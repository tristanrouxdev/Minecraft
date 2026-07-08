// Widget calculateur de stacks : [data-widget="stack-calc"]
// Quantité → piles (64), coffres (27/54 emplacements), shulker, bundle. Arrondi toujours supérieur (Math.ceil).

(function () {
  var STACK_SIZE = 64;
  var CONTAINERS = [
    { label: 'Piles (64)', slots: 1 },
    { label: 'Bundle (≈ 1 pile mélangée)', slots: 1 },
    { label: 'Shulker box (27 emplacements)', slots: 27 },
    { label: 'Coffre simple (27 emplacements)', slots: 27 },
    { label: 'Coffre double (54 emplacements)', slots: 54 }
  ];

  function initStackCalc(container) {
    container.classList.add('stack-calc', 'slot');

    var label = document.createElement('label');
    label.setAttribute('for', 'stack-calc-input');
    label.textContent = 'Quantité d\'objets';

    var input = document.createElement('input');
    input.type = 'number';
    input.id = 'stack-calc-input';
    input.className = 'stack-calc__input';
    input.min = '0';
    input.step = '1';
    input.value = '64';

    var results = document.createElement('dl');
    results.className = 'stack-calc__results';
    results.setAttribute('aria-live', 'polite');

    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(results);

    function refresh() {
      var qty = Math.max(0, Math.floor(parseFloat(input.value) || 0));
      results.innerHTML = '';
      CONTAINERS.forEach(function (c) {
        var capacity = c.slots * STACK_SIZE;
        var count = qty === 0 ? 0 : Math.ceil(qty / capacity);
        var dt = document.createElement('dt');
        dt.textContent = c.label;
        var dd = document.createElement('dd');
        dd.textContent = String(count);
        results.appendChild(dt);
        results.appendChild(dd);
      });
    }

    input.addEventListener('input', refresh);
    refresh();
  }

  document.querySelectorAll('[data-widget="stack-calc"]').forEach(initStackCalc);
})();
