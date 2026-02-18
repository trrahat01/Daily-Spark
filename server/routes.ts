import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { storage } from "./storage";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function passwordMatches(password: string, expectedHash: string): boolean {
  const receivedHash = hashPassword(password);
  const expected = Buffer.from(expectedHash, "utf8");
  const received = Buffer.from(receivedHash, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}

export async function registerRoutes(app: Express): Promise<Server> {
  /**
   * A simple health check endpoint to confirm the server is running and reachable.
   * You can test this in your browser at http://<your-ip>:5000/api/health
   */
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date() });
  });

  /**
   * User registration endpoint.
   * Expects { "username": "...", "password": "..." } in the request body.
   */
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password before storing.
      const hashedPassword = hashPassword(password);

      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
      });

      // Do not send the password hash back to the client.
      const { password: _, ...userWithoutPassword } = newUser as any;

      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  /**
   * User login endpoint.
   * Expects { "username": "...", "password": "..." } in the request body.
   */
  app.post("/api/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await storage.getUserByUsername(username);

    if (!user || !passwordMatches(password, (user as any).password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // In a real app, you would generate and return a JWT here.
    res.json({ message: "Login successful", token: "dummy-auth-token" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
