const axios = require('axios');
const CityData = require('../models/CityData');
const { CITIES, AQI_CATEGORIES } = require('./cities');

const OWM_KEY = process.env.OPENWEATHER_API_KEY;
const EXCHANGE_KEY = process.env.EXCHANGE_RATE_API_KEY;

// ── Weather from OpenWeatherMap ───────────────────────────────────────────────
async function fetchWeather(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${OWM_KEY}&units=metric`;
    const { data } = await axios.get(url, { timeout: 10000 });
    return {
      temperature: Math.round(data.main.temp),
      feels_like:  Math.round(data.main.feels_like),
      humidity:    data.main.humidity,
      pressure:    data.main.pressure,
      description: data.weather[0]?.description || '',
      icon:        data.weather[0]?.icon || '',
      wind_speed:  parseFloat((data.wind?.speed || 0).toFixed(1)),
      wind_deg:    data.wind?.deg || 0,
      visibility:  data.visibility || 0,
      clouds:      data.clouds?.all || 0
    };
  } catch (err) {
    console.error(`  ⚠ Weather fetch failed for ${city.name}: ${err.message}`);
    return null;
  }
}

// ── AQI from OpenWeatherMap Air Pollution API ─────────────────────────────────
async function fetchAQI(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lon}&appid=${OWM_KEY}`;
    const { data } = await axios.get(url, { timeout: 10000 });
    const item       = data.list[0] || {};
    const components = item.components || {};
    const aqiIndex   = item.main?.aqi || 1;
    const category   = AQI_CATEGORIES[aqiIndex] || AQI_CATEGORIES[1];

    return {
      value:    aqiIndex,
      category: category.label,
      color:    category.color,
      pm25:     parseFloat((components.pm2_5 || 0).toFixed(2)),
      pm10:     parseFloat((components.pm10  || 0).toFixed(2)),
      no2:      parseFloat((components.no2   || 0).toFixed(2)),
      o3:       parseFloat((components.o3    || 0).toFixed(2)),
      co:       parseFloat((components.co    || 0).toFixed(2)),
      so2:      parseFloat((components.so2   || 0).toFixed(2)),
      nh3:      parseFloat((components.nh3   || 0).toFixed(2))
    };
  } catch (err) {
    console.error(`  ⚠ AQI fetch failed for ${city.name}: ${err.message}`);
    return null;
  }
}

// ── Exchange Rates (base: INR) ────────────────────────────────────────────────
async function fetchExchangeRates() {
  // Primary: exchangerate-api.com (free tier with key)
  if (EXCHANGE_KEY && EXCHANGE_KEY !== 'your_exchange_rate_api_key_here') {
    try {
      const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/INR`;
      const { data } = await axios.get(url, { timeout: 10000 });
      if (data.result === 'success') {
        console.log('  ✓ Exchange rates fetched from exchangerate-api.com');
        return data.conversion_rates; // 1 INR = X currency
      }
    } catch (err) {
      console.warn(`  ⚠ Primary exchange API failed: ${err.message}`);
    }
  }

  // Fallback: open.er-api.com (no key needed)
  try {
    const { data } = await axios.get('https://open.er-api.com/v6/latest/INR', { timeout: 10000 });
    if (data.result === 'success') {
      console.log('  ✓ Exchange rates fetched from open.er-api.com (fallback)');
      return data.rates;
    }
  } catch (err) {
    console.warn(`  ⚠ Fallback exchange API failed: ${err.message}`);
  }

  // Second fallback: fixer.io style (no key)
  try {
    const { data } = await axios.get('https://api.exchangerate.host/latest?base=INR', { timeout: 10000 });
    if (data.success) {
      console.log('  ✓ Exchange rates fetched from exchangerate.host (2nd fallback)');
      return data.rates;
    }
  } catch (err) {
    console.warn(`  ⚠ Second fallback exchange API failed: ${err.message}`);
  }

  console.error('  ✗ All exchange rate sources failed');
  return null;
}

// ── Build currency info for a city ───────────────────────────────────────────
function buildCurrencyData(city, inrRates) {
  const base = {
    code:   city.currency.code,
    name:   city.currency.name,
    symbol: city.currency.symbol,
    rate_to_inr:   null,
    inr_to_local:  null,
    rate_to_usd:   null
  };

  if (!inrRates) return base;

  // inrRates[X] = how many X per 1 INR
  const localPerInr = inrRates[city.currency.code]; // e.g. JPY: 1.8 means 1 INR = 1.8 JPY
  const usdPerInr   = inrRates['USD'];               // e.g. 0.012 means 1 INR = 0.012 USD

  if (localPerInr) {
    // 1 local currency = ? INR
    base.rate_to_inr  = parseFloat((1 / localPerInr).toFixed(4));
    // 1 INR = ? local
    base.inr_to_local = parseFloat(localPerInr.toFixed(4));
  }

  if (localPerInr && usdPerInr) {
    // 1 local currency = ? USD  →  (1/localPerInr) INR * (usdPerInr) USD/INR
    base.rate_to_usd = parseFloat((usdPerInr / localPerInr).toFixed(6));
  }

  return base;
}

// ── Main: fetch all cities and persist to MongoDB ────────────────────────────
async function fetchAndStoreAllCities() {
  const startTime  = Date.now();
  console.log(`\n[${new Date().toISOString()}] 🌐 Starting data fetch for ${CITIES.length} cities...`);

  // Fetch exchange rates once (shared across all cities)
  const inrRates  = await fetchExchangeRates();
  const timestamp = new Date();
  let successCount = 0;

  for (const city of CITIES) {
    try {
      // Fetch weather and AQI in parallel
      const [weather, aqi] = await Promise.all([
        fetchWeather(city),
        fetchAQI(city)
      ]);

      const currencyData = buildCurrencyData(city, inrRates);

      const doc = new CityData({
        city:        city.name,
        country:     city.country,
        coordinates: { lat: city.lat, lon: city.lon },
        weather,
        aqi,
        population:  { total: city.population, source: 'World Population Review 2024' },
        currency:    currencyData,
        timestamp
      });

      await doc.save();
      successCount++;
      console.log(`  ✓ ${city.name} (${city.country}) — ${weather?.temperature ?? '?'}°C, AQI ${aqi?.value ?? '?'}`);
    } catch (err) {
      console.error(`  ✗ Failed to save ${city.name}: ${err.message}`);
    }

    // Small delay to be kind to rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Fetch cycle complete: ${successCount}/${CITIES.length} cities saved in ${elapsed}s\n`);

  return { successCount, total: CITIES.length, elapsed };
}

module.exports = { fetchAndStoreAllCities };
