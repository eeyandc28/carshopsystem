# CarShop ERP - Deployment Guide

This project consists of a Laravel 11 API (Backend) and a React SPA (Frontend).

## 🚀 Frontend Deployment (Vercel/Netlify)

1.  Connect your GitHub repository to Vercel/Netlify.
2.  Set the **Root Directory** to `frontend`.
3.  Set the **Build Command** to `npm run build`.
4.  Set the **Output Directory** to `dist`.
5.  Add **Environment Variables**:
    *   `VITE_API_URL`: Your live backend API URL (e.g., `https://carshop-api.up.railway.app/api/v1`).

## ☁️ Backend Deployment (Railway/Fly.io/Heroku)

1.  Connect your GitHub repository to the hosting platform.
2.  Set the **Root Directory** to `backend`.
3.  The platform will detect the `Dockerfile` or `Procfile` automatically.
4.  Add **Environment Variables**:
    *   `APP_KEY`: (Run `php artisan key:generate --show` locally to get one).
    *   `APP_ENV`: `production`
    *   `APP_DEBUG`: `false`
    *   `DB_CONNECTION`: `pgsql` or `mysql`
    *   `DATABASE_URL`: (Provided by your host).
5.  Ensure you run migrations on the live server: `php artisan migrate --force`.

## 🔒 Security Notes
*   Update `config/cors.php` in the backend to restrict `allowed_origins` to your production frontend URL.
*   Ensure `APP_DEBUG` is `false` in production to prevent leaking sensitive info.
