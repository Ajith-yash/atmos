/**
 * Atmos — CSV Weather Report Exporter & Modular Project ZIP Generator (export.js)
 */
const AtmosExport = (() => {
  function exportWeatherCsv(city, weatherData, aqiData, settings, onShowToast) {
    if (!weatherData || !weatherData.current || !weatherData.daily) {
      if (onShowToast) onShowToast('Wait for live weather data to finish loading before exporting.');
      return;
    }

    const tempUnit = settings.tempUnit === 'fahrenheit' ? 'F' : 'C';
    const windUnit = settings.windUnit === 'mph' ? 'mph' : 'km/h';
    const c = weatherData.current;
    const d = weatherData.daily;
    const aqi = aqiData?.current || {};

    const rows = [
      ['Atmos Weather & Air Quality Report'],
      ['Generated At', new Date().toISOString()],
      ['Location', `${city.name}, ${city.country || ''}`.trim()],
      ['Coordinates', `${city.latitude}, ${city.longitude}`],
      [],
      ['CURRENT CONDITIONS'],
      ['Metric', 'Value', 'Unit'],
      ['Temperature', c.temperature_2m, tempUnit],
      ['Feels Like', c.apparent_temperature, tempUnit],
      ['Relative Humidity', c.relative_humidity_2m, '%'],
      ['Wind Speed', c.wind_speed_10m, windUnit],
      ['Wind Direction', c.wind_direction_10m, 'deg'],
      ['Surface Pressure', c.surface_pressure, 'hPa'],
      ['Precipitation', c.precipitation, 'mm'],
      ['US AQI', aqi.us_aqi ?? 'N/A', 'Index'],
      ['European AQI', aqi.european_aqi ?? 'N/A', 'Index'],
      ['PM2.5', aqi.pm2_5 ?? 'N/A', 'ug/m3'],
      ['PM10', aqi.pm10 ?? 'N/A', 'ug/m3'],
      [],
      ['7-DAY DAILY FORECAST'],
      ['Date', `Max Temp (${tempUnit})`, `Min Temp (${tempUnit})`, 'Rain Prob (%)', 'UV Index Max', 'Sunrise', 'Sunset']
    ];

    if (Array.isArray(d.time)) {
      d.time.forEach((dateStr, i) => {
        rows.push([
          dateStr,
          d.temperature_2m_max?.[i] ?? '',
          d.temperature_2m_min?.[i] ?? '',
          d.precipitation_probability_max?.[i] ?? '',
          d.uv_index_max?.[i] ?? '',
          d.sunrise?.[i] ?? '',
          d.sunset?.[i] ?? ''
        ]);
      });
    }

    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeCity = String(city.name || 'location').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `atmos-weather-report-${safeCity}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onShowToast) {
      onShowToast(`Exported CSV weather report for ${city.name}.`);
    }
  }

  async function downloadProjectZip(onShowToast) {
    if (typeof JSZip === 'undefined') {
      if (onShowToast) onShowToast('Preparing Atmos project bundle...');
      return;
    }
    try {
      const zip = new JSZip();
      const root = zip.folder('Atmos');
      root.file('README.md', '# Atmos — Advanced Weather Dashboard & PWA\n\nOpen index.html with VS Code Live Server to run the modular project.');
      root.file('manifest.json', JSON.stringify({
        name: 'Atmos — Advanced Weather Dashboard & PWA',
        short_name: 'Atmos',
        start_url: './index.html',
        display: 'standalone',
        background_color: '#101014',
        theme_color: '#101014'
      }, null, 2));
      root.file('index.html', document.documentElement.outerHTML);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Atmos-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (onShowToast) onShowToast('Downloaded Atmos-Project.zip!');
    } catch (err) {
      if (onShowToast) onShowToast('Unable to generate ZIP archive in this browser.');
    }
  }

  return { exportWeatherCsv, downloadProjectZip };
})();
