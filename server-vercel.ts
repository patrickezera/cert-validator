// Simple Express server for Vercel
import cors from "cors";
import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Import API handlers
import checkCompatibilityHandler from "./api/check-compatibility.js";
import validateHandler from "./api/validate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// API routes
app.post(
  "/api/validate",
  upload.single("certificate"),
  (req: any, res: any) => {
    return validateHandler(req, res);
  }
);

app.post(
  "/api/check-compatibility",
  upload.fields([
    { name: "certificate", maxCount: 1 },
    { name: "privateKey", maxCount: 1 },
    { name: "caBundle", maxCount: 1 },
  ]),
  (req: any, res: any) => {
    return checkCompatibilityHandler(req, res);
  }
);

// Serve static files from the dist directory
// In Vercel, dist is at the root level, not inside dist-vercel
app.use(express.static(path.join(path.dirname(__dirname), "dist")));

// Fallback to index.html for client-side routing
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(path.dirname(__dirname), "dist", "index.html"));
});

// Start the server only if this file is run directly
// Using ES modules approach instead of CommonJS require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
export default app;
