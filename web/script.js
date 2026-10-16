(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Активный пункт навигации. Ссылки на другие страницы не трогаем:
     у «Блога» подсветка стоит с сборки. */
  var links = {};
  document.querySelectorAll('.nav a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var hash = href.indexOf('#');
    if (hash < 0) return;
    var id = href.slice(hash + 1);
    if (document.getElementById(id)) links[id] = a;
  });
  if ('IntersectionObserver' in window) {
    var seen = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      Object.keys(links).forEach(function (id) {
        links[id].classList.toggle('is-current', !!seen[id]);
      });
    }, { rootMargin: '-20% 0px -60% 0px' });
    Object.keys(links).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* Оглавление записи: активен последний заголовок, прошедший верхнюю границу экрана. */
  var tocItems = {};
  var tocHeads = [];
  document.querySelectorAll('.toc a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var h = href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null;
    if (!h) return;
    tocItems[h.id] = a.parentNode;
    tocHeads.push(h);
  });

  function paintToc() {
    if (!tocHeads.length) return;
    var line = (window.innerHeight || 0) * 0.3;
    var active = tocHeads[0];
    for (var k = 0; k < tocHeads.length; k++) {
      if (tocHeads[k].getBoundingClientRect().top <= line) active = tocHeads[k];
    }
    var bottom = document.documentElement.scrollHeight - (window.innerHeight || 0);
    if ((window.pageYOffset || root.scrollTop) >= bottom - 2) active = tocHeads[tocHeads.length - 1];
    for (var id in tocItems) tocItems[id].classList.toggle('is-active', id === active.id);
  }

  /* Прокрутка: линия под шапкой и кнопка «наверх». */
  var head = document.querySelector('.head');
  var up = document.querySelector('.up');

  var y = 0, queued = false;

  function paint() {
    queued = false;
    var sy = window.pageYOffset || root.scrollTop || 0;
    if (head) head.classList.toggle('is-stuck', sy > 8);
    if (up) up.classList.toggle('is-on', sy > (window.innerHeight || 0) * 0.9);
    paintToc();
  }

  function onScroll() {
    if (y === window.pageYOffset) return;
    y = window.pageYOffset;
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  paint();

  if (up) {
    up.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
    });
  }
})();
