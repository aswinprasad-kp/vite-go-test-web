import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Now TypeScript knows that targetHost is a string | undefined
  const targetHost = process.env.RENDER_BACKEND_URL; 

  if (!targetHost) {
    return res.status(500).json({ error: "Backend URL not configured" });
  }

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

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: "Proxy Error: " + error });
  }
}