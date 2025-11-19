import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import {
  sendPasswordResetEmail,
  sendEmail,
  sendWelcomeEmail,
  passwordResetTemplate,
} from "./email";
import { isAdmin as requireAdmin } from "./adminAuth";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Session setup (reuse existing logic but independent of Replit)
export function setupLocalSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const store = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      store,
      cookie: { httpOnly: true, secure: false, maxAge: sessionTtl },
    })
  );

  // Initialize passport after sessions
  app.use(passport.initialize());
  app.use(passport.session());
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(
  pw: string,
  hash: string | null | undefined
) {
  if (!hash) return false;
  return bcrypt.compare(pw, hash);
}

export async function findUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);
  return result[0];
}

export const ensureAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.session?.user) {
    attachUserClaimShim(req);
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export const checkSuspensionStatus: RequestHandler = async (
  req: any,
  res,
  next
) => {
  if (req.session?.user) {
    try {
      const userId = req.session.user.id;
      const user = await storage.getUser(userId);

      if (user?.isSuspended) {
        // Clear the session for suspended users
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Error destroying session for suspended user:", err);
          }
        });

        return res.status(403).json({
          message: "Account suspended",
          reason:
            user.suspensionReason ||
            "Your account has been suspended. Please contact support.",
          suspendedAt: user.suspendedAt,
        });
      }
    } catch (error) {
      console.error("Error checking suspension status:", error);
      // Continue if there's an error checking suspension status
    }
  }
  next();
};

export function attachUserClaimShim(req: any) {
  if (req.session?.user) {
    // Keep legacy shape: req.user.claims.sub
    req.user = {
      id: req.session.user.id,
      claims: { sub: req.session.user.id, email: req.session.user.email },
    };
    req.isAuthenticated = () => true;
  }
}

export const localAuthMiddleware: RequestHandler = (req: any, _res, next) => {
  attachUserClaimShim(req);
  next();
};

