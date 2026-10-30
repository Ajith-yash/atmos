/**
 * Atmos — City Search & Autocomplete Controller (geocoding.js)
 */
const AtmosGeocoding = (() => {
  let debounceTimer = null;

  function initSearch(onCitySelect) {
    const input = document.getElementById('citySearchInput');
    const dropdown = document.getElementById('searchDropdown');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (!input || !dropdown) return;

    input.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (clearBtn) {
        clearBtn.style.display = val.length > 0 ? 'inline-flex' : 'none';
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      if (val.length < 2) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(async () => {
        await performCitySearch(val, dropdown, input, onCitySelect);
      }, 260);
    });

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = input.value.trim();
        if (val.length >= 2) {
          await performCitySearch(val, dropdown, input, onCitySelect, true);
        }
      } else if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        dropdown.classList.add('hidden');
        input.focus();
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        dropdown.classList.add('hidden');
      }
    });
  }

  async function performCitySearch(query, dropdown, input, onCitySelect, autoPickFirst = false) {
    dropdown.classList.remove('hidden');
    dropdown.innerHTML = `<div style="padding:12px 14px;font-size:0.84rem;color:var(--text-muted);">Searching "${escapeHtml(query)}"...</div>`;

    try {
      const results = await AtmosAPI.searchCities(query, 6);
      if (!results.length) {
        dropdown.innerHTML = `<div style="padding:12px 14px;font-size:0.84rem;color:var(--text-muted);">No matching cities found for "${escapeHtml(query)}".</div>`;
        return;
      }

      if (autoPickFirst) {
        const first = formatGeoResult(results[0]);
        dropdown.classList.add('hidden');
        input.value = '';
        onCitySelect(first);
        return;
      }

      dropdown.innerHTML = results.map((r, idx) => {
        const region = [r.admin1, r.country].filter(Boolean).join(', ');
        return `
          <button type="button" class="search-item" data-idx="${idx}">
            <div>
              <div class="search-item-title">${escapeHtml(r.name)}</div>
              <div class="search-item-sub">${escapeHtml(region || 'Global Location')}</div>
            </div>
            <div style="font-size:0.74rem;color:var(--accent-blue);font-family:monospace;">
              ${Number(r.latitude).toFixed(2)}°, ${Number(r.longitude).toFixed(2)}°
            </div>
          </button>
        `;
      }).join('');

      dropdown.querySelectorAll('.search-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          const picked = results[Number(btn.getAttribute('data-idx'))];
          if (picked) {
            dropdown.classList.add('hidden');
            input.value = '';
            const clearBtn = document.getElementById('clearSearchBtn');
            if (clearBtn) clearBtn.style.display = 'none';
            onCitySelect(formatGeoResult(picked));
          }
        });
      });
    } catch (err) {
      dropdown.innerHTML = `<div style="padding:12px 14px;font-size:0.84rem;color:#FCA5A5;">Unable to reach Geocoding API. Check connection.</div>`;
    }
  }

  function formatGeoResult(r) {
    return {
      id: `${String(r.name).toLowerCase()}-${Number(r.latitude).toFixed(2)}`,
      name: r.name,
      country: r.country || r.country_code || '',
      admin1: r.admin1 || '',
      latitude: Number(r.latitude),
      longitude: Number(r.longitude)
    };
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  return { initSearch, escapeHtml };
})();
