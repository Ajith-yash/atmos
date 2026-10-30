/**
 * Atmos — Other Large Cities / Favourite Cities Manager (favorites.js)
 */
const AtmosFavorites = (() => {
  async function renderFavoritesList(settings, onSelectCity, onShowToast) {
    const listEl = document.getElementById('otherCitiesContainer');
    if (!listEl) return;

    const favs = AtmosStorage.getFavorites();
    if (!favs.length) {
      listEl.innerHTML = `<div style="padding:18px;text-align:center;color:var(--text-muted);font-size:0.86rem;background:var(--card-bg);border-radius:20px;">No saved cities yet. Click "+ Add Current" to pin cities here.</div>`;
      return;
    }

    const tempSym = settings.tempUnit === 'fahrenheit' ? '°' : '°';

    // Render skeleton cards immediately, then populate with live Open-Meteo data
    listEl.innerHTML = favs.map((c, idx) => `
      <div class="city-mini-card" data-fav-idx="${idx}">
        <button type="button" class="city-remove-btn" data-remove-idx="${idx}" title="Remove ${AtmosGeocoding.escapeHtml(c.name)}">&times;</button>
        <div>
          <div class="city-mini-country">${AtmosGeocoding.escapeHtml(c.country || 'Global')}</div>
          <div class="city-mini-name">${AtmosGeocoding.escapeHtml(c.name)}</div>
          <div class="city-mini-cond" id="favCond_${idx}">Syncing live...</div>
        </div>
        <div class="city-mini-right">
          <div id="favIcon_${idx}">${AtmosForecast.getWeatherSvg('cloud-wind', 40)}</div>
          <div class="city-mini-temp" id="favTemp_${idx}">--${tempSym}</div>
        </div>
      </div>
    `).join('');

    // Attach click listeners for selecting or removing a city
    listEl.querySelectorAll('.city-mini-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.city-remove-btn')) return;
        const idx = Number(card.getAttribute('data-fav-idx'));
        if (favs[idx] && onSelectCity) {
          onSelectCity(favs[idx]);
        }
      });
    });

    listEl.querySelectorAll('.city-remove-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.getAttribute('data-remove-idx'));
        const removed = favs[idx];
        const next = favs.filter((_, i) => i !== idx);
        AtmosStorage.saveFavorites(next);
        renderFavoritesList(settings, onSelectCity, onShowToast);
        if (onShowToast && removed) {
          onShowToast(`Removed ${removed.name} from Other Cities.`);
        }
      });
    });

    // Fetch live Open-Meteo data for each favorite card concurrently
    await Promise.all(favs.map(async (city, idx) => {
      try {
        const data = await AtmosAPI.fetchCompactCityWeather(city.latitude, city.longitude, settings);
        if (data && data.current) {
          const info = AtmosForecast.getWeatherInfo(data.current.weather_code, data.current.is_day);
          const condEl = document.getElementById(`favCond_${idx}`);
          const iconEl = document.getElementById(`favIcon_${idx}`);
          const tempEl = document.getElementById(`favTemp_${idx}`);
          if (condEl) condEl.textContent = info.label;
          if (iconEl) iconEl.innerHTML = AtmosForecast.getWeatherSvg(info.art, 42);
          if (tempEl) tempEl.textContent = `${Math.round(data.current.temperature_2m)}${tempSym}`;
        }
      } catch (err) {
        const condEl = document.getElementById(`favCond_${idx}`);
        if (condEl) condEl.textContent = 'Offline';
      }
    }));
  }

  function addCityToFavorites(city, settings, onSelectCity, onShowToast) {
    const favs = AtmosStorage.getFavorites();
    const exists = favs.some(
      (f) => f.name.toLowerCase() === city.name.toLowerCase() &&
             Math.abs(f.latitude - city.latitude) < 0.1
    );
    if (exists) {
      if (onShowToast) onShowToast(`${city.name} is already in your Other Cities list.`);
      return;
    }
    const updated = [city, ...favs].slice(0, 8);
    AtmosStorage.saveFavorites(updated);
    renderFavoritesList(settings, onSelectCity, onShowToast);
    if (onShowToast) onShowToast(`Added ${city.name} to Other Cities.`);
  }

  return { renderFavoritesList, addCityToFavorites };
})();
