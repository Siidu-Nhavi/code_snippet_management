# Code Snippet Manager

Full-stack code snippet manager with authentication, search, tags, categories, favorites, version history, sharing, and sync support.

## Live URLs

- Frontend: [https://code-snippet-management-server.vercel.app](https://code-snippet-management-server.vercel.app)
- Backend: [https://code-snippet-management.onrender.com](https://code-snippet-management.onrender.com)
- Health Check: [https://code-snippet-management.onrender.com/api/health](https://code-snippet-management.onrender.com/api/health)

## Environment Setup

### Frontend

Create `client/.env.production`:

```env
VITE_API_URL="https://code-snippet-management.onrender.com/api"
```

If `VITE_API_URL` is omitted, the frontend now uses `/api` by default. Local Vite dev proxies `/api` to `http://127.0.0.1:4001`, and Vercel rewrites `/api/*` to the Render backend.

### Backend

Render environment variables:

```env
DATABASE_URL="file:/var/data/prod.db"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
CLIENT_ORIGINS="https://code-snippet-management-server.vercel.app,http://localhost:5173"
```

If you keep SQLite on Render, attach a persistent disk and point `DATABASE_URL` to that disk path.

## Redeploy Steps

### Frontend on Vercel

1. Open the Vercel project.
2. Confirm `Root Directory` is `client`.
3. Confirm the environment variable is:

```env
VITE_API_URL=https://code-snippet-management.onrender.com/api
```

4. Redeploy the latest commit.
5. Open `https://code-snippet-management-server.vercel.app`.

### Backend on Render

1. Open the Render service.
2. Confirm `Root Directory` is `server`.
3. Confirm the environment variables match:

```env
DATABASE_URL=file:/var/data/prod.db
JWT_SECRET=replace-with-a-long-random-secret
PORT=4000
CLIENT_ORIGINS=https://code-snippet-management-server.vercel.app,http://localhost:5173
```

4. Attach a persistent disk if you are still using SQLite.
5. Redeploy the latest commit.
6. Test `https://code-snippet-management.onrender.com/api/health`.

## Local Development

Install dependencies:

```bash
npm install
```

Start backend:

```bash
npm run dev:server
```

Start frontend:

```bash
npm run dev:client
```

Vite now proxies `/api/*` to the backend automatically, so the default auth flow works locally even without setting `VITE_API_URL`.

## Notes

- The frontend API fallback is configured in `client/src/api.ts`.
- The Vite dev proxy is configured in `client/vite.config.ts`.
- The backend CORS origin allowlist is configured in `server/src/config.ts`.
- For production, PostgreSQL or MongoDB Atlas is a better long-term choice than SQLite on Render.
