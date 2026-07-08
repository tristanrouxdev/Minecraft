// Horloge Minecraft simulée : [data-widget="mc-clock"]. Purement illustrative (cycle 20 min).
// En pause si prefers-reduced-motion, comme prévu au §6/§9 du plan.

(function () {
  var CYCLE_MS = 20 * 60 * 1000;
  var NIGHT_START_FRACTION = 0.5;

  function formatDuration(ms) {
    var totalSeconds = Math.ceil(ms / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return minutes + ' min ' + (seconds < 10 ? '0' : '') + seconds + ' s';
  }

  function initClock(container) {
    container.classList.add('mc-clock');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      container.textContent = 'Horloge en pause (mouvement réduit).';
      return;
    }

    var text = document.createElement('p');
    container.appendChild(text);

    var start = Date.now();

    function tick() {
      var elapsed = (Date.now() - start) % CYCLE_MS;
      var nightStart = CYCLE_MS * NIGHT_START_FRACTION;
      if (elapsed < nightStart) {
        text.textContent = 'Jour — nuit simulée dans ' + formatDuration(nightStart - elapsed) + ' (illustratif, cycle 20 min).';
      } else {
        text.textContent = 'Nuit — jour simulé dans ' + formatDuration(CYCLE_MS - elapsed) + ' (illustratif, cycle 20 min).';
      }
    }

    tick();
    setInterval(tick, 1000);
  }

  document.querySelectorAll('[data-widget="mc-clock"]').forEach(initClock);
})();
