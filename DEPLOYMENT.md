# 🚀 3-Minute Deployment Guide: Render + Vercel

This guide walks you through deploying the **Study Coach** web application to the cloud for free using **Render** (Backend API) and **Vercel** (Frontend UI).

---

## Part 1: Push Project to GitHub

1. Initialize Git in the project root (`pomodoro-study-coach`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Study Coach Agentic AI application"
   ```
2. Create a new repository on [GitHub](https://github.com/new) and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/study-coach.git
   git branch -M main
   git push -u origin main
   ```

---

## Part 2: Deploy Backend on Render (Free)

1. Go to [Render.com](https://dashboard.render.com/) and click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `study-coach-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables** under the Environment tab:
   - `SUPABASE_URL`: `https://lvswuakhgryjrkuebokr.supabase.co`
   - `SUPABASE_KEY`: `sb_publishable_5xWfZBklEWhrodNX8khRyg_mt_UFcOC`
   - `OPENAI_API_KEY`: *(Your OpenAI API key / GitHub Models token)*
   - `OPENAI_MODEL`: `gpt-4o-mini`
5. Click **Create Web Service**.
6. Once deployed, copy your live backend URL (e.g. `https://study-coach-backend.onrender.com`).

---

## Part 3: Deploy Frontend on Vercel (Free)

1. Go to [Vercel.com](https://vercel.com/new) and import your GitHub repository.
2. Under **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
3. Under **Environment Variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://study-coach-backend.onrender.com` *(your Render backend URL from Part 2)*
4. Click **Deploy**.
5. Your live website URL is generated immediately (e.g. `https://study-coach.vercel.app`)!

---

## Part 4: Testing Your Live Deployment
1. Visit your Vercel URL.
2. Test starting a Pomodoro session and chatting with the coach.
3. Verify that your sessions and daily goals sync in real-time to your Supabase cloud PostgreSQL database!
