import type { Express, Request, Response } from "express";
import express from "express";
import { stripe, STRIPE_CONFIG } from "../lib/stripe";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

// Register all non-webhook payment routes
export function registerPaymentRoutes(app: Express) {
  // -------------------------------
  // Create Stripe Checkout session
  // -------------------------------
  app.post(
    "/api/payments/create-checkout",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        // Check if user is already paid
        const user = await storage.getUser(userId);
        if (user?.subscriptionStatus === "paid") {
          return res
            .status(400)
            .json({ message: "User already has paid access" });
        }

        // Create Stripe checkout session. If a pre-created PRICE_ID is
        // configured, use it (preferred for reuse in Stripe dashboard).
        const lineItems = STRIPE_CONFIG.PRICE_ID
          ? [{ price: STRIPE_CONFIG.PRICE_ID, quantity: 1 }]
          : [
              {
                price_data: {
                  currency: STRIPE_CONFIG.CURRENCY,
                  product_data: {
                    name: STRIPE_CONFIG.PRODUCT_NAME,
                    description: STRIPE_CONFIG.PRODUCT_DESCRIPTION,
                  },
                  unit_amount: STRIPE_CONFIG.PRICE_AMOUNT,
                },
                quantity: 1,
              },
            ];

        // If the user already has a Stripe customer id, attach it so
        // the resulting Checkout session will have `session.customer` set.
        // Otherwise provide their email so Stripe will create a Customer.
        const sessionParams: any = {
          mode: "payment",
          payment_method_types: ["card"],
          line_items: lineItems,
          success_url: `${req.protocol}://${req.get(
            "host"
          )}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.protocol}://${req.get("host")}/pricing`,
          metadata: {
            userId: userId,
          },
        };

        if (user?.stripeCustomerId) {
          sessionParams.customer = user.stripeCustomerId;
        } else if (user?.email) {
          sessionParams.customer_email = user.email;
        }

        console.log("Creating Stripe session with metadata:", sessionParams.metadata);
        const session = await stripe.checkout.sessions.create(sessionParams);

        res.json({ checkout_url: session.url });
      } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ message: "Failed to create checkout session" });
      }
    }
  );

  // -------------------------------
  // Check user's job viewing limits
  // -------------------------------
  app.get("/api/user/job-limits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { FeatureGates } = await import("../lib/featureGates");
      const limits = await FeatureGates.canViewJob(userId);
      res.json(limits);
    } catch (error) {
      console.error("Error checking job limits:", error);
      res.status(500).json({ message: "Failed to check job limits" });
    }
  });

  // -------------------------------
  // Record a job view (free tier tracking)
  // -------------------------------
  app.post(
    "/api/user/record-job-view",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { FeatureGates } = await import("../lib/featureGates");
        await FeatureGates.recordJobView(userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error recording job view:", error);
        res.status(500).json({ message: "Failed to record job view" });
      }
    }
  );

  // -------------------------------
  // Reconcile / create Stripe Customer for the authenticated user
  // -------------------------------
  app.post(
    "/api/payments/reconcile-customer",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.stripeCustomerId) {
          return res.json({ stripeCustomerId: user.stripeCustomerId });
        }

        if (!user.email) {
          return res
            .status(400)
            .json({
              message: "User has no email; cannot reconcile Stripe customer",
            });
        }

        // Try to find an existing Stripe customer by email
        const existing = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });
        if (existing.data && existing.data.length > 0) {
          const customerId = existing.data[0].id;
          await storage.updateUser(userId, { stripeCustomerId: customerId });
          return res.json({ stripeCustomerId: customerId });
        }

        // Create a new Stripe customer and persist
        const created = await stripe.customers.create({
          email: user.email,
          metadata: { userId },
        });
        await storage.updateUser(userId, { stripeCustomerId: created.id });
        return res.json({ stripeCustomerId: created.id });
      } catch (err: any) {
        console.error("Error reconciling Stripe customer:", err);
        res.status(500).json({ message: "Failed to reconcile customer" });
      }
    }
  );

  // -------------------------------
  // Admin: Backfill stripeCustomerId for paid users missing a customer id
  // -------------------------------
  app.post(
    "/api/payments/backfill-customers",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const requester = req.user as any;

        // Basic admin guard: check claims first
        const isAdminClaim = requester?.claims?.isAdmin;
        let isAdmin = !!isAdminClaim;

        // If claim not present, check DB user record
        if (!isAdmin) {
          const dbUser = await storage.getUser(requester.claims.sub);
          isAdmin = !!dbUser?.isAdmin;
        }

        if (!isAdmin) return res.status(403).json({ message: "Forbidden" });

        // Read dry-run and limit from query params
        const dry = String(req.query?.dry || "false") === "true";
        const limit = Math.max(
          1,
          Math.min(5000, parseInt(String(req.query?.limit || "1000")) || 1000)
        );

        // Find paid users missing stripeCustomerId (respecting limit)
        const usersToFix = await (async () => {
          // Use direct DB query via drizzle to avoid adding new storage API
          const { db } = await import("../db");
          const { users } = await import("../../shared/schema");
          const { and, eq, isNull } = await import("drizzle-orm");
          return db
            .select()
            .from(users)
            .where(
              and(
                eq(users.subscriptionStatus, "paid"),
                isNull(users.stripeCustomerId)
              )
            )
            .limit(limit);
        })();

        const report: any[] = [];

        for (const u of usersToFix) {
          try {
            if (!u.email) {
              report.push({ userId: u.id, status: "no-email" });
              continue;
            }

            // Try to find existing Stripe customer by email
            const existing = await stripe.customers.list({
              email: u.email,
              limit: 1,
            });
            let customerId: string | undefined;
            if (existing.data && existing.data.length > 0) {
              customerId = existing.data[0].id;
            } else {
              const created = await stripe.customers.create({
                email: u.email,
                metadata: { userId: u.id },
              });
              customerId = created.id;
            }

            if (customerId) {
              if (!dry) {
                await storage.updateUser(u.id, {
                  stripeCustomerId: customerId,
                });
              }
              report.push({
                userId: u.id,
                status: dry ? "would-update" : "updated",
                stripeCustomerId: customerId,
              });
            } else {
              report.push({ userId: u.id, status: "no-customer-id" });
            }
          } catch (err: any) {
            console.error(`Error reconciling user ${u.id}:`, err);
            report.push({ userId: u.id, status: "error", error: String(err) });
          }
        }

        res.json({ dryRun: dry, limit, report, count: report.length });
      } catch (err: any) {
        console.error("Error running backfill-customers:", err);
        res
          .status(500)
          .json({ message: "Backfill failed", error: String(err) });
      }
    }
  );
}

