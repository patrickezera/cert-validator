// TypeScript version of the API index handler
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  // Redirect to the static index.html
  res.setHeader("Location", "/");
  res.status(302).end();
}
