# Global City Insights — Backend

Node.js + Express + MongoDB Atlas backend for the Global City Insights Dashboard.

## Tech Stack
- **Node.js / Express** — REST API server
- **MongoDB Atlas** (free tier) — Data storage
- **OpenWeatherMap API** — Weather + Air Quality data
- **ExchangeRate-API / open.er-api.com** — Currency rates vs INR
- **node-cron** — Scheduled data fetching every 30 minutes

## Architecture

```
server.js           ← Express app + MongoDB connection + cron scheduler
routes/api.js       ← REST endpoints
services/
  dataFetcher.js    ← Fetches weather, AQI, exchange rates from APIs
  cities.js         ← City list (10 cities) + AQI category config
models/
  CityData.js       ← Mongoose schema (auto-TTL: 16 days)
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cities` | Latest data for all 10 cities |
| GET | `/api/cities/:name` | Latest data for one city |
| GET | `/api/cities/:name/history?days=7` | Trend data (7–15 days) |
| POST | `/api/refresh` | Manually trigger a data fetch |
| GET | `/api/stats` | DB statistics |
| GET | `/health` | Health check |

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB Atlas free tier account
- OpenWeatherMap free API key (1000 calls/day free)

### 2. MongoDB Atlas Setup
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free cluster
2. Add a database user (username + password)
3. Whitelist your IP (or `0.0.0.0/0` for open access)
4. Copy the connection string (looks like `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/`)

### 3. OpenWeatherMap API Key
1. Sign up at [openweathermap.org](https://openweathermap.org/api)
2. Go to API Keys → copy your key
3. The free tier includes both **Current Weather** and **Air Pollution** APIs

### 4. ExchangeRate API Key (Optional)
1. Sign up at [exchangerate-api.com](https://www.exchangerate-api.com/)
2. Free tier: 1,500 requests/month
3. If left blank, the backend falls back to [open.er-api.com](https://open.er-api.com) (no key needed)

### 5. Installation

```bash
# Clone / extract this folder
cd global-city-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/global-city-insights?retryWrites=true&w=majority
OPENWEATHER_API_KEY=your_openweathermap_key_here
EXCHANGE_RATE_API_KEY=your_exchangerate_api_key_or_leave_blank
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 6. Run

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

On startup the server will:
1. Connect to MongoDB Atlas
2. Immediately fetch data for all 10 cities
3. Schedule fetches every 30 minutes via cron

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard → Settings → Environment Variables.

## Data Retention

Records older than 16 days are automatically deleted via MongoDB TTL index.
Each fetch cycle stores one document per city.
With fetches every 30 minutes: ~48 records/city/day → ~6,720 records total at 15 days.

## 10 Cities Tracked

Tokyo, New York, London, Mumbai, Dubai, Sydney, Paris, São Paulo, Cairo, Singapore
