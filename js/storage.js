/**
 * Atmos — LocalStorage Wrapper & State Persistence (storage.js)
 * Safely reads/writes preferences, favourite cities, and offline cache.
 */
const AtmosStorage = (() => {
  const KEYS = {
    SETTINGS: 'atmos_settings_v1',
    FAVORITES: 'atmos_favorites_v1',
    LAST_CITY: 'atmos_last_city_v1',
    WEATHER_CACHE: 'atmos_weather_cache_v1'
  };

  const DEFAULT_SETTINGS = {
    tempUnit: 'celsius',      // 'celsius' | 'fahrenheit'
    windUnit: 'kmh',          // 'kmh' | 'mph'
    theme: 'dark',            // 'dark' | 'light'
    aqiStandard: 'us',        // 'us' | 'eu'
    timeFormat: '12h',        // '12h' | '24h'
    defaultCity: {
      name: 'Chennai',
      country: 'India',
      admin1: 'Tamil Nadu',
      latitude: 13.0827,
      longitude: 80.2707
    }
  };

  const DEFAULT_FAVORITES = [
    { id: 'california-us', name: 'California', country: 'US', admin1: 'Maryland', latitude: 38.3004, longitude: -76.5074 },
    { id: 'beijing-cn', name: 'Beijing', country: 'China', admin1: 'Beijing', latitude: 39.9042, longitude: 116.4074 },
    { id: 'jerusalem-il', name: 'Jerusalem', country: 'Israel', admin1: 'Jerusalem', latitude: 31.7683, longitude: 35.2137 }
  ];

  function safeGet(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function getSettings() {
    const saved = safeGet(KEYS.SETTINGS, {});
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  }

  function saveSettings(partial) {
    const updated = Object.assign({}, getSettings(), partial);
    safeSet(KEYS.SETTINGS, updated);
    return updated;
  }

  function getFavorites() {
    return safeGet(KEYS.FAVORITES, DEFAULT_FAVORITES);
  }

  function saveFavorites(list) {
    safeSet(KEYS.FAVORITES, list);
    return list;
  }

  function getLastCity() {
    const settings = getSettings();
    return safeGet(KEYS.LAST_CITY, settings.defaultCity);
  }

  function saveLastCity(cityObj) {
    safeSet(KEYS.LAST_CITY, cityObj);
  }

  function saveWeatherCache(cityKey, payload) {
    const cache = safeGet(KEYS.WEATHER_CACHE, {});
    cache[cityKey] = {
      timestamp: new Date().toISOString(),
      data: payload
    };
    safeSet(KEYS.WEATHER_CACHE, cache);
  }

  function getWeatherCache(cityKey) {
    const cache = safeGet(KEYS.WEATHER_CACHE, {});
    return cache[cityKey] || null;
  }

  function clearAll() {
    try {
      Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
    } catch (err) {
      // Ignore storage block errors in sandboxed frames
    }
  }

  return {
    getSettings,
    saveSettings,
    getFavorites,
    saveFavorites,
    getLastCity,
    saveLastCity,
    saveWeatherCache,
    getWeatherCache,
    clearAll
  };
})();
