/**
 * Atmos — 100% Keyless, Self-Contained Interactive Leaflet Global Weather Map (weather-map.js)
 * Renders world continents, islands, graticule grid lines, wind/climate streamlines,
 * and live Open-Meteo weather markers directly on Leaflet's vector layers.
 * Makes ZERO requests to external tile servers that require API keys or block iframe Referers.
 */
const AtmosMap = (() => {
  let mapInstance = null;
  let activeMarker = null;
  let globalMarkersLayer = null;
  let vectorBaseLayer = null;
  let currentModeIndex = 0;

  // Detailed World Continents & Major Islands GeoJSON for Leaflet Vector rendering
  const WORLD_GEOJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'North America', zone: 'Temperate / Continental' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-168,66],[-162,58],[-152,60],[-140,60],[-130,54],[-124,48],[-124,40],[-120,34],[-117,32],[-110,23],[-105,20],[-97,16],[-87,13],[-83,9],[-77,8],[-79,9],[-83,15],[-88,18],[-87,21],[-90,21],[-97,22],[-97,28],[-90,29],[-82,25],[-80,25],[-81,31],[-75,35],[-76,39],[-70,42],[-67,45],[-64,44],[-60,47],[-65,48],[-68,49],[-56,52],[-60,56],[-64,60],[-78,62],[-82,55],[-89,57],[-95,61],[-90,66],[-82,69],[-96,71],[-115,70],[-128,70],[-141,70],[-156,71],[-166,68],[-168,66]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'South America', zone: 'Tropical / Equatorial' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-77,8],[-75,11],[-71,12],[-62,11],[-60,8],[-52,4],[-50,0],[-44,-2],[-35,-6],[-35,-10],[-39,-15],[-40,-20],[-43,-23],[-48,-26],[-50,-30],[-53,-34],[-58,-38],[-62,-41],[-65,-45],[-67,-50],[-68,-55],[-72,-53],[-75,-47],[-73,-40],[-72,-33],[-70,-24],[-71,-18],[-76,-14],[-79,-8],[-81,-5],[-80,0],[-78,4],[-77,8]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Europe', zone: 'Maritime / Continental' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-9,36],[-5,36],[0,38],[3,42],[8,44],[12,42],[15,38],[18,40],[14,45],[19,42],[23,37],[26,40],[29,41],[30,46],[38,45],[42,42],[49,40],[50,45],[55,50],[60,55],[60,65],[68,70],[50,69],[42,67],[34,69],[28,71],[20,70],[14,67],[8,62],[5,59],[8,58],[11,59],[12,56],[9,55],[5,52],[1,51],[-5,48],[-2,43],[-9,43],[-9,36]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Africa', zone: 'Arid / Tropical Savanna' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-17,15],[-17,21],[-13,28],[-9,32],[-6,36],[0,36],[10,37],[11,33],[20,32],[25,32],[32,31],[34,28],[38,22],[41,15],[43,12],[51,12],[49,8],[45,2],[41,-2],[40,-10],[40,-16],[35,-20],[35,-25],[33,-27],[28,-33],[20,-35],[18,-32],[15,-23],[12,-17],[13,-9],[9,-2],[9,4],[5,6],[0,5],[-8,5],[-13,9],[-16,12],[-17,15]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Asia & Indian Subcontinent', zone: 'Monsoon / Continental' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[26,40],[27,37],[35,36],[35,31],[33,29],[38,22],[43,13],[48,14],[55,17],[60,22],[62,25],[67,25],[70,21],[73,19],[75,13],[77,8],[80,10],[80,13],[82,16],[87,21],[90,22],[92,20],[94,16],[97,16],[98,10],[100,6],[103,1],[104,4],[102,12],[105,10],[109,12],[108,17],[106,20],[110,20],[114,22],[118,24],[121,28],[122,32],[120,35],[122,37],[119,40],[124,40],[126,35],[129,35],[129,40],[135,43],[140,48],[141,53],[137,55],[142,59],[150,60],[160,62],[163,60],[170,60],[180,65],[180,70],[160,70],[140,73],[120,73],[105,77],[90,75],[75,72],[68,70],[60,65],[60,55],[55,50],[50,45],[49,40],[42,42],[38,45],[30,46],[29,41],[26,40]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Australia', zone: 'Subtropical / Arid' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[114,-22],[118,-20],[122,-17],[126,-14],[130,-12],[136,-12],[136,-15],[140,-17],[142,-11],[145,-15],[149,-20],[153,-25],[153,-28],[151,-34],[148,-38],[144,-38],[139,-36],[135,-34],[131,-32],[124,-33],[118,-35],[115,-34],[114,-28],[114,-22]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'United Kingdom & Ireland', zone: 'Oceanic' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-6,50],[1,51],[2,53],[-1,55],[-2,58],[-5,58],[-6,55],[-5,52],[-6,50]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Japan', zone: 'Humid Subtropical' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[130,31],[133,33],[136,34],[140,35],[141,39],[141,43],[145,44],[140,41],[138,37],[134,35],[130,33],[130,31]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Indonesia & Borneo', zone: 'Equatorial Maritime' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[95,5],[105,-6],[114,-8],[120,-8],[118,-3],[118,4],[112,3],[104,0],[98,3],[95,5]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Madagascar', zone: 'Tropical' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[44,-16],[49,-12],[50,-16],[47,-25],[44,-25],[44,-16]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'New Zealand', zone: 'Oceanic' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[166,-46],[172,-41],[178,-37],[176,-41],[170,-46],[166,-46]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Greenland', zone: 'Polar / Arctic' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-44,60],[-22,70],[-18,77],[-28,82],[-52,82],[-68,76],[-55,68],[-48,61],[-44,60]]]
        }
      },
      {
        type: 'Feature',
        properties: { name: 'Sri Lanka', zone: 'Tropical Monsoon' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[79.6,9.8],[81.8,8.5],[81.2,6.0],[79.8,6.8],[79.6,9.8]]]
        }
      }
    ]
  };

  const MAP_MODES = [
    { name: 'Dark Atmospheric Globe', fill: '#2B2B33', stroke: '#42424E', showStreams: true },
    { name: 'Climate & Wind Streamlines', fill: '#222834', stroke: '#38BDF8', showStreams: true },
    { name: 'Minimalist Slate Continents', fill: '#32323A', stroke: '#52525E', showStreams: false }
  ];

  function buildVectorGlobe(modeIdx, isLight = false) {
    const group = L.layerGroup();
    const mode = MAP_MODES[modeIdx % MAP_MODES.length];

    // 1. Latitude & Longitude Coordinate Grid
    for (let lat = -60; lat <= 60; lat += 30) {
      L.polyline([[lat, -180], [lat, 180]], {
        color: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.05)',
        weight: lat === 0 ? 1.5 : 1,
        dashArray: lat === 0 ? null : '4,6',
        interactive: false
      }).addTo(group);
    }
    for (let lon = -150; lon <= 150; lon += 30) {
      L.polyline([[-80, lon], [80, lon]], {
        color: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.05)',
        weight: 1,
        dashArray: '4,6',
        interactive: false
      }).addTo(group);
    }

    // 2. Continents & Major Islands GeoJSON Layer
    L.geoJSON(WORLD_GEOJSON, {
      style: () => ({
        fillColor: isLight ? '#CBD5E1' : mode.fill,
        fillOpacity: 0.92,
        color: isLight ? '#64748B' : mode.stroke,
        weight: 1.3
      }),
      onEachFeature: (feature, layer) => {
        if (feature.properties && feature.properties.name) {
          layer.bindTooltip(
            `${feature.properties.name} (${feature.properties.zone})`,
            { sticky: true, direction: 'top' }
          );
        }
      }
    }).addTo(group);

    // 3. Subtle Trade Wind & Ocean Current Streamlines
    if (mode.showStreams) {
      const streams = [
        [[10, 50], [12, 65], [13, 80], [11, 95]],
        [[30, -75], [36, -50], [44, -25], [50, -5]],
        [[-20, 110], [-18, 90], [-15, 70], [-16, 55]],
        [[35, 140], [38, 165], [40, -160], [36, -130]],
        [[-30, -45], [-34, -20], [-35, 10]]
      ];
      streams.forEach((pts) => {
        L.polyline(pts, {
          color: isLight ? 'rgba(56,189,248,0.35)' : 'rgba(185,221,242,0.18)',
          weight: 1.6,
          dashArray: '6,8',
          interactive: false
        }).addTo(group);
      });
    }

    return group;
  }

  function applyMapMode(index, isLight = false) {
    if (!mapInstance || typeof L === 'undefined') return;
    currentModeIndex = index % MAP_MODES.length;
    if (vectorBaseLayer) {
      mapInstance.removeLayer(vectorBaseLayer);
    }
    vectorBaseLayer = buildVectorGlobe(currentModeIndex, isLight).addTo(mapInstance);
  }

  function initMap(initialCity, onMapLocationSelect) {
    const container = document.getElementById('weatherLeafletMap');
    if (!container || typeof L === 'undefined') return;

    if (mapInstance) {
      mapInstance.remove();
    }

    mapInstance = L.map('weatherLeafletMap', {
      center: [initialCity.latitude, initialCity.longitude],
      zoom: 3,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: true
    });

    const isLight = document.body.classList.contains('theme-light');
    applyMapMode(0, isLight);

    globalMarkersLayer = L.layerGroup().addTo(mapInstance);
    populateGlobalWeatherNodes(onMapLocationSelect);

    // Click anywhere on the map to fetch live Open-Meteo weather at those coordinates
    mapInstance.on('click', (e) => {
      const lat = Number(e.latlng.lat.toFixed(4));
      const lon = Number(e.latlng.lng.toFixed(4));
      const resolvedCity = AtmosAPI.resolveCoordinatesLabel(lat, lon);
      updateCoordsBadge(lat, lon, resolvedCity.name);
      if (onMapLocationSelect) {
        onMapLocationSelect(resolvedCity);
      }
    });

    // Bind custom map buttons
    const zoomInBtn = document.getElementById('mapZoomInBtn');
    const zoomOutBtn = document.getElementById('mapZoomOutBtn');
    const recenterBtn = document.getElementById('mapRecenterBtn');
    const resetWorldBtn = document.getElementById('mapResetWorldBtn');
    const promoBtn = document.getElementById('mapPromoStartBtn');
    const viewWideBtn = document.getElementById('viewWideMapBtn');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => mapInstance.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => mapInstance.zoomOut());
    if (recenterBtn) {
      recenterBtn.addEventListener('click', () => {
        const nextMode = (currentModeIndex + 1) % MAP_MODES.length;
        const light = document.body.classList.contains('theme-light');
        applyMapMode(nextMode, light);
        const badge = document.getElementById('mapCoordsDisplay');
        if (badge) {
          badge.textContent = `Style: ${MAP_MODES[nextMode].name}`;
        }
      });
    }
    if (resetWorldBtn) {
      resetWorldBtn.addEventListener('click', () => {
        const current = AtmosStorage.getLastCity();
        mapInstance.flyTo([current.latitude, current.longitude], 4, { duration: 1.0 });
      });
    }
    if (promoBtn) {
      promoBtn.addEventListener('click', () => {
        const promoCard = document.getElementById('mapPromoCard');
        if (promoCard) promoCard.classList.add('hidden');
        mapInstance.flyTo([20, 25], 2, { duration: 1.0 });
      });
    }
    if (viewWideBtn) {
      viewWideBtn.addEventListener('click', () => {
        const grid = document.getElementById('bottomWorkspaceGrid');
        if (!grid) return;
        const expanded = grid.classList.toggle('map-expanded');
        viewWideBtn.textContent = expanded ? 'Compact view' : 'View wide';
        setTimeout(() => {
          if (mapInstance) mapInstance.invalidateSize();
        }, 320);
      });
    }
  }

  function populateGlobalWeatherNodes(onMapLocationSelect) {
    if (!globalMarkersLayer || typeof L === 'undefined') return;
    globalMarkersLayer.clearLayers();

    const hubs = AtmosAPI.getGlobalHubs();
    hubs.forEach((hub) => {
      const dot = L.circleMarker([hub.latitude, hub.longitude], {
        radius: 5,
        fillColor: '#8CC8EC',
        color: '#101014',
        weight: 1.5,
        fillOpacity: 0.9
      }).addTo(globalMarkersLayer);

      dot.bindTooltip(`${hub.name}, ${hub.country}`, { direction: 'top', offset: [0, -4] });
      dot.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (onMapLocationSelect) onMapLocationSelect(hub);
      });
    });
  }

  function updatePrimaryMarker(city, weatherData, settings) {
    if (!mapInstance || typeof L === 'undefined') return;
    const lat = Number(city.latitude);
    const lon = Number(city.longitude);
    updateCoordsBadge(lat, lon, city.name);

    const tempSym = settings.tempUnit === 'fahrenheit' ? '°F' : '°C';
    const tempVal = weatherData && weatherData.current
      ? `${Math.round(weatherData.current.temperature_2m)}${tempSym}`
      : '--';
    const condInfo = weatherData && weatherData.current
      ? AtmosForecast.getWeatherInfo(weatherData.current.weather_code, weatherData.current.is_day)
      : { label: 'Loading' };

    if (activeMarker) {
      mapInstance.removeLayer(activeMarker);
    }

    const customIcon = L.divIcon({
      className: 'atmos-map-pin',
      html: `
        <div style="background:#B9DDF2;color:#101014;padding:6px 12px;border-radius:999px;font-weight:700;font-size:12px;box-shadow:0 6px 18px rgba(0,0,0,0.6);white-space:nowrap;border:2px solid #101014;display:inline-flex;align-items:center;gap:6px;">
          <span>${AtmosGeocoding.escapeHtml(city.name)}</span>
          <span style="background:#101014;color:#B9DDF2;padding:2px 7px;border-radius:999px;">${tempVal}</span>
        </div>
      `,
      iconSize: [145, 34],
      iconAnchor: [72, 17]
    });

    activeMarker = L.marker([lat, lon], { icon: customIcon }).addTo(mapInstance);
    activeMarker.bindPopup(`
      <div style="font-family:sans-serif;color:#101014;min-width:160px;">
        <strong>${AtmosGeocoding.escapeHtml(city.name)}${city.country ? ', ' + AtmosGeocoding.escapeHtml(city.country) : ''}</strong><br/>
        <span>${condInfo.label} &bull; <b>${tempVal}</b></span><br/>
        <small>Humidity: ${weatherData?.current?.relative_humidity_2m ?? '--'}% | Wind: ${weatherData?.current?.wind_speed_10m ?? '--'} ${settings.windUnit === 'mph' ? 'mph' : 'km/h'}</small><br/>
        <small style="color:#525B6C;">Lat ${lat.toFixed(2)}°, Lon ${lon.toFixed(2)}°</small>
      </div>
    `);

    mapInstance.flyTo([lat, lon], Math.max(mapInstance.getZoom(), 3), { duration: 1.0 });
  }

  function updateCoordsBadge(lat, lon, label = '') {
    const badge = document.getElementById('mapCoordsDisplay');
    if (badge) {
      const prefix = label ? `${label} • ` : '';
      badge.textContent = `${prefix}Lat ${Number(lat).toFixed(2)}° • Lon ${Number(lon).toFixed(2)}°`;
    }
  }

  function syncThemeLayer(theme) {
    if (!mapInstance) return;
    const container = document.getElementById('weatherLeafletMap');
    if (container) {
      container.style.background = theme === 'light' ? '#E2E8F0' : '#141418';
    }
    applyMapMode(currentModeIndex, theme === 'light');
  }

  function invalidate() {
    if (mapInstance) {
      setTimeout(() => mapInstance.invalidateSize(), 150);
    }
  }

  return {
    initMap,
    updatePrimaryMarker,
    syncThemeLayer,
    invalidate
  };
})();
