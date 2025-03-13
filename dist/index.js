export default function handler(req, res) {
    // Redirect to the static index.html
    res.setHeader("Location", "/dist/index.html");
    res.status(302).end();
}
