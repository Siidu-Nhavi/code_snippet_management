# 🚀 Code Snippet Manager
const port = config.port;
const serverInstance = app.listen(port, () => {
  console.log(`Snippet Manager API listening on port ${port}`);
});

serverInstance.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Use PORT=<free-port> and restart.`);
    process.exit(1);
  }
  throw err;
});
![License](https://img.shields.io/badge/license-MIT-green)
![Frontend](https://img.shields.io/badge/frontend-React%20%7C%20Vite-blue)
![Backend](https://img.shields.io/badge/backend-Node%20%7C%20Express-orange)
![Database](https://img.shields.io/badge/database-Prisma%20ORM-purple)

A **full-stack, production-ready snippet management platform** designed for developers to efficiently store, organize, search, and share code snippets with advanced features like RBAC, version control, and cloud sync.

---

## 📌 Why This Project?

Developers often struggle with:

* Scattered code snippets across files/tools
* Lack of proper organization & search
* No version tracking for reusable code
* Difficulty sharing snippets securely

👉 This project solves all of the above with a **centralized, scalable solution**.

---

## 🌐 Live Demo (Optional)

* Frontend: *Add Vercel Link*
* Backend API: *Add Render Link*

---

## 🧠 Key Highlights

* 🔐 Secure JWT Authentication
* 🧩 Role-Based Access Control (RBAC)
* ⚡ Full-text search engine
* 🕒 Built-in version control system
* 🔗 Shareable token-based links
* 🔄 Sync API for cloud/offline workflows
* 🎯 Clean and scalable architecture

---

## 🏗️ System Architecture

```
Client (React + Vite)
        ↓
REST API (Node.js + Express)
        ↓
Database (Prisma ORM)
```

---

## 🛠️ Tech Stack

### Backend

* Node.js + Express
* TypeScript
* Prisma ORM
* SQLite (Development)
* PostgreSQL (Production recommended)
* JWT Authentication

### Frontend

* React + TypeScript
* Vite
* React Router
* highlight.js

---

## ✨ Features Breakdown

### 🔐 Authentication & Authorization

* Register / Login system
* JWT-based session handling
* Role-based access:

  * ADMIN → Full control
  * EDITOR → Manage content
  * VIEWER → Read-only

---

### 🧾 Snippet Management

* Create, update, delete snippets
* Public / private visibility
* Rich code + metadata storage
* Multi-language syntax highlighting

---

### 🗂️ Organization System

* Categories (structured grouping)
* Tags (flexible labeling)
* Efficient filtering system

---

### 🔍 Full-Text Search

Search across:

* Title
* Description
* Code
* Tags
* Categories

---

### ⭐ Favorites

* Mark snippets as favorite
* Personalized quick access

---

### 🕒 Version History

* Automatic snapshots on updates
* View previous versions
* Restore any version instantly

---

### 🔗 Sharing System

* Token-based secure sharing
* Public access without login

---

### 🔄 Sync API

* `pull` → fetch updates
* `push` → sync local changes
* Enables offline-first workflows

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
npm install
```

---

### 2. Setup Environment

```bash
cp server/.env.example server/.env
```

---

### 3. Setup Database

```bash
npm run setup
```

---

### 4. Run Backend

```bash
npm run dev:server
```

---

### 5. Run Frontend

```bash
npm run dev:client
```

---

## 🌐 API Reference

### Auth

* POST `/api/auth/register`
* POST `/api/auth/login`
* GET `/api/auth/me`

### Snippets

* GET `/api/snippets`
* POST `/api/snippets`
* PATCH `/api/snippets/:id`
* DELETE `/api/snippets/:id`

### Versioning

* GET `/api/snippets/:id/versions`
* POST `/api/snippets/:id/versions/:versionId/restore`

### Sharing

* POST `/api/snippets/:id/share`
* GET `/api/snippets/shared/:token`

### Sync

* GET `/api/sync/pull`
* POST `/api/sync/push`

---

## ⚙️ Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secret"
PORT=4000
```

---

## 🚀 Deployment Guide

### Frontend (Vercel)

* Build: `npm run build`
* Output: `dist`

### Backend (Render)

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run start
```

---

## ⚠️ Production Best Practices

* Use PostgreSQL instead of SQLite
* Enable HTTPS
* Configure proper CORS
* Use strong JWT secrets
* Add logging & monitoring
* Implement rate limiting

---

## 📈 Future Improvements

* AI-powered snippet suggestions 🤖
* Real-time collaboration
* Code execution sandbox
* Team workspaces
* Export/import functionality

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Developed to improve developer productivity and showcase full-stack engineering capabilities.
