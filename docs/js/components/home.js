// Widgets spécifiques à l'accueil : sommaire interactif, frise de progression, quoi de neuf.
// Chargé uniquement sur index.html.

(function () {
  var PAGES = [
    { key: 'fondations', title: 'Fondations', href: 'pages/fondations.html', summary: 'Première nuit, faim, outils, camps abandonnés.', checklist: true },
    { key: 'combat', title: 'Combat', href: 'pages/combat.html', summary: 'Armes, Masse, Lance, bestiaire, boss.', checklist: true },
    { key: 'exploration', title: 'Exploration', href: 'pages/exploration.html', summary: "Chambres d'épreuves, cités anciennes, biomes récents.", checklist: true },
    { key: 'dimensions', title: 'Dimensions', href: 'pages/dimensions.html', summary: 'Nether, netherite, cavalerie, End.', checklist: true },
    { key: 'technique', title: 'Technique', href: 'pages/technique.html', summary: 'Minage, fermes, redstone, ingénierie du soufre.', checklist: true },
    { key: 'changelog', title: 'Changelog', href: 'pages/changelog.html', summary: 'Historique des versions 1.21 → 26.3.', checklist: false },
    { key: 'enchantements', title: 'Enchantements', href: 'pages/enchantements.html', summary: "Encyclopédie filtrable + armure parfaite.", checklist: false },
    { key: 'fermes', title: 'Fermes', href: 'pages/fermes.html', summary: 'Fermes automatiques par catégorie, du Jour 1 au late-game.', checklist: true }
  ];

  var TIMELINE = [
    { label: 'Jour 1', href: 'pages/fondations.html#premiere-nuit' },
    { label: 'Fer/Cuivre', href: 'pages/fondations.html#progression-outils' },
    { label: 'Enchantement', href: 'pages/fondations.html#progression-outils' },
    { label: 'Nether', href: 'pages/dimensions.html#nether-preparation' },
    { label: 'Netherite', href: 'pages/dimensions.html#netherite' },
    { label: "Chambres d'épreuves", href: 'pages/exploration.html#chambres-epreuves' },
    { label: 'Cité ancienne', href: 'pages/exploration.html#cites-anciennes' },
    { label: 'End', href: 'pages/dimensions.html#end' },
    { label: 'Post-game', href: 'pages/dimensions.html#post-dragon' }
  ];

  function pagePercent(key) {
    var checklists = GS.getData('checklists') || {};
    var items = checklists[key] || [];
    if (!items.length) return 0;
    var state = {};
    try {
      state = JSON.parse(localStorage.getItem('gs_checklist_' + key) || '{}');
    } catch (e) {
      state = {};
    }
    var done = items.filter(function (item) {
      return state[item.id];
    }).length;
    return Math.round((done / items.length) * 100);
  }

  function initProgressCards(container) {
    container.innerHTML = '';
    PAGES.forEach(function (page) {
      var card = document.createElement('div');
      card.className = 'slot card';

      var title = document.createElement('h3');
      title.className = 'card__title';
      var link = document.createElement('a');
      link.href = page.href;
      link.textContent = page.title;
      title.appendChild(link);

      var summary = document.createElement('p');
      summary.className = 'card__summary';
      summary.textContent = page.summary;

      card.appendChild(title);
      card.appendChild(summary);

      if (page.checklist) {
        var percent = pagePercent(page.key);
        var xp = document.createElement('div');
        xp.className = 'xp-bar is-visible';
        xp.style.setProperty('--xp-value', percent + '%');
        var fill = document.createElement('div');
        fill.className = 'xp-bar__fill';
        var label = document.createElement('span');
        label.className = 'xp-bar__label';
        label.textContent = percent + '%';
        xp.appendChild(fill);
        xp.appendChild(label);
        card.appendChild(xp);
      }

      container.appendChild(card);
    });
  }

  function initTimeline(container) {
    container.innerHTML = '';
    TIMELINE.forEach(function (stage) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = stage.href;
      a.textContent = stage.label;
      li.appendChild(a);
      container.appendChild(li);
    });
  }

  function initWhatsNew(container) {
    var versions = GS.getData('versions') || [];
    var flattened = [];
    versions.forEach(function (v) {
      (v.entries || []).forEach(function (entry) {
        if (entry.date) {
          flattened.push({ date: entry.date, title: entry.title, versionLabel: v.label, links: v.links || [] });
        }
      });
    });
    flattened.sort(function (a, b) {
      return a.date < b.date ? 1 : -1;
    });
    var latest = flattened.slice(0, 3);

    container.innerHTML = '';
    if (!latest.length) {
      container.textContent = 'Aucune entrée récente.';
      return;
    }
    var list = document.createElement('ul');
    latest.forEach(function (entry) {
      var li = document.createElement('li');
      var link = entry.links[0] || 'pages/changelog.html';
      li.innerHTML = '<a href="' + link + '"><strong>' + entry.title + '</strong></a> — ' + entry.versionLabel + ' (' + entry.date + ')';
      list.appendChild(li);
    });
    container.appendChild(list);
  }

  var cardsEl = document.querySelector('[data-widget="progress-cards"]');
  if (cardsEl) initProgressCards(cardsEl);

  var timelineEl = document.querySelector('[data-widget="progress-timeline"]');
  if (timelineEl) initTimeline(timelineEl);

  var whatsNewEl = document.querySelector('[data-widget="whats-new"]');
  if (whatsNewEl) initWhatsNew(whatsNewEl);
})();
