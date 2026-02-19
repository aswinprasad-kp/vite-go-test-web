import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Pulls the hidden Render URL from Vercel's Environment Variables
  const targetHost = process.env.VITE_BE_URL; 

  if (!targetHost) {
    return res.status(500).json({ error: "VITE_BE_URL is missing in Vercel settings" });
  }

  // req.url contains the full path (e.g., /api/claims or /auth/login)
  const targetUrl = `${targetHost}${req.url}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": req.headers.authorization || '',
      },
      body: ["GET", "HEAD"].includes(req.method!) ? undefined : JSON.stringify(req.body),
    });

    // Safely pass the backend response back to the frontend
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      res.status(response.status).json(json);
    } catch {
      res.status(response.status).send(text);
    }
  } catch (error) {
    res.status(502).json({ error: "Gateway Timeout: Could not reach Go backend" + error});
  }
}