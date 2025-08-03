import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import NotificationService from "./websocket";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint to keep the service alive
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Keep-alive endpoint for external ping services
app.get("/ping", (req: Request, res: Response) => {
  res.status(200).send("pong");
});

// API status endpoint (not root)
app.get("/api/status", (req: Request, res: Response) => {
  res.status(200).json({ 
    message: "CityFund API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Keep-alive function to ping the service itself
const keepAlive = () => {
  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5000}`;
  
  fetch(`${baseUrl}/health`)
    .then(response => {
      if (response.ok) {
        log(`Keep-alive ping successful: ${new Date().toISOString()}`);
      } else {
        log(`Keep-alive ping failed with status: ${response.status}`);
      }
    })
    .catch(error => {
      log(`Keep-alive ping error: ${error.message}`);
    });
};

(async () => {
  // Create the main HTTP server
  const server = createServer(app);
  
  // Initialize WebSocket notification service with the main server
  const notificationService = new NotificationService(server);
  
  // Register API routes with notification service
  await registerRoutes(app, notificationService);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite in development mode
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0", // Use 0.0.0.0 for production
  }, () => {
    log(`serving on port ${port}`);
    
    // Start keep-alive mechanism only in production
    if (process.env.NODE_ENV === "production") {
      // Ping every 14 minutes (Render free tier stops after 15 minutes of inactivity)
      setInterval(keepAlive, 14 * 60 * 1000);
      
      // Initial ping after 1 minute
      setTimeout(keepAlive, 60 * 1000);
      
      log("Keep-alive mechanism started - pinging every 14 minutes");
    }
  });
})();
