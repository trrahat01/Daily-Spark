import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as fs from "fs";
import * as path from "path";

const app = express();
const log = console.log;

// =======================
// CORS
// =======================
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// =======================
// BODY PARSING
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// =======================
// LOGGING
// =======================
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// =======================
// LANDING PAGE (optional)
// =======================
function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function configureLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );

  if (!fs.existsSync(templatePath)) return;

  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  app.get("/", (req: Request, res: Response) => {
    const protocol = req.protocol || "https";
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;

    const html = landingPageTemplate
      .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
      .replace(/APP_NAME_PLACEHOLDER/g, appName);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  });
}

// =======================
// ERROR HANDLER
// =======================
function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    console.error("Server Error:", err);

    if (res.headersSent) return next(err);

    res.status(500).json({
      message: "Internal Server Error",
    });
  });
}

// =======================
// MAIN SERVER START
// =======================
(async () => {
  configureLanding(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = Number(process.env.PORT) || 5000;

  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`);
  });
})();
