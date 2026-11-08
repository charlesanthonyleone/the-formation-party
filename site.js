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

  const canvas = document.createElement('canvas');
  canvas.id = 'party-sky';
  canvas.className = 'party-sky';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const COLORS = ['210,225,255', '246,243,236', '255,255,255', '255,232,210', '255,176,186'];
  const sprites = COLORS.map(rgb => {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 64;
    const g = tile.getContext('2d');
    const glow = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, 'rgba(255,255,255,1)');
    glow.addColorStop(0.12, `rgba(${rgb},0.85)`);
    glow.addColorStop(0.32, `rgba(${rgb},0.22)`);
    glow.addColorStop(0.58, `rgba(${rgb},0.05)`);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(32, 32, 32, 0, Math.PI * 2);
    g.fill();
    return tile;
  });

  const rng = seed => () => {
    seed |= 0;
    seed = seed + 1831565813 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars = [];
  let clouds = [];
  const meteors = [];
  let nextMeteor = 1.8;
  let time = 0;
  let last = 0;
  let frameId = 0;

  const layout = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const rand = rng(11);
    const count = Math.round(Math.min(1400, Math.max(320, width * height / 900)));
    stars = Array.from({ length: count }, () => {
      const mass = Math.pow(rand(), 4.4);
      const pick = rand();
      return {
        x: rand() * width,
        y: rand() * height,
        m: mass,
        c: pick < 0.18 ? 0 : pick < 0.55 ? 1 : pick < 0.88 ? 2 : pick < 0.97 ? 3 : 4,
        f1: 1.4 + rand() * 3.2,
        f2: 3.5 + rand() * 5.5,
        p: rand() * Math.PI * 2,
        vx: 1.2 + rand() * 2.6,
        vy: 0.12 + rand() * 0.4
      };
    });
    clouds = Array.from({ length: 3 }, () => ({
      x: rand() * width,
      y: height * (0.16 + rand() * 0.28),
      w: 160 + rand() * 220,
      h: 36 + rand() * 50,
      a: 0.016 + rand() * 0.018,
      v: 2.5 + rand() * 5,
      phase: rand() * Math.PI * 2
    }));
  };

  const drawBackdrop = t => {
    const night = ctx.createLinearGradient(0, 0, 0, height);
    night.addColorStop(0, '#050d1c');
    night.addColorStop(0.52, '#0A2342');
    night.addColorStop(1, '#1a1024');
    ctx.fillStyle = night;
    ctx.fillRect(0, 0, width, height);

    const pulse = reduced ? 0.72 : 0.55 + 0.45 * Math.sin(t * 0.22);
    const horizon = ctx.createRadialGradient(width * 0.5, height * 1.08, 0, width * 0.5, height * 1.08, height * 0.72);
    horizon.addColorStop(0, `rgba(196,30,58,${0.30 * pulse})`);
    horizon.addColorStop(0.42, `rgba(196,30,58,${0.11 * pulse})`);
    horizon.addColorStop(1, 'rgba(196,30,58,0)');
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 0, width, height);

    const veil = ctx.createRadialGradient(width * 0.16, height * 0.04, 0, width * 0.16, height * 0.04, height * 0.58);
    veil.addColorStop(0, 'rgba(246,243,236,0.075)');
    veil.addColorStop(1, 'rgba(246,243,236,0)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);
  };

  const drawClouds = t => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const cloud of clouds) {
      const x = reduced ? cloud.x : ((cloud.x + t * cloud.v) % (width + cloud.w * 2)) - cloud.w;
      const y = cloud.y + (reduced ? 0 : Math.sin(t * 0.12 + cloud.phase) * 10);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, cloud.w * 0.55);
      glow.addColorStop(0, `rgba(246,243,236,${cloud.a})`);
      glow.addColorStop(0.55, `rgba(246,243,236,${cloud.a * 0.35})`);
      glow.addColorStop(1, 'rgba(246,243,236,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(x, y, cloud.w * 0.6, cloud.h * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawStars = t => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const spanX = width + 40;
    const spanY = height + 40;
    for (let i = 0; i < stars.length; i += 1) {
      const star = stars[i];
      const x = ((star.x + (reduced ? 0 : t * star.vx)) % spanX + spanX) % spanX - 20;
      const y = ((star.y + (reduced ? 0 : t * star.vy)) % spanY + spanY) % spanY - 20;
      const twinkle = reduced
        ? 0.86
        : Math.max(0, 0.62 + 0.38 * Math.sin(t * star.f1 + star.p) * Math.sin(t * star.f2 + star.p * 1.7));
      const size = (1.25 + star.m * 7.4) * (0.8 + 0.42 * twinkle);
      ctx.globalAlpha = Math.min(1, (0.38 + 0.9 * star.m) * twinkle);
      ctx.drawImage(sprites[star.c], x - size, y - size, size * 2, size * 2);
    }
    ctx.restore();
  };

  const spawnMeteor = t => {
    if (reduced || t < nextMeteor) return;
    const fromLeft = Math.random() < 0.55;
    const tilt = 0.26 + Math.random() * 0.2;
    const angle = fromLeft ? tilt : Math.PI - tilt;
    const speed = 400 + Math.random() * 380;
    meteors.push({
      x: fromLeft ? width * (0.04 + Math.random() * 0.42) : width * (0.54 + Math.random() * 0.4),
      y: height * (0.05 + Math.random() * 0.28),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.55,
      age: 0,
      len: 90 + Math.random() * 140,
      crimson: Math.random() < 0.48
    });
    nextMeteor = t + 2.1 + Math.random() * 4.4;
  };

  const drawMeteors = (dt, t) => {
    spawnMeteor(t);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = meteors.length - 1; i >= 0; i -= 1) {
      const meteor = meteors[i];
      meteor.age += dt;
      meteor.x += meteor.vx * dt;
      meteor.y += meteor.vy * dt;
      if (meteor.age >= meteor.life || meteor.y > height * 0.94) {
        meteors.splice(i, 1);
        continue;
      }
      const speed = Math.hypot(meteor.vx, meteor.vy) || 1;
      const ux = meteor.vx / speed;
      const uy = meteor.vy / speed;
      const fade = Math.sin(Math.min(1, meteor.age / meteor.life) * Math.PI);
      const length = Math.min(meteor.len, speed * meteor.age);
      const tailX = meteor.x - ux * length;
      const tailY = meteor.y - uy * length;
      const streak = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
      if (meteor.crimson) {
        streak.addColorStop(0, `rgba(255,255,255,${fade})`);
        streak.addColorStop(0.22, `rgba(255,196,196,${0.72 * fade})`);
        streak.addColorStop(1, 'rgba(196,30,58,0)');
      } else {
        streak.addColorStop(0, `rgba(255,255,255,${fade})`);
        streak.addColorStop(0.22, `rgba(210,225,255,${0.6 * fade})`);
        streak.addColorStop(1, 'rgba(160,190,255,0)');
      }
      ctx.strokeStyle = streak;
      ctx.lineWidth = meteor.crimson ? 2.05 : 1.45;
      ctx.beginPath();
      ctx.moveTo(meteor.x, meteor.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      const tip = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, 6);
      tip.addColorStop(0, `rgba(255,255,255,${fade})`);
      tip.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = tip;
      ctx.beginPath();
      ctx.arc(meteor.x, meteor.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const paint = t => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackdrop(t);
    drawClouds(t);
    drawStars(t);
    drawMeteors(0, t);
  };

  const frame = now => {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackdrop(time);
    drawClouds(time);
    drawStars(time);
    drawMeteors(dt, time);
    if (!reduced && !document.hidden) frameId = requestAnimationFrame(frame);
  };

  const start = () => {
    if (frameId || reduced) return;
    last = 0;
    frameId = requestAnimationFrame(frame);
  };

  layout();
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', layout);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else start();
  });

  if (reduced) paint(0);
  else start();
})();
