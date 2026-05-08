import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin (lazy if needed, but here we can do it early if we have credentials)
// In this environment, we might not have a service account key file easily, 
// so we typically skip it or use default credentials if provided.
// However, the instructions say "Default to Client-Side" unless requested.
// The user REQUESTED email reminders, so we use server.

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Simple endpoint to "send" email (demo)
  app.post("/api/send-reminder", (req, res) => {
    const { email, eventTitle, time } = req.body;
    console.log(`[EMAIL REMINDER] To: ${email}, Subject: Reminder: ${eventTitle}, Body: Your event starts at ${time}`);
    res.json({ success: true, message: "Email sent (logged to server console)" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\nChronos Calendar Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer();
