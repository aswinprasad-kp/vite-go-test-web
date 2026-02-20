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

The app will be available at `http://localhost:5173`.

## 🏗 Key Features

- **Unifed Auth**: Persistent Google-backed session management.
- **Vercel Proxy**: Local requests to `/api/*` are proxied to the backend via `api/proxy.ts`.
- **Responsive Design**: Polished, enterprise-grade UI components.

## 🧪 Troubleshooting

- **Failed to fetch backend**: Ensure the Go server is running on port `8080`.
- **CORS Issues**: Check the `ALLOWED_ORIGINS` in the backend `.env`.
- **Session Issues**: Use "Logout" to clear stale `localStorage` data.
