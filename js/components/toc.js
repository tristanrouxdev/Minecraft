// TOC de page + scrollspy : [data-widget="toc"], à côté de .page-body sur les pages de guide.

(function () {
  function initToc(nav) {
    var pageBody = nav.parentElement.querySelector('.page-body');
    if (!pageBody) return;
    var headings = pageBody.querySelectorAll('article > section > h2, article > section > h3');
    if (!headings.length) return;

    var list = document.createElement('ul');
    var linkByHeadingId = {};

    headings.forEach(function (heading) {
      var section = heading.closest('section');
      if (!section || !section.id) return;
      var li = document.createElement('li');
      if (heading.tagName === 'H3') li.style.paddingLeft = '1em';
      var clone = heading.cloneNode(true);
      var badge = clone.querySelector('.badge');
      if (badge) badge.remove();

      var a = document.createElement('a');
      a.href = '#' + section.id;
      a.textContent = clone.textContent.replace(/\s+/g, ' ').trim();
      li.appendChild(a);
      list.appendChild(li);
      linkByHeadingId[section.id] = a;
    });

    nav.appendChild(list);

    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = linkByHeadingId[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            Object.keys(linkByHeadingId).forEach(function (id) {
              linkByHeadingId[id].removeAttribute('aria-current');
            });
            link.setAttribute('aria-current', 'true');
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    pageBody.querySelectorAll('article > section[id]').forEach(function (section) {
      observer.observe(section);
    });
  }

  document.querySelectorAll('[data-widget="toc"]').forEach(initToc);
})();
