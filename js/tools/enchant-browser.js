// Widget encyclopédie d'enchantements : [data-widget="enchant-browser"]
// Données depuis data/enchantments.json (injecté, voir GS.getData). Filtres 100% côté client.

(function () {
  var CATEGORIES = [
    { key: 'all', label: 'Tous' },
    { key: 'armure', label: 'Armure' },
    { key: 'arme', label: 'Armes' },
    { key: 'outil', label: 'Outils' },
    { key: 'arc_arbalete', label: 'Arc/Arbalète' },
    { key: 'trident', label: 'Trident' },
    { key: 'peche', label: 'Pêche' },
    { key: 'universel', label: 'Universels' }
  ];
  var ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  function toRoman(n) {
    if (n == null) return 'à vérifier en jeu';
    return ROMAN[n] || String(n);
  }

  function sourceLabel(src) {
    if (src === 'table') return 'Table';
    if (src === 'loot') return 'Loot';
    if (src === 'table_et_loot') return 'Table + Loot';
    return 'à vérifier en jeu';
  }

  function initEnchantBrowser(container) {
    container.classList.add('enchant-browser', 'slot');
    var data = GS.getData('enchantments') || {};
    var keys = Object.keys(data);
    if (!keys.length) {
      container.textContent = 'Données d\'enchantements indisponibles.';
      return;
    }

    var state = { category: 'all', lootOnly: false, search: '' };
    var tabButtons = {};

    var controls = document.createElement('div');
    controls.className = 'enchant-browser__controls';

    var tabs = document.createElement('div');
    tabs.className = 'enchant-browser__tabs';
    tabs.setAttribute('role', 'group');
    tabs.setAttribute('aria-label', 'Filtrer par catégorie');
    CATEGORIES.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab-btn' + (cat.key === 'all' ? ' is-active' : '');
      btn.textContent = cat.label;
      btn.setAttribute('aria-pressed', cat.key === 'all' ? 'true' : 'false');
      btn.addEventListener('click', function () {
        state.category = cat.key;
        Object.keys(tabButtons).forEach(function (k) {
          tabButtons[k].classList.toggle('is-active', k === cat.key);
          tabButtons[k].setAttribute('aria-pressed', k === cat.key ? 'true' : 'false');
        });
        render();
      });
      tabButtons[cat.key] = btn;
      tabs.appendChild(btn);
    });

    var lootLabel = document.createElement('label');
    lootLabel.className = 'enchant-browser__loot-toggle';
    var lootCheckbox = document.createElement('input');
    lootCheckbox.type = 'checkbox';
    lootCheckbox.addEventListener('change', function () {
      state.lootOnly = lootCheckbox.checked;
      render();
    });
    lootLabel.appendChild(lootCheckbox);
    lootLabel.appendChild(document.createTextNode(' Loot uniquement'));

    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'enchant-browser__search';
    searchInput.placeholder = 'Rechercher un nom ou un ID…';
    searchInput.setAttribute('aria-label', 'Rechercher un enchantement');
    searchInput.addEventListener('input', function () {
      state.search = searchInput.value.trim().toLowerCase();
      render();
    });

    controls.appendChild(tabs);
    controls.appendChild(lootLabel);
    controls.appendChild(searchInput);

    var counter = document.createElement('p');
    counter.className = 'enchant-browser__counter';
    counter.setAttribute('aria-live', 'polite');

    var tableWrap = document.createElement('div');
    tableWrap.className = 'table-scroll';
    var table = document.createElement('table');
    var thead = document.createElement('thead');
    thead.innerHTML =
      '<tr><th>Nom</th><th>ID</th><th>Niveau max</th><th>Source</th><th>Objets</th><th>Description</th></tr>';
    var tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    container.appendChild(controls);
    container.appendChild(counter);
    container.appendChild(tableWrap);

    function matches(key, ench) {
      if (state.category !== 'all' && ench.category !== state.category) return false;
      if (state.lootOnly && ench.source !== 'loot') return false;
      if (state.search) {
        var haystack = (ench.name + ' ' + key + ' ' + (ench.id || '')).toLowerCase();
        if (haystack.indexOf(state.search) === -1) return false;
      }
      return true;
    }

    function copyId(id, btn) {
      var original = btn.textContent;
      function feedback(msg) {
        btn.textContent = msg;
        btn.disabled = true;
        setTimeout(function () {
          btn.textContent = original;
          btn.disabled = false;
        }, 1200);
      }
      if (!id) {
        feedback('Indisponible');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id).then(
          function () {
            feedback('Copié !');
          },
          function () {
            feedback('Échec');
          }
        );
      } else {
        feedback('Copie indisponible');
      }
    }

    function buildDetailRow(key, ench) {
      var detailRow = document.createElement('tr');
      detailRow.className = 'enchant-browser__detail-row';
      detailRow.hidden = true;
      var detailCell = document.createElement('td');
      detailCell.colSpan = 6;

      if (ench.conflicts && ench.conflicts.length) {
        var p = document.createElement('p');
        p.appendChild(document.createTextNode('Incompatible avec : '));
        ench.conflicts.forEach(function (cKey, i) {
          var link = document.createElement('a');
          link.href = '#ench-' + cKey;
          link.textContent = data[cKey] ? data[cKey].name : cKey;
          p.appendChild(link);
          if (i < ench.conflicts.length - 1) p.appendChild(document.createTextNode(', '));
        });
        detailCell.appendChild(p);
      } else {
        var none = document.createElement('p');
        none.textContent = 'Aucun conflit connu.';
        detailCell.appendChild(none);
      }

      if (ench.note) {
        var note = document.createElement('p');
        note.className = 'enchant-browser__note';
        note.textContent = ench.note;
        detailCell.appendChild(note);
      }

      detailRow.appendChild(detailCell);
      return detailRow;
    }

    function render() {
      tbody.innerHTML = '';
      var visibleKeys = keys.filter(function (k) {
        return matches(k, data[k]);
      });

      visibleKeys.forEach(function (key) {
        var ench = data[key];
        var row = document.createElement('tr');
        row.id = 'ench-' + key;

        var nameCell = document.createElement('td');
        var toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'enchant-browser__row-toggle';
        toggleBtn.textContent = ench.name;
        toggleBtn.setAttribute('aria-expanded', 'false');
        nameCell.appendChild(toggleBtn);

        var idCell = document.createElement('td');
        var code = document.createElement('code');
        code.textContent = ench.id || 'à vérifier en jeu';
        idCell.appendChild(code);
        if (ench.id) {
          var copyBtn = document.createElement('button');
          copyBtn.type = 'button';
          copyBtn.className = 'btn enchant-browser__copy';
          copyBtn.textContent = 'Copier';
          copyBtn.addEventListener('click', function () {
            copyId(ench.id, copyBtn);
          });
          idCell.appendChild(copyBtn);
        }

        var levelCell = document.createElement('td');
        levelCell.textContent = toRoman(ench.maxLevel);

        var sourceCell = document.createElement('td');
        var badge = document.createElement('span');
        badge.className = 'badge ' + (ench.source === 'loot' ? 'badge--snapshot' : 'badge--stable');
        badge.textContent = sourceLabel(ench.source);
        sourceCell.appendChild(badge);

        var itemsCell = document.createElement('td');
        itemsCell.textContent = (ench.items || []).join(', ');

        var descCell = document.createElement('td');
        descCell.textContent = ench.description || '';

        row.appendChild(nameCell);
        row.appendChild(idCell);
        row.appendChild(levelCell);
        row.appendChild(sourceCell);
        row.appendChild(itemsCell);
        row.appendChild(descCell);
        tbody.appendChild(row);

        var detailRow = buildDetailRow(key, ench);
        tbody.appendChild(detailRow);

        toggleBtn.addEventListener('click', function () {
          var expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
          toggleBtn.setAttribute('aria-expanded', String(!expanded));
          detailRow.hidden = expanded;
        });
      });

      var count = visibleKeys.length;
      counter.textContent = count + ' enchantement' + (count !== 1 ? 's' : '') + ' affiché' + (count !== 1 ? 's' : '');
    }

    render();
  }

  document.querySelectorAll('[data-widget="enchant-browser"]').forEach(initEnchantBrowser);
})();
