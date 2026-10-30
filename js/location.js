/**
 * Atmos — Browser Geolocation & Coordinate Resolver (location.js)
 */
const AtmosLocation = (() => {
  function requestCurrentLocation(onSuccess, onError) {
    if (!navigator.geolocation) {
      if (onError) onError('Browser Geolocation API is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        const resolved = AtmosAPI.resolveCoordinatesLabel(lat, lon);
        if (resolved.country === 'Global Weather Pin') {
          resolved.name = 'Current GPS Location';
          resolved.country = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
        }
        onSuccess(resolved);
      },
      (err) => {
        let msg = 'Unable to retrieve your location.';
        if (err.code === 1) msg = 'Location permission denied. Enable location access or search by city name.';
        else if (err.code === 2) msg = 'Location position unavailable.';
        else if (err.code === 3) msg = 'Location request timed out.';
        if (onError) onError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return { requestCurrentLocation };
})();
