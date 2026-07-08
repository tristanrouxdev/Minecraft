// Widget recherche globale : [data-widget="search"] dans le header.
// Filtre data/search-index.json, insensible casse/accents, groupé par page, navigation clavier.

(function () {
  var PAGE_NAMES = {
    'index.html': 'Accueil',
    'pages/fondations.html': 'Fondations',
    'pages/combat.html': 'Combat',
    'pages/exploration.html': 'Exploration',
    'pages/dimensions.html': 'Dimensions',
    'pages/technique.html': 'Technique',
    'pages/changelog.html': 'Changelog'
  };

  function normalize(str) {
    return str
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  function initSearch(container) {
    var input = container.querySelector('.search-box__input');
    var resultsList = container.querySelector('.search-box__results');
    if (!input || !resultsList) return;

    var depth = container.getAttribute('data-depth') || '';
    var index = GS.getData('search-index') || [];
    var normalizedIndex = index.map(function (entry) {
      return {
        entry: entry,
        haystack: normalize([entry.title].concat(entry.keywords || []).join(' '))
      };
    });

    var activeIndex = -1;

    function close() {
      resultsList.hidden = true;
      resultsList.innerHTML = '';
      activeIndex = -1;
    }

    function render(matches) {
      resultsList.innerHTML = '';
      activeIndex = -1;
      if (!matches.length) {
        resultsList.hidden = true;
        return;
      }

      var groups = {};
      var order = [];
      matches.forEach(function (m) {
        var page = m.entry.page;
        if (!groups[page]) {
          groups[page] = [];
          order.push(page);
        }
        groups[page].push(m.entry);
      });

      order.forEach(function (page) {
        var groupTitle = document.createElement('li');
        groupTitle.className = 'search-box__group-title';
        groupTitle.textContent = PAGE_NAMES[page] || page;
        resultsList.appendChild(groupTitle);

        groups[page].forEach(function (entry) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.className = 'search-box__result';
          a.href = depth + entry.page + (entry.anchor || '');
          a.textContent = entry.title;
          li.appendChild(a);
          resultsList.appendChild(li);
        });
      });

      resultsList.hidden = false;
    }

    function currentOptions() {
      return Array.prototype.slice.call(resultsList.querySelectorAll('.search-box__result'));
    }

    function setActive(newIndex) {
      var options = currentOptions();
      if (!options.length) return;
      options.forEach(function (opt) {
        opt.classList.remove('is-active');
      });
      activeIndex = (newIndex + options.length) % options.length;
      options[activeIndex].classList.add('is-active');
      options[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', function () {
      var query = normalize(input.value.trim());
      if (!query) {
        close();
        return;
      }
      var matches = normalizedIndex.filter(function (item) {
        return item.haystack.indexOf(query) !== -1;
      });
      render(matches);
    });

    input.addEventListener('keydown', function (evt) {
      var options = currentOptions();
      if (evt.key === 'Escape') {
        close();
        input.blur();
      } else if (evt.key === 'ArrowDown' && options.length) {
        evt.preventDefault();
        setActive(activeIndex + 1);
      } else if (evt.key === 'ArrowUp' && options.length) {
        evt.preventDefault();
        setActive(activeIndex - 1);
      } else if (evt.key === 'Enter' && activeIndex >= 0 && options[activeIndex]) {
        evt.preventDefault();
        window.location.href = options[activeIndex].href;
      }
    });

    document.addEventListener('click', function (evt) {
      if (!container.contains(evt.target)) close();
    });
  }

  document.querySelectorAll('[data-widget="search"]').forEach(initSearch);
})();