// -------------------------------
// Stripe Webhook endpoint (raw body)
// -------------------------------
export function registerStripeWebhook(app: Express) {
  // Note: the raw body parser for /api/webhooks/stripe is registered
  // centrally in server/index.ts BEFORE express.json(), so here we
  // only register the route handler. This ensures Stripe signature
  // verification receives the raw Buffer in req.body.
  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    console.log("🔍 Webhook handler invoked for:", req.originalUrl);

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET is not configured");
      return res.status(400).send("Webhook secret not configured");
    }

    let event;
    try {
      // Prefer the captured rawBuffer (req.rawBody) set by the verify
      // function in express.json(). Fall back to req.body if not present.
      const payload: Buffer | string =
        (req as any).rawBody || (req.body as any);
      event = stripe.webhooks.constructEvent(
        payload as any,
        sig,
        webhookSecret
      );
      console.log("✅ Webhook event received:", event.type);
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Respond to Stripe as quickly as possible to avoid timeouts.
    // Do NOT await/promise anything time-consuming before this!
    res.sendStatus(200);

    // -------------------------------
    // Handle different Stripe events (run in background after response)
    // -------------------------------
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const userId = session.metadata?.userId;
          console.log(
            "Webhook: checkout.session.completed for userId:",
            userId,
            "session:",
            session.id
          );

          if (userId) {
            try {
              // Retrieve the full session from Stripe to ensure we have the
              // latest fields and an expanded customer object if available.
              const fetched = await stripe.checkout.sessions.retrieve(
                session.id as string,
                {
                  expand: ["customer"],
                }
              );
              console.log("Debug - retrieved checkout session:", {
                id: fetched.id,
                customer: fetched.customer,
                customer_details: fetched.customer_details,
              });

              let customerId = (fetched.customer &&
                (fetched.customer as any).id) as string | undefined;

              // If expand didn't give customer, fall back to event.session.customer
              if (!customerId)
                customerId = session.customer as string | undefined;

              // If Stripe didn't attach a customer id to the session, try to resolve
              // one from the session details (email) by looking up existing
              // Stripe customers or creating a new one.
              if (!customerId) {
                const email = session.customer_details?.email as
                  | string
                  | undefined;
                if (email) {
                  // Try to find an existing customer by email
                  const existing = await stripe.customers.list({
                    email,
                    limit: 1,
                  });
                  if (existing.data && existing.data.length > 0) {
                    customerId = existing.data[0].id;
                  } else {
                    // Create a new customer so we have a record
                    const created = await stripe.customers.create({ email });
                    customerId = created.id;
                  }
                }
              }

              if (customerId) {
                console.log("Upgrading user to paid:", userId, "customerId:", customerId);
                await storage.upgradeUserToPaid(userId, customerId);
                console.log(
                  `✅ User ${userId} upgraded to paid status (customer ${customerId})`
                );
              } else {
                // If we still don't have a customer id, try lookup by email from fetched.customer_details
                const email = (fetched.customer_details &&
                  (fetched.customer_details as any).email) as
                  | string
                  | undefined;
                if (!customerId && email) {
                  const existing = await stripe.customers.list({
                    email,
                    limit: 1,
                  });
                  if (existing.data && existing.data.length > 0) {
                    customerId = existing.data[0].id;
                  } else {
                    const created = await stripe.customers.create({ email });
                    customerId = created.id;
                  }
                  if (customerId) {
                    await storage.upgradeUserToPaid(userId, customerId);
                    console.log(
                      `✅ User ${userId} upgraded to paid status (customer ${customerId})`
                    );
                  }
                }
              }
            } catch (err) {
              console.error(
                "❌ Error in checkout.session.completed handler:",
                err
              );
              // No need to return error to Stripe - already responded.
            }
          }
          break;
        }

        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as any;
          console.log(
            "💳 PaymentIntent succeeded:",
            paymentIntent.id,
            paymentIntent.amount
          );
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as any;
          console.log("📄 Invoice payment succeeded:", invoice.id);
          break;
        }

        case "invoice.payment_failed": {
          const failedInvoice = event.data.object as any;
          console.log("❌ Invoice payment failed:", failedInvoice.id);
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as any;
          console.log(
            `📌 Subscription event: ${event.type}`,
            subscription.id,
            subscription.status
          );
          break;
        }

        default: {
          console.log(`Unhandled event type: ${event.type}`);
        }
      }
    } catch (err) {
      console.error("❌ Error handling Stripe event after response:", err);
      // No need to return/catch to Stripe.
    }
  });
}
