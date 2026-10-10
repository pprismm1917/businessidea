/*!
 * Picket Digital — main.js
 * Vanilla JS, no dependencies. Everything here is an enhancement:
 * the page is fully readable and usable with JavaScript turned off.
 * After editing, bump ?v= on the <script> tag in index.html.
 */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var win = window;
  root.classList.remove("no-js");
  root.classList.add("js");

  var mqReduce = win.matchMedia("(prefers-reduced-motion: reduce)");
  function reduced() { return mqReduce.matches; }
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function onMqChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  /* ---------- One rAF-throttled scroll/resize loop ---------- */
  var scrollTasks = [];
  var ticking = false;
  function requestTick() {
    if (!ticking) {
      ticking = true;
      win.requestAnimationFrame(function () {
        ticking = false;
        for (var i = 0; i < scrollTasks.length; i++) scrollTasks[i]();
      });
    }
  }
  win.addEventListener("scroll", requestTick, { passive: true });
  win.addEventListener("resize", requestTick, { passive: true });

  /* ---------- Header: solid background once scrolled ---------- */
  var header = $("[data-header]");
  var headerScrolled = null;
  if (header) {
    scrollTasks.push(function () {
      var s = win.scrollY > 24;
      if (s !== headerScrolled) {
        header.classList.toggle("is-scrolled", s);
        headerScrolled = s;
      }
    });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = $("[data-nav-toggle]");
  var nav = doc.getElementById("site-nav");
  if (toggle && nav && header) {
    var isOpen = function () { return toggle.getAttribute("aria-expanded") === "true"; };
    var setNav = function (open, returnFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      header.classList.toggle("is-open", open);
      if (open) {
        var first = $("a", nav);
        if (first) win.setTimeout(function () { first.focus(); }, 60);
      } else if (returnFocus) {
        toggle.focus();
      }
    };
    toggle.addEventListener("click", function () { setNav(!isOpen()); });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) setNav(false, true);
    });
    doc.addEventListener("click", function (e) {
      if (isOpen() && !header.contains(e.target)) setNav(false);
    });
    onMqChange(win.matchMedia("(min-width: 960px)"), function (e) {
      if (e.matches && isOpen()) setNav(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in win && !reduced()) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          revealIO.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { revealIO.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Hero: parallax, pointer drift, toasts, optional video ---------- */
  var hero = $("[data-hero]");
  var heroVisible = true;
  var layers = hero ? $$("[data-depth]", hero) : [];
  var depths = layers.map(function (l) { return parseFloat(l.getAttribute("data-depth")) || 0; });
  var pointerX = 0;
  var pointerTarget = 0;
  var pointerRaf = 0;

  function paintHero() {
    if (!hero || !heroVisible || reduced()) return;
    var y = win.scrollY;
    for (var i = 0; i < layers.length; i++) {
      var d = depths[i];
      layers[i].style.transform = "translate3d(" + (pointerX * d * -60).toFixed(2) + "px," + (y * d).toFixed(1) + "px,0)";
    }
  }
  if (layers.length) scrollTasks.push(paintHero);

  if (hero && win.matchMedia("(pointer: fine)").matches) {
    var stepPointer = function () {
      pointerX += (pointerTarget - pointerX) * 0.07;
      paintHero();
      if (Math.abs(pointerTarget - pointerX) > 0.0005) pointerRaf = win.requestAnimationFrame(stepPointer);
      else pointerRaf = 0;
    };
    hero.addEventListener("pointermove", function (e) {
      if (reduced()) return;
      pointerTarget = e.clientX / win.innerWidth - 0.5;
      if (!pointerRaf) pointerRaf = win.requestAnimationFrame(stepPointer);
    }, { passive: true });
  }

  // Notification toasts on the phone mockup (cycle every ~3s)
  var toastWrap = $("[data-toasts]");
  var toasts = toastWrap ? $$(".toast", toastWrap) : [];
  var toastIndex = 0;
  var toastTimer = 0;
  function nextToast() {
    var cur = toasts[toastIndex];
    cur.classList.remove("is-active");
    cur.classList.add("is-leaving");
    win.setTimeout(function () { cur.classList.remove("is-leaving"); }, 650);
    toastIndex = (toastIndex + 1) % toasts.length;
    toasts[toastIndex].classList.add("is-active");
  }
  function startToasts() {
    if (toasts.length > 1 && !toastTimer && !doc.hidden && heroVisible) toastTimer = win.setInterval(nextToast, 3000);
  }
  function stopToasts() {
    win.clearInterval(toastTimer);
    toastTimer = 0;
  }
  doc.addEventListener("visibilitychange", function () {
    if (doc.hidden) stopToasts(); else startToasts();
  });

  // Optional hero video (only when enabled in the HTML and the visitor can afford it)
  var video = $("[data-hero-video]");
  var videoActive = false;
  function videoFail() {
    if (!video) return;
    videoActive = false;
    video.classList.remove("is-playing");
    try { video.pause(); } catch (err) { /* ignore */ }
    video.hidden = true;
  }
  if (video && video.getAttribute("data-video") === "on") {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    var bigScreen = win.matchMedia("(min-width: 900px)").matches;
    if (bigScreen && !reduced() && !conn.saveData) {
      var added = 0;
      [["data-src-webm", 'video/webm; codecs="vp9"', "video/webm"], ["data-src-mp4", "video/mp4", "video/mp4"]].forEach(function (cfg) {
        var url = video.getAttribute(cfg[0]);
        if (!url || !video.canPlayType(cfg[1])) return;
        var source = doc.createElement("source");
        source.src = url;
        source.type = cfg[2];
        video.appendChild(source);
        added++;
      });
      if (added) {
        var sources = $$("source", video);
        sources[sources.length - 1].addEventListener("error", videoFail);
        video.addEventListener("error", videoFail);
        video.addEventListener("playing", function () { video.classList.add("is-playing"); }, { once: true });
        video.hidden = false;
        video.preload = "auto";
        video.load();
        videoActive = true;
        var playing = video.play();
        if (playing && playing.catch) playing.catch(videoFail);
      }
    }
  }

  if (hero && "IntersectionObserver" in win) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      hero.classList.toggle("is-offscreen", !heroVisible);
      if (heroVisible) {
        startToasts();
        if (videoActive) { var pp = video.play(); if (pp && pp.catch) pp.catch(videoFail); }
        paintHero();
      } else {
        stopToasts();
        if (videoActive) video.pause();
      }
    }).observe(hero);
  } else {
    startToasts();
  }

  /* ---------- "Plank by plank": JS fallback when CSS scroll timelines aren't supported ---------- */
  var build = $("[data-build]");
  var cssTimeline = !!(win.CSS && CSS.supports && CSS.supports("animation-timeline: view()"));
  var mqScrub = win.matchMedia("(prefers-reduced-motion: no-preference) and (min-height: 560px)");
  function paintBuild() {
    if (!build || !build.classList.contains("is-scrub")) return;
    var r = build.getBoundingClientRect();
    var total = r.height - win.innerHeight;
    var p = total > 0 ? clamp(-r.top / total, 0, 1) : 1;
    build.style.setProperty("--p", p.toFixed(4));
  }
  function setupBuild() {
    if (!build || cssTimeline) return;
    var on = mqScrub.matches;
    build.classList.toggle("is-scrub", on);
    if (on) paintBuild();
    else build.style.removeProperty("--p");
  }
  if (build && !cssTimeline) {
    setupBuild();
    onMqChange(mqScrub, setupBuild);
    scrollTasks.push(paintBuild);
  }

  /* ---------- Before / after slider ---------- */
  $$("[data-compare]").forEach(function (fig) {
    var range = $("[data-compare-range]", fig);
    if (!range) return;
    var touched = false;
    var update = function () {
      var v = parseFloat(range.value);
      fig.style.setProperty("--pos", v + "%");
      range.setAttribute("aria-valuetext", Math.round(v) + "% before page, " + Math.round(100 - v) + "% after design");
    };
    range.addEventListener("input", function () { touched = true; update(); });
    range.addEventListener("pointerdown", function () { touched = true; });
    update();

    // One gentle "nudge" the first time it scrolls into view, to show it can be dragged
    if (!reduced() && "IntersectionObserver" in win) {
      var nudgeIO = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        nudgeIO.disconnect();
        var start = null;
        var keys = [50, 32, 66, 50];
        var dur = 2200;
        var ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
        var frame = function (ts) {
          if (touched) return;
          if (start === null) start = ts;
          var t = clamp((ts - start) / dur, 0, 1);
          var seg = Math.min(keys.length - 2, Math.floor(t * (keys.length - 1)));
          var local = t * (keys.length - 1) - seg;
          range.value = keys[seg] + (keys[seg + 1] - keys[seg]) * ease(local);
          update();
          if (t < 1) win.requestAnimationFrame(frame);
        };
        win.setTimeout(function () { win.requestAnimationFrame(frame); }, 500);
      }, { threshold: 0.6 });
      nudgeIO.observe(fig);
    }
  });

  /* ---------- Contact form: inline validation + fetch submit (falls back to normal POST without JS) ---------- */
  var form = $("[data-contact-form]");
  if (form && win.fetch && win.FormData) {
    form.noValidate = true;
    var statusEl = $("[data-form-status]", form);
    var submitBtn = $(".form__submit", form);
    var submitLabel = $(".form__submit-label", form);
    var submitText = submitLabel ? submitLabel.textContent : "";
    var contactEmail = "hello@picketdigital.com";

    var messageFor = function (input) {
      var v = input.value.trim();
      if (input.required && !v) {
        var label = form.querySelector('label[for="' + input.id + '"]');
        var name = label ? label.textContent.replace(/\(optional\)/i, "").trim().toLowerCase() : "this field";
        return "Please enter your " + name.replace(/^your /, "") + ".";
      }
      if (input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Please enter a valid email, like you@yourcompany.com.";
      if (input.type === "tel" && v && v.replace(/\D/g, "").length < 10) return "Please enter a 10-digit phone number.";
      return "";
    };
    var showFieldError = function (input, msg) {
      var err = doc.getElementById(input.id + "-err");
      if (err) err.textContent = msg;
      if (msg) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    };
    var setStatus = function (type, text, withEmail) {
      statusEl.className = "form__status" + (type === "error" ? " is-error" : "");
      statusEl.textContent = text;
      if (withEmail) {
        var a = doc.createElement("a");
        a.href = "mailto:" + contactEmail;
        a.textContent = contactEmail;
        statusEl.appendChild(doc.createTextNode(" "));
        statusEl.appendChild(a);
        statusEl.appendChild(doc.createTextNode("."));
      }
    };
    var checked = $$("input[required], input[type=email], input[type=tel]", form);
    checked.forEach(function (input) {
      input.addEventListener("blur", function () {
        if (input.value.trim() || input.getAttribute("aria-invalid")) showFieldError(input, messageFor(input));
      });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") && !messageFor(input)) showFieldError(input, "");
      });
    });

    var showSuccess = function () {
      var wrap = form.closest("[data-form-wrap]") || form.parentNode;
      var first = (form.elements.name && form.elements.name.value.trim().split(/\s+/)[0]) || "";
      var box = doc.createElement("div");
      box.className = "form-success";
      box.setAttribute("tabindex", "-1");
      box.setAttribute("role", "status");
      box.innerHTML = '<div class="form-success__icon"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-check"/></svg></div><h3></h3><p></p>';
      $("h3", box).textContent = first ? "Thanks, " + first + "!" : "Thanks — got it!";
      $("p", box).textContent = "We'll be in touch during Texas business hours to confirm a few details. Your free draft is usually ready in about 48 hours.";
      wrap.replaceChildren(box);
      box.focus();
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      checked.forEach(function (input) {
        var msg = messageFor(input);
        showFieldError(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      if (firstBad) {
        setStatus("error", "Please check the highlighted fields.");
        firstBad.focus();
        return;
      }
      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        if (win.console) console.warn("Picket Digital: the contact form isn't connected yet. Paste your Formspree form ID into the form's action in index.html.");
        setStatus("error", "This form isn't connected yet. Please email us at", true);
        return;
      }
      setStatus("", "");
      submitBtn.setAttribute("aria-busy", "true");
      if (submitLabel) submitLabel.textContent = "Sending…";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (res.ok) { showSuccess(); return; }
        throw new Error("HTTP " + res.status);
      }).catch(function () {
        setStatus("error", "Sorry — that didn't go through. Please try again, or email us at", true);
      }).then(function () {
        submitBtn.removeAttribute("aria-busy");
        if (submitLabel) submitLabel.textContent = submitText;
      });
    });
  }

  requestTick();
})();
