// Tooltip d'item : .item[data-item] → carte flottante résolue via recipes.json / mobs.json.
// Fonctionne au hover et au focus clavier.

(function () {
  var recipes = GS.getData('recipes') || {};
  var mobs = GS.getData('mobs') || {};
  var card = null;
  var hideTimeout = null;

  function resolveEntry(id) {
    if (recipes[id]) return { kind: 'recipe', data: recipes[id] };
    if (mobs[id]) return { kind: 'mob', data: mobs[id] };
    return null;
  }

  function buildCardContent(entry) {
    var title = document.createElement('p');
    title.className = 'item-tooltip__title';
    title.textContent = entry.data.name;

    var body = document.createElement('p');
    if (entry.kind === 'recipe') {
      body.textContent = entry.data.note || (entry.data.version ? 'Introduit en ' + entry.data.version + '.' : '');
    } else {
      var bits = [];
      if (entry.data.biome) bits.push(entry.data.biome);
      if (entry.data.strategy) bits.push(entry.data.strategy);
      body.textContent = bits.join(' — ');
    }
    return [title, body];
  }

  function ensureCard() {
    if (card) return card;
    card = document.createElement('div');
    card.className = 'item-tooltip';
    card.setAttribute('role', 'tooltip');
    card.hidden = true;
    document.body.appendChild(card);
    return card;
  }

  function show(target, entry) {
    clearTimeout(hideTimeout);
    var el = ensureCard();
    el.innerHTML = '';
    buildCardContent(entry).forEach(function (node) {
      el.appendChild(node);
    });
    el.hidden = false;

    var rect = target.getBoundingClientRect();
    var cardRect = el.getBoundingClientRect();
    var left = rect.left;
    var top = rect.bottom + 6;

    if (left + cardRect.width > window.innerWidth - 8) {
      left = window.innerWidth - cardRect.width - 8;
    }
    if (top + cardRect.height > window.innerHeight - 8) {
      top = rect.top - cardRect.height - 6;
    }
    left = Math.max(8, left);
    top = Math.max(8, top);

    el.style.left = left + window.scrollX + 'px';
    el.style.top = top + window.scrollY + 'px';
  }

  function hide() {
    hideTimeout = setTimeout(function () {
      if (card) card.hidden = true;
    }, 60);
  }

  document.querySelectorAll('.item[data-item]').forEach(function (span) {
    var entry = resolveEntry(span.getAttribute('data-item'));
    if (!entry) return;
    if (!span.hasAttribute('tabindex')) span.setAttribute('tabindex', '0');

    span.addEventListener('mouseenter', function () {
      show(span, entry);
    });
    span.addEventListener('mouseleave', hide);
    span.addEventListener('focus', function () {
      show(span, entry);
    });
    span.addEventListener('blur', hide);
  });
})();
