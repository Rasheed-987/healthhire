import type { RequestHandler } from "express";
import crypto from "crypto";

// Session-based CSRF token utilities
const CSRF_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function issueCSRFToken(req: any): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + CSRF_TTL_MS;
  if (!req.session) req.session = {};
  req.session.csrfToken = token;
  req.session.csrfTokenExpiresAt = expiresAt;
  return token;
}

export const validateCSRFToken: RequestHandler = async (req: any, res, next) => {
  try {
    const headerToken = req.headers["x-csrf-token"] as string | undefined;
    if (!headerToken) {
      console.warn(`CSRF token missing for ${req.method} ${req.path} from ${req.ip}`);
      return res.status(403).json({ message: "CSRF token required", code: "CSRF_TOKEN_MISSING" });
    }

    const sessionToken = req.session?.csrfToken;
    const expiresAt = req.session?.csrfTokenExpiresAt as number | undefined;

    if (!sessionToken || headerToken !== sessionToken) {
      console.warn(`Invalid CSRF token for ${req.method} ${req.path} from ${req.ip}`);
      return res.status(403).json({ message: "Invalid CSRF token", code: "CSRF_TOKEN_INVALID" });
    }

    if (expiresAt && Date.now() > expiresAt) {
      console.warn(`Expired CSRF token for ${req.method} ${req.path} from ${req.ip}`);
      return res.status(403).json({ message: "Expired CSRF token", code: "CSRF_TOKEN_EXPIRED" });
    }

    // Valid token: proceed without rotating (allow multiple uses within TTL)
    return next();
  } catch (err) {
    console.error("CSRF validation error:", err);
    return res.status(500).json({ message: "CSRF validation failed" });
  }
};