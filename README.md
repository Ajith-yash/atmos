# Atmos — Advanced Weather Dashboard & Progressive Web App

**Atmos** is a modern, responsive, dark-themed weather dashboard and installable Progressive Web App (PWA) built with **HTML5**, **CSS3**, and **Vanilla JavaScript**. It connects directly to **Open-Meteo's free, keyless weather, geocoding, and air quality APIs**—requiring zero API keys, zero paid subscriptions, and zero account registration.

---

## Key Features

1. **Real-Time Weather Overview**: Current temperature, feels-like temperature, high/low, humidity, wind speed and direction, atmospheric pressure, visibility, UV index, rainfall, and local sunrise/sunset times.
2. **Global City Search (Geocoding API)**: Instant city autocomplete across the globe displaying city name, region/state, country, and exact coordinates.
3. **3-Tab Forecast Engine**:
   - **Today**: 24-hour horizontal hourly forecast cards with temperature, custom weather icons, and rain probability.
   - **Tomorrow**: Full 24-hour hourly breakdown for the next day.
   - **Next 7 Days**: 7-day daily forecast cards with high/low temperatures, weather conditions, and interactive pale-blue (`#B9DDF2`) active card selection.
4. **Weather Analytics Studio (Chart.js)**:
   - 24-Hour Temperature & Feels-Like Curve
   - Rain Probability Bar Chart
   - Relative Humidity Area Chart
   - Wind Speed Trend Chart
5. **Interactive Global Weather Map (Leaflet.js + OpenStreetMap)**:
   - Dark-themed interactive map container with custom zoom, GPS recenter, live weather markers, coordinate display, and click-anywhere weather inspection.
6. **Air Quality Dashboard**:
   - Real-time **US AQI** and **European AQI** with category badges (*Good, Fair, Moderate, Poor, Very Poor*), health guidance, and pollutant breakdowns (**PM2.5, PM10, CO, NO₂, O₃**).
7. **Other Cities / Favourite Cities Sidebar**:
   - Add, remove, and switch between saved global cities persisted in `localStorage`.
8. **Transparent Weather Alerts & Advisories**:
   - Clearly explains official alert availability and surfaces live meteorological threshold notifications without fabricating emergency alerts.
9. **Customisable Settings & CSV Export**:
   - Toggle `°C / °F`, `km/h / mph`, Dark / Light theme, default startup city, and export a full weather report as a `.csv` file.
10. **Mobile-First Bottom Navigation & Installable PWA**:
    - Offline shell caching via `service-worker.js`, `manifest.json`, and explicit labeling of cached offline weather snapshots.

---

## Technologies Used

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, dark theme (`#292929` / `#101014` / `#1C1C20` / `#25252A` / `#B9DDF2`), grid/flexbox layouts, smooth transitions
- **Vanilla JavaScript (ES6+)** — Modular application architecture using `async/await` and `fetch()`
- **Open-Meteo APIs** — Forecast API, Geocoding API, and Air Quality API (keyless)
- **Leaflet.js & OpenStreetMap** — Interactive global map and tile rendering
- **Chart.js** — Live weather analytics charts
- **Lucide Icons & Custom Weather SVGs** — Clean UI iconography
- **Browser Geolocation API & LocalStorage** — One-tap GPS weather and persistent preferences
- **Service Worker & Web App Manifest** — Offline support and PWA installation

---

## Project Structure

```text
Atmos/
├── index.html
├── manifest.json
├── service-worker.js
├── README.md
├── css/
│   ├── style.css
│   ├── dashboard.css
│   ├── components.css
│   ├── responsive.css
│   └── animations.css
├── js/
│   ├── app.js
│   ├── api.js
│   ├── geocoding.js
│   ├── location.js
│   ├── forecast.js
│   ├── weather-map.js
│   ├── air-quality.js
│   ├── charts.js
│   ├── favorites.js
│   ├── settings.js
│   ├── storage.js
│   ├── alerts.js
│   └── export.js
├── assets/
│   ├── icons/
│   ├── images/
│   └── screenshots/
└── docs/
    └── API-GUIDE.md
```

---

## How to Run the Project

1. Extract the `Atmos` project folder.
2. Open the folder in **VS Code**.
3. Install the **Live Server** extension (if not already installed).
4. Right-click `index.html` and select **"Open with Live Server"** (or run `python3 -m http.server 8080`).
5. Open `http://localhost:5500` (or `http://localhost:8080`) in your browser.

---

## Browser Permissions & PWA Installation

- **Geolocation**: Click the GPS pin button in the header to grant location permission and load weather for your exact coordinates.
- **PWA Installation**: Click **"Install Atmos"** in the header or footer (or use the browser address bar install icon) to install Atmos as a standalone desktop or mobile app.

---

## Credits & Attribution

- **Designed & Developed by**: Ajith Yash (`ajityashofficial@gmail.com`)
- **Weather & Air Quality Data**: [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0)
- **Map Tiles**: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
