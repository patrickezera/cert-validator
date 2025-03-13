export default function handler(req: any, res: any) {
  // Redirect to the static index.html
  res.setHeader("Location", "/");
  res.status(302).end();
}
