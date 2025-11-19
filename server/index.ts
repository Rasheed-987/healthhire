import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
// import { CronService } from "./services/cronService"; // DISABLED to prevent infinite loops

const app = express();
// Use express.json with a `verify` function that captures the raw body
// buffer for Stripe webhook requests. This avoids ordering pitfalls and
// ensures we have access to the original signed payload as a Buffer.
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      try {
        if (
          req.originalUrl &&
          req.originalUrl.startsWith("/api/webhooks/stripe")
        ) {
          req.rawBody = buf;
        }
      } catch (err) {
        // swallow - verification should not crash the app
      }
    },
  })
);

// urlencoded bodies (not used by Stripe webhooks) — keep default behaviour
app.use(
  express.urlencoded({
    extended: false,
    verify: (req: any, _res, buf) => {
      // also capture raw for urlencoded webhook edge-cases
      if (
        req.originalUrl &&
        req.originalUrl.startsWith("/api/webhooks/stripe")
      ) {
        req.rawBody = buf;
      }
    },
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Only capture response JSON in development mode
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  if (app.get("env") === "development") {
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // Only include response JSON in development
      if (app.get("env") === "development" && capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate long log lines to prevent log bloat
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);

  server
    .listen(
      {
        port,
        host: "0.0.0.0",
        // reusePort: true,
      },
      () => {
        // Initialize cron jobs for usage resets - DISABLED to prevent infinite loops
        // CronService.initialize();

        console.log(`🚀 Server running on port ${port}`);
        console.log(`📱 Frontend: ${process.env.PUBLIC_APP_URL}:${port}`);
        console.log(`🔧 API: ${process.env.PUBLIC_APP_URL}:${port}/api`);
      }
    )
    .on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${port} is already in use. Please:`);
        console.error(
          `   1. Change PORT in your .env file to a different port (e.g., PORT=5001)`
        );
        console.error(`   2. Or stop the process using port ${port}`);
        console.error(
          `   3. Or run: netstat -ano | findstr :${port} to find the process ID`
        );
        process.exit(1);
      } else {
        console.error("❌ Server failed to start:", err.message);
        process.exit(1);
      }
    });
})();
