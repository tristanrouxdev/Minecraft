// Bootstrap commun : thème, burger, nav. Les widgets par page s'auto-initialisent séparément.

function initBurger() {
  const burger = document.querySelector('[data-widget="burger"]');
  const nav = document.getElementById('site-nav');
  if (!burger || !nav) return;
  burger.addEventListener('click', () => {
    const expanded = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open', !expanded);
  });
}

function initThemeToggle() {
  const btn = document.querySelector('[data-widget="theme-toggle"]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('gs_theme', next);
    } catch (e) {
      /* stockage indisponible, thème non persisté */
    }
  });
}

initBurger();
initThemeToggle();
