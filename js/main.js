// Bootstrap commun : thème, burger, nav active. Scripts classiques (pas de type="module")
// car fetch()/import() sont bloqués par Chrome sous file:// — voir README.

// Espace de nom unique partagé entre les scripts classiques (pas d'ES modules, voir plus haut).
window.GS = window.GS || {};

GS.getData = function (name) {
  var el = document.getElementById('data-' + name);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch (e) {
    console.error('[GS.getData] JSON invalide pour "' + name + '"', e);
    return null;
  }
};

(function () {
  function initBurger() {
    var burger = document.querySelector('[data-widget="burger"]');
    var nav = document.getElementById('site-nav');
    if (!burger || !nav) return;
    burger.addEventListener('click', function () {
      var expanded = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open', !expanded);
    });
  }

  function initThemeToggle() {
    var btn = document.querySelector('[data-widget="theme-toggle"]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('gs_theme', next);
      } catch (e) {
        /* stockage indisponible, thème non persisté */
      }
    });
  }

  function markActiveNavLink() {
    var links = document.querySelectorAll('.site-nav a');
    var current = window.location.pathname.replace(/\/index\.html$/, '/');
    links.forEach(function (link) {
      var linkPath = new URL(link.href).pathname.replace(/\/index\.html$/, '/');
      if (linkPath === current) link.setAttribute('aria-current', 'page');
    });
  }

  initBurger();
  initThemeToggle();
  markActiveNavLink();
})();
