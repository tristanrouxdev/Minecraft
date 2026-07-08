// Widget calculateur de minage : [data-widget="mining-calc"]
// Toutes les valeurs viennent de data/ores.json (injecté en <script type="application/json" id="data-ores">).

(function () {
  function buildChart(distribution) {
    var chart = document.createElement('div');
    chart.className = 'mining-calc__chart';
    if (!distribution || !distribution.length) {
      var empty = document.createElement('p');
      empty.textContent = 'Distribution détaillée à vérifier en jeu.';
      chart.appendChild(empty);
      return chart;
    }
    var maxWeight = Math.max.apply(
      null,
      distribution.map(function (pair) {
        return pair[1];
      })
    );
    distribution.forEach(function (pair) {
      var y = pair[0];
      var weight = pair[1];
      var row = document.createElement('div');
      row.className = 'mining-calc__bar-row';
      var label = document.createElement('span');
      label.textContent = 'Y' + y;
      var track = document.createElement('div');
      track.className = 'mining-calc__bar-track';
      var fill = document.createElement('div');
      fill.className = 'mining-calc__bar-fill';
      fill.style.width = Math.round((weight / maxWeight) * 100) + '%';
      track.appendChild(fill);
      row.appendChild(label);
      row.appendChild(track);
      chart.appendChild(row);
    });
    return chart;
  }

  function initMiningCalc(container) {
    container.classList.add('mining-calc', 'slot');
    var ores = GS.getData('ores') || {};
    var keys = Object.keys(ores);
    if (!keys.length) {
      container.textContent = 'Données de minerais indisponibles.';
      return;
    }

    var select = document.createElement('select');
    select.className = 'mining-calc__select';
    select.setAttribute('aria-label', 'Choisir un minerai');
    keys.forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = ores[key].name;
      select.appendChild(opt);
    });
    container.appendChild(select);

    var summary = document.createElement('div');
    summary.className = 'mining-calc__summary';
    summary.setAttribute('aria-live', 'polite');
    container.appendChild(summary);

    var chartHolder = document.createElement('div');
    container.appendChild(chartHolder);

    function render() {
      var ore = ores[select.value];
      summary.innerHTML = '';

      function stat(label, value) {
        var p = document.createElement('p');
        var strong = document.createElement('strong');
        strong.textContent = label + ' : ';
        p.appendChild(strong);
        p.appendChild(document.createTextNode(value == null ? 'à vérifier en jeu' : String(value)));
        return p;
      }

      summary.appendChild(stat('Y optimal', ore.yBest));
      summary.appendChild(
        stat('Plage', ore.yMin != null && ore.yMax != null ? ore.yMin + ' à ' + ore.yMax : null)
      );
      if (ore.note) {
        var note = document.createElement('p');
        note.textContent = ore.note;
        summary.appendChild(note);
      }

      chartHolder.innerHTML = '';
      chartHolder.appendChild(buildChart(ore.distribution));
    }

    select.addEventListener('change', render);
    render();
  }

  document.querySelectorAll('[data-widget="mining-calc"]').forEach(initMiningCalc);
})();
