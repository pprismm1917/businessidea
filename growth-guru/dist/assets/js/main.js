/* Growth Guru [GGA] — site interactions.
   Progressive enhancement: every page works without this file.
   Menu, nav indicator, scroll reveals, off-screen animation pause, services scrollspy,
   work filter + project dialogs, blog filter/search, contact form (Formspree), Calendly popup loader. */
(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;
  root.classList.add('js', 'ready');

  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => Array.from(r.querySelectorAll(s));
  const mq = (q) => window.matchMedia(q);
  const reduced = () => mq('(prefers-reduced-motion: reduce)').matches;
  const smooth = () => (reduced() ? 'auto' : 'smooth');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const ICON = {
    info: '<path d="M12 16v-4M12 8h.01"/><circle cx="12" cy="12" r="9.5"/>',
    ok: '<circle cx="12" cy="12" r="9.5"/><path d="m8 12 2.8 2.8L16 9.5"/>',
    err: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v5M12 16h.01"/>',
  };
  const icon = (k) =>
    `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  /* ---------- Header: glass background after scrolling ---------- */
  const header = $('[data-header]');
  if (header) {
    let ticking = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    update();
  }

  /* ---------- Desktop nav: sliding underline ---------- */
  const nav = $('.nav');
  if (nav) {
    const links = $$('.nav__link', nav);
    const current = links.find((a) => a.getAttribute('aria-current') === 'page');
    const indicator = $('.nav__indicator', nav);
    const inset = 14;
    const moveTo = (el, instant) => {
      if (!indicator) return;
      if (instant) indicator.style.transition = 'none';
      if (!el || !el.offsetWidth) {
        nav.style.setProperty('--no', '0');
      } else {
        nav.style.setProperty('--nx', `${el.offsetLeft + inset}px`); // links are positioned relative to .nav
        nav.style.setProperty('--nw', String(Math.max(0, el.offsetWidth - inset * 2)));
        nav.style.setProperty('--no', '1');
      }
      if (instant) {
        void indicator.offsetWidth;
        indicator.style.transition = '';
      }
    };
    nav.classList.add('has-indicator');
    const reset = () => moveTo(current, false);
    links.forEach((a) => {
      a.addEventListener('mouseenter', () => moveTo(a));
      a.addEventListener('focus', () => moveTo(a));
    });
    nav.addEventListener('mouseleave', reset);
    nav.addEventListener('focusout', (e) => {
      if (!nav.contains(e.relatedTarget)) reset();
    });
    const place = () => moveTo(current, true);
    place();
    window.addEventListener('resize', place, { passive: true });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(place);
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $('[data-menu-toggle]');
  const menu = $('[data-menu]');
  if (toggle && menu) {
    const label = $('.visually-hidden', toggle);
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const setOpen = (open, returnFocus) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
      if (label) label.textContent = open ? 'Close menu' : 'Menu';
      if (open) {
        const first = $('a', menu);
        if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
      } else if (returnFocus) toggle.focus();
    };
    toggle.addEventListener('click', () => setOpen(!isOpen()));
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    d.addEventListener('keydown', (e) => {
      if (!isOpen()) return;
      if (e.key === 'Escape') {
        setOpen(false, true);
        return;
      }
      if (e.key === 'Tab') {
        const items = [toggle, ...$$('a, button', menu)];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && d.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && d.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!items.includes(d.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    mq('(min-width: 1080px)').addEventListener('change', (e) => {
      if (e.matches && isOpen()) setOpen(false);
    });
  }

  /* ---------- Scroll reveals ---------- */
  const revealEls = $$('[data-reveal], .process');
  if ('IntersectionObserver' in window && !reduced()) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Pause decorative loops while they're off-screen ---------- */
  if ('IntersectionObserver' in window) {
    const loops = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-offscreen', !e.isIntersecting)),
      { rootMargin: '60px' },
    );
    $$('.hero-stage, .visual, .cta-band__visual, .process, .marquee, .not-found__visual').forEach((el) => loops.observe(el));
  }

  /* ---------- Cursor glow on cards (desktop only) ---------- */
  if (mq('(hover: hover) and (pointer: fine)').matches) {
    let pending = null;
    d.addEventListener(
      'pointermove',
      (e) => {
        const card = e.target.closest && e.target.closest('.glow-card');
        if (!card) return;
        if (!pending) {
          requestAnimationFrame(() => {
            const { card: c, x, y } = pending;
            const r = c.getBoundingClientRect();
            c.style.setProperty('--mx', `${x - r.left}px`);
            c.style.setProperty('--my', `${y - r.top}px`);
            pending = null;
          });
        }
        pending = { card, x: e.clientX, y: e.clientY };
      },
      { passive: true },
    );
  }

  /* ---------- Services: scrollspy pills ---------- */
  const spy = $('[data-scrollspy]');
  if (spy) {
    const links = $$('a[href^="#"]', spy);
    const strip = $('.jump__inner', spy) || spy;
    const sections = links.map((a) => d.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    let active = null;
    let ticking = false;
    const setActive = (id) => {
      if (id === active) return;
      active = id;
      links.forEach((a) => {
        if (a.getAttribute('href') === `#${id}`) {
          a.setAttribute('aria-current', 'true');
          if (strip.scrollWidth > strip.clientWidth) {
            strip.scrollTo({ left: a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2, behavior: smooth() });
          }
        } else a.removeAttribute('aria-current');
      });
    };
    // Active = the last section whose top has passed 40% of the viewport (first one by default).
    const update = () => {
      ticking = false;
      const line = window.innerHeight * 0.4;
      let id = sections[0] && sections[0].id;
      for (const s of sections) if (s.getBoundingClientRect().top <= line) id = s.id;
      if (id) setActive(id);
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    update();
    // Fade whichever end of the chip rail has more chips hidden behind it.
    if (strip !== spy) {
      const edges = () => {
        const max = strip.scrollWidth - strip.clientWidth;
        strip.classList.toggle('fade-start', max > 1 && strip.scrollLeft > 1);
        strip.classList.toggle('fade-end', max > 1 && strip.scrollLeft < max - 1);
      };
      strip.addEventListener('scroll', edges, { passive: true });
      window.addEventListener('resize', edges, { passive: true });
      if (d.fonts && d.fonts.ready) d.fonts.ready.then(edges);
      edges();
    }
  }

  /* ---------- Dialogs (work projects) ---------- */
  const openDialog = (dlg) => {
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') {
      if (!dlg.open) dlg.showModal();
    } else dlg.setAttribute('open', '');
  };
  // "View project" is a link to #dlg-… (so it still works without JavaScript); with JS it opens the dialog.
  $$('[data-open-dialog]').forEach((btn) =>
    btn.addEventListener('click', (e) => {
      const dlg = d.getElementById(btn.dataset.openDialog);
      if (!dlg) return;
      e.preventDefault();
      openDialog(dlg);
    }),
  );
  $$('dialog.modal').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
    // The close control is a link back to the grid (works without JS); with JS it acts as a button.
    $$('[data-close-dialog]', dlg).forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        dlg.close();
      });
      b.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
          e.preventDefault();
          dlg.close();
        }
      });
    });
  });
  // /work/#aura-social (or #dlg-aura-social) opens that project's details. The card's button is
  // focused first, so closing the dialog returns keyboard focus to that card.
  if ($('[data-work-grid]')) {
    const fromHash = (delay) => {
      const id = location.hash.slice(1).replace(/^dlg-/, '');
      const dlg = id ? d.getElementById(`dlg-${id}`) : null;
      if (!dlg) return;
      const btn = $(`[data-open-dialog="dlg-${id}"]`);
      setTimeout(() => {
        if (btn) btn.focus({ preventScroll: true });
        openDialog(dlg);
      }, delay);
    };
    // Wait for the page to finish loading: the browser's own jump to #… happens then and resets focus.
    if (d.readyState === 'complete') fromHash(300);
    else window.addEventListener('load', () => fromHash(250), { once: true });
    window.addEventListener('hashchange', () => fromHash(0));
  }

  /* ---------- Work: animated filter (FLIP) ---------- */
  const workFilter = $('[data-work-filter]');
  if (workFilter) {
    const items = $$('[data-work-item]');
    const buttons = $$('button[data-filter]', workFilter);
    const status = $('[data-work-status]');
    const names = { social: 'social media', website: 'website design', branding: 'branding', campaign: 'marketing campaign' };
    let run = 0;
    const apply = (filter) => {
      const id = ++run;
      const show = (el) => filter === 'all' || el.dataset.category === filter;
      const visibleBefore = items.filter((el) => !el.classList.contains('is-gone'));
      const leaving = visibleBefore.filter((el) => !show(el));
      const entering = items.filter((el) => el.classList.contains('is-gone') && show(el));
      const count = items.filter(show).length;
      if (status) status.textContent = filter === 'all' ? `Showing all ${count} concepts` : `Showing ${count} ${names[filter] || ''} concept${count === 1 ? '' : 's'}`;
      if (reduced()) {
        items.forEach((el) => {
          el.classList.toggle('is-gone', !show(el));
          el.classList.remove('is-out');
        });
        return;
      }
      leaving.forEach((el) => el.classList.add('is-out'));
      setTimeout(
        () => {
          if (id !== run) return;
          const staying = items.filter((el) => !el.classList.contains('is-gone') && show(el));
          const before = new Map(staying.map((el) => [el, el.getBoundingClientRect()]));
          leaving.forEach((el) => el.classList.add('is-gone'));
          entering.forEach((el) => {
            el.classList.remove('is-gone');
            el.classList.add('is-out');
            const card = $('[data-reveal]', el);
            if (card) card.classList.add('is-in');
          });
          staying.forEach((el) => {
            const a = before.get(el);
            const b = el.getBoundingClientRect();
            const dx = a.left - b.left;
            const dy = a.top - b.top;
            if (dx || dy) {
              el.style.transition = 'none';
              el.style.transform = `translate(${dx}px, ${dy}px)`;
            }
          });
          void d.body.offsetWidth;
          requestAnimationFrame(() => {
            staying.forEach((el) => {
              el.style.transition = '';
              el.style.transform = '';
            });
            entering.forEach((el, i) => {
              el.style.transitionDelay = `${i * 60}ms`;
              el.classList.remove('is-out');
              setTimeout(() => (el.style.transitionDelay = ''), 600);
            });
          });
        },
        leaving.length ? 280 : 0,
      );
    };
    buttons.forEach((btn) =>
      btn.addEventListener('click', () => {
        if (btn.getAttribute('aria-pressed') === 'true') return;
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        apply(btn.dataset.filter);
      }),
    );
  }

  /* ---------- Blog: topic filter + instant search ---------- */
  const blog = $('[data-blog]');
  if (blog) {
    const items = $$('[data-post]', blog);
    const chips = $$('button[data-filter]', blog);
    const input = $('[data-blog-search]', blog);
    const status = $('[data-blog-status]', blog);
    const empty = $('[data-blog-empty]', blog);
    const topicCards = $$('[data-topic]');
    const labels = {};
    chips.forEach((c) => (labels[c.dataset.filter] = c.textContent.trim()));
    let cat = 'all';
    // Each search word must match the start of a word ("ai" finds "AI", not the "ai" inside "plain").
    const wordStart = (t) => new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    const apply = () => {
      const q = (input ? input.value : '').trim().toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean).map(wordStart);
      let n = 0;
      items.forEach((el) => {
        const card = $('.post-card', el);
        const hay = card ? card.dataset.search || '' : '';
        const ok = (cat === 'all' || el.dataset.category === cat) && terms.every((re) => re.test(hay));
        const wasHidden = el.classList.contains('is-hidden');
        el.classList.toggle('is-hidden', !ok);
        if (ok) {
          n++;
          const r = $('[data-reveal]', el);
          if (r) r.classList.add('is-in');
          if (wasHidden && !reduced()) {
            el.classList.remove('is-entering');
            void el.offsetWidth;
            el.classList.add('is-entering');
          }
        }
      });
      if (empty) empty.hidden = n !== 0;
      topicCards.forEach((t) => t.classList.toggle('is-active', t.dataset.topic === cat));
      if (status) {
        const where = cat === 'all' ? '' : ` in ${labels[cat] || cat}`;
        const match = q ? ` matching “${q}”` : '';
        status.textContent = n ? `Showing ${n} article${n === 1 ? '' : 's'}${where}${match}` : `No articles${where}${match}`;
      }
    };
    const setCat = (c) => {
      cat = labels[c] ? c : 'all';
      chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
      apply();
    };
    chips.forEach((b) => b.addEventListener('click', () => setCat(b.dataset.filter)));
    if (input) input.addEventListener('input', apply);
    topicCards.forEach((a) => a.addEventListener('click', () => setCat(a.dataset.topic)));
    const topic = new URLSearchParams(location.search).get('topic');
    if (topic) setCat(topic);
    else apply();
  }

  /* ---------- Contact form ---------- */
  const form = $('[data-contact-form]');
  if (form) {
    const status = $('[data-form-status]');
    const submit = $('button[type="submit"]', form);
    const endpoint = form.dataset.endpoint || '';
    const email = form.dataset.email || '';
    const response = form.dataset.response || '';
    let plans = {};
    try {
      plans = JSON.parse(form.dataset.plans || '{}');
    } catch (_) {
      /* ignore */
    }
    const card = $('#contact-form');
    const fields = $$('input[required], select[required], textarea[required]', form);
    const el = (name) => form.elements.namedItem(name);
    const title = $('[data-form-title]');
    const callOnly = $$('[data-call-only]', form);
    const titleDefault = title ? title.textContent : '';
    // "Book a call" mode: the form doubles as the call request (no Calendly needed).
    const wantsCall = el('wants_call');
    const setCallMode = (on) => {
      if (wantsCall) wantsCall.checked = on;
      el('request').value = on ? 'call' : 'message';
      callOnly.forEach((n) => (n.hidden = !on));
      if (title) title.textContent = on ? 'Request your free strategy call' : titleDefault;
    };
    if (wantsCall) wantsCall.addEventListener('change', () => setCallMode(wantsCall.checked));

    const show = (kind, html) => {
      status.className = `form-status is-visible form-status--${kind}`;
      status.innerHTML = `${icon(kind === 'success' ? 'ok' : kind === 'error' ? 'err' : 'info')}<div>${html}</div>`;
      status.focus({ preventScroll: true });
      status.scrollIntoView({ behavior: smooth(), block: 'nearest' });
    };
    const hide = () => {
      status.className = 'form-status';
      status.textContent = '';
    };
    const setError = (input, msg) => {
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      const err = d.getElementById(`${input.id}-error`);
      if (err) err.textContent = msg;
    };
    const validate = (input) => {
      const v = input.value.trim();
      let msg = '';
      if (input.required && !v) msg = input.dataset.msgRequired || 'This field is required.';
      else if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Please enter a valid email address, like name@company.com.';
      setError(input, msg);
      return !msg;
    };
    fields.forEach((input) => {
      input.addEventListener('blur', () => {
        if (input.value.trim() || input.getAttribute('aria-invalid') === 'true') validate(input);
      });
      input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => {
        if (input.getAttribute('aria-invalid') === 'true') validate(input);
      });
    });

    // Pre-fill from booking / plan / service buttons: /contact/#plan-growth, #service-web-design, #call
    const prefill = (intent, scroll) => {
      if (!intent) return false;
      const msg = el('message');
      const service = el('service');
      let used = false;
      if (intent.startsWith('plan-') && plans[intent.slice(5)]) {
        const name = plans[intent.slice(5)];
        el('plan').value = name;
        if (msg && !msg.value.trim()) msg.value = `Hi! I'm interested in the ${name} plan. `;
        used = true;
      } else if (intent.startsWith('service-')) {
        const opt = $$('option', service).find((o) => o.dataset.key === intent.slice(8));
        if (opt) {
          service.value = opt.value;
          if (service.getAttribute('aria-invalid') === 'true') validate(service);
          used = true;
        }
      } else if (intent === 'call') {
        setCallMode(true);
        if (msg && !msg.value.trim()) msg.value = "Hi! I'd like to book a free 30-minute strategy call.";
        used = true;
      }
      if (used && scroll && card) {
        card.scrollIntoView({ behavior: smooth(), block: 'start' });
        if (scroll === 'focus') setTimeout(() => el('name').focus({ preventScroll: true }), reduced() ? 0 : 500);
      }
      return used;
    };
    if (location.hash) setTimeout(() => prefill(location.hash.slice(1), true), 250);
    d.addEventListener('click', (e) => {
      const a = e.target.closest('[data-form-intent]');
      if (!a) return;
      e.preventDefault();
      prefill(a.dataset.formIntent, 'focus');
    });

    let sending = false;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;
      hide();
      const invalid = fields.filter((f) => !validate(f));
      if (invalid.length) {
        invalid[0].focus();
        return;
      }
      const name = el('name').value.trim();
      const first = esc(name.split(/\s+/)[0] || 'there');
      // Honeypot filled in: quietly pretend it worked.
      if (el('_gotcha') && el('_gotcha').value) {
        show('success', `<strong>Thanks, ${first}!</strong> Your message is on its way.`);
        form.reset();
        return;
      }
      const isCall = el('request').value === 'call';
      const plan = el('plan').value;
      const subject = isCall ? `${name} asked to schedule a call with you` : plan ? `${name} is interested in the ${plan} plan` : `New inquiry from ${name}`;
      el('_subject').value = subject;
      const mailHref = () => {
        const body = [`Name: ${name}`, `Email: ${el('email').value.trim()}`, `Company: ${el('company').value.trim()}`, `Website/social: ${el('website').value.trim()}`, `Service: ${el('service').value}`, ...(isCall ? [`Best time for a call: ${el('call_time').value.trim()}`] : []), '', el('message').value.trim()].join('\n');
        return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      };
      if (!endpoint) {
        show('info', `Our form is being connected. Please email us at <a href="${esc(mailHref())}">${esc(email)}</a>. Tap the address and your message will be copied into the email for you.`);
        return;
      }
      sending = true;
      submit.disabled = true;
      submit.classList.add('is-loading');
      submit.setAttribute('aria-busy', 'true');
      try {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (res.ok) {
          const when = response ? ` ${esc(response.charAt(0).toLowerCase() + response.slice(1))}` : ' soon';
          show('success', isCall ? `<strong>Thanks, ${first}!</strong> Your call request is in. We'll email you${when} to confirm a time.` : `<strong>Thanks, ${first}!</strong> Your message is on its way. We'll reply${when}.`);
          form.reset();
          setCallMode(false);
          fields.forEach((f) => f.removeAttribute('aria-invalid'));
        } else {
          let detail = '';
          try {
            const data = await res.json();
            if (data && Array.isArray(data.errors)) detail = data.errors.map((x) => x.message).filter(Boolean).join(' ');
          } catch (_) {
            /* ignore */
          }
          show('error', `Sorry, your message didn't send${detail ? ` (${esc(detail)})` : ''}. Please try again, or email us at <a href="${esc(mailHref())}">${esc(email)}</a>.`);
        }
      } catch (_) {
        show('error', `We couldn't reach the server. Check your connection and try again, or email us at <a href="${esc(mailHref())}">${esc(email)}</a>.`);
      } finally {
        sending = false;
        submit.disabled = false;
        submit.classList.remove('is-loading');
        submit.removeAttribute('aria-busy');
      }
    });
  }

  /* ---------- Calendly popup (loaded only on first click) ---------- */
  let calendly = null;
  const loadCalendly = () => {
    if (window.Calendly) return Promise.resolve();
    if (calendly) return calendly;
    calendly = new Promise((resolve, reject) => {
      const css = d.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://assets.calendly.com/assets/external/widget.css';
      d.head.appendChild(css);
      const s = d.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      const timer = setTimeout(() => reject(new Error('timeout')), 8000);
      s.onload = () => {
        clearTimeout(timer);
        if (window.Calendly) resolve();
        else reject(new Error('missing'));
      };
      s.onerror = () => {
        clearTimeout(timer);
        reject(new Error('blocked'));
      };
      d.head.appendChild(s);
    }).catch((err) => {
      calendly = null;
      throw err;
    });
    return calendly;
  };
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-calendly]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const url = a.getAttribute('href');
    const popupUrl = url + (url.includes('?') ? '&' : '?') + 'hide_gdpr_banner=1&background_color=110d1a&text_color=f5f2fb&primary_color=a855f7';
    $$('dialog[open]').forEach((dlg) => dlg.close());
    if (toggle && toggle.getAttribute('aria-expanded') === 'true') toggle.click();
    a.setAttribute('aria-busy', 'true');
    loadCalendly()
      .then(() => window.Calendly.initPopupWidget({ url: popupUrl }))
      .catch(() => {
        // Couldn't load the popup (blocked or offline): open the booking page itself.
        const w = window.open(url, '_blank');
        if (w) w.opener = null;
        else location.href = url;
      })
      .finally(() => a.removeAttribute('aria-busy'));
  });
})();
