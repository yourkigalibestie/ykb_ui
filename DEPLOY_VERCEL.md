# Vercel Free Deployment Guide for Frontend

This guide walks you through deploying the `Your Kigali Bestie` Vite React frontend to **Vercel** (Hobby / Free Plan).

---

## 1. Quick Setup via Vercel Dashboard (Recommended)

1. Push your latest code to GitHub (`yourkigalibestie/ykb_ui` or your root repository).
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Click **Add New...** → **Project** and import your GitHub repository.
4. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**:
     - If importing the standalone `ykb_ui` repository: leave as `./` (Root)
     - If importing the monorepo: set to `frontend`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `dist` (or leave default)
   - **Install Command**: `npm install` (or leave default)

---

## 2. Environment Variables in Vercel

In the **Environment Variables** section before clicking Deploy (or under **Settings → Environment Variables**):

| Variable | Description | Value Example |
|---|---|---|
| `VITE_API_URL` | Render Backend API Endpoint | `https://ykb-backend.onrender.com/api` |
| `VITE_PHASE1` | Phase 1 Feature Flag | `true` |

---

## 3. SPA Routing & Rewrites

Vercel configuration is defined in [`frontend/vercel.json`](file:///d:/MP/AI/Clients/Your_Kigali_Bestie/frontend/vercel.json):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures React Router routes (e.g. `/services`, `/starter-guide`, `/register`, `/admin`) refresh properly without 404 errors.

---

## 4. Connecting Frontend & Backend

Once your frontend is deployed on Vercel:
1. Copy your Vercel deployment domain (e.g. `https://your-project.vercel.app` or custom domain `https://kigalibespoke.com`).
2. Go to your **Render Backend Dashboard** → **Environment**.
3. Update `ALLOWED_ORIGINS` to include your Vercel domain:
   ```env
   ALLOWED_ORIGINS="http://localhost:5173,https://your-project.vercel.app,https://kigalibespoke.com"
   ```
4. In your **Vercel Project Settings** → **Environment Variables**, ensure `VITE_API_URL` points to your live Render backend URL (`https://your-backend.onrender.com/api`).
