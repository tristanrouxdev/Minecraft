// Widget badges de version + toggle "masquer le contenu snapshot".
// Cible tout élément [data-version] ; injecte un badge uniquement sur les titres de section (h2/h3).

(function () {
  var STORAGE_KEY = 'gs_hide_snapshot';

  function isSnapshot(value) {
    return /snapshot/.test(value);
  }

  function injectBadges() {
    var versions = GS.getData('versions') || [];
    var byId = {};
    versions.forEach(function (v) {
      byId[v.id] = v;
    });

    document.querySelectorAll('h2[data-version], h3[data-version]').forEach(function (heading) {
      var value = heading.getAttribute('data-version');
      var badge = document.createElement('span');
      badge.className = 'badge ' + (isSnapshot(value) ? 'badge--snapshot' : 'badge--stable');
      badge.textContent = byId[value] ? byId[value].label : value;
      heading.appendChild(document.createTextNode(' '));
      heading.appendChild(badge);
    });
  }

  function applySnapshotVisibility(hidden) {
    document.querySelectorAll('[data-version]').forEach(function (el) {
      var value = el.getAttribute('data-version');
      if (isSnapshot(value)) {
        el.classList.toggle('is-hidden-snapshot', hidden);
      }
    });
  }

  function loadHiddenState() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function saveHiddenState(hidden) {
    try {
      localStorage.setItem(STORAGE_KEY, String(hidden));
    } catch (e) {
      /* stockage indisponible, préférence non persistée */
    }
  }

  function initToggle() {
    var btn = document.querySelector('[data-widget="snapshot-toggle"]');
    var hidden = loadHiddenState();
    applySnapshotVisibility(hidden);
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(hidden));

    btn.addEventListener('click', function () {
      hidden = !hidden;
      btn.setAttribute('aria-pressed', String(hidden));
      applySnapshotVisibility(hidden);
      saveHiddenState(hidden);
    });
  }

  injectBadges();
  initToggle();
})();
