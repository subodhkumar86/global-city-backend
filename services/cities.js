// 10 global cities with full metadata
const CITIES = [
  {
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lon: 139.6503,
    population: 13960000,
    timezone: 'Asia/Tokyo',
    currency: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' }
  },
  {
    name: 'New York',
    country: 'USA',
    lat: 40.7128,
    lon: -74.0060,
    population: 8336817,
    timezone: 'America/New_York',
    currency: { code: 'USD', name: 'US Dollar', symbol: '$' }
  },
  {
    name: 'London',
    country: 'UK',
    lat: 51.5074,
    lon: -0.1278,
    population: 8982000,
    timezone: 'Europe/London',
    currency: { code: 'GBP', name: 'British Pound', symbol: '£' }
  },
  {
    name: 'Mumbai',
    country: 'India',
    lat: 19.0760,
    lon: 72.8777,
    population: 20667656,
    timezone: 'Asia/Kolkata',
    currency: { code: 'INR', name: 'Indian Rupee', symbol: '₹' }
  },
  {
    name: 'Dubai',
    country: 'UAE',
    lat: 25.2048,
    lon: 55.2708,
    population: 3331420,
    timezone: 'Asia/Dubai',
    currency: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' }
  },
  {
    name: 'Sydney',
    country: 'Australia',
    lat: -33.8688,
    lon: 151.2093,
    population: 5312000,
    timezone: 'Australia/Sydney',
    currency: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
  },
  {
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lon: 2.3522,
    population: 2161000,
    timezone: 'Europe/Paris',
    currency: { code: 'EUR', name: 'Euro', symbol: '€' }
  },
  {
    name: 'São Paulo',
    country: 'Brazil',
    lat: -23.5505,
    lon: -46.6333,
    population: 12325232,
    timezone: 'America/Sao_Paulo',
    currency: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }
  },
  {
    name: 'Cairo',
    country: 'Egypt',
    lat: 30.0444,
    lon: 31.2357,
    population: 10107125,
    timezone: 'Africa/Cairo',
    currency: { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' }
  },
  {
    name: 'Singapore',
    country: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
    population: 5850342,
    timezone: 'Asia/Singapore',
    currency: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' }
  }
];

// AQI category mapping (OpenWeatherMap uses 1-5 scale)
const AQI_CATEGORIES = {
  1: { label: 'Good',      color: '#00e676', description: 'Air quality is satisfactory.' },
  2: { label: 'Fair',      color: '#ffee58', description: 'Acceptable air quality.' },
  3: { label: 'Moderate',  color: '#ffa726', description: 'Sensitive individuals may be affected.' },
  4: { label: 'Poor',      color: '#ef5350', description: 'Everyone may experience health effects.' },
  5: { label: 'Very Poor', color: '#ab47bc', description: 'Health alert: everyone may experience effects.' }
};

module.exports = { CITIES, AQI_CATEGORIES };
