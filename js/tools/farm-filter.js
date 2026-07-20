// Widget de filtre par catégorie pour la page Fermes : [data-widget="farm-filter"]
// Filtre les cards [data-farm-category] déjà présentes dans le DOM (contenu statique) — pas de recherche texte.

(function () {
  var CATEGORIES = [
    { key: 'all', label: 'Tous' },
    { key: 'ressources', label: 'Ressources' },
    { key: 'mobs', label: 'Mobs' },
    { key: 'cultures', label: 'Cultures' },
    { key: 'nourriture', label: 'Nourriture' },
    { key: 'xp', label: 'XP' },
    { key: 'utilitaire', label: 'Utilitaire' }
  ];

  function initFarmFilter(container) {
    var cards = Array.prototype.slice.call(container.querySelectorAll('[data-farm-category]'));
    if (!cards.length) return;

    var tabs = document.createElement('div');
    tabs.className = 'enchant-browser__tabs farm-filter__tabs';
    tabs.setAttribute('role', 'group');
    tabs.setAttribute('aria-label', 'Filtrer les fermes par catégorie');

    var tabButtons = {};
    var active = 'all';

    function render() {
      cards.forEach(function (card) {
        card.hidden = active !== 'all' && card.getAttribute('data-farm-category') !== active;
      });
    }

    CATEGORIES.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab-btn' + (cat.key === 'all' ? ' is-active' : '');
      btn.textContent = cat.label;
      btn.setAttribute('aria-pressed', cat.key === 'all' ? 'true' : 'false');
      btn.addEventListener('click', function () {
        active = cat.key;
        Object.keys(tabButtons).forEach(function (k) {
          tabButtons[k].classList.toggle('is-active', k === cat.key);
          tabButtons[k].setAttribute('aria-pressed', k === cat.key ? 'true' : 'false');
        });
        render();
      });
      tabButtons[cat.key] = btn;
      tabs.appendChild(btn);
    });

    container.insertBefore(tabs, container.firstChild);
  }

  document.querySelectorAll('[data-widget="farm-filter"]').forEach(initFarmFilter);
})();
