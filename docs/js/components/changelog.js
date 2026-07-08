// Rendu client de la page changelog : timeline verticale depuis data/versions.json.

(function () {
  function initChangelog(container) {
    var versions = GS.getData('versions') || [];
    container.innerHTML = '';

    var timeline = document.createElement('div');
    timeline.className = 'changelog-timeline';

    versions.forEach(function (version) {
      var block = document.createElement('div');
      block.className = 'changelog-entry slot';

      var header = document.createElement('h2');
      header.textContent = version.label + ' ';
      var badge = document.createElement('span');
      badge.className = 'badge ' + (version.status === 'snapshot' ? 'badge--snapshot' : 'badge--stable');
      badge.textContent = version.date || version.status;
      header.appendChild(badge);
      block.appendChild(header);

      var summary = document.createElement('p');
      summary.textContent = version.summary;
      block.appendChild(summary);

      if (version.entries && version.entries.length) {
        var entryList = document.createElement('ul');
        version.entries.forEach(function (entry) {
          var li = document.createElement('li');
          var strong = document.createElement('strong');
          strong.textContent = entry.title + (entry.date ? ' (' + entry.date + ')' : '');
          li.appendChild(strong);
          if (entry.notes && entry.notes.length) {
            var notesList = document.createElement('ul');
            entry.notes.forEach(function (note) {
              var noteLi = document.createElement('li');
              noteLi.textContent = note;
              notesList.appendChild(noteLi);
            });
            li.appendChild(notesList);
          }
          entryList.appendChild(li);
        });
        block.appendChild(entryList);
      }

      if (version.links && version.links.length) {
        var linksP = document.createElement('p');
        version.links.forEach(function (link, i) {
          if (i > 0) linksP.appendChild(document.createTextNode(' · '));
          var a = document.createElement('a');
          a.href = '../' + link;
          a.textContent = 'Voir dans le guide';
          linksP.appendChild(a);
        });
        block.appendChild(linksP);
      }

      timeline.appendChild(block);
    });

    container.appendChild(timeline);
  }

  var el = document.querySelector('[data-widget="changelog"]');
  if (el) initChangelog(el);
})();
