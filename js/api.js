/**
 * Atmos — Open-Meteo 100% Keyless API Service Module (api.js)
 * Strictly uses ONLY Open-Meteo's free, keyless Forecast, Geocoding, and Air Quality APIs.
 * Zero API keys, zero account registration, zero blocked third-party endpoints.
 */
const AtmosAPI = (() => {
  // Reference coordinates for major world regions when clicking on the interactive global map
  const GLOBAL_HUBS = [
    { name: 'Chennai', country: 'India', admin1: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
    { name: 'Mumbai', country: 'India', admin1: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
    { name: 'New Delhi', country: 'India', admin1: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
    { name: 'Bengaluru', country: 'India', admin1: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
    { name: 'London', country: 'United Kingdom', admin1: 'England', latitude: 51.5074, longitude: -0.1278 },
    { name: 'Paris', country: 'France', admin1: 'Île-de-France', latitude: 48.8566, longitude: 2.3522 },
    { name: 'Berlin', country: 'Germany', admin1: 'Berlin', latitude: 52.5200, longitude: 13.4050 },
    { name: 'New York', country: 'United States', admin1: 'New York', latitude: 40.7128, longitude: -74.0060 },
    { name: 'California', country: 'US', admin1: 'California', latitude: 36.7783, longitude: -119.4179 },
    { name: 'Toronto', country: 'Canada', admin1: 'Ontario', latitude: 43.6532, longitude: -79.3832 },
    { name: 'São Paulo', country: 'Brazil', admin1: 'São Paulo', latitude: -23.5505, longitude: -46.6333 },
    { name: 'Cairo', country: 'Egypt', admin1: 'Cairo', latitude: 30.0444, longitude: 31.2357 },
    { name: 'Jerusalem', country: 'Israel', admin1: 'Jerusalem', latitude: 31.7683, longitude: 35.2137 },
    { name: 'Dubai', country: 'United Arab Emirates', admin1: 'Dubai', latitude: 25.2048, longitude: 55.2708 },
    { name: 'Beijing', country: 'China', admin1: 'Beijing', latitude: 39.9042, longitude: 116.4074 },
    { name: 'Tokyo', country: 'Japan', admin1: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
    { name: 'Singapore', country: 'Singapore', admin1: 'Central', latitude: 1.3521, longitude: 103.8198 },
    { name: 'Sydney', country: 'Australia', admin1: 'New South Wales', latitude: -33.8688, longitude: 151.2093 }
  ];

  /**
   * A. Open-Meteo Forecast API (Keyless)
   */
  async function fetchWeather(lat, lon, settings = {}) {
    const tempUnit = settings.tempUnit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const windUnit = settings.windUnit === 'mph' ? 'mph' : 'kmh';

    const params = new URLSearchParams({
      latitude: Number(lat).toFixed(4),
      longitude: Number(lon).toFixed(4),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'is_day',
        'precipitation',
        'rain',
        'weather_code',
        'wind_speed_10m',
        'wind_direction_10m',
        'surface_pressure',
        'visibility'
      ].join(','),
      hourly: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'precipitation_probability',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
        'uv_index'
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'sunrise',
        'sunset',
        'uv_index_max',
        'precipitation_probability_max',
        'precipitation_sum',
        'wind_speed_10m_max'
      ].join(','),
      temperature_unit: tempUnit,
      wind_speed_unit: windUnit,
      timezone: 'auto'
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Forecast API returned HTTP ${response.status}`);
    }
    return await response.json();
  }

  /**
   * B. Open-Meteo Geocoding API (Keyless)
   */
  async function searchCities(query, count = 6) {
    const clean = String(query || '').trim();
    if (!clean) return [];

    const params = new URLSearchParams({
      name: clean,
      count: String(count),
      language: 'en',
      format: 'json'
    });

    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Geocoding API returned HTTP ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data.results) ? data.results : [];
  }

  /**
   * C. Open-Meteo Air Quality API (Keyless)
   */
  async function fetchAirQuality(lat, lon) {
    const params = new URLSearchParams({
      latitude: Number(lat).toFixed(4),
      longitude: Number(lon).toFixed(4),
      current: [
        'us_aqi',
        'european_aqi',
        'pm10',
        'pm2_5',
        'carbon_monoxide',
        'nitrogen_dioxide',
        'ozone'
      ].join(','),
      timezone: 'auto'
    });

    const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Air Quality API returned HTTP ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Fetch compact current weather for favourite sidebar city cards
   */
  async function fetchCompactCityWeather(lat, lon, settings = {}) {
    const tempUnit = settings.tempUnit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const params = new URLSearchParams({
      latitude: Number(lat).toFixed(4),
      longitude: Number(lon).toFixed(4),
      current: 'temperature_2m,weather_code,is_day',
      temperature_unit: tempUnit,
      timezone: 'auto'
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Compact weather error: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Resolve coordinates to the nearest known hub or formatted coordinate label without requiring any API key
   */
  function resolveCoordinatesLabel(lat, lon) {
    const nLat = Number(lat);
    const nLon = Number(lon);
    let closest = null;
    let minDist = Infinity;

    GLOBAL_HUBS.forEach((hub) => {
      const dLat = hub.latitude - nLat;
      const dLon = hub.longitude - nLon;
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < minDist) {
        minDist = dist;
        closest = hub;
      }
    });

    // If within ~3.5 degrees of a known hub, label as near that city; otherwise show exact coordinates
    if (closest && minDist <= 3.5) {
      return {
        id: `coord-${nLat.toFixed(2)}-${nLon.toFixed(2)}`,
        name: closest.name,
        country: closest.country,
        admin1: closest.admin1,
        latitude: nLat,
        longitude: nLon
      };
    }

    const latDir = nLat >= 0 ? 'N' : 'S';
    const lonDir = nLon >= 0 ? 'E' : 'W';
    return {
      id: `coord-${nLat.toFixed(2)}-${nLon.toFixed(2)}`,
      name: `${Math.abs(nLat).toFixed(2)}°${latDir}, ${Math.abs(nLon).toFixed(2)}°${lonDir}`,
      country: 'Global Weather Pin',
      admin1: 'Open-Meteo Coordinate',
      latitude: nLat,
      longitude: nLon
    };
  }

  function getGlobalHubs() {
    return GLOBAL_HUBS.slice();
  }

  return {
    fetchWeather,
    fetchAirQuality,
    searchCities,
    fetchCompactCityWeather,
    resolveCoordinatesLabel,
    getGlobalHubs
  };
})();
