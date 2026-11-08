(() => {
  const root = document.documentElement;
  const button = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  const header = document.querySelector('.site-header');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (button && nav) {
    const label = button.querySelector('.menu-label');
    button.hidden = false;
    root.classList.add('js');
    const close = () => {
      button.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      if (label) label.textContent = 'Menu';
    };
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      if (label) label.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        close();
        button.focus();
      }
    });
    document.addEventListener('click', event => { if (!event.target.closest('.site-header')) close(); });
    window.addEventListener('hashchange', close);
    window.matchMedia('(min-width: 761px)').addEventListener('change', close);
  }

  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const chapters = [...document.querySelectorAll('.chapter')];
  if (chapters.length && header) {
    const bar = document.createElement('div');
    bar.className = 'read-progress';
    bar.setAttribute('aria-hidden', 'true');
    header.appendChild(bar);
    const paint = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height > 0 ? window.scrollY / height : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    };
    paint();
    window.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', paint);
  }

  const chapterLinks = [...document.querySelectorAll('.chapter-nav a[href^="#"]')];
  if (chapterLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(chapterLinks.map(link => [link.getAttribute('href').slice(1), link]));
    const mark = id => {
      chapterLinks.forEach(link => {
        const on = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-current', on);
        if (on) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };
    const spy = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) mark(visible.target.id);
    }, { rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.2, 0.5] });
    chapters.forEach(chapter => { if (byId.has(chapter.id)) spy.observe(chapter); });
  }

  const seal = document.querySelector('.hero-seal');
  const wide = window.matchMedia('(min-width: 861px)');
  if (seal && !reduced && wide.matches) {
    const drift = () => {
      const shift = Math.min(window.scrollY, 360) * 0.045;
      seal.style.transform = `translateY(${shift}px)`;
    };
    window.addEventListener('scroll', drift, { passive: true });
  }
})();
