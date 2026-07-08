// Widget checklist : [data-widget="checklist"][data-checklist-page="..."]
// État persisté dans localStorage sous gs_checklist_<page>.

(function () {
  function storageKey(page) {
    return 'gs_checklist_' + page;
  }

  function loadState(page) {
    try {
      var raw = localStorage.getItem(storageKey(page));
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveState(page, state) {
    try {
      localStorage.setItem(storageKey(page), JSON.stringify(state));
    } catch (e) {
      /* stockage indisponible, progression non persistée */
    }
  }

  function computePercent(items, state) {
    if (!items.length) return 0;
    var done = items.filter(function (item) {
      return state[item.id];
    }).length;
    return Math.round((done / items.length) * 100);
  }

  function buildXpBar(percent) {
    var bar = document.createElement('div');
    bar.className = 'xp-bar is-visible';
    bar.style.setProperty('--xp-value', percent + '%');
    var fill = document.createElement('div');
    fill.className = 'xp-bar__fill';
    var label = document.createElement('span');
    label.className = 'xp-bar__label';
    label.textContent = percent + '%';
    bar.appendChild(fill);
    bar.appendChild(label);
    return { bar: bar, label: label };
  }

  function initChecklist(container) {
    var page = container.getAttribute('data-checklist-page');
    var checklists = GS.getData('checklists') || {};
    var items = checklists[page] || [];
    var heading = container.querySelector('h2');

    var state = loadState(page);

    var xp = buildXpBar(computePercent(items, state));
    container.insertBefore(xp.bar, heading ? heading.nextSibling : container.firstChild);

    var list = document.createElement('ul');
    list.className = 'checklist';

    function refreshXp() {
      var percent = computePercent(items, state);
      xp.bar.style.setProperty('--xp-value', percent + '%');
      xp.label.textContent = percent + '%';
    }

    items.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'checklist__item';

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'chk-' + page + '-' + item.id;
      checkbox.checked = Boolean(state[item.id]);

      var label = document.createElement('label');
      label.setAttribute('for', checkbox.id);
      label.textContent = item.label;
      if (checkbox.checked) label.classList.add('is-done');

      checkbox.addEventListener('change', function () {
        state[item.id] = checkbox.checked;
        label.classList.toggle('is-done', checkbox.checked);
        saveState(page, state);
        refreshXp();
      });

      li.appendChild(checkbox);
      li.appendChild(label);

      if (item.phase) {
        var phase = document.createElement('span');
        phase.className = 'checklist__phase';
        phase.textContent = item.phase;
        li.appendChild(phase);
      }
      if (item.version) {
        var badge = document.createElement('span');
        var isSnapshot = /snapshot/.test(item.version);
        badge.className = 'badge ' + (isSnapshot ? 'badge--snapshot' : 'badge--stable');
        badge.textContent = item.version;
        li.appendChild(badge);
      }

      list.appendChild(li);
    });

    container.appendChild(list);

    // --- Contrôles : reset + export/import ---
    var controls = document.createElement('div');
    controls.className = 'checklist__controls';

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn';
    resetBtn.textContent = 'Réinitialiser';
    resetBtn.addEventListener('click', function () {
      if (!window.confirm('Réinitialiser la checklist de cette page ?')) return;
      state = {};
      saveState(page, state);
      list.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
        cb.checked = false;
      });
      list.querySelectorAll('label').forEach(function (lbl) {
        lbl.classList.remove('is-done');
      });
      refreshXp();
    });

    var exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'btn';
    exportBtn.textContent = 'Exporter';

    var importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'btn';
    importBtn.textContent = 'Importer';

    var textarea = document.createElement('textarea');
    textarea.className = 'checklist__export';
    textarea.setAttribute('aria-label', 'Export/import JSON de la checklist');
    textarea.hidden = true;

    exportBtn.addEventListener('click', function () {
      textarea.hidden = false;
      textarea.value = JSON.stringify(state, null, 2);
      textarea.focus();
      textarea.select();
    });

    importBtn.addEventListener('click', function () {
      if (textarea.hidden) {
        textarea.hidden = false;
        textarea.value = '';
        textarea.focus();
        return;
      }
      try {
        var imported = JSON.parse(textarea.value);
        state = imported && typeof imported === 'object' ? imported : {};
        saveState(page, state);
        list.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
          var id = cb.id.replace('chk-' + page + '-', '');
          cb.checked = Boolean(state[id]);
          var lbl = list.querySelector('label[for="' + cb.id + '"]');
          if (lbl) lbl.classList.toggle('is-done', cb.checked);
        });
        refreshXp();
      } catch (e) {
        window.alert('JSON invalide, import annulé.');
      }
    });

    controls.appendChild(resetBtn);
    controls.appendChild(exportBtn);
    controls.appendChild(importBtn);
    container.appendChild(controls);
    container.appendChild(textarea);
  }

  document.querySelectorAll('[data-widget="checklist"]').forEach(initChecklist);
})();
