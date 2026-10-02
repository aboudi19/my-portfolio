export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer:fine)');
const cleanup = [];
export function initAnimations() {
  if (!reducedMotion.matches) document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.12 },
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  cleanup.push(() => observer.disconnect());
  const learnObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) document.getElementById('learning-number').textContent = e.target.dataset.learn;
      }),
    { rootMargin: '-25% 0px -40% 0px', threshold: 0 },
  );
  document.querySelectorAll('[data-learn]').forEach((el) => learnObserver.observe(el));
  cleanup.push(() => learnObserver.disconnect());
  const navLinks = [...document.querySelectorAll('.main-nav a')];
  const navObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navLinks.forEach((a) => {
            const active = a.hash === '#' + e.target.id;
            a.classList.toggle('active', active);
            if (active) a.setAttribute('aria-current', 'location');
            else a.removeAttribute('aria-current');
          });
        }
      }),
    { rootMargin: '-15% 0px -65% 0px' },
  );
  navLinks.forEach((a) => {
    const el = document.querySelector(a.hash);
    if (el) navObserver.observe(el);
  });
  cleanup.push(() => navObserver.disconnect());
  let pending = false,
    lastTimeline = -1,
    manualTimeline = false;
  const progress = document.querySelector('.reading-progress'),
    timeline = document.querySelector('.timeline-section'),
    windowEl = document.querySelector('.timeline-window');
  const renderScroll = () => {
    pending = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (timeline && windowEl && innerWidth > 760 && !reducedMotion.matches && !manualTimeline) {
      const rect = timeline.getBoundingClientRect(),
        distance = timeline.offsetHeight - innerHeight + 92;
      const ratio = Math.max(0, Math.min(1, (92 - rect.top) / distance));
      if (Math.abs(ratio - lastTimeline) > 0.0005) {
        windowEl.scrollLeft = ratio * (windowEl.scrollWidth - windowEl.clientWidth);
        lastTimeline = ratio;
      }
    }
  };
  const onScroll = () => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(renderScroll);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  cleanup.push(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  });
  onScroll();
  windowEl?.addEventListener('pointerdown', () => (manualTimeline = true), { passive: true });
  windowEl?.addEventListener('keydown', () => (manualTimeline = true));
  for (const [id, direction] of [
    ['timeline-prev', -1],
    ['timeline-next', 1],
  ])
    document.getElementById(id)?.addEventListener('click', () => {
      manualTimeline = true;
      windowEl.scrollBy({ left: direction * 330, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    });
  if (finePointer.matches && !reducedMotion.matches) {
    const cursor = document.querySelector('.cursor');
    if (cursor) {
      cursor.style.display = 'none';
      const move = (e) => {
        cursor.style.display = 'block';
        cursor.style.transform = `translate3d(${e.clientX - 11}px,${e.clientY - 11}px,0)`;
        cursor.classList.toggle('hover', !!e.target.closest('a,button,summary,input,textarea'));
      };
      document.addEventListener('pointermove', move, { passive: true });
      cleanup.push(() => document.removeEventListener('pointermove', move));
    }
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.12}px,${(e.clientY - r.top - r.height / 2) * 0.16}px)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
  }
  reducedMotion.addEventListener('change', () =>
    document.documentElement.classList.toggle('js-motion', !reducedMotion.matches),
  );
}
export function createScene(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.style.display = 'none';
    return { pulse() {}, destroy() {} };
  }
  const network = canvas.dataset.scene === 'network',
    dark = network || canvas.dataset.theme === 'dark';
  let width = 0,
    height = 0,
    frame = 0,
    visible = false,
    destroyed = false,
    last = 0,
    time = 0,
    strength = 0.65,
    pulseAt = -100,
    mouse = { x: 0, y: 0, inside: false };
  const mobile = () => innerWidth <= 760;
  const points = Array.from({ length: mobile() ? 480 : 1100 }, (_, i) => {
    const n = mobile() ? 480 : 1100,
      y = 1 - (i / (n - 1)) * 2,
      r = Math.sqrt(1 - y * y),
      theta = i * 2.3999632297;
    return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
  });
  function resize() {
    const r = canvas.getBoundingClientRect();
    width = r.width;
    height = r.height;
    const dpr = Math.min(devicePixelRatio || 1, mobile() ? 1.25 : 1.7);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reducedMotion.matches) draw();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { threshold: 0 },
  );
  io.observe(canvas);
  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (!width || !height) return;
    if (network) drawNetwork();
    else drawSphere();
  }
  function drawSphere() {
    const radius = Math.min(width * 0.34, height * 0.42),
      rotation = time * 0.11 + mouse.x * 0.15,
      tilt = mouse.y * 0.12 - 0.15,
      scrollMorph = dark ? 0 : Math.min(1, scrollY / Math.max(innerHeight, 1));
    const cx = width * 0.52,
      cy = height * 0.49;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.2);
    grad.addColorStop(0, dark ? 'rgba(162,201,132,.07)' : 'rgba(148,170,124,.13)');
    grad.addColorStop(1, 'rgba(148,170,124,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    const projected = points
      .map((p, i) => {
        const ripple = 1 + Math.sin(p.y * 7 + time * 0.55) * 0.06 + Math.sin(i * 0.08 + time * 0.1) * 0.015;
        let x = p.x * Math.cos(rotation) - p.z * Math.sin(rotation),
          z = p.x * Math.sin(rotation) + p.z * Math.cos(rotation);
        const y = p.y * Math.cos(tilt) - z * Math.sin(tilt);
        z = p.y * Math.sin(tilt) + z * Math.cos(tilt);
        const scale = 2.8 / (2.8 - z * 0.55);
        return {
          x: cx + x * radius * scale * ripple,
          y: cy + y * radius * scale * ripple * (1 - scrollMorph * 0.15),
          z,
          alpha: 0.15 + (z + 1) * 0.35,
        };
      })
      .sort((a, b) => a.z - b.z);
    ctx.strokeStyle = dark ? 'rgba(207,229,184,.065)' : 'rgba(37,55,27,.055)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < projected.length; i += mobile() ? 8 : 5) {
      const a = projected[i],
        b = projected[(i + 13) % projected.length];
      if (Math.hypot(a.x - b.x, a.y - b.y) < radius * 0.19) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    for (const p of projected) {
      ctx.beginPath();
      ctx.fillStyle = dark ? `rgba(200,225,178,${p.alpha})` : `rgba(45,65,35,${p.alpha * 0.9})`;
      ctx.arc(p.x, p.y, (p.z + 1) * 0.55 + 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = dark ? 'rgba(190,219,166,.16)' : 'rgba(57,76,43,.13)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy,
        radius * (1.05 + i * 0.04),
        radius * (0.28 + i * 0.07),
        time * 0.025 + i * 0.8,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4 + time * 0.06,
        r = radius * (1.18 + (i % 3) * 0.17);
      const x = cx + Math.cos(a) * r,
        y = cy + Math.sin(a) * r * 0.6;
      ctx.fillStyle = dark ? '#b4cba37a' : '#66755969';
      ctx.fillRect(x, y, 1.3, 1.3);
    }
  }
  function drawNetwork() {
    const counts = mobile() ? [3, 5, 5, 3] : [4, 6, 6, 4],
      nodes = counts.map((count, col) =>
        Array.from({ length: count }, (_, row) => ({
          x: width * (0.06 + col * 0.293),
          y: height * (0.16 + row * (0.68 / (count - 1))),
          col,
          row,
        })),
      );
    const travel = (time - pulseAt) / 2.2,
      propagating = travel >= 0 && travel <= 1;
    ctx.lineWidth = 0.7;
    for (let c = 0; c < 3; c++)
      for (const a of nodes[c])
        for (const b of nodes[c + 1]) {
          const near = mouse.inside && Math.hypot(mouse.x - a.x, mouse.y - a.y) < 80;
          ctx.strokeStyle = near ? 'rgba(201,232,172,.38)' : 'rgba(171,188,155,.13)';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          const t = propagating ? travel * 3 - c : (time * 0.2 + a.row * 0.11 + b.row * 0.05) % 1;
          if (t >= 0 && t <= 1) {
            ctx.fillStyle = `rgba(206,234,181,${strength * (near ? 1 : 0.7)})`;
            ctx.beginPath();
            ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, propagating ? 2.5 : 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
    for (const layer of nodes)
      for (const n of layer) {
        const near = mouse.inside && Math.hypot(mouse.x - n.x, mouse.y - n.y) < 80,
          active = propagating && Math.abs(travel * 3 - n.col) < 0.3;
        ctx.strokeStyle = near || active ? '#d2e8bf' : '#66735b';
        ctx.fillStyle = near || active ? '#c9e8ac' : '#1e271b';
        ctx.beginPath();
        ctx.arc(n.x, n.y, near || active ? 9 : 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (near || active) {
          ctx.strokeStyle = '#c9e8ac30';
          ctx.beginPath();
          ctx.arc(n.x, n.y, 17, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
  }
  function tick(timestamp) {
    frame = 0;
    if (destroyed || !visible || document.hidden) return;
    if (timestamp - last >= (mobile() ? 33 : 16)) {
      time = timestamp / 1000;
      last = timestamp;
      draw();
    }
    if (!reducedMotion.matches) frame = requestAnimationFrame(tick);
  }
  function start() {
    if (!destroyed && visible && !document.hidden && !frame) {
      if (reducedMotion.matches) {
        draw();
        return;
      }
      frame = requestAnimationFrame(tick);
    }
  }
  const move = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse = network
      ? { x: e.clientX - r.left, y: e.clientY - r.top, inside: true }
      : { x: (e.clientX - r.left) / width - 0.5, y: (e.clientY - r.top) / height - 0.5, inside: true };
    if (reducedMotion.matches) draw();
  };
  const leave = () => {
    mouse.inside = false;
    if (!network) {
      mouse.x = 0;
      mouse.y = 0;
    }
  };
  canvas.addEventListener('pointermove', move, { passive: true });
  canvas.addEventListener('pointerleave', leave, { passive: true });
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else start();
  };
  document.addEventListener('visibilitychange', visibility);
  const motion = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    start();
  };
  reducedMotion.addEventListener('change', motion);
  const api = {
    pulse(value = 0.65) {
      strength = value;
      pulseAt = time;
      if (reducedMotion.matches) {
        pulseAt = time - 1;
        draw();
      }
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
      reducedMotion.removeEventListener('change', motion);
    },
  };
  cleanup.push(api.destroy);
  return api;
}
export function disposeAnimations() {
  cleanup.splice(0).forEach((fn) => fn());
}
export function loadLogos() {
  document.querySelectorAll('[data-logo]').forEach((el) => {
    const image = new Image();
    image.alt =
      el.dataset.logo === 'school'
        ? 'Logo de l’école — emplacement personnalisable'
        : 'Logo de l’équipe — emplacement personnalisable';
    image.loading = 'eager';
    image.onload = () => el.replaceChildren(image);
    image.src = `assets/logos/${el.dataset.logo}-logo.png`;
  });
}
