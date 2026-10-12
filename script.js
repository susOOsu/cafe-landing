(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 다크모드 (저장된 값 → 시스템 설정 순)
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  const dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'dark' : 'light';
  $('#theme').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // 스크롤 reveal (형제 순서대로 시차)
  $$('.reveal').forEach(el => {
    const sibs = $$('.reveal', el.parentElement).filter(n => n.parentElement === el.parentElement);
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      const c = $('[data-count]', e.target);
      if (c) countUp(c);
    });
  }, { threshold: 0.18 });
  $$('.reveal').forEach(el => io.observe(el));

  // 숫자 카운트업
  function countUp(el) {
    const end = +el.dataset.count;
    if (reduce) { el.textContent = end.toLocaleString(); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // 스크롤: 진행바, 헤더, 패럴랙스
  const header = $('#header'), bar = $('#progress');
  const para = $$('[data-speed]');
  let lastY = 0, ticking = false;
  function onScroll() {
    const y = scrollY, max = root.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    header.classList.toggle('scrolled', y > 24);
    header.classList.toggle('hide', y > lastY && y > 400);
    lastY = y;
    if (!reduce) {
      para.forEach(el => {
        const r = el.getBoundingClientRect();
        const off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.speed);
        el.style.transform = `translate3d(0, ${(-off).toFixed(1)}px, 0)`;
      });
    }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // 스토리 챕터 인디케이터
  const nav = $('#chapterNav'), items = $$('li', nav);
  const story = $('#story');
  new IntersectionObserver(([e]) => nav.classList.toggle('show', e.isIntersecting), { threshold: 0.05 }).observe(story);
  const co = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) items.forEach((li, i) => li.classList.toggle('on', i === +e.target.dataset.chapter));
    });
  }, { threshold: 0.55 });
  $$('.chapter').forEach(c => co.observe(c));

  // 메뉴 슬라이더 버튼
  const slider = $('#slider');
  const step = () => ($('.card', slider).offsetWidth + 24);
  $('#prev').addEventListener('click', () => slider.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('#next').addEventListener('click', () => slider.scrollBy({ left: step(), behavior: 'smooth' }));
})();
