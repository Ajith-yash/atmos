/**
 * Atmos — Main Application Orchestrator (app.js)
 * Coordinates Open-Meteo live requests, forecast tabs, active card selection,
 * offline detection, PWA installation, and responsive navigation.
 */
const AtmosApp = (() => {
  let state = {
    city: null,
    settings: null,
    weather: null,
    aqi: null,
    activeTab: 'next7', // 'today' | 'tomorrow' | 'next7'
    selectedCardIndex: 0,
    isOfflineCached: false,
    cachedTimestamp: null,
    deferredInstallPrompt: null
  };

  function showToast(message) {
    const toast = document.getElementById('atmosToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3400);
  }

  function openModal(title, htmlBody) {
    const backdrop = document.getElementById('atmosModalBackdrop');
    const titleEl = document.getElementById('atmosModalTitle');
    const bodyEl = document.getElementById('atmosModalBody');
    if (!backdrop || !titleEl || !bodyEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = htmlBody;
    backdrop.classList.remove('hidden');
  }

  function closeModal() {
    const backdrop = document.getElementById('atmosModalBackdrop');
    if (backdrop) backdrop.classList.add('hidden');
  }

  async function loadCityWeather(city, showNotification = false) {
    state.city = city;
    state.selectedCardIndex = 0;
    AtmosStorage.saveLastCity(city);

    const locText = document.getElementById('headerLocationText');
    if (locText) {
      locText.textContent = city.country ? `${city.name}, ${city.country}` : city.name;
    }

    setLoadingState(true);

    try {
      const [weatherData, aqiData] = await Promise.all([
        AtmosAPI.fetchWeather(city.latitude, city.longitude, state.settings),
        AtmosAPI.fetchAirQuality(city.latitude, city.longitude).catch(() => null)
      ]);

      state.weather = weatherData;
      state.aqi = aqiData;
      state.isOfflineCached = false;
      state.cachedTimestamp = null;

      AtmosStorage.saveWeatherCache(city.id || city.name, { weather: weatherData, aqi: aqiData });
      updateOfflineBanner(false, null);

      renderAllSections();
      if (showNotification) {
        showToast(`Updated live weather for ${city.name}.`);
      }
    } catch (err) {
      // Check if cached data exists for offline fallback
      const cached = AtmosStorage.getWeatherCache(city.id || city.name);
      if (cached && cached.data) {
        state.weather = cached.data.weather;
        state.aqi = cached.data.aqi;
        state.isOfflineCached = true;
        state.cachedTimestamp = cached.timestamp;
        updateOfflineBanner(true, cached.timestamp);
        renderAllSections();
        showToast(`Offline mode: showing cached snapshot for ${city.name}.`);
      } else {
        updateOfflineBanner(true, null);
        showToast('Unable to reach Open-Meteo APIs. Check your internet connection.');
      }
    } finally {
      setLoadingState(false);
    }
  }

  function setLoadingState(isLoading) {
    const strip = document.getElementById('forecastStripContainer');
    if (strip) {
      strip.classList.toggle('loading-pulse', isLoading);
    }
  }

  function updateOfflineBanner(isOffline, timestamp) {
    const banner = document.getElementById('offlineStatusBanner');
    if (!banner) return;
    if (!isOffline) {
      banner.style.display = 'none';
      return;
    }
    banner.style.display = 'flex';
    const timeLabel = timestamp ? new Date(timestamp).toLocaleString() : 'No cached snapshot available';
    banner.innerHTML = `
      <span><strong>Offline / Cached View:</strong> Live Open-Meteo connection unavailable. Displaying cached data from ${AtmosGeocoding.escapeHtml(timeLabel)} (not live).</span>
      <button type="button" id="retryLiveSyncBtn" style="background:#B9DDF2;color:#101014;padding:4px 12px;border-radius:999px;font-weight:700;font-size:0.75rem;">Retry Live Sync</button>
    `;
    const retryBtn = document.getElementById('retryLiveSyncBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => loadCityWeather(state.city, true));
    }
  }

  function renderAllSections() {
    if (!state.weather) return;
    renderForecastStrip();
    renderWeatherDetailsGrid();
    AtmosCharts.updateAllCharts(state.weather, state.settings);
    AtmosAirQuality.renderAirQuality(state.aqi, state.settings);
    AtmosAlerts.renderAlerts(state.city, state.weather, state.settings);
    AtmosMap.updatePrimaryMarker(state.city, state.weather, state.settings);
  }

  /**
   * Renders the primary Forecast Strip (Pale-blue Hero Card + Mini Cards)
   * Supports Today (hourly), Tomorrow (hourly), and Next 7 days (daily)
   */
  function renderForecastStrip() {
    const container = document.getElementById('forecastStripContainer');
    if (!container || !state.weather) return;

    const c = state.weather.current;
    const d = state.weather.daily;
    const h = state.weather.hourly;
    const tempSym = '°';
    const windSym = state.settings.windUnit === 'mph' ? 'mph' : 'km/h';

    container.classList.toggle('hourly-mode', state.activeTab !== 'next7');

    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: state.settings.timeFormat !== '24h'
    });

    const curInfo = AtmosForecast.getWeatherInfo(c.weather_code, c.is_day);
    const sunriseStr = AtmosForecast.formatTime(d?.sunrise?.[0], state.settings.timeFormat);
    const sunsetStr = AtmosForecast.formatTime(d?.sunset?.[0], state.settings.timeFormat);
    const windCompass = AtmosForecast.windDegToCompass(c.wind_direction_10m);

    // Build Hero Card (Left pale-blue card matching screenshot)
    const heroHtml = `
      <div class="weather-hero-card">
        <div class="hero-card-header">
          <span>${dayName}</span>
          <span>${timeStr}</span>
        </div>
        <div class="hero-card-body">
          <div class="hero-temp-row">
            <div>
              <div class="hero-temp-value">${Math.round(c.temperature_2m)}${tempSym}</div>
              <div style="font-size:0.82rem;font-weight:600;margin-top:4px;opacity:0.85;">
                ${curInfo.label} • H:${Math.round(d?.temperature_2m_max?.[0] ?? c.temperature_2m)}° L:${Math.round(d?.temperature_2m_min?.[0] ?? c.temperature_2m)}°
              </div>
            </div>
            <div class="hero-weather-art">
              ${AtmosForecast.getWeatherSvg(curInfo.art, 72)}
            </div>
          </div>
          <div class="hero-meta-grid">
            <div>Real Feel <strong>${Math.round(c.apparent_temperature)}${tempSym}</strong></div>
            <div>Sunrise <strong>${sunriseStr}</strong></div>
            <div>Wind <strong>${windCompass}, ${Math.round(c.wind_speed_10m)} ${windSym}</strong></div>
            <div>Sunset <strong>${sunsetStr}</strong></div>
            <div>Pressure <strong>${Math.round(c.surface_pressure ?? 1013)} mb</strong></div>
            <div>Rainfall <strong>${Number(c.precipitation ?? 0).toFixed(1)} mm</strong></div>
            <div>Humidity <strong>${c.relative_humidity_2m}%</strong></div>
            <div>UV Index <strong>${Number(d?.uv_index_max?.[0] ?? 0).toFixed(0)}</strong></div>
          </div>
        </div>
      </div>
    `;

    // Build Mini Cards based on active tab
    let miniCardsHtml = '';

    if (state.activeTab === 'next7' && d && Array.isArray(d.time)) {
      // Days 1..6 (6 vertical pill cards next to the hero card = 7 days total)
      const items = d.time.slice(1, 7).map((dateStr, idx) => {
        const i = idx + 1;
        const dt = new Date(dateStr + 'T12:00:00');
        const shortDay = dt.toLocaleDateString('en-US', { weekday: 'short' });
        const info = AtmosForecast.getWeatherInfo(d.weather_code?.[i] ?? 0, 1);
        const maxT = Math.round(d.temperature_2m_max?.[i] ?? 0);
        const minT = Math.round(d.temperature_2m_min?.[i] ?? 0);
        const rainP = d.precipitation_probability_max?.[i] ?? 0;
        return { idx: i, title: shortDay, info, primary: `${maxT}${tempSym}`, sub: `Low ${minT}° • ${rainP}%` };
      });

      miniCardsHtml = items.map((item) => `
        <div class="forecast-mini-card ${state.selectedCardIndex === item.idx ? 'selected' : ''}" data-card-idx="${item.idx}">
          <div class="mini-card-day">${item.title}</div>
          <div class="mini-card-icon">${AtmosForecast.getWeatherSvg(item.info.art, 50)}</div>
          <div style="text-align:center;">
            <div class="mini-card-temp">${item.primary}</div>
            <div class="mini-card-sub">${item.sub}</div>
          </div>
        </div>
      `).join('');
    } else if (h && Array.isArray(h.time)) {
      // Hourly cards for Today or Tomorrow
      let startIdx = 0;
      if (state.activeTab === 'today') {
        const found = h.time.findIndex((t) => new Date(t) >= now);
        startIdx = found >= 0 ? found : 0;
      } else {
        // Tomorrow starts at index 24
        startIdx = 24;
      }

      const slice = [];
      for (let k = 0; k < 12; k++) {
        const idx = Math.min(startIdx + k * 2, h.time.length - 1);
        const dt = new Date(h.time[idx]);
        const hrLabel = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: state.settings.timeFormat !== '24h' });
        const hrNum = dt.getHours();
        const isDayHour = hrNum >= 6 && hrNum <= 18 ? 1 : 0;
        const info = AtmosForecast.getWeatherInfo(h.weather_code?.[idx] ?? 0, isDayHour);
        const temp = Math.round(h.temperature_2m?.[idx] ?? 0);
        const prob = h.precipitation_probability?.[idx] ?? 0;
        slice.push({ idx: k + 1, title: hrLabel, info, primary: `${temp}${tempSym}`, sub: `Rain ${prob}%` });
      }

      miniCardsHtml = slice.map((item) => `
        <div class="forecast-mini-card ${state.selectedCardIndex === item.idx ? 'selected' : ''}" data-card-idx="${item.idx}">
          <div class="mini-card-day">${item.title}</div>
          <div class="mini-card-icon">${AtmosForecast.getWeatherSvg(item.info.art, 46)}</div>
          <div style="text-align:center;">
            <div class="mini-card-temp">${item.primary}</div>
            <div class="mini-card-sub">${item.sub}</div>
          </div>
        </div>
      `).join('');
    }

    container.innerHTML = heroHtml + miniCardsHtml;

    // Allow selecting any forecast card to highlight it with the pale-blue background
    container.querySelectorAll('.forecast-mini-card').forEach((card) => {
      card.addEventListener('click', () => {
        state.selectedCardIndex = Number(card.getAttribute('data-card-idx'));
        renderForecastStrip();
      });
    });
  }

  /**
   * Populates the 10-Card Detailed Weather Metrics Section (Section 5 & 11)
   */
  function renderWeatherDetailsGrid() {
    const c = state.weather?.current;
    const d = state.weather?.daily;
    if (!c || !d) return;

    const tempSym = state.settings.tempUnit === 'fahrenheit' ? '°F' : '°C';
    const windSym = state.settings.windUnit === 'mph' ? 'mph' : 'km/h';

    setText('detSunrise', AtmosForecast.formatTime(d.sunrise?.[0], state.settings.timeFormat));
    setText('detSunset', AtmosForecast.formatTime(d.sunset?.[0], state.settings.timeFormat));

    const uv = Number(d.uv_index_max?.[0] ?? 0);
    setText('detUvIndex', uv.toFixed(1));
    setText('detUvSub', uv >= 8 ? 'Very High' : uv >= 6 ? 'High' : uv >= 3 ? 'Moderate' : 'Low');

    setText('detHumidity', `${c.relative_humidity_2m}%`);
    setText('detHumiditySub', c.relative_humidity_2m > 75 ? 'Humid air' : 'Comfortable');

    const visMeters = c.visibility;
    if (visMeters != null) {
      setText('detVisibility', `${(Number(visMeters) / 1000).toFixed(1)} km`);
      setText('detVisibilitySub', Number(visMeters) >= 10000 ? 'Clear horizon' : 'Moderate haze');
    } else {
      setText('detVisibility', 'N/A');
      setText('detVisibilitySub', 'Sensor unavailable');
    }

    setText('detWindSpeed', `${c.wind_speed_10m} ${windSym}`);
    setText('detWindSub', `Max today: ${d.wind_speed_10m_max?.[0] ?? '--'} ${windSym}`);

    const compass = AtmosForecast.windDegToCompass(c.wind_direction_10m);
    setText('detWindDir', `${compass} (${c.wind_direction_10m}°)`);

    setText('detPressure', c.surface_pressure != null ? `${Math.round(c.surface_pressure)} hPa` : 'N/A');
    setText('detPrecip', `${Number(c.precipitation ?? 0).toFixed(1)} mm`);
    setText('detPrecipSub', `Rain prob: ${d.precipitation_probability_max?.[0] ?? 0}%`);
    setText('detFeelsLike', `${Math.round(c.apparent_temperature)}${tempSym}`);
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function bindNavigationAndActions() {
    // Forecast tabs: Today | Tomorrow | Next 7 days
    document.querySelectorAll('[data-forecast-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.getAttribute('data-forecast-tab');
        state.selectedCardIndex = 0;
        document.querySelectorAll('[data-forecast-tab]').forEach((b) => {
          b.classList.toggle('active', b === btn);
        });
        renderForecastStrip();
      });
    });

    // Mode pill switch: Forecast | Air quality
    const modeForecastBtn = document.getElementById('modeForecastBtn');
    const modeAqiBtn = document.getElementById('modeAqiBtn');
    if (modeForecastBtn && modeAqiBtn) {
      modeForecastBtn.addEventListener('click', () => {
        modeForecastBtn.classList.add('active');
        modeAqiBtn.classList.remove('active');
        document.getElementById('forecastSectionAnchor')?.scrollIntoView({ behavior: 'smooth' });
      });
      modeAqiBtn.addEventListener('click', () => {
        modeAqiBtn.classList.add('active');
        modeForecastBtn.classList.remove('active');
        document.getElementById('airQualitySection')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // AQI US vs EU standard buttons inside Air Quality Dashboard
    const aqiUsBtn = document.getElementById('aqiSwitchUsBtn');
    const aqiEuBtn = document.getElementById('aqiSwitchEuBtn');
    if (aqiUsBtn && aqiEuBtn) {
      aqiUsBtn.addEventListener('click', () => {
        state.settings = AtmosStorage.saveSettings({ aqiStandard: 'us' });
        AtmosSettings.syncSettingsControls(state.settings);
        AtmosAirQuality.renderAirQuality(state.aqi, state.settings);
      });
      aqiEuBtn.addEventListener('click', () => {
        state.settings = AtmosStorage.saveSettings({ aqiStandard: 'eu' });
        AtmosSettings.syncSettingsControls(state.settings);
        AtmosAirQuality.renderAirQuality(state.aqi, state.settings);
      });
    }

    // Current Location GPS button
    const gpsBtn = document.getElementById('gpsLocationBtn');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', () => {
        showToast('Requesting browser GPS location...');
        AtmosLocation.requestCurrentLocation(
          (locCity) => loadCityWeather(locCity, true),
          (errMsg) => showToast(errMsg)
        );
      });
    }

    // Add Current City to Favourites ("+ Add Current")
    const addFavBtn = document.getElementById('addCurrentCityFavBtn');
    if (addFavBtn) {
      addFavBtn.addEventListener('click', () => {
        if (state.city) {
          AtmosFavorites.addCityToFavorites(
            state.city,
            state.settings,
            (c) => loadCityWeather(c, true),
            showToast
          );
        }
      });
    }

    // Header Notification Bell -> Scrolls to Weather Alerts or opens Alerts summary
    const notifBtn = document.getElementById('headerAlertsBtn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        document.getElementById('alertsSettingsSection')?.scrollIntoView({ behavior: 'smooth' });
        showToast(`Viewing weather alerts & telemetry status for ${state.city?.name || 'current city'}.`);
      });
    }

    // Header Settings / Profile button -> Scrolls to Settings panel
    const profileBtn = document.getElementById('headerProfileSettingsBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        document.getElementById('alertsSettingsSection')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Brand button -> Scroll to top
    const brandBtn = document.getElementById('atmosBrandBtn');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Smooth section navigation links (Footer Quick Links + Mobile Bottom Nav)
    document.querySelectorAll('[data-scroll-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-scroll-target');
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });

        if (btn.classList.contains('mobile-nav-item')) {
          document.querySelectorAll('.mobile-nav-item').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });

    // About Atmos modal button
    const aboutBtn = document.getElementById('footerAboutBtn');
    if (aboutBtn) {
      aboutBtn.addEventListener('click', () => {
        openModal(
          'About Atmos — Weather Dashboard & PWA',
          `
            <p style="font-size:0.88rem;color:var(--text-muted);margin-bottom:12px;">
              <strong>Atmos</strong> is a responsive, installable Progressive Web App built with HTML5, CSS3, and Vanilla JavaScript.
            </p>
            <ul style="font-size:0.84rem;color:var(--text-main);padding-left:18px;margin-bottom:14px;line-height:1.6;">
              <li><strong>Forecast & Telemetry:</strong> Open-Meteo Forecast API (Keyless)</li>
              <li><strong>Global City Search:</strong> Open-Meteo Geocoding API</li>
              <li><strong>Air Quality Monitoring:</strong> Open-Meteo Air Quality API (US &amp; European AQI)</li>
              <li><strong>Interactive Mapping:</strong> Leaflet.js + OpenStreetMap</li>
              <li><strong>Analytics Studio:</strong> Chart.js real-time 24-hour curves</li>
            </ul>
            <p style="font-size:0.8rem;color:var(--text-muted);">
              Designed &amp; Developed by <strong>Ajith Yash</strong>.
            </p>
          `
        );
      });
    }

    // Export CSV & Download ZIP buttons
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        AtmosExport.exportWeatherCsv(state.city, state.weather, state.aqi, state.settings, showToast);
      });
    }

    const downloadZipBtn = document.getElementById('downloadProjectZipBtn');
    if (downloadZipBtn) {
      downloadZipBtn.addEventListener('click', () => {
        AtmosExport.downloadProjectZip(showToast);
      });
    }

    // PWA Install Button
    const installBtn = document.getElementById('installPwaBtn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (state.deferredInstallPrompt) {
          state.deferredInstallPrompt.prompt();
          await state.deferredInstallPrompt.userChoice;
          state.deferredInstallPrompt = null;
        } else {
          openModal(
            'Install Atmos as a Progressive Web App',
            `
              <p style="font-size:0.88rem;color:var(--text-muted);margin-bottom:12px;">
                Atmos includes a valid <code>manifest.json</code> and offline <code>service-worker.js</code>.
              </p>
              <ol style="font-size:0.84rem;color:var(--text-main);padding-left:18px;line-height:1.65;">
                <li>In <strong>Chrome / Edge</strong>: Click the <strong>Install Atmos</strong> icon in the right side of the browser address bar.</li>
                <li>On <strong>iOS Safari</strong>: Tap <strong>Share</strong> &rarr; <strong>Add to Home Screen</strong>.</li>
                <li>On <strong>Android Chrome</strong>: Open the browser menu &rarr; <strong>Install App</strong>.</li>
              </ol>
            `
          );
        }
      });
    }

    // Modal close button
    const closeModalBtn = document.getElementById('atmosModalCloseBtn');
    const modalBackdrop = document.getElementById('atmosModalBackdrop');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
      });
    }

    // Online / Offline event listeners
    window.addEventListener('online', () => {
      showToast('Back online! Syncing live Open-Meteo weather...');
      if (state.city) loadCityWeather(state.city, false);
    });
    window.addEventListener('offline', () => {
      updateOfflineBanner(true, state.cachedTimestamp || new Date().toISOString());
      showToast('Network disconnected. Switched to offline mode.');
    });

    // Capture PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredInstallPrompt = e;
    });
  }

  async function init() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    state.settings = AtmosStorage.getSettings();
    state.city = AtmosStorage.getLastCity();

    AtmosSettings.syncSettingsControls(state.settings);
    AtmosSettings.bindSettingsEvents(
      async (newSettings, shouldRefetch) => {
        state.settings = newSettings;
        if (shouldRefetch) {
          await loadCityWeather(state.city, true);
          await AtmosFavorites.renderFavoritesList(state.settings, (c) => loadCityWeather(c, true), showToast);
        } else {
          renderAllSections();
        }
      },
      () => {
        AtmosStorage.clearAll();
        state.settings = AtmosStorage.getSettings();
        state.city = AtmosStorage.getLastCity();
        AtmosSettings.syncSettingsControls(state.settings);
        loadCityWeather(state.city, false);
        AtmosFavorites.renderFavoritesList(state.settings, (c) => loadCityWeather(c, true), showToast);
        showToast('Cleared locally stored preferences and restored defaults.');
      }
    );

    AtmosGeocoding.initSearch((selectedCity) => {
      loadCityWeather(selectedCity, true);
    });

    AtmosMap.initMap(state.city, (mapCity) => {
      loadCityWeather(mapCity, true);
    });

    bindNavigationAndActions();

    await Promise.all([
      loadCityWeather(state.city, false),
      AtmosFavorites.renderFavoritesList(state.settings, (c) => loadCityWeather(c, true), showToast)
    ]);

    // Register Service Worker when running over http/https (outside sandboxed srcdoc)
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  AtmosApp.init();
});
