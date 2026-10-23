# Complete Web Application Deployment Guide

This guide walks you through deploying the **HealthCare Management Web Application** end-to-end so that users can use it online without issues.

---

## Architecture Overview

```
┌─────────────────────────────────┐       HTTPS (REST API)       ┌─────────────────────────────────┐
│         Vercel (Frontend)       │ ───────────────────────────> │         Render (Backend)        │
│  React (Vite) Single Page App   │ <─────────────────────────── │      Node.js + Express API      │
└─────────────────────────────────┘                              └────────────────┬────────────────┘
                                                                                  │
                                                                                  │ MySQL SSL Connection
                                                                                  ▼
                                                                 ┌─────────────────────────────────┐
                                                                 │        Cloud MySQL Database     │
                                                                 │     (TiDB Cloud / Aiven /       │
                                                                 │            Railway)             │
                                                                 └─────────────────────────────────┘
```

---

## Step 1: Create a Free Cloud MySQL Database

Your local database (`127.0.0.1`) cannot be accessed by cloud servers. You need a free cloud MySQL instance.

### Option A (Recommended): TiDB Cloud (Serverless) - 100% Free Forever
1. Go to [https://tidbcloud.com](https://tidbcloud.com) and create a free account (Sign in with GitHub or Google).
2. Click **Create Cluster** and select **TiDB Serverless** (Free 5GB).
3. Choose your nearest region (e.g., AWS / Asia-Mumbai or AP-Southeast-1) and click **Create**.
4. Once created, click **Connect**:
   - Connection Type: **General**
   - Click **Generate Password** and copy it down.
   - Note down:
     - **Host**: (e.g., `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`)
     - **Port**: `4000`
     - **User**: (e.g., `xxxxxx.root`)
     - **Password**: `<your-password>`
     - **Database**: `test` (or create a new database `health`)

---

## Step 2: Deploy Backend to Render (Free)

1. Sign up or log into [Render.com](https://render.com) using your GitHub account.
2. Click **New +** -> **Web Service**.
3. Select your repository: `AI_HealthCare` (or connect your GitHub repository).
4. Fill in the deployment details:
   - **Name**: `healthcare-backend` (or any preferred name)
   - **Region**: Choose the region closest to you (e.g., Singapore / Frankfurt / Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend` *(⚠️ Important: must be `backend`)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` *(This automatically initializes database tables and starts the server)*
   - **Instance Type**: `Free`

5. Under **Environment Variables**, add the following keys:
   | Key | Value | Notes |
   |---|---|---|
   | `PORT` | `5000` | Render will bind this port |
   | `DB_HOST` | `<your-cloud-db-host>` | e.g. from TiDB or Aiven |
   | `DB_PORT` | `4000` (or `3306`) | 4000 for TiDB, 3306 for Aiven/Railway |
   | `DB_USER` | `<your-cloud-db-username>` | Database username |
   | `DB_PASSWORD` | `<your-cloud-db-password>` | Database password |
   | `DB_NAME` | `test` (or `health`) | Database name |
   | `DB_SSL` | `true` | Required for cloud databases |
   | `JWT_SECRET` | `your_secret_random_token_here` | Any long random string |
   | `GROQ_API_KEY` | `<your-groq-api-key>` | Free from [console.groq.com](https://console.groq.com) |
   | `GROQ_MODEL` | `qwen/qwen3.8-27b` | AI symptom checker model |
   | `GEMINI_API_KEY` | `<your-gemini-api-key>` | Free from [aistudio.google.com](https://aistudio.google.com) |
   | `FRONTEND_URL` | `https://<your-app>.vercel.app` | Your Vercel frontend URL |
   | `BACKEND_URL` | `https://<your-backend-app>.onrender.com` | Your Render backend URL |

6. Click **Deploy Web Service**.
7. Wait 2-3 minutes for the build to complete. Look at the deploy logs:
   - You should see:
     ```
     [Database] Checking connection to database...
     [Database] Successfully connected!
     [Migration] Running database migrations...
     [Migration] Database migration complete! All tables verified and ready.
     Server running on port 5000
     ```
8. Render will provide your public backend URL, e.g.:
   `https://healthcare-backend-xxxx.onrender.com`
   Test it in your browser: `https://healthcare-backend-xxxx.onrender.com/`
   It should return:
   ```json
   { "status": "ok", "message": "Healthcare API is running smoothly" }
   ```

---

## Step 3: Connect Frontend on Vercel to Backend

Now configure your deployed Vercel frontend to send all API requests to the Render backend.

1. Open your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click on your project.
3. Go to **Settings** -> **Environment Variables**.
4. Add the following variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://healthcare-backend-xxxx.onrender.com/api` *(or without `/api`, the app auto-formats it)*
   - Environments: Check **Production**, **Preview**, and **Development**.
5. Click **Save**.
6. Go to the **Deployments** tab, click the **...** (three dots) next to the latest deployment, and select **Redeploy**.
   *(Vite embeds environment variables during build time, so redeploying is necessary)*.

---

## Step 4: Verification Checklist

Once both are deployed, test the live website:

1. **Open your Vercel URL**: `https://your-frontend.vercel.app`
2. **Register a New Patient Account**:
   - Fill in name, email, password, and phone number.
   - Click Register. (Registration works immediately with instant login).
3. **Log In**:
   - Sign in with your registered email and password.
   - Verify that you are redirected to the Dashboard.
4. **Log Health Data**:
   - Add blood pressure, heart rate, sleep hours, etc.
   - Verify that charts and logs update.
5. **AI Symptoms & Chatbot**:
   - Open AI Assistant and ask a medical question.
   - Verify that the response is generated via Groq/fallback.
6. **Doctor Portal (Optional)**:
   - Register as Doctor (Passcode: `DOCTOR2026`).
   - Log in and verify patient consultations and prescription management.

---

## Summary of Files Updated for Production

- `backend/config/db.js`: Added support for both `DATABASE_URL` and SSL cloud connections.
- `backend/utils/wait-and-migrate.js`: Reuses the unified DB pool and automatically executes `schema.sql` on deployment start.
- `backend/controllers/authController.js`: Added smart email verification handling so registration & login work out-of-the-box in production even if SMTP isn't set up yet.
- `backend/server.js`: Added root `/` and `/api/health-check` endpoints and bound to `0.0.0.0`.
- `backend/package.json`: Updated `npm start` to auto-migrate schema before server launch.
- `frontend/src/api/axios.js`: Normalized `VITE_API_URL` handling to prevent 404 errors with trailing slashes or missing `/api`.
