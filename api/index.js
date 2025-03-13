// JavaScript version of the API index handler
export default function handler(req, res) {
  // Redirect to the static index.html
  res.setHeader("Location", "/");
  res.status(302).end();
}
