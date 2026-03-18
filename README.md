# Code Snippet Manager

Full-stack snippet manager for developers with authentication, RBAC, snippet CRUD, tagging, categories, full-text search, favorites, version history, share links, and sync endpoints.

## Stack

- Backend: Node.js, Express, TypeScript, Prisma, SQLite, JWT auth
- Frontend: React, TypeScript, Vite, React Router, highlight.js

## Features

- User auth (`register`, `login`, `me`) with JWT
- Role-based permissions (`ADMIN`, `EDITOR`, `VIEWER`)
- Snippet create, edit, delete, and public/private visibility
- Multi-language syntax highlighting in the UI
- Categories and tags for organization
- Full-text search across title, description, code, tag names, and category name
- Favorites per user
- Automatic version snapshots and restore from history
- Shareable tokenized links
- Sync API (`pull`/`push`) for cloud sync workflows

## Quick Start

1. Install dependencies:
   - `npm.cmd install`
2. Configure backend env:
   - `Copy-Item server/.env.example server/.env`
3. Initialize database and seed sample data:
   - `npm.cmd run setup`
4. Run backend:
   - `npm.cmd run dev:server`
5. Run frontend (new terminal):
   - `npm.cmd run dev:client`

Backend runs on `http://localhost:4000` and frontend on `http://localhost:5173`.

## Demo Accounts

After seeding:

- `admin@snippet.local` / `Password123!`
- `editor@snippet.local` / `Password123!`
- `viewer@snippet.local` / `Password123!`

## Build

- `npm.cmd run build`

## Core API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST/PATCH/DELETE /api/categories`
- `GET/POST/PATCH/DELETE /api/tags`
- `GET/POST /api/snippets`
- `GET/PATCH/DELETE /api/snippets/:id`
- `POST /api/snippets/:id/favorite`
- `GET /api/snippets/:id/versions`
- `POST /api/snippets/:id/versions/:versionId/restore`
- `POST /api/snippets/:id/share`
- `GET /api/snippets/shared/:token`
- `GET /api/sync/pull`
- `POST /api/sync/push`
