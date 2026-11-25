// Adds html.js, reveal-on-enter, --progress and the active chapter in the rail. Native scroll only.
const d = document.documentElement;
d.classList.add('js');
addEventListener('DOMContentLoaded', () => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = [...document.querySelectorAll('.reveal')];
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(e => e.classList.add('in'));
  } else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.2 });
    reveals.forEach(e => io.observe(e));
  }
  let queued = 0;
  const update = () => {
    queued = 0;
    const max = d.scrollHeight - innerHeight;
    d.style.setProperty('--progress', max > 0 ? Math.min(1, scrollY / max).toFixed(3) : 0);
  };
  addEventListener('scroll', () => queued || (queued = requestAnimationFrame(update)), { passive: true });
  addEventListener('resize', update);
  update();
  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.rail a')];
    const ob = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      d.dataset.step = e.target.dataset.step;
      links.forEach((a, i) => i + 1 == e.target.dataset.step ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
    }), { rootMargin: '-45% 0px -45% 0px' });
    document.querySelectorAll('.chapter').forEach(c => ob.observe(c));
  }
  // Fiber line, night sky, sunrise. Layout is read on resize only; the frame loop reads scrollY.
  const svg = document.querySelector('.fiber'), cv = document.querySelector('.sky'), shield = document.getElementById('shield');
  if (!svg || !cv) return; // the projects page has no fiber line or sky
  const core = svg.querySelector('.c'), glow = svg.querySelector('.g'), pulse = svg.querySelector('.p'), grad = svg.querySelector('linearGradient');
  const NS = 'http://www.w3.org/2000/svg', clamp = v => Math.max(0, Math.min(1, v));
  let L = 0, y0 = 0, y1 = 0, mt = 0, shTop = 0, p = -1, sun = -1, nodes = [], on = 0;
  const build = () => {
    const main = svg.parentNode, w = svg.clientWidth, h = main.offsetHeight, top = scrollY;
    mt = main.getBoundingClientRect().top + top;
    const Y = e => e.getBoundingClientRect().top + top - mt;
    const cs = [...document.querySelectorAll('.chapter')];
    const ys = [Y(cs[0]), ...cs.map(c => Y(c) + parseFloat(getComputedStyle(c).paddingTop) + 24), Y(document.getElementById('contact'))];
    const a = w < 24 ? w / 2 : w * .3, b = w < 24 ? a : w * .7;
    const xs = ys.map((_, i) => i % 2 ? b : a);
    let d = `M${xs[0]} ${ys[0]}`;
    for (let i = 1; i < ys.length; i++) { const m = (ys[i - 1] + ys[i]) / 2; d += `C${xs[i - 1]} ${m} ${xs[i]} ${m} ${xs[i]} ${ys[i]}`; }
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    core.setAttribute('d', d); glow.setAttribute('d', d);
    y0 = ys[0]; y1 = ys[ys.length - 1];
    L = core.getTotalLength();
    [core, glow].forEach(e => e.style.strokeDasharray = L);
    grad.setAttribute('y1', ys[3] - 40); grad.setAttribute('y2', ys[3] + 200);
    nodes.forEach(n => n.remove());
    nodes = ys.slice(1, 5).map((y, i) => { const n = document.createElementNS(NS, 'circle'); n.setAttribute('class', 'n'); n.setAttribute('r', w < 24 ? 3.5 : 5); n.setAttribute('cx', xs[i + 1]); n.setAttribute('cy', y); n.ny = y; svg.appendChild(n); return n; });
    shTop = shield.getBoundingClientRect().top + top;
    p = sun = -1; draw(0);
  };
  const star = [], dots = []; let seed = 7, W = 0, H = 0;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  for (let i = 0; i < 42; i++) star.push({ x: rnd(), y: rnd(), r: .4 + rnd() * .9, a: .25 + rnd() * .3, k: i % 2 ? .6 + rnd() * 1.4 : 0, ph: rnd() * 6 });
  for (let i = 0; i < 9; i++) dots.push({ x: rnd(), y: rnd(), vx: (rnd() - .5) * .006, vy: (rnd() - .5) * .004 });
  const cx = cv.getContext('2d');
  const sky = t => {
    cx.clearRect(0, 0, W, H);
    cx.fillStyle = '#F3EEE3';
    star.forEach(s => { cx.globalAlpha = s.a * (s.k ? .65 + .35 * Math.sin(t * s.k + s.ph) : 1); cx.beginPath(); cx.arc(s.x * W, s.y * H, s.r, 0, 6.3); cx.fill(); });
    const q = dots.map(o => [((o.x + o.vx * t) % 1 + 1) % 1 * W, ((o.y + o.vy * t) % 1 + 1) % 1 * H]);
    cx.strokeStyle = cx.fillStyle = '#D4AE5C';
    q.forEach((a, i) => {
      cx.globalAlpha = .5; cx.beginPath(); cx.arc(a[0], a[1], 1.6, 0, 6.3); cx.fill();
      for (let j = i + 1; j < q.length; j++) { const k = 1 - Math.hypot(a[0] - q[j][0], a[1] - q[j][1]) / 240; if (k > 0) { cx.globalAlpha = k * .16; cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(q[j][0], q[j][1]); cx.stroke(); } }
    });
  };
  // t in seconds: drives twinkle, drift and the light pulse
  const draw = t => {
    const vh = innerHeight, y = scrollY;
    const np = reduce ? 1 : clamp((y + vh * .6 - mt - y0) / (y1 - y0));
    if (Math.abs(np - p) > .0005) {
      p = np; core.style.strokeDashoffset = glow.style.strokeDashoffset = L * (1 - p);
      nodes.forEach(n => n.classList.toggle('on', n.ny <= y0 + p * (y1 - y0) + 6));
    }
    if (!reduce && p > 0 && p < 1) {
      const f = t / 4 % 1, pt = core.getPointAtLength(L * p * f);
      pulse.setAttribute('cx', pt.x); pulse.setAttribute('cy', pt.y); pulse.style.opacity = Math.sin(f * 3.14);
    } else pulse.style.opacity = 0;
    const s = reduce ? 1 : clamp((vh * .9 - (shTop - y)) / (vh * .6));
    if (Math.abs(s - sun) > .004) { sun = s; shield.style.setProperty('--sun', s.toFixed(3)); cv.style.opacity = 1 - s; }
  };
  const size = () => {
    const r = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; cv.width = W * r; cv.height = H * r; cx.setTransform(r, 0, 0, r, 0, 0);
    build(); if (reduce) sky(0);
  };
  size();
  addEventListener('resize', size);
  if (!reduce) {
    on = !('IntersectionObserver' in window) ? 1 : 0; const vis = new Set();
    const so = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? vis.add(e.target) : vis.delete(e.target); on = vis.size; }));
    ['top', 'glance', 'cable', 'office', 'shield'].forEach(i => so.observe(document.getElementById(i)));
    const frame = now => { requestAnimationFrame(frame); draw(now / 1000); if (on > 0 && sun < 1) sky(now / 1000); };
    requestAnimationFrame(frame);
  }
});
