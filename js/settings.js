/**
 * Atmos — User Preferences & Theme Controller (settings.js)
 */
const AtmosSettings = (() => {
  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('theme-light', isLight);

    const lightBtn = document.getElementById('themeLightBtn');
    const darkBtn = document.getElementById('themeDarkBtn');
    if (lightBtn && darkBtn) {
      lightBtn.classList.toggle('active', isLight);
      darkBtn.classList.toggle('active', !isLight);
    }

    const settingThemeSelect = document.getElementById('settingThemeSelect');
    if (settingThemeSelect) settingThemeSelect.value = isLight ? 'light' : 'dark';
    if (typeof AtmosMap !== 'undefined' && AtmosMap.syncThemeLayer) {
      AtmosMap.syncThemeLayer(isLight ? 'light' : 'dark');
    }
  }

  function syncSettingsControls(settings) {
    applyTheme(settings.theme);

    const themeSelect = document.getElementById('settingThemeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const updated = AtmosStorage.saveSettings({ theme: e.target.value });
        syncSettingsControls(updated);
        onSettingsChanged(updated, false);
      });
    }

    const tempSelect = document.getElementById('settingTempUnit');
    const windSelect = document.getElementById('settingWindUnit');
    const timeSelect = document.getElementById('settingTimeFormat');
    const aqiSelect = document.getElementById('settingAqiStandard');

    if (tempSelect) tempSelect.value = settings.tempUnit;
    if (windSelect) windSelect.value = settings.windUnit;
    if (timeSelect) timeSelect.value = settings.timeFormat;
    if (aqiSelect) aqiSelect.value = settings.aqiStandard;
  }

  function bindSettingsEvents(onSettingsChanged, onClearStorage) {
    const lightBtn = document.getElementById('themeLightBtn');
    const darkBtn = document.getElementById('themeDarkBtn');

    if (lightBtn) {
      lightBtn.addEventListener('click', () => {
        const updated = AtmosStorage.saveSettings({ theme: 'light' });
        syncSettingsControls(updated);
        onSettingsChanged(updated, false);
      });
    }
    if (darkBtn) {
      darkBtn.addEventListener('click', () => {
        const updated = AtmosStorage.saveSettings({ theme: 'dark' });
        syncSettingsControls(updated);
        onSettingsChanged(updated, false);
      });
    }

    const themeSelect = document.getElementById('settingThemeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const updated = AtmosStorage.saveSettings({ theme: e.target.value });
        syncSettingsControls(updated);
        onSettingsChanged(updated, false);
      });
    }

    const tempSelect = document.getElementById('settingTempUnit');
    if (tempSelect) {
      tempSelect.addEventListener('change', (e) => {
        const updated = AtmosStorage.saveSettings({ tempUnit: e.target.value });
        onSettingsChanged(updated, true);
      });
    }

    const windSelect = document.getElementById('settingWindUnit');
    if (windSelect) {
      windSelect.addEventListener('change', (e) => {
        const updated = AtmosStorage.saveSettings({ windUnit: e.target.value });
        onSettingsChanged(updated, true);
      });
    }

    const timeSelect = document.getElementById('settingTimeFormat');
    if (timeSelect) {
      timeSelect.addEventListener('change', (e) => {
        const updated = AtmosStorage.saveSettings({ timeFormat: e.target.value });
        onSettingsChanged(updated, false);
      });
    }

    const aqiSelect = document.getElementById('settingAqiStandard');
    if (aqiSelect) {
      aqiSelect.addEventListener('change', (e) => {
        const updated = AtmosStorage.saveSettings({ aqiStandard: e.target.value });
        onSettingsChanged(updated, false);
      });
    }

    const clearBtn = document.getElementById('clearStorageBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (onClearStorage) onClearStorage();
      });
    }
  }

  return { applyTheme, syncSettingsControls, bindSettingsEvents };
})();
