const mongoose = require('mongoose');

const cityDataSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    index: true
  },
  country: String,
  coordinates: {
    lat: Number,
    lon: Number
  },
  weather: {
    temperature: Number,       // Celsius
    feels_like: Number,
    humidity: Number,          // %
    pressure: Number,          // hPa
    description: String,
    icon: String,
    wind_speed: Number,        // m/s
    wind_deg: Number,          // degrees
    visibility: Number,        // meters
    clouds: Number             // % cloud cover
  },
  aqi: {
    value: Number,             // OWM AQI index 1-5
    category: String,          // Good/Fair/Moderate/Poor/Very Poor
    color: String,
    pm25: Number,              // µg/m³
    pm10: Number,
    no2: Number,
    o3: Number,
    co: Number,
    so2: Number,
    nh3: Number
  },
  population: {
    total: Number,
    source: String
  },
  currency: {
    code: String,
    name: String,
    symbol: String,
    rate_to_inr: Number,       // 1 unit of local currency = X INR
    inr_to_local: Number,      // 1 INR = X local currency
    rate_to_usd: Number        // 1 unit of local currency = X USD
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for querying latest data per city efficiently
cityDataSchema.index({ city: 1, timestamp: -1 });

// TTL index: auto-delete records older than 16 days (keeps DB clean)
cityDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 16 * 24 * 60 * 60 });

module.exports = mongoose.model('CityData', cityDataSchema);
