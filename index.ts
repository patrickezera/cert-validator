// This file serves as an entry point for Vercel
// It redirects to the built application
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Redirect to the static index.html
  res.setHeader("Location", "/dist/index.html");
  res.status(302).end();
}
