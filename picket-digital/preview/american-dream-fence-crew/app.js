/* ==========================================================================
   American Dream Fence Crew — app.js
   Loaded with defer (js-flag.js sets the "js" class before first paint).
   Everything waits for DOMContentLoaded. No external requests.
   Pieces: mobile menu, service preselect, gallery filters, lightbox (also opened
   from the phone work strip), demo estimate form, sticky call bar, reveal-on-enter
   and lazy-photo fade-in (both skipped under prefers-reduced-motion), scrolled header
   shadow and the current-section marker in the desktop nav.
   ========================================================================== */
(function () {
  'use strict';

  // Harmless if js-flag.js already did this.
  document.documentElement.classList.replace('no-js', 'js');

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initServiceLinks();
    initGallery();
    initForm();
    initStickyBar();
    initReveal();
    initImageFade();
    initHeader();
  });

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var toggle = $('.menu-toggle');
    var nav = $('#site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      // style.css keeps the sticky call bar down while the menu is open (it would otherwise slide in over the hero)
      document.documentElement.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.querySelector('span').textContent = open ? 'Close' : 'Menu';
    }
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) setOpen(false);
    });
  }

  /* ---------- "Get an estimate for X" links preselect the service ---------- */
  function initServiceLinks() {
    var select = $('#service');
    if (!select) return;

    function preselect(value) {
      if (!value) return;
      var opt = select.querySelector('option[value="' + value + '"]');
      if (opt) select.value = value;
    }
    $$('a[data-service]').forEach(function (a) {
      a.addEventListener('click', function () { preselect(a.getAttribute('data-service')); });
    });
    // Also honor a hash like #estimate?service=gate (for links from elsewhere).
    var m = /[?&]service=([a-z]+)/.exec(location.hash);
    if (m) {
      preselect(m[1]);
      var form = $('#estimate');
      if (form) form.scrollIntoView();
    }
  }

  /* ---------- Gallery: filters + lightbox ---------- */
  function initGallery() {
    var gallery = $('#gallery');
    var dialog = $('#lightbox');
    if (!gallery) return;

    var items = $$('.gallery__item', gallery);
    var chips = $$('.chip[data-filter]');
    var status = $('.filters__status');
    var empty = $('.gallery__empty');

    // Filters
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var filter = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var shown = 0;
        items.forEach(function (li) {
          var show = filter === 'all' || li.getAttribute('data-cat') === filter;
          li.hidden = !show;
          if (show) shown++;
        });
        if (empty) empty.hidden = shown > 0;
        if (status) status.textContent = 'Showing ' + shown + ' of ' + items.length + ' photos.';
      });
    });

    // Lightbox (native <dialog>; falls back to the plain image link if unsupported)
    if (!dialog || typeof dialog.showModal !== 'function') return;

    var img = $('#lightbox-img');
    var blank = img.getAttribute('src');   // 1px placeholder from the HTML, restored on close
    var caption = $('#lightbox-caption');
    var count = $('#lightbox-count');
    var closeBtn = $('.lightbox__close', dialog);
    var prevBtn = $('.lightbox__prev', dialog);
    var nextBtn = $('.lightbox__next', dialog);
    var current = -1;
    var opener = null;
    var lockY = 0;

    function visible() { return items.filter(function (li) { return !li.hidden; }); }

    function show(index) {
      var list = visible();
      if (!list.length) return;
      current = (index + list.length) % list.length;
      var link = $('a', list[current]);
      var thumb = $('img', link);
      img.src = link.getAttribute('href');
      // The figcaption carries the description; an identical alt would be read twice.
      img.alt = '';
      img.width = thumb.getAttribute('width');
      img.height = thumb.getAttribute('height');
      caption.textContent = thumb.alt;
      count.textContent = '(' + (current + 1) + ' of ' + list.length + ')';
      // Warm the cache for Prev/Next so they don't flash a black box (same origin, no CSP change).
      [current + 1, current - 1].forEach(function (i) {
        var pre = new Image();
        pre.src = $('a', list[(i + list.length) % list.length]).getAttribute('href');
      });
    }

    // Scroll lock: pin the body at the current scroll position (overflow:hidden alone is not enough on phones).
    function lock() {
      lockY = window.pageYOffset || document.documentElement.scrollTop || 0;
      document.body.style.top = -lockY + 'px';
      document.documentElement.classList.add('has-modal');
    }
    function unlock() {
      var html = document.documentElement;
      html.classList.remove('has-modal');
      document.body.style.top = '';
      var prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';   // jump back, don't smooth-scroll
      window.scrollTo(0, lockY);
      html.style.scrollBehavior = prev;
    }

    function open(index, from) {
      opener = from || null;
      show(index);
      lock();
      dialog.showModal();
      closeBtn.focus();
    }

    gallery.addEventListener('click', function (e) {
      var link = e.target.closest('.gallery__link');
      if (!link) return;
      e.preventDefault();
      var index = visible().indexOf(link.closest('.gallery__item'));
      open(index, link);
    });

    // Phone work strip: each tile opens the lightbox at that gallery photo. The filter is reset to
    // "All" first so the strip's indices match the full list. With JS off the link opens the image.
    $$('[data-gallery-index]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (chips[0] && chips[0].getAttribute('aria-pressed') !== 'true') chips[0].click();
        open(+a.getAttribute('data-gallery-index'), a);
      });
    });

    closeBtn.addEventListener('click', function () { dialog.close(); });
    prevBtn.addEventListener('click', function () { show(current - 1); });
    nextBtn.addEventListener('click', function () { show(current + 1); });

    // Click on the dark backdrop closes
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.classList.contains('lightbox__frame')) dialog.close();
    });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
      else if (e.key === 'Tab') {
        // Keep focus inside the dialog (Esc is handled natively by <dialog>)
        var focusable = [closeBtn, prevBtn, nextBtn];
        var i = focusable.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); nextBtn.focus(); }
        else if (!e.shiftKey && i === focusable.length - 1) { e.preventDefault(); closeBtn.focus(); }
        else if (i === -1) { e.preventDefault(); closeBtn.focus(); }
      }
    });

    dialog.addEventListener('close', function () {
      unlock();
      img.setAttribute('src', blank);
      if (opener) opener.focus();
    });
  }

  /* ---------- Demo estimate form (never sends anywhere) ---------- */
  function initForm() {
    var form = $('#estimate');
    if (!form) return;
    form.noValidate = true;

    var status = $('.form__status', form);
    var fields = {
      name: { el: $('#name'), check: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your name.'; } },
      phone: { el: $('#phone'), check: function (v) { return v.replace(/\D/g, '').length >= 10 ? '' : 'Please enter a phone number with area code.'; } },
      email: { el: $('#email'), check: function (v) { return (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) ? '' : 'That email address doesn’t look right.'; } },
      city: { el: $('#city'), check: function (v) { return v ? '' : 'Please choose a city.'; } },
      service: { el: $('#service'), check: function (v) { return v ? '' : 'Please choose what you need.'; } }
    };

    function setError(key, msg) {
      var f = fields[key];
      var err = $('#' + key + '-error');
      if (err) err.textContent = msg;
      if (msg) f.el.setAttribute('aria-invalid', 'true');
      else f.el.removeAttribute('aria-invalid');
    }

    function validate(key) {
      var f = fields[key];
      var msg = f.check(f.el.value);
      setError(key, msg);
      return !msg;
    }

    // Re-check a field once the person leaves it, and clear errors as they fix them
    Object.keys(fields).forEach(function (key) {
      var el = fields[key].el;
      if (!el) return;
      el.addEventListener('blur', function () { if (el.value) validate(key); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) validate(key); });
      el.addEventListener('change', function () { if (el.getAttribute('aria-invalid')) validate(key); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.classList.remove('form__status--error');

      var firstBad = null;
      Object.keys(fields).forEach(function (key) {
        if (!validate(key) && !firstBad) firstBad = fields[key].el;
      });
      if (firstBad) {
        status.classList.add('form__status--error');
        status.textContent = 'Please fix the highlighted fields and try again.';
        firstBad.focus();
        return;
      }

      // Honeypot filled in: a bot. Pretend it worked and do nothing.
      var hp = $('#website');
      var who = fields.name.el.value.trim().split(/\s+/)[0];
      form.classList.add('is-done');
      status.textContent = 'Thanks' + (who ? ', ' + who : '') + '. This is a preview, so nothing was sent. ' +
        'On your live site this request lands in Bobby’s inbox and on your phone within seconds.';
      if (hp && hp.value) status.textContent = 'Thanks. This is a preview, so nothing was sent.';
      status.setAttribute('tabindex', '-1');
      status.focus();
      status.scrollIntoView({ block: 'center' });

      // Offer a way back to the form
      var again = document.createElement('button');
      again.type = 'button';
      again.className = 'btn btn--outline';
      again.textContent = 'Start another request';
      again.addEventListener('click', function () {
        form.classList.remove('is-done');
        form.reset();
        status.textContent = '';
        again.remove();
        fields.name.el.focus();
      });
      status.insertAdjacentElement('afterend', again);
    });
  }

  /* ---------- Sticky bar: hidden while the hero buttons or the estimate form are on screen ----------
     The bar starts with is-hidden in the HTML, so it slides in on the first scroll past the hero
     instead of covering the hero's own Call / Free estimate buttons. Without IntersectionObserver
     it simply stays shown. */
  function initStickyBar() {
    var bar = $('#sticky-bar');
    if (!bar) return;
    var targets = [$('.hero__actions'), $('#estimate')].filter(Boolean);
    if (!targets.length || !('IntersectionObserver' in window)) { bar.classList.remove('is-hidden'); return; }
    var onScreen = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var i = onScreen.indexOf(en.target);
        if (en.isIntersecting && i === -1) onScreen.push(en.target);
        if (!en.isIntersecting && i !== -1) onScreen.splice(i, 1);
      });
      bar.classList.toggle('is-hidden', onScreen.length > 0);
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- Reveal: .reveal elements fade up 12px as they enter (style.css, .js only).
     Siblings stagger by 40ms through --i (set with the CSSOM, which the CSP allows).
     Without IntersectionObserver, or when the person prefers reduced motion, everything
     is shown at once. ---------- */
  function initReveal() {
    var els = $$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    els.forEach(function (el) {
      var i = 0, sib = el;
      while ((sib = sib.previousElementSibling)) { if (sib.classList.contains('reveal')) i++; }
      el.style.setProperty('--i', i % 6);
      io.observe(el);
    });
  }

  /* ---------- Lazy photos fade in once decoded (style.css hides them until .is-loaded).
     Errors also mark the image so alt text is never stuck invisible. ---------- */
  function initImageFade() {
    $$('img[loading="lazy"]').forEach(function (img) {
      var done = function () { img.classList.add('is-loaded'); };
      if (img.complete) done();
      else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  }

  /* ---------- Desktop header: a shadow once the page has scrolled, and the section currently
     under the top of the viewport marked in the nav with aria-current. ---------- */
  function initHeader() {
    var header = $('.site-header');
    if (!header) return;
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var links = $$('.nav__list a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var sections = $$('section[id]').filter(function (s) { return byId[s.id]; });
    var inBand = [];
    var setCurrent = function (id) {
      links.forEach(function (a) {
        if (id && a === byId[id]) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };
    // A band at 25-45% of the viewport decides which section is "current" (tall sections never reach
    // a 40% visible threshold, so a band works better). Nothing in the band (the hero) means no marker.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var i = inBand.indexOf(en.target);
        if (en.isIntersecting && i === -1) inBand.push(en.target);
        if (!en.isIntersecting && i !== -1) inBand.splice(i, 1);
      });
      var top = inBand.slice().sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; })[0];
      setCurrent(top ? top.id : null);
    }, { rootMargin: '-25% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }
})();
