# Atmos — Open-Meteo API Integration Guide

Atmos uses three official **Open-Meteo** endpoints. **No API key, account registration, or paid subscription is required** for non-commercial use under [Open-Meteo's Terms of Use](https://open-meteo.com/en/terms) (CC BY 4.0 attribution).

---

## 1. Open-Meteo Forecast API

- **Base Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Purpose**: Fetches real-time current conditions, 24-hour hourly forecasts, and 7-day daily forecasts.

### Query Parameters Used

| Parameter | Value / Description |
| :--- | :--- |
| `latitude`, `longitude` | Decimal geographic coordinates (e.g., `13.0827`, `80.2707`) |
| `current` | `temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility` |
| `hourly` | `temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,visibility,uv_index` |
| `daily` | `weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max` |
| `temperature_unit` | `celsius` (default) or `fahrenheit` |
| `wind_speed_unit` | `kmh` (default) or `mph` |
| `timezone` | `auto` (resolves local timezone automatically) |

### Example Request

```http
GET https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto
```

---

## 2. Open-Meteo Geocoding API

- **Base Endpoint**: `https://geocoding-api.open-meteo.com/v1/search`
- **Purpose**: Searches global cities, regions, and countries by name and returns coordinates.

### Query Parameters Used

| Parameter | Value / Description |
| :--- | :--- |
| `name` | Search query string (e.g., `Chennai`, `London`, `Tokyo`) |
| `count` | Number of matching locations to return (`6`) |
| `language` | `en` |
| `format` | `json` |

### Example Request

```http
GET https://geocoding-api.open-meteo.com/v1/search?name=Chennai&count=5&language=en&format=json
```

---

## 3. Open-Meteo Air Quality API

- **Base Endpoint**: `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Purpose**: Retrieves real-time US AQI, European AQI, and atmospheric pollutant concentrations.

### Query Parameters Used

| Parameter | Value / Description |
| :--- | :--- |
| `latitude`, `longitude` | Decimal geographic coordinates |
| `current` | `us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone` |
| `timezone` | `auto` |

### Example Request

```http
GET https://air-quality-api.open-meteo.com/v1/air-quality?latitude=13.0827&longitude=80.2707&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone&timezone=auto
```
