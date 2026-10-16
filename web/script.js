(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Активный пункт навигации. */
  var links = {};
  document.querySelectorAll('.nav a').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (id) links[id] = a;
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

  /* Прокрутка: линия под шапкой и кнопка «наверх». */
  var head = document.querySelector('.head');
  var up = document.querySelector('.up');

  var y = 0, queued = false;

  function paint() {
    queued = false;
    var sy = window.pageYOffset || root.scrollTop || 0;
    if (head) head.classList.toggle('is-stuck', sy > 8);
    if (up) up.classList.toggle('is-on', sy > (window.innerHeight || 0) * 0.9);
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
