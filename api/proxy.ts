import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure the backend URL is formatted correctly (no trailing slash)
  const targetHost = process.env.VITE_BE_URL?.replace(/\/$/, ""); 

  if (!targetHost) {
    return res.status(500).json({ error: "VITE_BE_URL is missing in Vercel settings" });
  }

  // Construct the full destination path
  const targetUrl = `${targetHost}${req.url}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        // Forward the Auth header for your Google/Internal JWTs
        "Authorization": req.headers.authorization || '',
      },
      // Only include body for methods that allow it
      body: ["GET", "HEAD"].includes(req.method || "GET") ? undefined : JSON.stringify(req.body),
    });

    const text = await response.text();
    
    // Attempt to return JSON if possible, otherwise send raw text
    try {
      const json = JSON.parse(text);
      res.status(response.status).json(json);
    } catch {
      res.status(response.status).send(text);
    }
  } catch (error) {
    res.status(502).json({ 
      error: "Gateway Timeout: Could not reach Go backend", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}