/**
 * Atmos — Air Quality Index (AQI) Interpreter & Renderer (air-quality.js)
 * Supports both US AQI and European EAQI standards with clear category explanations.
 */
const AtmosAirQuality = (() => {
  function evaluateAqiCategory(score, standard = 'us') {
    const val = Number(score) || 0;
    if (standard === 'eu') {
      if (val <= 20) return { level: 'Good', color: '#34D399', bg: 'rgba(52,211,153,0.16)', desc: 'Air quality is clean and ideal for outdoor activities.' };
      if (val <= 40) return { level: 'Fair', color: '#A3E635', bg: 'rgba(163,230,53,0.16)', desc: 'Air quality is acceptable; unusually sensitive individuals should monitor prolonged exertion.' };
      if (val <= 60) return { level: 'Moderate', color: '#FACC15', bg: 'rgba(250,204,21,0.16)', desc: 'Sensitive groups may experience minor respiratory discomfort outdoors.' };
      if (val <= 80) return { level: 'Poor', color: '#FB923C', bg: 'rgba(251,146,60,0.16)', desc: 'Increased likelihood of respiratory symptoms; limit heavy outdoor exercise.' };
      return { level: 'Very Poor', color: '#F87171', bg: 'rgba(248,113,113,0.18)', desc: 'High pollution levels. Avoid strenuous outdoor activity.' };
    }
    // US AQI thresholds mapped to the 5 required categories: Good, Fair, Moderate, Poor, Very Poor
    if (val <= 50) return { level: 'Good', color: '#34D399', bg: 'rgba(52,211,153,0.16)', desc: 'Air quality is satisfactory, and air pollution poses little or no risk.' };
    if (val <= 100) return { level: 'Fair', color: '#A3E635', bg: 'rgba(163,230,53,0.16)', desc: 'Air quality is acceptable. Unusually sensitive individuals should consider limiting prolonged outdoor exertion.' };
    if (val <= 150) return { level: 'Moderate', color: '#FACC15', bg: 'rgba(250,204,21,0.16)', desc: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.' };
    if (val <= 200) return { level: 'Poor', color: '#FB923C', bg: 'rgba(251,146,60,0.16)', desc: 'Everyone may begin to experience health effects; sensitive groups should avoid prolonged outdoor exertion.' };
    return { level: 'Very Poor', color: '#F87171', bg: 'rgba(248,113,113,0.18)', desc: 'Health alert: air pollution levels are elevated for all populations. Limit outdoor exposure.' };
  }

  function renderAirQuality(aqiData, settings) {
    const standard = settings.aqiStandard === 'eu' ? 'eu' : 'us';
    const current = (aqiData && aqiData.current) ? aqiData.current : null;

    const stdBadge = document.getElementById('aqiStandardLabel');
    const scoreEl = document.getElementById('aqiPrimaryScore');
    const catPill = document.getElementById('aqiCategoryPill');
    const descEl = document.getElementById('aqiCategoryExplanation');

    const usBtn = document.getElementById('aqiSwitchUsBtn');
    const euBtn = document.getElementById('aqiSwitchEuBtn');
    if (usBtn && euBtn) {
      usBtn.classList.toggle('active', standard === 'us');
      euBtn.classList.toggle('active', standard === 'eu');
    }

    if (!current) {
      if (scoreEl) scoreEl.textContent = '--';
      if (catPill) catPill.textContent = 'Unavailable';
      if (descEl) descEl.textContent = 'Air quality telemetry is temporarily unavailable for this coordinate.';
      return;
    }

    const activeScore = standard === 'eu' ? current.european_aqi : current.us_aqi;
    const altScore = standard === 'eu' ? current.us_aqi : current.european_aqi;
    const altName = standard === 'eu' ? 'US AQI' : 'European AQI';
    const info = evaluateAqiCategory(activeScore, standard);

    if (stdBadge) {
      stdBadge.textContent = standard === 'eu'
        ? `European AQI Standard (US AQI: ${altScore ?? '--'})`
        : `US EPA AQI Standard (European AQI: ${altScore ?? '--'})`;
    }
    if (scoreEl) {
      scoreEl.textContent = activeScore != null ? Math.round(activeScore) : '--';
      scoreEl.style.color = info.color;
    }
    if (catPill) {
      catPill.textContent = info.level;
      catPill.style.background = info.bg;
      catPill.style.color = info.color;
    }
    if (descEl) {
      descEl.textContent = `${info.desc} (${altName}: ${altScore ?? '--'}).`;
    }

    // Update individual pollutants
    setPollutant('pm25Val', current.pm2_5);
    setPollutant('pm10Val', current.pm10);
    setPollutant('coVal', current.carbon_monoxide);
    setPollutant('no2Val', current.nitrogen_dioxide);
    setPollutant('o3Val', current.ozone);
  }

  function setPollutant(id, val) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = val != null ? Number(val).toFixed(1) : '--';
    }
  }

  return { renderAirQuality, evaluateAqiCategory };
})();
