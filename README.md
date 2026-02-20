# XpenseOps Web (Frontend)

The modern React dashboard for XpenseOps, built with Vite and TailwindCSS.

## 🛠 Prerequisites

- **Node.js**: (Managed via npm/bun)
- **Vercel CLI**: Optional, for local proxy testing.

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env.local` file:

```env
VITE_BE_URL="http://localhost:8080"
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
```

### 2. Installation

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

**Use the URL with port 5173.** The app is served by Vite on port 5173, not 443:

- **https://localhost:5173/** (or http://localhost:5173/)
- **https://local.work-os.app:5173/** (if you use that hostname)

Do **not** open `https://local.work-os.app/` (no port) during local dev — that hits Nginx on 443, which can return 502 if it isn’t configured to proxy to the Vite server.

## 🏗 Key Features

- **Unifed Auth**: Persistent Google-backed session management.
- **Vercel Proxy**: Local requests to `/api/*` are proxied to the backend via `api/proxy.ts`.
- **Responsive Design**: Polished, enterprise-grade UI components.

## 🧪 Troubleshooting

- **502 Bad Gateway**: You're likely opening `https://local.work-os.app/` (port 443). Use **https://localhost:5173/** or **https://local.work-os.app:5173/** so the request goes to the Vite dev server.
- **Failed to fetch backend**: Ensure the Go server is running on port `8080`. Frontend uses the Vite proxy: requests to `/api/*` are sent to `VITE_BE_URL` (default `http://127.0.0.1:8080`).
- **CORS Issues**: Check the `ALLOWED_ORIGINS` in the backend `.env` (include `https://localhost:5173` and `https://local.work-os.app:5173` if needed).
- **Session Issues**: Use "Logout" to clear stale `localStorage` data.
- **WebSocket / HMR when using Nginx (https://local.work-os.app/)**: Use the full Nginx config below (including the `map` and `proxy_ssl_*` directives). If HMR still fails, use **https://local.work-os.app:5173/** directly (no Nginx).
- **Cross-Origin-Opener-Policy (Google OAuth)**: If the Google sign-in popup is blocked, have Nginx send `Cross-Origin-Opener-Policy: same-origin-allow-popups` for your app (Vercel does this via `vercel.json`).

### Nginx config for https://local.work-os.app (with WebSocket / HMR)

In your Nginx config file (e.g. `/opt/homebrew/etc/nginx/nginx.conf`):

1. **Add the `map` inside the `http { }` block** — right after the opening `http {`, before any `include` or `server`. (If you don’t, you’ll get `unknown "connection_upgrade" variable`.)

2. **Add or replace the `server` block** for `local.work-os.app` with the one below.

**Full snippet (place the `map` at the top of `http { }`, then the `server` block where you keep your other servers):**

```nginx
# Inside http { } — put this map first, before any include or server
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# Server block for local.work-os.app (HTTPS → Vite on 5173)
    server {
        listen 443 ssl;
        ssl_protocols TLSv1.2;
        ssl_ciphers 'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH';
        ssl_prefer_server_ciphers on;
        server_name local.work-os.app;

        ssl_certificate /Users/aswinprasad/silq/certs/local.work-os.app.pem;
        ssl_certificate_key /Users/aswinprasad/silq/certs/local.work-os.app-key.pem;

        add_header Cross-Origin-Opener-Policy "same-origin-allow-popups";

        location / {
            proxy_pass https://127.0.0.1:5173;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_cache_bypass $http_upgrade;

            proxy_ssl_verify off;
            proxy_ssl_server_name on;
            proxy_ssl_name local.work-os.app;

            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }
    }
```

Then run `nginx -t && nginx -s reload` (or `brew services restart nginx`). Ensure Vite is running with HTTPS on 5173 (`npm run dev` or `npm run dev:stage` with certs in `.env.local` / `.env.stage`).

If WebSocket still fails, use **https://local.work-os.app:5173/** so the browser talks to Vite directly (no Nginx in front).
