/* Nude Stack'd web app: rules, digital deck and languages. No framework, no build step. */
(function () {
  'use strict';
  var CFG = window.NUDE_CONFIG || {};
  var LANGS = [
    ['en', 'English'], ['de', 'Deutsch'], ['nl', 'Nederlands'],
    ['fr', 'Français'], ['es', 'Español'], ['it', 'Italiano']
  ];
  var OTHER = [
    ['pl', 'Polski'], ['pt', 'Português'], ['sv', 'Svenska'], ['da', 'Dansk'], ['no', 'Norsk'], ['fi', 'Suomi'],
    ['cs', 'Čeština'], ['el', 'Ελληνικά'], ['ro', 'Română'], ['hu', 'Magyar'], ['tr', 'Türkçe'], ['ja', '日本語'],
    ['ko', '한국어'], ['zh-CN', '中文'], ['ar', 'العربية'], ['hi', 'हिन्दी']
  ];
  var MODE = CFG.mode || 'game';           // 'game' (sign-in needed) or 'rules' (open, no cards)
  var USER = window.NUDE_USER || null;     // customer email, only set by Liquid when signed in
  var CARDS = window.NUDE_CARDS || {};     // card text, only rendered by Liquid when signed in
  var app = document.getElementById('app');
  var C = null;                            // loaded content for the current language
  var cache = {};
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('nude.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('nude.' + k, JSON.stringify(v)); } catch (e) { /* private mode: keep going */ } }
  };
  var state = {
    lang: store.get('lang', null),
    adult: store.get('adult', false),
    drawn: store.get('drawn', {}),
    current: store.get('current', null),   // {id, level}
    flipNext: false
  };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(name, cls) { return '<svg class="' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function t(k, vars) { var s = (C.ui && C.ui[k]) || k; if (vars) Object.keys(vars).forEach(function (v) { s = s.replace('{' + v + '}', vars[v]); }); return s; }
  function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function cat(id) { return C.categories.filter(function (c) { return c.id === id; })[0]; }
  function card(id) { return C.cards.filter(function (c) { return c.id === id; })[0]; }
  function left(catId) { return C.cards.filter(function (c) { return c.category === catId && !state.drawn[c.id]; }).length; }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function guessLang() {
    var nav = (navigator.languages || [navigator.language || 'en']).map(function (l) { return String(l).slice(0, 2).toLowerCase(); });
    for (var i = 0; i < nav.length; i++) for (var j = 0; j < LANGS.length; j++) if (LANGS[j][0] === nav[i]) return nav[i];
    return 'en';
  }

  function load(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch(CFG.content[lang]).then(function (r) { if (!r.ok) throw new Error('content ' + r.status); return r.json(); })
      .then(function (j) { j.cards = CARDS[lang] || []; cache[lang] = j; return j; });
  }

  function setLang(lang) {
    return load(lang).then(function (j) {
      C = j; state.lang = lang; store.set('lang', lang);
      document.documentElement.lang = lang;
      document.title = C.game.name + ' · ' + t('howTo');
    });
  }

  // ---------- views ----------
  function bar(opts) {
    var back = opts.back !== undefined ? '<button class="bar__back" data-go="' + opts.back + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      esc(t(opts.backLabel || 'back')) + '</button>' : '<span></span>';
    return '<div class="bar">' + back + '<button class="lang-btn" data-act="lang" aria-label="' + esc(t('language')) + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>' +
      esc(state.lang.toUpperCase()) + '</button></div>';
  }
  function mtNote() { return C.game.reviewed ? '' : '<p class="note-mt">' + esc(t('machineNote')) + '</p>'; }

  // Sign-in gate. Signed out: confirm 18+, optional marketing, then Shopify's email-code login.
  // Signed in on a new device: the same confirmation, then play.
  function viewGate() {
    var chips = LANGS.map(function (l) { return '<button class="chip" data-setlang="' + l[0] + '" aria-pressed="' + (l[0] === state.lang) + '">' + esc(l[1]) + '</button>'; }).join('');
    var pend = store.get('pending', {});
    var foot = USER ? esc(t('signedInAs', { email: USER })) : esc(t('codeNote'));
    return '<main class="screen screen--red gate">' +
      '<div class="lockup"><span class="lockup__nude">Nude.</span><span class="lockup__stacked">STACKED</span></div>' +
      '<h1>' + esc(t('gateTitle')) + '</h1><p>' + esc(t('gateBody')) + (USER ? '' : ' ' + esc(t('gateLogin'))) + '</p>' +
      '<div class="gate__langs" role="group" aria-label="' + esc(t('language')) + '">' + chips + '</div>' +
      '<div class="ticks">' +
      '<label class="tick"><input type="checkbox" id="age"' + (pend.adult ? ' checked' : '') + '><span>' + esc(t('gateYes')) + '</span></label>' +
      '<label class="tick tick--soft"><input type="checkbox" id="optin"' + (pend.optin ? ' checked' : '') + '><span>' + esc(t('optin')) + '</span></label>' +
      '<p class="gate__err" id="err" role="alert"></p></div>' +
      '<div class="home__actions"><button class="btn btn--white" data-act="' + (USER ? 'confirm' : 'signin') + '">' + esc(t(USER ? 'startPlaying' : 'continueEmail')) + '</button>' +
      '<p class="gate__small">' + foot + ' <a href="' + esc(CFG.privacy) + '">' + esc(t('privacy')) + '</a></p>' +
      '<a class="linkbtn" href="' + esc(CFG.rulesUrl) + '">' + esc(t('rulesOnly')) + '</a></div></main>';
  }

  function ticks() {
    var age = document.getElementById('age'), optin = document.getElementById('optin');
    if (!age.checked) { document.getElementById('err').textContent = t('ageRequired'); age.focus(); return null; }
    return { adult: true, optin: !!(optin && optin.checked), at: new Date().toISOString() };
  }

  // Lead capture in Klaviyo (public client API). Marketing consent is separate and optional.
  function capture(p) {
    if (!CFG.klaviyo || !USER) return;
    var base = 'https://a.klaviyo.com/client/', q = '/?company_id=' + CFG.klaviyo;
    var h = { 'Content-Type': 'application/vnd.api+json', revision: '2025-01-15' };
    var prof = { type: 'profile', attributes: { email: USER } };
    function post(path, body) { return fetch(base + path + q, { method: 'POST', headers: h, body: JSON.stringify(body) }).catch(function () {}); }
    post('profiles', { data: { type: 'profile', attributes: { email: USER, properties: {
      nude_app_owner: true, nude_age_confirmed_at: p.at, nude_app_language: state.lang, nude_marketing_optin: p.optin } } } });
    post('events', { data: { type: 'event', attributes: { properties: { language: state.lang, marketing_optin: p.optin },
      metric: { data: { type: 'metric', attributes: { name: "Nude Stack'd app sign-in" } } }, profile: { data: prof } } } });
    if (p.optin && CFG.list) post('subscriptions', { data: { type: 'subscription', attributes: {
      custom_source: "Nude Stack'd app", profile: { data: { type: 'profile', attributes: { email: USER,
        subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } } } } } },
      relationships: { list: { data: { type: 'list', id: CFG.list } } } } });
  }
  function confirmed(p) {
    capture(p);
    state.adult = USER; store.set('adult', USER); store.set('pending', null);
  }

  function viewRulesHome() {
    return '<main class="screen screen--red home">' + bar({}) +
      '<div class="home__middle"><div class="lockup"><span class="lockup__nude">Nude.</span><span class="lockup__stacked">STACKED</span></div>' +
      '<p class="home__tag">' + esc(t('tagline')) + '</p><span class="badge18" aria-label="18+">18+</span></div>' +
      '<div><div class="home__actions"><button class="btn btn--white" data-go="how">' + esc(t('howTo')) + '</button>' +
      '<a class="btn btn--ghost" href="' + esc(CFG.shopUrl) + '">' + esc(t('getGame')) + '</a></div>' +
      '<div class="home__links"><button data-go="safety">' + esc(t('safety')) + '</button></div>' +
      '<p style="text-align:center;margin:6px 0 0"><a class="linkbtn" href="' + esc(CFG.gameUrl) + '">' + esc(t('ownIt')) + '</a></p></div></main>';
  }

  function viewHome() {
    if (MODE === 'rules') return viewRulesHome();
    return '<main class="screen screen--red home">' + bar({}) +
      '<div class="home__middle"><div class="lockup"><span class="lockup__nude">Nude.</span><span class="lockup__stacked">STACKED</span></div>' +
      '<p class="home__tag">' + esc(t('tagline')) + '</p><span class="badge18" aria-label="18+">18+</span></div>' +
      '<div><div class="home__actions"><button class="btn btn--white" data-go="play">' + esc(t('play')) + '</button>' +
      '<button class="btn btn--ghost" data-go="how">' + esc(t('howTo')) + '</button></div>' +
      '<div class="home__links"><button data-go="safety">' + esc(t('safety')) + '</button>' +
      '<a href="' + esc(CFG.logout) + '">' + esc(t('signOut')) + '</a></div>' +
      '<p class="xoxo">XOXO</p></div></main>';
  }

  function viewPick() {
    var tiles = C.categories.map(function (c) {
      var n = left(c.id);
      return '<button class="block' + (n ? '' : ' block--done') + '" data-cat="' + c.id + '">' + icon(c.icon) +
        '<span class="block__name">' + esc(c.name) + '</span><span class="block__left" aria-label="' + esc(t('cardsLeft', { n: n })) + '">' + n + '</span></button>';
    }).join('');
    return '<main class="screen screen--red pick">' + bar({ back: '', backLabel: 'home' }) +
      '<h1>' + esc(t('pickTitle')) + '</h1><p class="pick__hint">' + esc(t('pickHint')) + '</p>' +
      '<div class="blocks">' + tiles + '</div>' +
      '<div class="pick__foot"><button class="btn btn--ghost" data-act="pull">' + esc(t('pullForMe')) + '</button>' +
      '<button class="linkbtn" data-act="newgame">' + esc(t('newGame')) + '</button></div></main>';
  }

  function viewCard() {
    var cur = state.current, cd = cur && card(cur.id);
    if (!cd) { location.hash = '#/play'; return ''; }
    var c = cat(cd.category), names = t('levelNames');
    var lv = cd.levels.map(function (txt, i) {
      return '<li><button class="lvl' + (cur.level === i ? ' is-on' : '') + '" data-level="' + i + '" aria-pressed="' + (cur.level === i) + '">' +
        '<span class="lvl__label">' + esc(t('level')) + ' ' + (i + 1) + ' <span>· ' + esc(names[i] || '') + '</span></span>' +
        '<span class="lvl__text">' + esc(txt) + '</span></button></li>';
    }).join('');
    var flipped = !state.flipNext || reduced();
    return '<main class="screen screen--red deal">' + bar({ back: 'play', backLabel: 'back' }) +
      '<div class="stage"><div class="card' + (flipped ? ' is-flipped' : '') + '" id="card">' +
      '<div class="card__face card__front" aria-hidden="' + flipped + '">' + icon(c.icon) +
      '<div class="lockup"><span class="lockup__nude">Nude.</span><span class="lockup__stacked">STACKED</span></div><p class="xoxo">XOXO</p></div>' +
      '<div class="card__face card__back"><div class="card__head"><span class="stacked">STACKED</span><span class="card__cat">' + icon(c.icon) + esc(c.name) + '</span></div>' +
      '<p class="sr">' + esc(t('chooseLevel')) + '</p><ol class="levels' + (cur.level !== null && cur.level !== undefined ? ' has-pick' : '') + '">' + lv + '</ol>' +
      '<p class="card__foot">XOXO</p></div></div></div>' +
      '<div><div class="deal__actions"><button class="btn btn--ghost" data-act="skip">' + esc(t('skip')) + '</button>' +
      '<button class="btn btn--white" data-act="next">' + esc(t('nextTurn')) + '</button></div>' +
      '<p class="deal__note">' + esc(t('skipNote')) + '</p></div></main>';
  }

  function viewHow() {
    var cats = C.categories.map(function (c) { return '<li>' + icon(c.icon) + esc(c.name) + '</li>'; }).join('');
    var names = t('levelNames');
    var rules = C.rules.slice(0, -1).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('');
    return '<main class="screen screen--light read">' + bar({ back: '', backLabel: 'home' }) +
      '<h1>' + esc(t('rulesTitle')) + '</h1><p class="lead">' + esc(C.contents) + '</p>' +
      '<ol style="margin-top:16px">' + rules + '</ol>' +
      '<p class="skipbox">' + esc(C.rules[C.rules.length - 1]) + '</p>' +
      '<h2>' + esc(t('levelsTitle')) + '</h2><p>' + esc(t('levelsBody')) + '</p>' +
      '<div class="lvlrow"><div>1 · ' + esc(names[0]) + '</div><div>2 · ' + esc(names[1]) + '</div><div>3 · ' + esc(names[2]) + '</div></div>' +
      '<h2>' + esc(t('categoriesTitle')) + '</h2><ul class="catlist">' + cats + '</ul>' +
      '<p style="margin-top:22px;font-weight:600;color:var(--red)">' + esc(C.readyLine) + '</p>' +
      '<div class="cta">' + (MODE === 'rules'
        ? '<a class="btn btn--red" href="' + esc(CFG.shopUrl) + '">' + esc(t('getGame')) + '</a>'
        : '<button class="btn btn--red" data-go="play">' + esc(t('play')) + '</button>') +
      '<p style="text-align:center"><button class="linkbtn" data-go="safety">' + esc(t('safety')) + '</button></p></div>' + mtNote() + '</main>';
  }

  function list(items) { return '<ul>' + items.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>'; }
  function viewSafety() {
    var s = C.safety;
    return '<main class="screen screen--light read">' + bar({ back: '', backLabel: 'home' }) +
      '<h1>' + esc(t('safety')) + '</h1><p class="lead">' + esc(s.general[0]) + '</p>' +
      '<details open><summary>' + esc(t('activitiesTitle')) + '</summary>' + list(s.activities) + '</details>' +
      '<details><summary>' + esc(t('generalTitle')) + '</summary>' + list(s.general) + '</details>' +
      '<details><summary>' + esc(t('careTitle')) + '</summary>' + list(s.care) + '</details>' +
      '<details><summary>' + esc(t('productTitle')) + '</summary>' + list(C.product) + '</details>' +
      '<p style="font-size:13.5px;margin-top:18px">' + esc(t('leaflet')) + '</p>' + mtNote() + '</main>';
  }

  function sheet() {
    var here = location.pathname + location.search;
    var host = location.hostname.replace(/-/g, '--').replace(/\./g, '-') + '.translate.goog';
    var main = LANGS.map(function (l) { return '<li><button data-setlang="' + l[0] + '" aria-current="' + (l[0] === state.lang) + '">' + esc(l[1]) + (l[0] === state.lang ? '<span aria-hidden="true">✓</span>' : '') + '</button></li>'; }).join('');
    var other = OTHER.map(function (l) {
      var href = 'https://' + host + here + (here.indexOf('?') > -1 ? '&' : '?') + '_x_tr_sl=en&_x_tr_tl=' + l[0] + '&_x_tr_hl=' + l[0];
      return '<li><a href="' + esc(href) + '" rel="noopener">' + esc(l[1]) + '<span aria-hidden="true">↗</span></a></li>';
    }).join('');
    var wrap = document.createElement('div');
    wrap.className = 'sheet-wrap';
    wrap.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(t('language')) + '"><h2>' + esc(t('language')) + '</h2><ul>' + main + '</ul>' +
      '<h3>' + esc(t('otherLanguage')) + ' · Google Translate</h3><ul>' + other + '</ul></div>';
    wrap.addEventListener('click', function (e) { if (e.target === wrap) wrap.remove(); });
    document.body.appendChild(wrap);
    var first = wrap.querySelector('button'); if (first) first.focus();
  }

  function toast(msg) {
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2600);
  }

  // ---------- game ----------
  function deal(catId) {
    var pool = C.cards.filter(function (c) { return c.category === catId && !state.drawn[c.id]; });
    if (!pool.length) { toast(t('categoryDone')); return; }
    var c = rand(pool);
    state.drawn[c.id] = true; store.set('drawn', state.drawn);
    state.current = { id: c.id, level: null }; store.set('current', state.current);
    state.flipNext = true;
    if (location.hash === '#/card') render(); else location.hash = '#/card';
  }
  function surprise() {
    var open = C.categories.filter(function (c) { return left(c.id) > 0; });
    if (!open.length) { toast(t('categoryDone')); return; }
    deal(rand(open).id);
  }
  function pull() {
    // a virtual block for couples playing without the tower: any category that still has cards
    surprise();
  }

  // ---------- render ----------
  function route() { return (location.hash.replace(/^#\/?/, '') || '').split('/')[0]; }
  function render() {
    if (!C) return;
    var r = route(), html, open = MODE === 'rules' || (USER && state.adult === USER);
    if (MODE === 'rules' && (r === 'play' || r === 'card')) r = '';
    if (!open) html = viewGate();
    else if (r === 'play') html = viewPick();
    else if (r === 'card') html = viewCard();
    else if (r === 'how') html = viewHow();
    else if (r === 'safety') html = viewSafety();
    else html = viewHome();
    var light = open && (r === 'how' || r === 'safety');
    document.body.classList.toggle('is-light', light);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', light ? '#FFFFFF' : '#DD1D3E');
    app.innerHTML = html;
    if (r === 'card' && state.flipNext && !reduced()) {
      state.flipNext = false;
      var el = document.getElementById('card');
      setTimeout(function () { if (el) { el.classList.add('is-flipped'); el.querySelector('.card__front').setAttribute('aria-hidden', 'true'); } }, 650);
    }
    var h = app.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); }
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go],[data-act],[data-cat],[data-level],[data-setlang]');
    if (!b) return;
    if (b.hasAttribute('data-go')) { location.hash = '#/' + b.getAttribute('data-go'); return; }
    if (b.hasAttribute('data-cat')) { deal(b.getAttribute('data-cat')); return; }
    if (b.hasAttribute('data-setlang')) {
      var lang = b.getAttribute('data-setlang'), sh = document.querySelector('.sheet-wrap'), ag = document.getElementById('age');
      if (ag) store.set('pending', { adult: ag.checked, optin: document.getElementById('optin').checked, at: new Date().toISOString() });
      setLang(lang).then(function () { if (sh) sh.remove(); render(); });
      return;
    }
    if (b.hasAttribute('data-level')) {
      var i = +b.getAttribute('data-level');
      state.current.level = state.current.level === i ? null : i; store.set('current', state.current);
      var ol = app.querySelector('.levels');
      ol.classList.toggle('has-pick', state.current.level !== null);
      ol.querySelectorAll('.lvl').forEach(function (x, k) { x.classList.toggle('is-on', k === state.current.level); x.setAttribute('aria-pressed', k === state.current.level); });
      return;
    }
    var a = b.getAttribute('data-act');
    if (a === 'signin') {
      var p = ticks(); if (!p) return;
      store.set('pending', p);
      location.href = CFG.login;
    }
    else if (a === 'confirm') { var q = ticks(); if (!q) return; confirmed(q); render(); }
    else if (a === 'lang') sheet();
    else if (a === 'pull') pull();
    else if (a === 'skip') { var cd = card(state.current.id); deal(cd.category); }
    else if (a === 'next') { location.hash = '#/play'; }
    else if (a === 'newgame') { state.drawn = {}; store.set('drawn', {}); state.current = null; store.set('current', null); render(); toast(t('newGameDone')); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var s = document.querySelector('.sheet-wrap'); if (s) s.remove(); } });
  window.addEventListener('hashchange', render);

  // ---------- boot ----------
  fetch(CFG.icons).then(function (r) { return r.text(); }).then(function (svg) {
    var d = document.createElement('div'); d.innerHTML = svg; document.body.insertBefore(d.firstElementChild, document.body.firstChild);
  }).catch(function () { /* icons are decoration; the app still works */ });
  setLang(state.lang || guessLang()).then(function () {
    // back from the email-code login with the 18+ box already ticked: record it once and go straight in
    var pend = store.get('pending', null);
    if (MODE === 'game' && USER && pend && pend.adult && state.adult !== USER) confirmed(pend);
    render();
  }).catch(function () {
    app.innerHTML = '<main class="screen screen--red gate"><h1>Nude.</h1><p>The game could not load. Check your connection and refresh the page.</p></main>';
  });
})();
