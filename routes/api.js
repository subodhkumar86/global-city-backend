const express = require('express');
const router  = express.Router();
const CityData = require('../models/CityData');
const { CITIES } = require('../services/cities');
const { fetchAndStoreAllCities } = require('../services/dataFetcher');

// ── GET /api/cities ───────────────────────────────────────────────────────────
// Latest data for all 10 cities
router.get('/cities', async (req, res) => {
  try {
    const latestData = await CityData.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id:  '$city',
          doc:  { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { city: 1 } }
    ]);

    res.json({
      success: true,
      count:   latestData.length,
      data:    latestData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/cities/:cityName ─────────────────────────────────────────────────
// Latest data for a specific city
router.get('/cities/:cityName', async (req, res) => {
  try {
    const city   = decodeURIComponent(req.params.cityName);
    const latest = await CityData.findOne({ city })
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) {
      return res.status(404).json({ success: false, error: `City '${city}' not found` });
    }

    res.json({ success: true, data: latest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/cities/:cityName/history ────────────────────────────────────────
// Historical trend data for a city (7-15 days, grouped hourly)
router.get('/cities/:cityName/history', async (req, res) => {
  try {
    const city  = decodeURIComponent(req.params.cityName);
    const days  = Math.min(parseInt(req.query.days) || 7, 15);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const history = await CityData.aggregate([
      {
        $match: {
          city,
          timestamp: { $gte: since }
        }
      },
      {
        $group: {
          _id: {
            year:  { $year:        '$timestamp' },
            month: { $month:       '$timestamp' },
            day:   { $dayOfMonth:  '$timestamp' },
            hour:  { $hour:        '$timestamp' }
          },
          temperature: { $avg: '$weather.temperature' },
          feels_like:  { $avg: '$weather.feels_like' },
          humidity:    { $avg: '$weather.humidity' },
          pressure:    { $avg: '$weather.pressure' },
          wind_speed:  { $avg: '$weather.wind_speed' },
          aqi:         { $avg: '$aqi.value' },
          pm25:        { $avg: '$aqi.pm25' },
          pm10:        { $avg: '$aqi.pm10' },
          timestamp:   { $first: '$timestamp' }
        }
      },
      { $sort: { timestamp: 1 } },
      {
        $project: {
          _id:         0,
          timestamp:   1,
          temperature: { $round: ['$temperature', 1] },
          feels_like:  { $round: ['$feels_like',  1] },
          humidity:    { $round: ['$humidity',    0] },
          pressure:    { $round: ['$pressure',    0] },
          wind_speed:  { $round: ['$wind_speed',  1] },
          aqi:         { $round: ['$aqi',         1] },
          pm25:        { $round: ['$pm25',         2] },
          pm10:        { $round: ['$pm10',         2] }
        }
      }
    ]);

    res.json({ success: true, city, days, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/refresh ─────────────────────────────────────────────────────────
// Manually trigger a data refresh
router.post('/refresh', async (req, res) => {
  try {
    // Respond immediately, run fetch async
    res.json({ success: true, message: 'Data refresh initiated. Check /api/stats for updates.' });
    fetchAndStoreAllCities().catch(console.error);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
// Dashboard/database statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalRecords, oldest, newest, citiesTracked] = await Promise.all([
      CityData.countDocuments(),
      CityData.findOne().sort({ timestamp:  1 }).select('timestamp city').lean(),
      CityData.findOne().sort({ timestamp: -1 }).select('timestamp city').lean(),
      CityData.distinct('city')
    ]);

    res.json({
      success: true,
      stats: {
        totalRecords,
        citiesTracked:  citiesTracked.length,
        cities:         citiesTracked.sort(),
        oldestRecord:   oldest?.timestamp,
        newestRecord:   newest?.timestamp,
        dataRetention:  '15 days',
        fetchInterval:  '30 minutes'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/cities-list ──────────────────────────────────────────────────────
// Static list of tracked cities (no DB needed)
router.get('/cities-list', (req, res) => {
  res.json({
    success: true,
    cities: CITIES.map(c => ({
      name:       c.name,
      country:    c.country,
      lat:        c.lat,
      lon:        c.lon,
      population: c.population,
      currency:   c.currency
    }))
  });
});
// GET /api/cron — called by Vercel Cron every 30 minutes
router.get('/cron', async (req, res) => {
  // Secure it so only Vercel can call it
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ success: true, message: 'Cron triggered' });
  fetchAndStoreAllCities().catch(console.error);
});
module.exports = router;
