/* PLAYMATE LABS — full-screen scratch popup
   The scratch is decoration. The form is never gated behind it: a Reveal
   button is always available, and if canvas is unsupported the panel starts
   revealed. */
(function () {
  var el = document.getElementById('scratchPopup');
  if (!el) return;

  var KEY   = 'pm_scratch_seen';
  var cfg   = window.PM_SCRATCH || {};
  var delay = (cfg.delay || 6) * 1000;
  var days  = cfg.days || 14;

  function seen() {
    try {
      var v = localStorage.getItem(KEY);
      return v && (Date.now() - parseInt(v, 10)) < days * 864e5;
    } catch (e) { return false; }   // private mode: just show it
  }
  function remember() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }

  var canvas  = document.getElementById('spCanvas');
  var hint    = document.getElementById('spHint');
  var submit  = document.getElementById('spSubmit');
  var reveal  = document.getElementById('spReveal');
  var revealed = false;
  var lastFocus = null;

  var card  = document.getElementById('spCard');
  var prize = document.getElementById('spPrize');

  function unlock() {
    if (revealed) return;
    revealed = true;
    // fade the remaining foil away; the reward is already underneath it
    if (canvas) canvas.classList.add('is-cleared');
    if (hint)   hint.style.display = 'none';
    if (submit) submit.disabled = false;
    if (reveal) reveal.hidden = true;
    el.classList.add('sp--revealed');
    var email = document.getElementById('spEmail');
    if (email) email.focus();
  }

  function setupCanvas() {
    if (!canvas || !canvas.getContext) { unlock(); return; }
    var ctx = canvas.getContext('2d');
    if (!ctx) { unlock(); return; }

    var rect = canvas.getBoundingClientRect();
    var dpr  = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.scale(dpr, dpr);

    var g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0,   cfg.foilFrom || '#C9A96E');
    g.addColorStop(0.5, cfg.foilMid  || '#E8D7AE');
    g.addColorStop(1,   cfg.foilTo   || '#B08D4F');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.globalCompositeOperation = 'destination-out';

    var drawing = false, cleared = false;

    function at(e) {
      var r = canvas.getBoundingClientRect();
      var p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    }
    function scratch(e) {
      if (!drawing) return;
      e.preventDefault();
      var p = at(e);
      ctx.beginPath();
      ctx.arc(p.x, p.y, cfg.brush || 22, 0, Math.PI * 2);
      ctx.fill();
      if (hint) hint.style.opacity = '0';
      check();
    }
    var checking = false;
    function check() {
      if (cleared || checking) return;
      checking = true;
      requestAnimationFrame(function () {
        checking = false;
        try {
          var d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          var clear = 0, step = 64;               // sample, do not scan every pixel
          for (var i = 3; i < d.length; i += 4 * step) { if (d[i] === 0) clear++; }
          var total = d.length / (4 * step);
          if (clear / total > (cfg.threshold || 0.45)) { cleared = true; unlock(); }
        } catch (err) { /* tainted or unavailable — the Reveal button still works */ }
      });
    }
    function start(e) { drawing = true; scratch(e); }
    function stop()  { drawing = false; }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', scratch);
    window.addEventListener('mouseup', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', scratch, { passive: false });
    window.addEventListener('touchend', stop);
  }

  function open() {
    lastFocus = document.activeElement;
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      el.classList.add('is-open');
      setupCanvas();
      var first = document.getElementById('spClose');
      if (first) first.focus();
    });
    if (!/[?&]popup=1/.test(window.location.search)) remember();
  }
  function close() {
    el.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { el.hidden = true; }, 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.getElementById('spClose').addEventListener('click', close);
  el.addEventListener('click', function (e) { if (e.target === el) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !el.hidden) close();
  });
  if (reveal) reveal.addEventListener('click', unlock);

  // keep focus inside while open
  el.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || el.hidden) return;
    var f = el.querySelectorAll('button:not([hidden]), input, a[href]');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // ?popup=1 forces it open for previewing — ignores design mode, the delay
  // and the already-seen record, and never sets that record itself.
  var forced = /[?&]popup=1/.test(window.location.search);
  if (forced) { open(); return; }

  if (window.Shopify && window.Shopify.designMode) return;  // never ambush the editor
  if (seen()) return;
  setTimeout(open, delay);
})();
