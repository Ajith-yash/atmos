/**
 * Atmos — Real-Time Weather Analytics with Chart.js (charts.js)
 * Builds and updates 4 Chart.js graphs + the header Chance of Rain vertical bar widget.
 */
const AtmosCharts = (() => {
  const instances = {
    temp: null,
    rain: null,
    humidity: null,
    wind: null
  };

  function renderChanceOfRainBars(hourly) {
    const container = document.getElementById('chanceOfRainBars');
    if (!container || !hourly || !Array.isArray(hourly.time)) return;

    const now = new Date();
    let startIdx = hourly.time.findIndex((t) => new Date(t) >= now);
    if (startIdx < 0) startIdx = 0;

    const slice = [];
    for (let i = 0; i < 6; i++) {
      const idx = Math.min(startIdx + i * 2, hourly.time.length - 1);
      const dt = new Date(hourly.time[idx]);
      const hr = dt.toLocaleTimeString([], { hour: '2-digit', hour12: true }).replace(/\s+/g, '');
      const prob = Number(hourly.precipitation_probability?.[idx] ?? 0);
      slice.push({ hr, prob });
    }

    container.innerHTML = slice.map((item) => {
      const heightPct = Math.max(12, Math.min(100, item.prob));
      return `
        <div class="rain-col-item" title="Rain probability: ${item.prob}% at ${item.hr}">
          <div class="rain-track">
            <div class="rain-fill" style="height:${heightPct}%;"></div>
          </div>
          <span class="rain-time-lbl">${item.hr}</span>
        </div>
      `;
    }).join('');
  }

  function updateAllCharts(weatherData, settings) {
    if (!weatherData || !weatherData.hourly || typeof Chart === 'undefined') return;
    const h = weatherData.hourly;
    renderChanceOfRainBars(h);

    const now = new Date();
    let startIdx = h.time.findIndex((t) => new Date(t) >= now);
    if (startIdx < 0) startIdx = 0;

    const count = 12; // Next 24 hours in 2-hour intervals for crisp legibility
    const labels = [];
    const temps = [];
    const feels = [];
    const rainProbs = [];
    const humidities = [];
    const winds = [];

    for (let i = 0; i < count; i++) {
      const idx = Math.min(startIdx + i * 2, h.time.length - 1);
      const d = new Date(h.time[idx]);
      labels.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: settings.timeFormat !== '24h' }));
      temps.push(Number(h.temperature_2m?.[idx] ?? 0));
      feels.push(Number(h.apparent_temperature?.[idx] ?? 0));
      rainProbs.push(Number(h.precipitation_probability?.[idx] ?? 0));
      humidities.push(Number(h.relative_humidity_2m?.[idx] ?? 0));
      winds.push(Number(h.wind_speed_10m?.[idx] ?? 0));
    }

    const isLight = settings.theme === 'light';
    const textColor = isLight ? '#525B6C' : '#A1A1AA';
    const gridColor = isLight ? 'rgba(15,23,42,0.07)' : 'rgba(255,255,255,0.06)';
    const tempSym = settings.tempUnit === 'fahrenheit' ? '°F' : '°C';
    const windSym = settings.windUnit === 'mph' ? 'mph' : 'km/h';

    const baseOptions = (unitSuffix) => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { color: textColor, boxWidth: 12, font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: '#1C1C20',
          titleColor: '#FFFFFF',
          bodyColor: '#B9DDF2',
          borderColor: 'rgba(185,221,242,0.25)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { size: 10 }, maxRotation: 0 },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: textColor,
            font: { size: 10 },
            callback: (v) => `${v}${unitSuffix}`
          },
          grid: { color: gridColor }
        }
      }
    });

    // 1. Temperature Chart
    const tempCtx = document.getElementById('tempAnalyticsChart');
    if (tempCtx) {
      if (instances.temp) instances.temp.destroy();
      instances.temp = new Chart(tempCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: `Temperature (${tempSym})`,
              data: temps,
              borderColor: '#B9DDF2',
              backgroundColor: 'rgba(185, 221, 242, 0.16)',
              borderWidth: 2.5,
              tension: 0.4,
              fill: true,
              pointRadius: 3
            },
            {
              label: `Feels Like (${tempSym})`,
              data: feels,
              borderColor: '#8CC8EC',
              borderDash: [5, 5],
              borderWidth: 2,
              tension: 0.4,
              fill: false,
              pointRadius: 2
            }
          ]
        },
        options: baseOptions(tempSym)
      });
    }

    // 2. Rain Probability Chart
    const rainCtx = document.getElementById('rainAnalyticsChart');
    if (rainCtx) {
      if (instances.rain) instances.rain.destroy();
      instances.rain = new Chart(rainCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Rain Probability (%)',
              data: rainProbs,
              backgroundColor: '#8CC8EC',
              borderRadius: 8,
              maxBarThickness: 22
            }
          ]
        },
        options: baseOptions('%')
      });
    }

    // 3. Humidity Chart
    const humCtx = document.getElementById('humidityAnalyticsChart');
    if (humCtx) {
      if (instances.humidity) instances.humidity.destroy();
      instances.humidity = new Chart(humCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Relative Humidity (%)',
              data: humidities,
              borderColor: '#38BDF8',
              backgroundColor: 'rgba(56, 189, 248, 0.14)',
              borderWidth: 2.5,
              tension: 0.35,
              fill: true,
              pointRadius: 3
            }
          ]
        },
        options: baseOptions('%')
      });
    }

    // 4. Wind Speed Chart
    const windCtx = document.getElementById('windAnalyticsChart');
    if (windCtx) {
      if (instances.wind) instances.wind.destroy();
      instances.wind = new Chart(windCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: `Wind Speed (${windSym})`,
              data: winds,
              borderColor: '#A78BFA',
              backgroundColor: 'rgba(167, 139, 250, 0.14)',
              borderWidth: 2.5,
              tension: 0.35,
              fill: true,
              pointRadius: 3
            }
          ]
        },
        options: baseOptions(` ${windSym}`)
      });
    }
  }

  return { updateAllCharts, renderChanceOfRainBars };
})();
