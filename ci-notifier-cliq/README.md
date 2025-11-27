# CI Notifier for Zoho Cliq

> Complete DevOps/CI notification system with real-time dashboard for Zoho Cliq

![CI Notifier](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

- **Real-time CI Notifications** - Receive instant Cliq notifications when builds fail
- **Interactive Dashboard** - Web-based dashboard to view all CI runs with filters and search
- **Action Buttons** - Re-run workflows, create GitHub issues, and more directly from Cliq
- **Multi-source Support** - GitHub Actions, generic CI/CD systems
- **Live Updates** - Server-Sent Events (SSE) for real-time dashboard updates
- **Dual Database** - SQLite for local dev, PostgreSQL for production
- **GitHub Integration** - Re-run workflows and create issues via GitHub API
- **Rich Cliq Cards** - Beautiful, actionable message cards with workflow details

## 📋 Table of Contents

- [Installation](#installation)
- [Local Setup](#local-setup)
- [Running Locally](#running-locally)
- [Testing with ngrok](#testing-with-ngrok)
- [Cliq Configuration](#cliq-configuration)
- [GitHub Integration](#github-integration)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Git
- (Optional) ngrok for local testing with Cliq
- (Optional) GitHub account with repository access

### Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd ci-notifier-cliq

# Install all dependencies (backend + frontend)
npm run install-all
```

## 🛠️ Local Setup

### 1. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
# Required:
#   - CLIQ_WEBHOOK_URL: Your Cliq incoming webhook URL
# Optional:
#   - GITHUB_TOKEN: For re-run and issue creation
#   - API_KEY: For dashboard security
```

### 2. Initialize Database

```bash
# Create SQLite database and schema
npm run migrate
```

This creates `data/ci_runs.db` with the required schema.

### 3. Verify Setup

```bash
# Check backend package
cd backend && npm list

# Check frontend package
cd ../frontend && npm list
```

## ▶️ Running Locally

### Option 1: Both Backend + Frontend (Recommended)

```bash
# Start both servers concurrently
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### Option 2: Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# or: npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Test the Setup

```bash
# Send a test webhook (PowerShell)
.\scripts\test-payload.ps1

# Or using bash
bash scripts/test-payload.sh
```

Check:
1. Backend logs show webhook received
2. Dashboard shows the new run: http://localhost:5173/dashboard
3. (If `CLIQ_WEBHOOK_URL` configured) Cliq channel receives a card

## 🌐 Testing with ngrok

To test Cliq integration locally, expose your backend with ngrok:

### 1. Start ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 2. Update Environment

Edit `.env`:
```
BACKEND_URL=https://abc123.ngrok.io
```

Restart the backend server.

### 3. Update Cliq Extension

In `cliq-extension.json`, replace `${BACKEND_URL}` with your ngrok URL, then upload to Cliq.

## 🤖 Cliq Configuration

### Step 1: Create Incoming Webhook

1. In Zoho Cliq, go to **Settings** > **Bots & Tools** > **Incoming Webhooks**
2. Click **Create Webhook**
3. Name: "CI Notifier"
4. Select a channel
5. Copy the webhook URL
6. Paste into `.env` as `CLIQ_WEBHOOK_URL`

### Step 2: Register Extension

1. Open `cliq-extension.json`
2. Replace `${BACKEND_URL}` with your actual URL:
   - Local via ngrok: `https://abc123.ngrok.io`
   - Production: `https://your-app.herokuapp.com`
3. In Cliq, go to **Settings** > **Bots & Tools** > **Extensions**
4. Click **Create Extension** > **Upload JSON**
5. Upload `cliq-extension.json`
6. Publish the extension

### Step 3: Test

In any Cliq channel, type:
```
/test-ci-card
```

You should receive a test CI failure card.

## 🐙 GitHub Integration

### Step 1: Generate Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Select scopes: `repo`, `workflow`
4. Copy the token
5. Add to `.env`:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```

### Step 2: Add Workflow to Repository

Copy `scripts/sample-github-action.yml` to your repo as `.github/workflows/ci-notifier.yml`

Add repository secret:
- Name: `CI_NOTIFIER_WEBHOOK_URL`
- Value: Your webhook URL (e.g., `https://your-app.herokuapp.com/ci/webhook`)

### Step 3: Test

Push a commit that causes a workflow to fail. The notifier should receive the webhook.

## 🚢 Deployment

### Heroku Deployment

#### Prerequisites
- Heroku account
- Heroku CLI installed

#### Steps

```bash
# Login to Heroku
heroku login

# Create app
heroku create ci-notifier-cliq

# Add Postgres addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set CLIQ_WEBHOOK_URL="your_cliq_webhook_url"
heroku config:set GITHUB_TOKEN="your_github_token"
heroku config:set API_KEY=$(openssl rand -hex 32)
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

Your app will be at: `https://ci-notifier-cliq.herokuapp.com`

**Important:** Update `BACKEND_URL` in Cliq extension manifest and re-upload.

### Vercel Deployment

#### Prerequisites
- Vercel account
- Vercel CLI (optional)

#### Steps

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - CLIQ_WEBHOOK_URL
# - GITHUB_TOKEN
# - API_KEY
# - DATABASE_URL (use a hosted Postgres like Supabase or Neon)

# Deploy to production
vercel --prod
```

**Note:** Vercel serverless functions have limitations. For SSE (Server-Sent Events), Heroku is recommended.

## 📚 API Documentation

### Backend Endpoints

#### CI Webhooks

**POST /ci/webhook**
- Receive CI/CD webhooks
- Supports GitHub Actions and generic payloads
- Query param: `?source=github` (optional, auto-detected)

```bash
curl -X POST http://localhost:3000/ci/webhook \
  -H "Content-Type: application/json" \
  -d '{"workflow_run": {...}}'
```

#### Cliq Actions

**POST /cliq/action**
- Handle Cliq button actions (rerun, assign, open-run)

**GET /cliq/test-card**
- Send a test card to Cliq

#### Dashboard API

**GET /api/runs**
- Get paginated runs
- Query params: `page`, `limit`, `status`, `repo`, `search`, `startDate`, `endDate`

**GET /api/runs/:id**
- Get single run details

**GET /api/stats**
- Get aggregate statistics

**POST /api/runs/:id/rerun**
- Trigger workflow re-run

**POST /api/runs/:id/create-issue**
- Create GitHub issue for failed run

**POST /api/runs/:id/post-to-cliq**
- Manually post run to Cliq

#### Real-time

**GET /events**
- Server-Sent Events for live dashboard updates

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js 18+ with Express
- SQLite (dev) / PostgreSQL (prod)
- better-sqlite3 / pg
- axios for HTTP requests
- Jest + supertest for testing

**Frontend:**
- React 18
- Vite for build
- React Router for routing
- Native fetch for API calls
- Server-Sent Events for real-time

**DevOps:**
- GitHub Actions for CI
- Heroku / Vercel for hosting
- ngrok for local testing

### Project Structure

```
ci-notifier-cliq/
├── backend/                  # Backend Node.js server
│   ├── src/
│   │   ├── index.js         # Server entry point
│   │   ├── db.js            # Database layer
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth middleware
│   │   └── templates/       # Cliq card templates
│   ├── tests/               # Jest unit tests
│   └── package.json
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API service
│   │   └── styles/          # CSS
│   └── package.json
├── scripts/                 # Utility scripts
│   ├── migrate.js           # DB migration
│   ├── test-payload.ps1     # Test webhook
│   └── sample-github-action.yml
├── data/                    # SQLite database (gitignored)
├── cliq-extension.json      # Cliq extension manifest
├── .env.example             # Environment template
├── Procfile                 # Heroku config
├── vercel.json              # Vercel config
└── README.md
```

### Database Schema

**runs table:**
```sql
CREATE TABLE runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo TEXT NOT NULL,
  workflow TEXT NOT NULL,
  branch TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'success', 'failure', etc.
  run_url TEXT NOT NULL,
  raw_payload TEXT NOT NULL,  -- JSON
  logs TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Testing

### Run Unit Tests

```bash
cd backend
npm test
```

Tests cover:
- Webhook endpoint with GitHub Actions payload
- Cliq action handlers (rerun, assign, open-run)
- Dashboard API endpoints (runs, filters, stats)

### Manual Testing

1. **Send test webhook:**
   ```bash
   .\scripts\test-payload.ps1
   ```

2. **Check database:**
   ```bash
   sqlite3 data/ci_runs.db "SELECT * FROM runs;"
   ```

3. **Verify dashboard:**
   Open http://localhost:5173/dashboard

4. **Test Cliq card:**
   In Cliq channel, type `/test-ci-card`

## 🐛 Troubleshooting

### Backend won't start

**Error:** `Cannot find module 'better-sqlite3'`

**Solution:**
```bash
cd backend
npm install
```

### Frontend shows "Failed to fetch"

**Cause:** Backend not running or CORS issue

**Solution:**
- Ensure backend is running on port 3000
- Check `vite.config.js` proxy settings
- Start both with `npm run dev` from root

### Database errors

**Error:** `SQLITE_CANTOPEN`

**Solution:**
```bash
npm run migrate
```

### Cliq card not received

**Checklist:**
- [ ] `CLIQ_WEBHOOK_URL` is set in `.env`
- [ ] Backend is restarted after changing `.env`
- [ ] Webhook URL is correct (test with `curl`)
- [ ] Cliq incoming webhook is active

### ngrok issues

**Error:** Ngrok URL changes every restart

**Solution:**
- Use ngrok paid plan for fixed URLs
- Or update `BACKEND_URL` and Cliq extension each time

### GitHub API errors

**Error:** `Bad credentials`

**Solution:**
- Verify `GITHUB_TOKEN` is correct
- Ensure token has `repo` and `workflow` scopes
- Token must not be expired

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Backend server port |
| `NODE_ENV` | No | `development` | Environment (development/production) |
| `DATABASE_URL` | No | (SQLite) | PostgreSQL connection string |
| `CLIQ_WEBHOOK_URL` | Yes* | - | Cliq incoming webhook URL |
| `BACKEND_URL` | Yes | `http://localhost:3000` | Public backend URL |
| `GITHUB_TOKEN` | No | - | GitHub personal access token |
| `API_KEY` | No | - | API key for dashboard endpoints |
| `WEBHOOK_SECRET` | No | - | Webhook signature verification secret |

*Required for Cliq notifications to work

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Zoho Cliq for the extensibility platform
- GitHub Actions for CI/CD webhooks
- Node.js and React communities

---

**Need help?** Open an issue on GitHub or contact the maintainer.

**Built with ❤️ for the Zoho Cliq developer community**