export function registerLocalAuthRoutes(app: Express) {
  // --------- Passport Google OAuth setup ---------
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
  const GOOGLE_CALLBACK_URL = `${process.env.VITE_API_BASE_URL}/api/auth/google/callback`;

  // Debug endpoint to verify OAuth configuration
  app.get("/api/auth/google/debug", (req: any, res) => {
    res.json({
      googleOAuthConfigured: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
      clientIdSet: !!GOOGLE_CLIENT_ID,
      clientIdPrefix: GOOGLE_CLIENT_ID
        ? GOOGLE_CLIENT_ID.substring(0, 20) + "..."
        : "NOT SET",
      callbackURL: GOOGLE_CALLBACK_URL,
      publicAppUrl: process.env.PUBLIC_APP_URL || "NOT SET",
      host: req.get("host"),
      protocol: req.protocol,
      fullCallbackUrl: `${req.protocol}://${req.get(
        "host"
      )}${GOOGLE_CALLBACK_URL}`,
    });
  });

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: GOOGLE_CALLBACK_URL,
          passReqToCallback: true,
        },
        async (
          req: any,
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: any
        ) => {
          try {
            const email = profile?.emails?.[0]?.value?.toLowerCase();
            if (!email) return done(new Error("No email returned from Google"));

            // Look for existing user by email
            const existing = await findUserByEmail(email);
            if (existing) {
              // Check if user is suspended
              if (existing.isSuspended) {
                return done(
                  new Error(
                    "Your account has been suspended. Please contact support."
                  )
                );
              }

              // Update last login
              await db
                .update(users)
                .set({ lastLoginAt: new Date(), updatedAt: new Date() })
                .where(eq(users.id, existing.id));

              // Send greeting email to existing user on every login
              try {
                console.log(
                  `📧 Sending greeting email to existing user: ${email}`
                );
                await sendWelcomeEmail(email, existing.firstName || "");
                console.log(
                  `✅ Greeting email sent successfully to existing user: ${email}`
                );
              } catch (emailError) {
                console.error(
                  "❌ Failed to send greeting email to existing user:",
                  emailError
                );
                // Don't fail the authentication if email fails
              }

              return done(null, existing);
            }

            // Create new user record (first login via Google)
            const displayName = profile.displayName || "";
            const names = displayName.split(" ");
            const firstName = names[0] || "";
            const lastName = names.slice(1).join(" ") || "";

            const [created] = await db
              .insert(users)
              .values({
                email,
                firstName,
                lastName,
                emailVerifiedAt: new Date(),
                profileImageUrl: profile?.photos?.[0]?.value || null,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();

            // Send welcome email to new user
            try {
              console.log(`📧 Sending welcome email to new user: ${email}`);
              await sendWelcomeEmail(email, firstName);
              console.log(
                `✅ Welcome email sent successfully to new user: ${email}`
              );
            } catch (emailError) {
              console.error(
                "❌ Failed to send welcome email to new user:",
                emailError
              );
              // Don't fail the authentication if email fails
            }

            return done(null, created);
          } catch (err) {
            return done(err as any);
          }
        }
      )
    );

    // Serialize/deserialize for passport session
    passport.serializeUser((user: any, done) => {
      done(null, (user as any).id);
    });
    passport.deserializeUser(async (id: string, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);
        done(null, user || null);
      } catch (e) {
        done(e as any);
      }
    });

    // Routes to start Google OAuth flow and handle callback
    app.get(
      "/api/auth/google",
      (req, res, next) => {
        // Store an optional redirect in session to use after auth
        const redirect =
          req.query.redirect ||
          req.get("origin") ||
          process.env.PUBLIC_APP_URL ||
          "/";
        if (req.session) req.session.oauthRedirect = redirect;
        next();
      },
      passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
      })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", {
        failureRedirect: "/login?error=suspended",
        session: true,
      }),
      (req: any, res) => {
        // After successful auth, set session.user similarly to local login
        const user = req.user as any;
        if (req.session) {
          req.session.user = { id: user.id, email: user.email };
        }

        // If this is the user's first login (no subscription info), redirect to subscription/checkout
        const redirectTo =
          (req.session && req.session.oauthRedirect) ||
          process.env.PUBLIC_APP_URL ||
          "/";
        // Basic heuristic: if subscriptionStatus is not 'paid', consider first-login
        const isPaid = user && (user as any).subscriptionStatus === "paid";
        if (!isPaid) {
          // redirect to checkout or pricing
          return res.redirect(`${redirectTo.replace(/\/$/, "")}/checkout`);
        }
        return res.redirect(redirectTo);
      }
    );
  } else {
    console.warn(
      "Google OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable"
    );
  }

  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password)
        return res.status(400).json({ message: "Email and password required" });
      const existing = await findUserByEmail(email);
      if (existing)
        return res.status(409).json({ message: "Email already registered" });
      const passwordHash = await hashPassword(password);
      const [created] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          firstName,
          lastName,
          emailVerifiedAt: new Date(),
        })
        .returning();

      req.session.user = { id: created.id, email: created.email };
      res.json({
        id: created.id,
        email: created.email,
        firstName: created.firstName,
        lastName: created.lastName,
      });
    } catch (e: any) {
      console.error("Register error", e);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ message: "Email and password required" });

      const user = await findUserByEmail(email);
      if (
        !user ||
        !(await verifyPassword(password, (user as any).passwordHash))
      ) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.isSuspended) {
        return res.status(403).json({
          message: "Your account has been suspended. Please contact support.",
          isSuspended: true,
          suspensionReason: user.suspensionReason,
        });
      }

      const isFirstLogin = !user.lastLoginAt;

      // Update last login (don't wait for email)
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Send session response immediately
      req.session.user = { id: user.id, email: user.email };
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        firstLogin: isFirstLogin,
      });

      if (isFirstLogin) {
        sendWelcomeEmailAsync(email, user.firstName || "", true);
      } else {
        sendWelcomeEmailAsync(email, user.firstName || "", false);
      }
    } catch (e) {
      console.error("Login error", e);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Async email function
  async function sendWelcomeEmailAsync(
    email: string,
    firstName: string,
    isFirstLogin: boolean
  ) {
    try {
      console.log(`📧 Sending async greeting email to: ${email}`);
      await sendWelcomeEmail(email, firstName, isFirstLogin);
      console.log(`✅ Greeting email sent successfully to: ${email}`);
    } catch (emailError) {
      console.error("❌ Failed to send greeting email:", emailError);
    }
  }

  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req: any, res) => {
    attachUserClaimShim(req);
    if (!req.user) return res.status(200).json({ user: null });
    res.json({ user: req.user.claims });
  });

  // ============== Email/OTP Verification Endpoints == ============
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function generateToken(bytes = 32) {
    return randomBytes(bytes).toString("hex");
  }

  function getBaseUrl(req: any) {
    const origin = req.get("origin") || req.headers.referer || "";
    if (origin) return origin.replace(/\/$/, "");
    return process.env.PUBLIC_APP_URL || "http://localhost:5173";
  }

  async function sendEmailUnified(to: string, subject: string, body: string) {
    const html = `<p>${body.replace(/\n/g, "<br/>")}</p>`;
    try {
      await sendEmail(to, subject, html, body);
      console.log(`Email sent successfully to: ${to}`);
    } catch (e) {
      console.warn(
        "[Email] Failed to send email, falling back to console log:",
        e
      );
      console.log("[EmailStub]", { to, subject, body });
    }
  }

  // Request email verification OTP (can be called after register)
  app.post("/api/auth/request-email-verification", async (req: any, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const user = await findUserByEmail(email);
      if (!user) return res.json({ success: true }); // do not reveal
      const otp = generateOTP();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await db
        .update(users)
        .set({
          verificationToken: otp,
          verificationTokenExpires: expires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      await sendEmailUnified(
        email,
        "Your verification code",
        `Your HealthHire verification code is ${otp}. It expires in 10 minutes.`
      );
      res.json({ success: true });
    } catch (e) {
      console.error("Request verification error", e);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  // Verify email with OTP
  app.post("/api/auth/verify-email", async (req: any, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp)
        return res.status(400).json({ message: "Email and code required" });
      const user = await findUserByEmail(email);
      if (!user) return res.status(400).json({ message: "Invalid code" });
      const now = new Date();
      if (
        (user as any).verificationToken !== otp ||
        !user.verificationTokenExpires ||
        now > new Date(user.verificationTokenExpires)
      ) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }
      await db
        .update(users)
        .set({
          emailVerifiedAt: new Date(),
          verificationToken: null,
          verificationTokenExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      res.json({ success: true });
    } catch (e) {
      console.error("Verify email error", e);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend verification (alias)
  app.post("/api/auth/resend-verification", async (req: any, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const user = await findUserByEmail(email);
      if (!user) return res.json({ success: true });
      const otp = generateOTP();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await db
        .update(users)
        .set({
          verificationToken: otp,
          verificationTokenExpires: expires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      await sendEmailUnified(
        email,
        "Your verification code",
        `Your HealthHire verification code is ${otp}. It expires in 10 minutes.`
      );
      res.json({ success: true });
    } catch (e) {
      console.error("Resend verification error", e);
      res.status(500).json({ message: "Failed to resend code" });
    }
  });

  // ============== Forgot / Reset Password Endpoints ==============
  app.post("/api/auth/forgot-password", async (req: any, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const user = await findUserByEmail(email);
      // Always respond success to prevent enumeration
      if (user) {
        const token = generateToken(32);
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        await db
          .update(users)
          .set({
            resetToken: token,
            resetTokenExpires: expires,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        const baseUrl = getBaseUrl(req);
        const link = `${baseUrl}/reset-password?token=${token}`;
        const { subject, html, text } = passwordResetTemplate(link);
        await sendEmail(email, subject, html, text);
      }
      res.json({ success: true });
    } catch (e) {
      console.error("Forgot password error", e);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req: any, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword)
        return res
          .status(400)
          .json({ message: "Token and new password are required" });

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters long" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, token))
        .limit(1);
      if (
        !user ||
        !user.resetTokenExpires ||
        new Date() > new Date(user.resetTokenExpires)
      ) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      const passwordHash = await hashPassword(newPassword);
      await db
        .update(users)
        .set({
          passwordHash,
          resetToken: null,
          resetTokenExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      console.log(`Password reset successful for user: ${user.email}`);
      res.json({ message: "Password has been reset successfully" });
    } catch (e) {
      console.error("Reset password error", e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============== Accept Invite Endpoint ==============
  app.post("/api/auth/accept-invite", async (req: any, res) => {
    try {
      const { token, firstName, lastName, password } = req.body;
      if (!token || !password)
        return res.status(400).json({ message: "Token and password required" });
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);
      if (
        !user ||
        !user.verificationTokenExpires ||
        new Date() > new Date(user.verificationTokenExpires)
      ) {
        return res.status(400).json({ message: "Invalid or expired invite" });
      }
      const passwordHash = await hashPassword(password);
      const [updated] = await db
        .update(users)
        .set({
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          passwordHash,
          emailVerifiedAt: new Date(),
          verificationToken: null,
          verificationTokenExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      // Auto-login
      req.session.user = { id: updated.id, email: updated.email };
      res.json({ success: true });
    } catch (e) {
      console.error("Accept invite error", e);
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });
}
