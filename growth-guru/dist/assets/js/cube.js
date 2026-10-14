/* Growth Guru [GGA] signature 3D cube. Auto-inits every .gg-cube; no globals.
   build.mjs already writes the cube's inner markup into each page (so it spins with CSS alone,
   even without JavaScript); this file adopts that markup, or builds it for an empty .gg-cube,
   pauses off-screen / hidden tab, and tilts toward the mouse on desktop (lerped, layered on the CSS spin). */
(() => {
  const d = document, w = window, M = Math;
  const mq = q => w.matchMedia && w.matchMedia(q).matches;
  const still = mq('(prefers-reduced-motion: reduce)');
  const fine = mq('(hover: hover) and (pointer: fine)');
  // [particles, rings] per size
  const SIZES = { lg: [14, 3], md: [8, 2], sm: [0, 1] };
  // [diameter cqi, rotateZ, rotateX, seconds, modifier]
  const RINGS = [[84, -18, 72, 14, ''], [96, 10, 79, 30, 'dash'], [72, 38, 64, 9, 'rev']];
  const cubes = [];
  let seed = 11, px = null, py = 0, raf = 0, last = 0;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const mk = (p, c, v) => {
    const e = d.createElement('i');
    e.className = 'gg-cube__' + c;
    if (v) for (const k in v) e.style.setProperty('--' + k, v[k]);
    return p.appendChild(e);
  };
  const faces = p => { for (const f of 'fbrltu') mk(p, 'face gg-cube__face--' + f); };

  function build(el) {
    const pre = el.querySelector('.gg-cube__tilt');
    if (pre) return { el, tilt: pre, x: 0, y: 0, vis: true };
    const [np, nr] = SIZES[el.dataset.size] || SIZES.lg;
    el.textContent = '';
    el.setAttribute('aria-hidden', 'true');
    mk(el, 'halo');
    mk(el, 'floor');
    const tilt = mk(mk(el, 'stage'), 'tilt'), bob = mk(tilt, 'bob');
    RINGS.slice(0, nr).forEach(([dm, rz, rx, t, m]) => {
      const o = mk(mk(bob, 'ring', { d: dm + 'cqi', rz: rz + 'deg', rx: rx + 'deg', t: t + 's' }), 'orbit' + (m ? ' gg-cube__orbit--' + m : ''));
      mk(o, 'sat');
    });
    for (let i = 0; i < np; i++) {
      const a = i / np * 6.283 + rnd() * .6, r = 27 + rnd() * 15;
      mk(bob, 'p', {
        x: (M.cos(a) * r).toFixed(2) + 'cqi',
        y: (M.sin(a) * r * .88).toFixed(2) + 'cqi',
        z: ((rnd() * 2 - 1) * 18).toFixed(2) + 'cqi',
        ps: (.8 + rnd() * 1.4).toFixed(2) + 'cqi',
        t: (2.8 + rnd() * 4).toFixed(2) + 's',
        dl: (-rnd() * 7).toFixed(2) + 's'
      });
    }
    mk(bob, 'core');
    const spin = mk(mk(bob, 'axis'), 'spin');
    faces(spin);
    for (let i = 0; i < 8; i++) mk(spin, 'v', { vx: i & 1 ? 1 : -1, vy: i & 2 ? 1 : -1, vz: i & 4 ? 1 : -1 });
    faces(mk(spin, 'inner'));
    return { el, tilt, x: 0, y: 0, vis: true };
  }

  const clamp = v => v < -1 ? -1 : v > 1 ? 1 : v;
  function tick(t) {
    raf = 0;
    const k = 1 - M.pow(.92, M.min(64, M.max(8, t - last)) / 16.7);
    last = t;
    const hw = w.innerWidth / 2, hh = w.innerHeight / 2;
    // read all rects first, then write (no layout thrash)
    const tg = cubes.map(c => {
      if (!c.vis || px === null) return [0, 0];
      const b = c.el.getBoundingClientRect();
      return [-clamp((py - b.top - b.height / 2) / hh) * 8, clamp((px - b.left - b.width / 2) / hw) * 14];
    });
    let go = false;
    cubes.forEach((c, i) => {
      if (!c.vis) return;
      const [tx, ty] = tg[i];
      c.x += (tx - c.x) * k;
      c.y += (ty - c.y) * k;
      if (M.abs(tx - c.x) + M.abs(ty - c.y) > .03) go = true;
      c.tilt.style.transform = 'rotateX(' + c.x.toFixed(2) + 'deg) rotateY(' + c.y.toFixed(2) + 'deg)';
    });
    if (go && !d.hidden) raf = requestAnimationFrame(tick);
  }
  function kick() {
    if (raf || !fine || still || !cubes.length) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function init() {
    const io = 'IntersectionObserver' in w && new IntersectionObserver(es => {
      for (const e of es) {
        const c = cubes.find(c => c.el === e.target);
        if (!c) continue;
        c.vis = e.isIntersecting;
        c.el.classList.toggle('is-off', !c.vis);
      }
      kick();
    }, { rootMargin: '60px' });
    d.querySelectorAll('.gg-cube').forEach(el => {
      if (el.dataset.ggCube) return;
      el.dataset.ggCube = '1';
      const c = build(el);
      cubes.push(c);
      if (io) io.observe(el);
    });
  }

  d.addEventListener('visibilitychange', () => {
    for (const c of cubes) c.el.classList.toggle('is-hidden', d.hidden);
    if (!d.hidden) kick();
  });
  if (fine && !still) {
    w.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      px = e.clientX; py = e.clientY; kick();
    }, { passive: true });
    const away = () => { px = null; kick(); };
    d.documentElement.addEventListener('mouseleave', away);
    w.addEventListener('blur', away);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
