require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');
const { fetchAndStoreAllCities } = require('./services/dataFetcher');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api', apiRoutes);

app.get('/', (req, res) => res.json({ message: 'Global City Insights Backend 🌍' }));
app.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

const IS_VERCEL = !!process.env.VERCEL;

if (!IS_VERCEL) {
  // LOCAL: normal startup with cron
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('✅ Connected to MongoDB Atlas');
      app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

      console.log('⏳ Running initial data fetch...');
      await fetchAndStoreAllCities();

      const cron = require('node-cron');
      cron.schedule('*/30 * * * *', async () => {
        console.log(`⏰ [CRON] Fetching at ${new Date().toISOString()}`);
        await fetchAndStoreAllCities();
      });
      console.log('🔄 Cron scheduled: every 30 minutes');
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      process.exit(1);
    });

} else {
  // VERCEL: lazy connect per request
  let isConnected = false;
  app.use(async (req, res, next) => {
    if (!isConnected) {
      await mongoose.connect(process.env.MONGODB_URI);
      isConnected = true;
    }
    next();
  });
}

module.exports = app;