// Widget calculateur de coordonnées Nether : [data-widget="nether-calc"]
// Ratio 1:8, arrondi vers zéro (Math.trunc), aucune valeur codée en dur hors du ratio stable §12.

(function () {
  var RATIO = 8;

  function computeResult(x, z, direction) {
    if (direction === 'overworld-to-nether') {
      return { x: Math.trunc(x / RATIO), z: Math.trunc(z / RATIO) };
    }
    return { x: Math.trunc(x * RATIO), z: Math.trunc(z * RATIO) };
  }

  function initNetherCalc(container) {
    container.classList.add('nether-calc', 'slot');

    var row = document.createElement('div');
    row.className = 'nether-calc__row';

    function makeField(labelText, id) {
      var wrap = document.createElement('div');
      wrap.className = 'nether-calc__field';
      var label = document.createElement('label');
      label.setAttribute('for', id);
      label.textContent = labelText;
      var input = document.createElement('input');
      input.type = 'number';
      input.id = id;
      input.step = 'any';
      input.value = '0';
      wrap.appendChild(label);
      wrap.appendChild(input);
      return { wrap: wrap, input: input };
    }

    var xField = makeField('X', 'nether-calc-x');
    var zField = makeField('Z', 'nether-calc-z');
    row.appendChild(xField.wrap);
    row.appendChild(zField.wrap);

    var dirWrap = document.createElement('div');
    dirWrap.className = 'nether-calc__field';
    var dirLabel = document.createElement('label');
    dirLabel.setAttribute('for', 'nether-calc-dir');
    dirLabel.textContent = 'Sens';
    var dirSelect = document.createElement('select');
    dirSelect.id = 'nether-calc-dir';
    var opt1 = document.createElement('option');
    opt1.value = 'overworld-to-nether';
    opt1.textContent = 'Overworld → Nether (÷8)';
    var opt2 = document.createElement('option');
    opt2.value = 'nether-to-overworld';
    opt2.textContent = 'Nether → Overworld (×8)';
    dirSelect.appendChild(opt1);
    dirSelect.appendChild(opt2);
    dirWrap.appendChild(dirLabel);
    dirWrap.appendChild(dirSelect);
    row.appendChild(dirWrap);

    container.appendChild(row);

    var result = document.createElement('p');
    result.className = 'nether-calc__result';
    result.setAttribute('aria-live', 'polite');
    container.appendChild(result);

    var note = document.createElement('p');
    note.className = 'nether-calc__note';
    note.textContent = 'La zone de liaison d\'un portail couvre un rayon de quelques blocs autour des coordonnées calculées : un nouveau portail construit à proximité rejoint le portail existant plutôt que d\'en créer un nouveau.';
    container.appendChild(note);

    function refresh() {
      var x = parseFloat(xField.input.value) || 0;
      var z = parseFloat(zField.input.value) || 0;
      var direction = dirSelect.value;
      var out = computeResult(x, z, direction);
      var destLabel = direction === 'overworld-to-nether' ? 'Nether' : 'Overworld';
      result.textContent = destLabel + ' : X=' + out.x + ', Z=' + out.z;
    }

    xField.input.addEventListener('input', refresh);
    zField.input.addEventListener('input', refresh);
    dirSelect.addEventListener('change', refresh);

    refresh();
  }

  document.querySelectorAll('[data-widget="nether-calc"]').forEach(initNetherCalc);
})();
