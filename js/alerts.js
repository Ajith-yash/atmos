/**
 * Atmos — Transparent Weather Alerts & Meteorological Advisories (alerts.js)
 * Honours Section 12: Never fabricates official emergency alerts; clearly explains
 * Open-Meteo alert availability while showing transparent threshold observations.
 */
const AtmosAlerts = (() => {
  function renderAlerts(city, weatherData, settings) {
    const container = document.getElementById('weatherAlertsContent');
    if (!container) return;

    const current = weatherData?.current;
    const daily = weatherData?.daily;
    const windSym = settings.windUnit === 'mph' ? 'mph' : 'km/h';

    const advisories = [];
    if (current) {
      const uvMax = daily?.uv_index_max?.[0] ?? 0;
      const rainProbMax = daily?.precipitation_probability_max?.[0] ?? 0;
      const windSpeed = current.wind_speed_10m ?? 0;

      if (uvMax >= 7) {
        advisories.push({
          title: `Elevated UV Index Observation (UV ${uvMax.toFixed(1)})`,
          detail: 'Open-Meteo daily telemetry indicates a high solar UV index today. Sun protection is advised during midday hours.'
        });
      }
      if (rainProbMax >= 65) {
        advisories.push({
          title: `High Precipitation Probability (${rainProbMax}%)`,
          detail: 'Forecast data indicates a high likelihood of rain showers today.'
        });
      }
      if ((settings.windUnit === 'mph' && windSpeed >= 25) || (settings.windUnit !== 'mph' && windSpeed >= 40)) {
        advisories.push({
          title: `Breezy / Gusty Surface Winds (${windSpeed} ${windSym})`,
          detail: 'Elevated 10-meter surface wind speeds observed at this coordinate.'
        });
      }
    }

    container.innerHTML = `
      <div style="background:var(--card-secondary);border-left:4px solid var(--accent-blue);padding:14px 16px;border-radius:14px;margin-bottom:14px;">
        <div style="font-weight:700;font-size:0.88rem;margin-bottom:4px;color:var(--text-main);">
          Official Government Severe-Weather Warnings Unavailable
        </div>
        <p style="font-size:0.8rem;color:var(--text-muted);line-height:1.45;">
          Open-Meteo's free keyless APIs provide numerical weather prediction and air quality telemetry for <strong>${AtmosGeocoding.escapeHtml(city.name)}</strong>, but do not distribute official government CAP emergency warnings. Always consult your national meteorological agency for severe weather alerts.
        </p>
      </div>
      ${advisories.length ? advisories.map((a) => `
        <div style="background:var(--card-secondary);padding:12px 16px;border-radius:14px;margin-bottom:10px;border:1px solid var(--border-subtle);">
          <div style="font-weight:600;font-size:0.84rem;color:var(--accent-blue);margin-bottom:3px;">${AtmosGeocoding.escapeHtml(a.title)}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">${AtmosGeocoding.escapeHtml(a.detail)}</div>
        </div>
      `).join('') : `
        <div style="background:var(--card-secondary);padding:12px 16px;border-radius:14px;font-size:0.82rem;color:var(--text-muted);">
          No extreme telemetry thresholds (UV, heavy rain probability, or high surface wind) detected in current Open-Meteo readings for ${AtmosGeocoding.escapeHtml(city.name)}.
        </div>
      `}
    `;
  }

  return { renderAlerts };
})();
