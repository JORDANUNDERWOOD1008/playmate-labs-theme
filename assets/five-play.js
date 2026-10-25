/* The Sense Lab: the 5 Day Experience as one mini-game a day.
   Three versions (solo = For me, met = Just met, duo = With someone), five days each:
   sight, sound, taste, touch, sixth sense. Links from the emails: /pages/5-day-play?m=duo&d=2
   Progress lives in localStorage on this device. Klaviyo events fire when klaviyo.js knows who
   this is (the email link's _kx), otherwise nothing is sent. Shared links carry their data in
   the #hash, so nothing leaves the phone except what people choose to send each other. */
(() => {
  const CFG = window.PM5 || {};
  const app = document.getElementById('app');
  if (!app) return;

  /* ── storage ─────────────────────────────────────────────── */
  const KEY = 'pm5:v1';
  let S = {};
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { S = {}; }
  S.done = S.done || {}; S.data = S.data || {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };
  const put = (k, v) => { S.data[k] = v; save(); };
  const got = k => S.data[k];

  /* ── tiny helpers ────────────────────────────────────────── */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const b64e = o => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = s => { try { s = s.replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)))); } catch (_) { return null; } };
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
  function chime() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [660, 880].forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        const t = ac.currentTime + i * 0.18;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.start(t); o.stop(t + 0.55);
      });
    } catch (_) {}
  }
  function toast(msg) {
    let t = document.querySelector('.p5-toast');
    if (!t) { t = document.createElement('div'); t.className = 'p5-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200);
  }
  async function share(text, url) {
    const full = url ? `${text}\n${url}` : text;
    if (navigator.share) { try { await navigator.share(url ? {text, url} : {text}); return true; } catch (e) { if (e && e.name === 'AbortError') return false; } }
    try { await navigator.clipboard.writeText(full); toast('Copied. Paste it into your chat.'); return true; } catch (_) {}
    prompt('Copy this:', full); return true;
  }
  const names = () => S.names || ['you', 'them'];

  /* dates for the calendar */
  const DAYS_OUT = [['tonight', 0], ['tomorrow', 1], ['fri', 'F'], ['sat', 'S'], ['sun', 'U'], ['next week', 7]];
  const TIMES = [['lunch', '12:30'], ['after work', '18:30'], ['evening', '20:00']];
  function whenDate(day, time) {
    const d = new Date(), wd = {F: 5, S: 6, U: 0};
    const o = (DAYS_OUT.find(x => x[0] === day) || DAYS_OUT[0])[1];
    if (typeof o === 'number') d.setDate(d.getDate() + o);
    else { const diff = (wd[o] - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + diff); }
    const [h, m] = ((TIMES.find(x => x[0] === time) || TIMES[2])[1]).split(':').map(Number);
    d.setHours(h, m, 0, 0); return d;
  }
  function ics(title, start, mins, desc) {
    const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const end = new Date(start.getTime() + (mins || 90) * 60000);
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Playmate Labs//Sense Lab//EN', 'BEGIN:VEVENT',
      `UID:${Date.now()}@playmatelabs.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
      `SUMMARY:${title.replace(/[,;]/g, '\\$&')}`, `DESCRIPTION:${(desc || 'Booked in the Sense Lab.').replace(/[,;]/g, '\\$&')}`,
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], {type: 'text/calendar'}));
    a.download = 'playmate-plan.ics'; document.body.appendChild(a); a.click(); a.remove();
    toast('Opening your calendar.');
  }

  /* ── tracking ────────────────────────────────────────────── */
  function track(name, props) {
    try { window.dataLayer && window.dataLayer.push({event: 'pm5_' + name.toLowerCase().replace(/\W+/g, '_'), ...props}); } catch (_) {}
    try { if (window.klaviyo && window.klaviyo.push) window.klaviyo.push(['track', name, props]); } catch (_) {}
  }
  function identify(props) { try { if (window.klaviyo && window.klaviyo.push) window.klaviyo.push(['identify', props]); } catch (_) {} }

  /* ── content: the three versions ─────────────────────────── */
  const SENSES = ['sight', 'sound', 'taste', 'touch', 'sixth sense'];
  const ORD = ['one', 'two', 'three', 'four', 'five'];
  const MODES = {
    solo: {label: 'for me', line: 'single, dating, or happily unavailable.', intro: 'Five evenings of dating yourself first. One sense a night, ten minutes, all on your phone.'},
    met: {label: 'just met', line: 'a few dates in, or still deciding.', intro: 'Five tiny rounds that work by text or in person. Only you need to be signed up.'},
    duo: {label: 'with someone', line: 'you and someone you like.', intro: 'Five evenings, one sense a night, ten minutes. One phone, passed between you.'}
  };
  const DAYS = {
    solo: [
      {h: 'look. honestly.', after: '(at yourself, for once)', game: 'type check', how: 'Tap three things that catch your eye, then three green flags. The overlap is your real type.', take: 'a type that actually makes sense', run: soloSight},
      {h: 'turn it up.', after: '(dancing in the kitchen counts)', game: 'the soundtrack', how: 'Three songs for three moments, a dramatic name, then ten minutes with the lights low. No skips.', take: 'your own soundtrack', run: soloSound},
      {h: 'treat yourself.', after: '(solo dining is a power move)', game: 'table for one', how: 'Pick a place you keep scrolling past, put it in the diary, then rate a cupboard mystery out of ten.', take: 'a table for one in the diary', run: soloTaste},
      {h: 'reach out.', after: '(every card is optional. that\'s sort of the point.)', game: 'three cards', how: 'Pick a number before you look. Each card is one small move. A friend counts, and so does just you.', take: 'something in the diary', run: soloTouch},
      {h: 'trust your gut.', after: '(it\'s been right all week)', game: 'the good bit', how: 'Pick your favourite night, check your day-one type, and book the good bit again.', take: 'a clearer idea of what you want', run: soloSixth}
    ],
    met: [
      {h: 'what did you see?', after: '(be honest, be kind)', game: 'first impressions', how: 'Build two sentences: what you noticed first, and what surprised you after. Count down, then trade them.', take: 'your how-we-met story', run: metSight},
      {h: 'this or that.', after: '(say it with your chest)', game: 'a minor disagreement', how: 'Five tiny debates. Answer, send them the link, and see where you disagree. Nobody\'s keeping score.', take: 'five easy conversation starters', run: metSound},
      {h: 'try this.', after: '(trust me)', game: 'the recommendation', how: 'Recommend one thing to eat or drink, say why it\'s for them, and send it as a ticket.', take: 'something specific to reply to', run: metTaste},
      {h: 'pick a card.', after: '(every card is optional. that\'s sort of the point.)', game: 'three hidden cards', how: 'Tell them your number, then flip. One card comes with a twenty-second timer.', take: 'a new story, or a reason to meet again', run: metTouch},
      {h: 'your gut says…', after: '(listen to it)', game: 'round two', how: 'Check in with yourself. If it\'s a yes, send two date options and let them pick. If not, say it kindly.', take: 'a clear next step, if it\'s mutual', run: metSixth}
    ],
    duo: [
      {h: 'look. closer.', after: '(longer than is comfortable)', game: 'sixty seconds', how: 'Sixty seconds of eye contact, one thank-you each, then swap a secret on the phone. No peeking.', take: 'a photo they haven\'t seen yet', run: duoSight},
      {h: 'say it. louder.', after: '(the verdict is final)', game: 'the courtroom', how: 'Answer four small disputes in secret, then hear the verdicts. Then build a three-song playlist.', take: 'a playlist that sounds like you two', run: duoSound},
      {h: 'feed. me.', after: '(blindfold optional, encouraged)', game: 'blind taste test', how: 'Three bites each. One of you feeds, the other guesses with their eyes closed. Best guesser picks tomorrow\'s card.', take: 'a new "our" food', run: duoTaste},
      {h: 'hands. only.', after: '(every card is optional. that\'s sort of the point.)', game: 'pick a card', how: 'Last night\'s best guesser picks a number. Pass on anything, no explanation needed.', take: 'the word they traced (keep it)', run: duoTouch},
      {h: 'read my mind.', after: '(then book the table)', game: 'mind reader', how: 'Predict each other\'s perfect date, score the details you nailed, and book the winner. Tonight.', take: 'a date in the diary', run: duoSixth}
    ]
  };
  const ICONS = {
    sight: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    sound: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    taste: '<path d="M12 3c-3 4-6 6-6 10a6 6 0 0 0 12 0c0-4-3-6-6-10z"/>',
    touch: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1V4.5a1.5 1.5 0 0 1 3 0V12m0-6.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3 15a1.6 1.6 0 0 1 2.6-1.9L8 15"/>',
    'sixth sense': '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="2.5"/>'
  };
  const icon = s => `<svg class="p5-ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[s]}</svg>`;

  /* ── routing ─────────────────────────────────────────────── */
  const q = new URLSearchParams(location.search);
  let MODE = MODES[q.get('m')] ? q.get('m') : (MODES[S.mode] ? S.mode : null);
  let DAY = Math.min(5, Math.max(0, parseInt(q.get('d'), 10) || 0));
  let SHARED = location.hash.startsWith('#s=') ? b64d(location.hash.slice(3)) : null;
  if (MODE && q.get('m')) { S.mode = MODE; save(); }

  function go(mode, day) {
    MODE = mode; DAY = day || 0;
    if (mode) { S.mode = mode; save(); }
    const u = new URL(location.href);
    u.hash = '';
    mode ? u.searchParams.set('m', mode) : u.searchParams.delete('m');
    day ? u.searchParams.set('d', day) : u.searchParams.delete('d');
    history.pushState(null, '', u.pathname + u.search);
    render();
    scrollTo({top: 0, behavior: reduced ? 'auto' : 'smooth'});
  }
  addEventListener('popstate', () => {
    const p = new URLSearchParams(location.search);
    MODE = MODES[p.get('m')] ? p.get('m') : null; DAY = parseInt(p.get('d'), 10) || 0; render();
  });

  function render() {
    if (SHARED && SHARED.t) return renderShared(SHARED);
    if (!MODE) return renderPicker();
    if (!DAY) return renderHub();
    renderDay();
  }

  function renderPicker() {
    app.innerHTML = `<section class="p5-wrap p5-pick">
      <p class="p5-hand p5-tilt">the sense lab.</p>
      <h1 class="p5-h1">who's playing?</h1>
      <p class="p5-lede">Five days, five senses, one small game a night. Pick your version.</p>
      <div class="p5-modes">${Object.entries(MODES).map(([k, m]) => `
        <button type="button" class="p5-mode" data-mode="${k}"><span class="p5-mode-t">${m.label}.</span><span class="p5-mode-l">${m.line}</span></button>`).join('')}</div>
    </section>`;
    app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => go(b.dataset.mode, 0));
  }

  function renderHub() {
    const m = MODES[MODE], list = DAYS[MODE];
    app.innerHTML = `<section class="p5-wrap">
      <p class="p5-hand p5-tilt">the sense lab, ${m.label}.</p>
      <h1 class="p5-h1">five nights. five senses.</h1>
      <p class="p5-lede">${m.intro}</p>
      <ol class="p5-days">${list.map((d, i) => {
        const done = S.done[`${MODE}-${i + 1}`];
        return `<li><button type="button" class="p5-day${done ? ' is-done' : ''}" data-day="${i + 1}">
          <span class="p5-day-n">${icon(SENSES[i])}</span>
          <span class="p5-day-b"><span class="p5-day-k">day ${ORD[i]}: ${SENSES[i]}</span><span class="p5-day-t">${esc(d.h)}</span><span class="p5-day-g">${esc(d.game)}</span></span>
          <span class="p5-day-s" aria-label="${done ? 'played' : 'not played yet'}">${done ? '✓' : '→'}</span></button></li>`;
      }).join('')}</ol>
      <p class="p5-switch">Wrong version? ${Object.keys(MODES).filter(k => k !== MODE).map(k => `<button type="button" class="p5-link" data-mode="${k}">${MODES[k].label}</button>`).join(' or ')}</p>
    </section>`;
    app.querySelectorAll('[data-day]').forEach(b => b.onclick = () => go(MODE, +b.dataset.day));
    app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => go(b.dataset.mode, 0));
  }

  /* ── the day screen + game stage ─────────────────────────── */
  let G, ACT = {}, CH = {};
  function renderDay() {
    const d = DAYS[MODE][DAY - 1], key = `${MODE}-${DAY}`;
    app.innerHTML = `<section class="p5-wrap">
      <nav class="p5-crumbs"><button type="button" class="p5-link" data-hub>← the five days</button><span>${DAY} / 5</span></nav>
      <header class="p5-head">
        <p class="p5-hand p5-tilt">day ${ORD[DAY - 1]}: ${SENSES[DAY - 1]}</p>
        <h1 class="p5-h1">${esc(d.h)}</h1>
        <p class="p5-after">${esc(d.after)}</p>
        <div class="p5-how"><span class="p5-tag">${icon(SENSES[DAY - 1])} ${esc(d.game)} · 10 min</span><p>${esc(d.how)}</p></div>
      </header>
      <div class="p5-stage" id="p5-stage" aria-live="polite"></div>
    </section>`;
    app.querySelector('[data-hub]').onclick = () => go(MODE, 0);
    G = document.getElementById('p5-stage');
    G.addEventListener('click', onClick);
    G.addEventListener('input', e => { const f = ACT['in:' + e.target.name]; if (f) f(e.target.value, e.target); });
    CH = {};
    if (!S.started?.[key]) { S.started = S.started || {}; S.started[key] = Date.now(); save(); track('5 Day Game Started', {mode: MODE, day: DAY, game: d.game}); }
    d.run();
  }
  function onClick(e) {
    const c = e.target.closest('[data-chip]');
    if (c && G.contains(c)) {
      const g = c.dataset.g, v = c.dataset.chip, max = +c.dataset.max || 1;
      const set = CH[g] = CH[g] || [];
      const i = set.indexOf(v);
      if (i > -1) set.splice(i, 1);
      else { if (set.length >= max) { if (max === 1) set.length = 0; else { c.animate && !reduced && c.animate([{transform: 'translateX(-4px)'}, {transform: 'translateX(4px)'}, {transform: 'none'}], 220); return; } } set.push(v); }
      G.querySelectorAll(`[data-g="${CSS.escape(g)}"]`).forEach(b => b.setAttribute('aria-pressed', String(set.includes(b.dataset.chip))));
      const f = ACT['chip:' + g]; if (f) f(set.slice(), c);
      return;
    }
    const b = e.target.closest('[data-act]');
    if (b && G.contains(b) && ACT[b.dataset.act]) ACT[b.dataset.act](b, e);
  }
  function show(html, acts) {
    stopTimers();
    G.innerHTML = html; ACT = acts || {};
    if (!reduced) G.firstElementChild?.classList.add('p5-in');
    const f = G.querySelector('[data-focus]'); if (f) f.focus({preventScroll: true});
  }
  const chips = (g, list, max = 1, sel = []) => `<div class="p5-chips" role="group">${list.map(v => `<button type="button" class="p5-chip" data-g="${esc(g)}" data-chip="${esc(v)}" data-max="${max}" aria-pressed="${sel.includes(v)}">${esc(v)}</button>`).join('')}</div>`;
  const step = (n, of, t) => `<p class="p5-step">${n ? `<span>${n}/${of}</span>` : ''}${esc(t)}</p>`;
  const btn = (act, label, cls = '') => `<button type="button" class="p5-btn ${cls}" data-act="${act}">${label}</button>`;
  const enable = (act, on) => { const b = G.querySelector(`[data-act="${act}"]`); if (b) b.disabled = !on; };

  /* pass the phone */
  function pass(to, next, note) {
    show(`<div class="p5-pass"><p class="p5-hand">pass the phone</p><p class="p5-pass-to">to ${esc(to)}.</p><p class="p5-muted">${esc(note || 'No peeking. We\'ll know.')}</p>${btn('go', `I'm ${esc(to)}`)}</div>`, {go: next});
  }

  /* timers: a ring that counts down */
  let TIMERS = [];
  function stopTimers() { TIMERS.forEach(t => cancelAnimationFrame(t.raf)); TIMERS = []; }
  const fmt2 = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  function timerHTML(secs, label, cls = '') {
    return `<div class="p5-timer ${cls}" data-timer><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="tr"/><circle cx="60" cy="60" r="52" class="tp" pathLength="100"/></svg>
      <div class="p5-timer-c"><span class="p5-timer-n">${fmt2(secs)}</span><span class="p5-timer-l">${esc(label || '')}</span></div></div>`;
  }
  function runTimer(secs, onDone, onTick) {
    const box = G.querySelector('[data-timer]'); if (!box) return;
    const n = box.querySelector('.p5-timer-n'), p = box.querySelector('.tp');
    const t = {start: performance.now(), raf: 0};
    box.classList.add('is-on');
    const tick = () => { const now = performance.now();
      const left = secs - (now - t.start) / 1000;
      n.textContent = fmt2(left);
      p.style.strokeDashoffset = String(100 - Math.max(0, left / secs) * 100);
      if (onTick) onTick(left);
      if (left <= 0) { box.classList.remove('is-on'); box.classList.add('is-done'); buzz([120, 80, 120]); chime(); onDone && onDone(); return; }
      t.raf = requestAnimationFrame(tick);
    };
    t.raf = requestAnimationFrame(tick); TIMERS.push(t);
  }

  /* three face-down cards */
  function cardsHTML(cards, label) {
    return `<div class="p5-cards" role="group" aria-label="${esc(label || 'three cards')}">${cards.map((c, i) => `
      <button type="button" class="p5-card" data-act="flip" data-i="${i}" aria-label="card ${i + 1}">
        <span class="p5-card-in"><span class="p5-card-f"><span class="p5-card-n">${i + 1}</span></span>
        <span class="p5-card-b"><span class="p5-card-k">${esc(c.k)}</span><span class="p5-card-t">${esc(c.t)}</span></span></span></button>`).join('')}</div>`;
  }
  function flip(b) { b.classList.add('is-flipped'); b.setAttribute('aria-label', b.querySelector('.p5-card-t').textContent); buzz(15); }

  /* finishing a day */
  function finish(extra, acts) {
    const d = DAYS[MODE][DAY - 1], key = `${MODE}-${DAY}`;
    const first = !S.done[key];
    S.done[key] = Date.now(); save();
    if (first) {
      track('5 Day Game Completed', {mode: MODE, day: DAY, game: d.game});
      identify({five_day_last_day: DAY, five_day_mode: MODE, five_day_completed_count: Object.keys(S.done).filter(k => k.startsWith(MODE)).length});
    }
    const last = DAY === 5;
    const next = !last ? `<p class="p5-hand p5-tilt">see you tomorrow.</p><p class="p5-muted">Same time, new sense. Tomorrow's email has the next game.</p>
      ${btn('hub', 'back to the five days', 'p5-ghost')}` :
      `<p class="p5-hand p5-tilt">that's the lab closed.</p><p class="p5-muted">Keep the good bits.</p>${products()}${btn('hub', 'back to the five days', 'p5-ghost')}`;
    show(`<div class="p5-done">
      <div class="p5-stamp" aria-hidden="true">done.</div>
      <p class="p5-take"><span>you'll leave with:</span> ${esc(d.take)}</p>
      ${extra || ''}
      ${next}
    </div>`, Object.assign({hub: () => go(MODE, 0)}, acts));
    burst();
  }
  function burst() {
    if (reduced) return;
    const layer = document.createElement('div'); layer.className = 'p5-burst'; layer.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('span');
      s.textContent = i % 3 ? '♥' : '✦';
      s.style.setProperty('--x', `${(Math.random() - 0.5) * 320}px`);
      s.style.setProperty('--y', `${-120 - Math.random() * 260}px`);
      s.style.setProperty('--r', `${(Math.random() - 0.5) * 120}deg`);
      s.style.animationDelay = `${Math.random() * 120}ms`;
      layer.appendChild(s);
    }
    document.body.appendChild(layer); setTimeout(() => layer.remove(), 1600);
  }
  function products(only) {
    const P = (CFG.products || []).filter(p => !only || p.handle === only);
    if (!P.length) return '';
    const utm = `utm_source=klaviyo&utm_medium=email&utm_campaign=5-day-experience&utm_content=${MODE}-d${DAY}-game`;
    return `<div class="p5-prods">${P.map(p => `<a class="p5-prod" href="${esc(p.url)}?${utm}">
      ${p.image ? `<img src="${esc(p.image)}" alt="" width="160" height="160" loading="lazy">` : ''}
      <span><span class="p5-prod-t">${esc(p.title)}</span><span class="p5-prod-l">${esc(p.line || '')}</span><span class="p5-prod-p">${esc(p.price || '')}</span></span></a>`).join('')}</div>`;
  }
  const nudge = (handle, line) => `<div class="p5-nudge"><p class="p5-muted">${esc(line)}</p>${products(handle)}</div>`;

  /* reusable: when + calendar */
  function whenHTML(g) {
    return `<div class="p5-when"><p class="p5-label">when?</p>${chips(g + '-d', DAYS_OUT.map(x => x[0]))}<p class="p5-label">what time?</p>${chips(g + '-t', TIMES.map(x => x[0]))}</div>`;
  }
  const whenOf = g => (CH[g + '-d'] || [])[0] && (CH[g + '-t'] || [])[0] ? whenDate(CH[g + '-d'][0], CH[g + '-t'][0]) : null;
  const whenLabel = g => `${(CH[g + '-d'] || [])[0] || ''}, ${(CH[g + '-t'] || [])[0] || ''}`;

  /* ═══════════ FOR ME ═══════════ */
  const TYPE_POOL = ['great smile', 'tall', 'well dressed', 'nice voice', 'the eyes', 'tattoos', 'funny', 'confident', 'kind', 'a bit mysterious', 'a bit chaotic', 'good listener', 'makes plans', 'curious', 'adventurous', 'great taste in music', 'sporty', 'clever'];
  function soloSight() {
    const pool = shuffle(TYPE_POOL);
    const r1 = () => show(`<div>${step(1, 3, 'What catches your eye? Tap three. Be shallow, it\'s fine.')}${chips('eye', pool, 3)}<div class="p5-row">${btn('next', 'next: green flags')}</div></div>`,
      {'chip:eye': s => enable('next', s.length === 3), next: () => { put('solo-type-eye', CH.eye.slice()); r2(); }});
    const r2 = () => show(`<div>${step(2, 3, 'Now three green flags: what makes time with someone genuinely good?')}${chips('green', shuffle(TYPE_POOL), 3)}<div class="p5-row">${btn('next', 'show me my type')}</div></div>`,
      {'chip:green': s => enable('next', s.length === 3), next: () => { put('solo-type-green', CH.green.slice()); reveal(); }});
    const reveal = () => {
      const a = got('solo-type-eye'), b = got('solo-type-green'), both = a.filter(x => b.includes(x));
      const verdict = both.length === 3 ? 'Your type is your good time. Rare. Keep it.' : both.length ? 'Some overlap. That bit is your real type. The rest is noise.' : 'Your type and your good time have never met. Interesting. Very interesting.';
      put('solo-type', both);
      show(`<div>${step(3, 3, 'Your results')}
        <div class="p5-venn"><div class="p5-venn-c a"><p class="p5-label">catches your eye</p>${a.map(x => `<span class="${both.includes(x) ? 'hit' : ''}">${esc(x)}</span>`).join('')}</div>
        <div class="p5-venn-c b"><p class="p5-label">green flags</p>${b.map(x => `<span class="${both.includes(x) ? 'hit' : ''}">${esc(x)}</span>`).join('')}</div></div>
        <p class="p5-verdict">${esc(verdict)}</p>
        <div class="p5-box"><p class="p5-label">last thing: one thing you're proud of</p><p class="p5-muted">Something you did, not something you look like. Type it, then say it out loud. Nobody's listening. Probably.</p>
        <textarea name="proud" rows="2" placeholder="I'm proud that I…"></textarea></div>
        <div class="p5-row">${btn('fin', 'said it out loud')}</div><p class="p5-muted p5-small">Nothing here leaves your phone. Screenshot it: you'll want it on day five.</p></div>`,
        {'in:proud': v => enable('fin', v.trim().length > 2), fin: () => { put('solo-proud', G.querySelector('[name=proud]').value.trim()); finish(); }});
      enable('fin', false);
    };
    r1(); enable('next', false);
  }

  const PLAYLIST_NAMES = ['Main Character, Season Two', 'Soft Launch', 'Kitchen Disco (Live)', 'Unbothered (Deluxe)', 'Romanticising Tuesday', 'Lights Low, Standards High', 'Me, Myself and the Aux', 'Plot Twist: I\'m Fine', 'Sunday Best', 'The Comeback Tour'];
  function soloSound() {
    const slots = [['sun', 'sunday mornings'], ['ready', 'getting ready'], ['late', '1am']];
    const songs = got('solo-songs') || {};
    const s1 = () => {
      show(`<div>${step(1, 3, 'Three songs, three moments. The life you\'d want someone to walk into.')}
        ${slots.map(([k, l]) => `<label class="p5-field"><span class="p5-label">${l}</span><input name="${k}" value="${esc(songs[k] || '')}" placeholder="song, artist" autocomplete="off"></label>`).join('')}
        <div class="p5-row">${btn('next', 'next: name it')}</div></div>`,
        Object.assign({next: () => { slots.forEach(([k]) => songs[k] = G.querySelector(`[name=${k}]`).value.trim()); put('solo-songs', songs); s2(); }},
          ...slots.map(([k]) => ({['in:' + k]: () => enable('next', slots.every(([j]) => G.querySelector(`[name=${j}]`).value.trim()))}))));
      enable('next', slots.every(([k]) => songs[k]));
    };
    const s2 = () => {
      show(`<div>${step(2, 3, 'Name the playlist. Make it dramatic.')}
        <label class="p5-field"><input name="pname" value="${esc(got('solo-pname') || '')}" placeholder="Main Character, Season Two" autocomplete="off"></label>
        <div class="p5-row">${btn('gen', 'too much pressure. you name it.', 'p5-ghost')}${btn('next', 'next: lights low')}</div></div>`,
        {gen: () => { const i = G.querySelector('[name=pname]'); i.value = pick(PLAYLIST_NAMES.filter(n => n !== i.value)); enable('next', true); },
          'in:pname': v => enable('next', v.trim().length > 0),
          next: () => { put('solo-pname', G.querySelector('[name=pname]').value.trim()); s3(); }});
      enable('next', !!got('solo-pname'));
    };
    const s3 = () => {
      const name = got('solo-pname');
      show(`<div class="p5-center">${step(3, 3, 'Pour something good. Lights low. Play it through. No skipping, no scrolling.')}
        <div class="p5-vinyl" data-vinyl><div class="p5-vinyl-l"><span>${esc(name)}</span></div></div>
        <ol class="p5-tracks">${slots.map(([k, l]) => `<li><span>${esc(songs[k])}</span><a class="p5-link" target="_blank" rel="noopener" href="https://open.spotify.com/search/${encodeURIComponent(songs[k])}">play ↗</a></li>`).join('')}</ol>
        ${timerHTML(600, 'no skips')}
        <div class="p5-row">${btn('go', 'start the ten minutes')}${btn('skip', 'done already', 'p5-ghost')}</div></div>`,
        {go: b => { b.disabled = true; G.querySelector('[data-vinyl]').classList.add('spin'); runTimer(600, () => after()); },
          skip: () => after()});
    };
    const after = () => finish(`<div class="p5-box"><p class="p5-label">bonus round</p><p>Send one song to a friend with zero context. See who replies first.</p>
      <div class="p5-row">${btn('send', 'send a song', 'p5-ghost')}</div></div>`, {send: () => share(`🎧 ${songs.late || songs.sun}`)});
    s1();
  }

  const PLACES = ['the café you keep walking past', 'the bakery with the queue', 'a wine bar', 'the market', 'the ramen place', 'a gallery café', 'a pub with a fire', 'the dessert place'];
  const WHEEL = ['that café', 'the bakery', 'wine bar', 'the market', 'ramen', 'gallery café', 'cosy pub', 'dessert'];
  function soloTaste() {
    let place = got('solo-place') || '';
    const s1 = () => {
      show(`<div>${step(1, 3, 'Pick the place: somewhere saved and never tried, within twenty minutes.')}
        <label class="p5-field"><input name="place" value="${esc(place)}" placeholder="name of the place" autocomplete="off"></label>
        <div class="p5-wheel-wrap"><div class="p5-wheel" data-wheel>${WHEEL.map((p, i) => `<span style="--i:${i}">${esc(p)}</span>`).join('')}</div><div class="p5-wheel-pin" aria-hidden="true"></div></div>
        <div class="p5-row">${btn('spin', 'no idea? spin for it', 'p5-ghost')}${btn('next', 'next: the diary')}</div></div>`,
        {'in:place': v => { place = v; enable('next', v.trim().length > 1); },
          spin: b => {
            b.disabled = true;
            const i = Math.floor(Math.random() * PLACES.length), w = G.querySelector('[data-wheel]');
            const turns = 4 * 360 + (360 - i * 45) - 22.5 + (Math.random() * 30 - 15);
            w.style.transition = reduced ? 'none' : 'transform 2.6s cubic-bezier(.17,.67,.2,1)';
            w.style.transform = `rotate(${turns}deg)`;
            setTimeout(() => { const inp = G.querySelector('[name=place]'); inp.value = place = PLACES[i]; enable('next', true); b.disabled = false; toast(`The wheel says: ${PLACES[i]}.`); w.style.transition = 'none'; w.style.transform = `rotate(${turns % 360}deg)`; }, reduced ? 50 : 2700);
          },
          next: () => { put('solo-place', place.trim()); s2(); }});
      enable('next', place.trim().length > 1);
    };
    const s2 = () => {
      show(`<div>${step(2, 3, `Put ${place} in the diary. A real day and time. Table for one.`)}${whenHTML('tb')}
        <div class="p5-row">${btn('cal', 'add to my calendar')}${btn('next', 'next: tonight\'s taste test', 'p5-ghost')}</div></div>`,
        {'chip:tb-d': () => enable('cal', !!whenOf('tb')), 'chip:tb-t': () => enable('cal', !!whenOf('tb')),
          cal: () => { ics(`Table for one: ${place}`, whenOf('tb'), 90, 'Order what you\'d never normally choose. Phone in your bag. Watch the room.'); put('solo-booked', whenLabel('tb')); },
          next: s3});
      enable('cal', false);
    };
    const REACT = ['never again.', 'no.', 'confusing.', 'hmm.', 'fine, actually.', 'it\'s growing on me.', 'okay, who knew.', 'surprisingly good.', 'new favourite?', 'why have I been ignoring this?', 'life-changing.'];
    const s3 = () => {
      show(`<div>${step(3, 3, 'Tonight\'s taste test: something in the cupboard you never eat. Try it. Rate it.')}
        <label class="p5-field"><input name="thing" placeholder="the mystery item" autocomplete="off"></label>
        <div class="p5-rate"><input type="range" name="rate" min="0" max="10" value="5" aria-label="your rating out of ten"><p class="p5-rate-n"><b>5</b>/10 <span>${REACT[5]}</span></p></div>
        <div class="p5-box"><p class="p5-label">when you go: the wildcard</p><p>Order the thing you'd never normally choose. Ask whoever's serving what they'd order. Then rate it: taste, vibe, would-you-bring-a-date-here.</p></div>
        <div class="p5-row">${btn('fin', 'rated. done.')}</div></div>`,
        {'in:rate': v => { G.querySelector('.p5-rate-n').innerHTML = `<b>${v}</b>/10 <span>${REACT[v]}</span>`; },
          'in:thing': v => enable('fin', v.trim().length > 1),
          fin: () => { put('solo-taste', {thing: G.querySelector('[name=thing]').value.trim(), rate: +G.querySelector('[name=rate]').value}); finish(); }});
      enable('fin', false);
    };
    s1();
  }

  function soloTouch() {
    const cards = [
      {k: 'mild', t: 'Text someone you\'ve lost touch with. A specific memory, no "hey stranger".'},
      {k: 'warm', t: 'Invite a friend to something real: a gig, a walk, a class. Name a day.'},
      {k: 'spicy', t: 'Book the thing you\'ve been waiting for company to do. Go alone.'}
    ];
    show(`<div>${step(0, 0, 'Pick a number. Commit before you look.')}${cardsHTML(cards)}<div data-after></div>
      <p class="p5-muted p5-center p5-small">Can't choose? Do all three. Very main character of you.</p></div>`, {
      flip: b => {
        flip(b); const c = cards[+b.dataset.i], box = G.querySelector('[data-after]');
        const tools = {
          mild: `<div class="p5-box"><p class="p5-label">your text</p>${chips('mem', ['that night out', 'that terrible holiday', 'the song you always played', 'our old job', 'that one teacher'])}
            <textarea name="msg-mild" rows="2">Just thought about that night out. How are you, really?</textarea><div class="p5-row">${btn('send', 'send it')}</div></div>`,
          warm: `<div class="p5-box"><p class="p5-label">your invite</p>${chips('act', ['a gig', 'a long walk', 'a class', 'the cinema', 'a market'])}${chips('when', ['this thursday', 'saturday', 'sunday morning'])}
            <textarea name="msg-warm" rows="2">A long walk on saturday? I'll sort the coffee.</textarea><div class="p5-row">${btn('send', 'send it')}</div></div>`,
          spicy: `<div class="p5-box"><p class="p5-label">the booking</p><label class="p5-field"><input name="thing" placeholder="the thing (a show, a class, a table)"></label>
            <label class="p5-tick"><input type="checkbox" name="booked"> booked it. going alone. icon behaviour.</label></div>`
        };
        box.insertAdjacentHTML('beforeend', `<div class="p5-in">${tools[c.k]}</div>`);
        if (!G.querySelector('[data-act=fin]')) box.insertAdjacentHTML('afterend', `<div class="p5-row">${btn('fin', 'made my move')}</div>`);
      },
      'chip:mem': s => { const t = G.querySelector('[name=msg-mild]'); if (t && s[0]) t.value = `Just thought about ${s[0]}. How are you, really?`; },
      'chip:act': () => warm(), 'chip:when': () => warm(),
      send: b => share(b.closest('.p5-box').querySelector('textarea').value),
      fin: () => { put('solo-move', [...G.querySelectorAll('.p5-card.is-flipped')].map(b => cards[+b.dataset.i].k)); finish(); }
    });
    function warm() { const t = G.querySelector('[name=msg-warm]'); if (t) t.value = `${(CH.act || ['A long walk'])[0].replace(/^./, c => c.toUpperCase())} ${(CH.when || ['on saturday'])[0].replace(/^(saturday|sunday)/, 'on $1')}? I'll sort the details.`; }
  }

  function soloSixth() {
    const nights = [
      {k: 'sight', l: 'your type', v: (got('solo-type') || []).join(', ') || (got('solo-type-eye') || []).join(', ')},
      {k: 'sound', l: 'your soundtrack', v: got('solo-pname') || ''},
      {k: 'taste', l: 'table for one', v: got('solo-place') || ''},
      {k: 'touch', l: 'your move', v: (got('solo-move') || []).join(' + ')}
    ];
    const s1 = () => show(`<div>${step(1, 3, 'Pick your favourite night.')}
      <div class="p5-tiles">${nights.map((n, i) => `<button type="button" class="p5-tile" data-chip="${n.k}" data-g="fav" data-max="1" aria-pressed="false">${icon(n.k)}<span class="p5-label">${n.k}</span><b>${esc(n.l)}</b>${n.v ? `<span class="p5-muted">${esc(n.v)}</span>` : ''}</button>`).join('')}</div>
      <p class="p5-label">what made it good?</p>${chips('why', ['doing things my way', 'trying something new', 'good music', 'good food', 'saying yes', 'time off my phone', 'being a bit brave'], 2)}
      <div class="p5-row">${btn('next', 'next')}</div></div>`,
      {'chip:fav': () => enable('next', !!(CH.fav || []).length), next: s2});
    const s2 = () => {
      const eye = got('solo-type-eye') || [], green = got('solo-type-green') || [];
      const list = [...new Set([...eye, ...green])];
      show(`<div>${step(2, 3, 'Check your day-one list. Did your type change? Cross things out freely.')}
        ${list.length ? `<div class="p5-strike">${list.map(x => `<button type="button" class="p5-chip" data-act="x" aria-pressed="false">${esc(x)}</button>`).join('')}</div>` : '<p class="p5-muted">No day-one list on this phone. Write three things that make time with someone good, in your head. That counts.</p>'}
        <label class="p5-field"><span class="p5-label">finish the sentence</span><input name="more" placeholder="I'd like more of…" value="${esc(CH.why ? `I'd like more of ${CH.why.join(' and ')}.` : '')}"></label>
        <div class="p5-row">${btn('next', 'next: the diary')}</div></div>`,
        {x: b => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')),
          next: () => { put('solo-more', G.querySelector('[name=more]').value.trim()); s3(); }});
    };
    const s3 = () => {
      const fav = nights.find(n => n.k === (CH.fav || [])[0]) || nights[0];
      show(`<div>${step(3, 3, 'Put it in the diary. Same thing, next week. Or bring someone, when you want to.')}${whenHTML('gb')}
        <div class="p5-row">${btn('cal', 'add to my calendar')}${btn('fin', 'see my receipt', 'p5-ghost')}</div></div>`,
        {'chip:gb-d': () => enable('cal', !!whenOf('gb')), 'chip:gb-t': () => enable('cal', !!whenOf('gb')),
          cal: () => ics(`The good bit again: ${fav.l}`, whenOf('gb'), 60, got('solo-more') || 'Keep the good bit.'),
          fin: () => {
            const more = got('solo-more') || '';
            finish(`<div class="p5-receipt"><p class="p5-label">the sense lab · receipt</p>
              ${nights.map(n => `<p class="p5-receipt-r"><span>${n.k}</span><span>${esc(n.v || 'done')}</span></p>`).join('')}
              <p class="p5-receipt-r is-top"><span>best bit</span><span>${esc(fav.l)}</span></p>
              ${more ? `<p class="p5-receipt-q">${esc(more)}</p>` : ''}<p class="p5-hand">signed, me x</p></div>`);
          }});
      enable('cal', false);
    };
    s1(); enable('next', false);
  }

  /* ═══════════ JUST MET ═══════════ */
  function metSight() {
    const FIRST = ['great smile', 'really calm', 'a bit too cool for me', 'trouble (the good kind)', 'very well dressed', 'hard to read', 'instantly easy to talk to', 'nervous (cute)'];
    const TWIST = ['your laugh', 'how much you know about weird stuff', 'your music taste', 'you remembered a tiny detail', 'how you ordered', 'you\'re funnier than you let on', 'how kind you were to the waiter'];
    const line = () => `First thing I noticed: ${(CH.f || ['…'])[0]}.\nThen you surprised me: ${(CH.t || ['…'])[0]}.`;
    show(`<div>${step(1, 2, 'Build your two sentences. Tap, then tweak the words.')}
      <p class="p5-label">first impression</p>${chips('f', FIRST)}
      <p class="p5-label">the plot twist</p>${chips('t', TWIST)}
      <div class="p5-note"><textarea name="msg" rows="3" aria-label="your message">${esc(line())}</textarea><span class="p5-hand">from me x</span></div>
      <div class="p5-row">${btn('next', 'ready to trade')}</div></div>`,
      {'chip:f': () => sync(), 'chip:t': () => sync(), next: () => { put('met-first', G.querySelector('[name=msg]').value); count(); }});
    function sync() { G.querySelector('[name=msg]').value = line(); enable('next', !!(CH.f || []).length && !!(CH.t || []).length); }
    enable('next', false);
    function count() {
      show(`<div class="p5-center">${step(2, 2, 'Trade them at the same time. Count down together, even by text.')}<div class="p5-count" data-count>3</div>${btn('go', 'start the countdown')}</div>`, {
        go: b => {
          b.remove(); let n = 3; const el = G.querySelector('[data-count]');
          const t = setInterval(() => { n--; buzz(30); if (n > 0) { el.textContent = n; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } else { clearInterval(t); el.textContent = 'send!'; el.classList.add('pop'); trade(); } }, 900);
        }
      });
    }
    function trade() {
      setTimeout(() => show(`<div>${step(0, 0, 'Send it, then see where the conversation goes.')}
        <div class="p5-note is-sent"><p>${esc(got('met-first')).replace(/\n/g, '<br>')}</p><span class="p5-hand">from me x</span></div>
        <div class="p5-row">${btn('send', 'send it')}</div>
        <div class="p5-box"><p class="p5-label">bonus round: six words each</p><p class="p5-muted">Your how-we-met story in exactly six words. Compare.</p>
        <input name="six" placeholder="Coffee. Wrong order. Right person, apparently." autocomplete="off"><p class="p5-six" data-six>0 / 6 words</p></div>
        <div class="p5-row">${btn('fin', 'traded')}</div></div>`, {
        send: () => share(got('met-first')),
        'in:six': v => { const n = v.trim() ? v.trim().split(/\s+/).length : 0, el = G.querySelector('[data-six]'); el.textContent = n === 6 ? 'six words. perfect.' : `${n} / 6 words`; el.classList.toggle('ok', n === 6); },
        fin: () => finish()
      }), 700);
    }
  }

  const TOT = [['breakfast', 'dinner'], ['city', 'coast'], ['planned', 'spontaneous'], ['call', 'text'], ['window', 'aisle']];
  function totHTML(g) {
    return `<div class="p5-tot">${TOT.map(([a, b], i) => `<div class="p5-tot-r" role="group" aria-label="${a} or ${b}">
      <button type="button" class="p5-tot-b" data-g="${g}${i}" data-chip="0" data-max="1" aria-pressed="false">${a}</button><span class="p5-hand">or</span>
      <button type="button" class="p5-tot-b" data-g="${g}${i}" data-chip="1" data-max="1" aria-pressed="false">${b}</button></div>`).join('')}</div>`;
  }
  const totDone = g => TOT.every((_, i) => (CH[g + i] || []).length);
  const totVals = g => TOT.map((_, i) => +(CH[g + i] || [0])[0]);
  function totReveal(mine, theirs, me, them) {
    return `<div class="p5-cmp"><div class="p5-cmp-h"><span>${esc(me)}</span><span></span><span>${esc(them)}</span></div>${TOT.map((p, i) => {
      const same = mine[i] === theirs[i];
      return `<div class="p5-cmp-r ${same ? 'same' : 'diff'}" style="--d:${i * 160}ms"><span>${p[mine[i]]}</span><span class="p5-cmp-v">${same ? 'same' : 'debate!'}</span><span>${p[theirs[i]]}</span></div>`;
    }).join('')}</div>`;
  }
  function metSound() {
    const acts = {};
    TOT.forEach((_, i) => acts['chip:a' + i] = () => enable('next', totDone('a')));
    show(`<div>${step(1, 2, 'Answer separately. No overthinking.')}${totHTML('a')}<div class="p5-row">${btn('next', 'locked in')}</div></div>`,
      Object.assign(acts, {next: () => { put('met-tot', totVals('a')); s2(); }}));
    enable('next', false);
    const s2 = () => {
      const url = `${location.origin}${location.pathname}?m=met&d=2#s=${b64e({t: 'tot', a: got('met-tot')})}`;
      show(`<div>${step(2, 2, 'Now get theirs.')}
        <div class="p5-box"><p class="p5-label">apart?</p><p>Send them the link. They answer, then both of you see where you disagree.</p><div class="p5-row">${btn('send', 'send them the debates')}</div></div>
        <div class="p5-box"><p class="p5-label">together?</p><p>Hand them the phone. Their answers stay hidden until the end.</p><div class="p5-row">${btn('hand', 'hand it over', 'p5-ghost')}</div></div>
        <div class="p5-row">${btn('fin', 'sent. done for tonight.', 'p5-ghost')}</div></div>`, {
        send: () => share('Five tiny debates. Answer yours, then we\'ll see who\'s wrong.', url),
        hand: () => pass('them', () => {
          const a2 = {}; TOT.forEach((_, i) => a2['chip:b' + i] = () => enable('next', totDone('b')));
          show(`<div>${step(0, 0, 'Your turn. Answer honestly. They can\'t see.')}${totHTML('b')}<div class="p5-row">${btn('next', 'reveal')}</div></div>`,
            Object.assign(a2, {next: () => closing(got('met-tot'), totVals('b'), 'you', 'them')}));
          enable('next', false);
        }),
        fin: () => finish()
      });
    };
  }
  function closing(mine, theirs, me, them) {
    show(`<div>${step(0, 0, 'The verdict. Nobody\'s keeping score.')}${totReveal(mine, theirs, me, them)}
      <div class="p5-box p5-center"><p class="p5-label">defend one answer</p><p class="p5-muted">Thirty seconds. Make it a closing argument. Voice note if you're apart.</p>${timerHTML(30, 'closing argument', 'sm')}${btn('go', 'start')}</div>
      <div class="p5-row">${btn('fin', 'call a truce')}</div></div>`,
      {go: b => { b.disabled = true; runTimer(30, () => toast('Time. Objections noted.')); }, fin: () => IN_SHARED ? sharedDone() : finish()});
  }

  function metTaste() {
    const KIND = ['something to eat', 'something to drink', 'a place that does it best'];
    const WHY = ['because you said', 'because it\'s a bit like you:', 'because you need to try', 'because I want to know what you think of'];
    show(`<div>${step(1, 2, 'Pick one thing. Something with a story.')}${chips('k', KIND)}
      <label class="p5-field"><input name="thing" placeholder="the thing (e.g. the hot honey pizza at Luigi's)" autocomplete="off"></label>
      <p class="p5-label">why them? start with one of these</p>${chips('w', WHY)}
      <label class="p5-field"><textarea name="why" rows="2" placeholder="one sentence on why you picked it for this person"></textarea></label>
      <div class="p5-row">${btn('next', 'make the ticket')}</div></div>`, {
      'chip:w': s => { const t = G.querySelector('[name=why]'); if (s[0] && !t.value.startsWith(s[0])) t.value = s[0] + ' '; t.focus(); check(); },
      'chip:k': check, 'in:thing': check, 'in:why': check,
      next: () => { put('met-rec', {k: (CH.k || [KIND[0]])[0], thing: val('thing'), why: val('why')}); ticket(); }
    });
    enable('next', false);
    function val(n) { return G.querySelector(`[name=${n}]`).value.trim(); }
    function check() { enable('next', val('thing').length > 1 && val('why').length > 5); }
    function ticket() {
      const r = got('met-rec');
      show(`<div>${step(2, 2, 'Send it over. Ask a question back.')}
        <div class="p5-ticket"><p class="p5-label">a recommendation for you · ${esc(r.k)}</p><p class="p5-ticket-t">${esc(r.thing)}</p><p class="p5-ticket-w">${esc(r.why)}</p><p class="p5-hand">trust me x</p></div>
        <div class="p5-row">${btn('send', 'send the ticket')}</div>
        <div class="p5-box"><p class="p5-label">save the best</p><p class="p5-muted">Theirs or yours: whichever sounds best is your next-date idea, quietly. We'll keep it for day five.</p>
        <input name="best" value="${esc(r.thing)}" autocomplete="off"></div>
        <div class="p5-row">${btn('fin', 'swapped')}</div></div>`, {
        send: () => share(`A recommendation for you: ${r.thing}. ${r.why}`),
        fin: () => { put('met-best', G.querySelector('[name=best]').value.trim()); finish(); }
      });
    }
  }

  function metTouch() {
    const cards = [
      {k: 'curious', t: 'What\'s a skill you\'re unexpectedly good at?'},
      {k: 'playful', t: 'Sell me your ideal Sunday in twenty seconds.'},
      {k: 'bold', t: 'Name a place you\'d like to show me. Somewhere that means something.'}
    ];
    show(`<div>${step(0, 0, 'Tell them your number first. Then flip.')}
      <div class="p5-row"><span class="p5-label" style="margin:0">tell them:</span>${[1, 2, 3].map(n => `<button type="button" class="p5-chip" data-act="tell" data-n="${n}">I picked ${n}</button>`).join('')}</div>
      ${cardsHTML(cards)}<div data-after></div></div>`, {
      tell: b => share(`I picked card ${b.dataset.n}. Brace yourself.`),
      flip: b => {
        if (G.querySelector('.p5-card.is-flipped')) return toast('One card tonight. That\'s the rule.');
        flip(b); const c = cards[+b.dataset.i];
        G.querySelector('[data-after]').innerHTML = `<div class="p5-in">
          ${c.k === 'playful' ? `<div class="p5-box p5-center"><p class="p5-label">twenty-second pitch</p>${timerHTML(20, 'sell it', 'sm')}${btn('go', 'start the clock')}</div>` : ''}
          <div class="p5-row">${btn('send', 'send the question')}${btn('pass', 'pass', 'p5-ghost')}</div>
          <p class="p5-muted p5-small">Apart? Answer by voice note, and end every answer with a question back.</p>
          <div class="p5-row">${btn('fin', 'answered')}</div></div>`;
      },
      go: b => { b.disabled = true; runTimer(20, () => toast('Sold. Probably.')); },
      send: () => share(G.querySelector('.p5-card.is-flipped .p5-card-t').textContent),
      pass: () => { G.querySelector('[data-after]').insertAdjacentHTML('afterbegin', `<div class="p5-box p5-forfeit p5-in"><p class="p5-label">forfeit</p><p>Tell them one thing you liked about the last time you met.</p></div>`); },
      fin: () => finish(`<div class="p5-box"><p class="p5-label">bonus round</p><p>Next time you meet, let the goodbye be their call. High five, hug or a wave. Asking is allowed, and quite charming.</p></div>`)
    });
  }

  const IDEAS = ['small gallery, then coffee', 'pub quiz', 'market wander', 'pottery or a one-off class', 'walk with a destination', 'bookshop dare'];
  function metSixth() {
    show(`<div>${step(1, 2, 'Check in with yourself. All valid.')}
      <div class="p5-gut">${[['excited', '🔥'], ['curious', '👀'], ['nice, but', '🌧']].map(([k, e]) => `<button type="button" class="p5-gut-b" data-act="gut" data-k="${k}"><span aria-hidden="true">${e}</span>${k}</button>`).join('')}</div></div>`,
      {gut: b => { put('met-gut', b.dataset.k); b.dataset.k === 'nice, but' ? kind() : options(); }});
    function options() {
      const best = got('met-best');
      const placeList = best ? [best, ...IDEAS] : IDEAS;
      show(`<div>${step(2, 2, 'Offer two options. Easy to say yes to, easy to say no to.')}
        ${[1, 2].map(n => `<div class="p5-box"><p class="p5-label">option ${n}</p>${chips('d' + n, ['thursday', 'friday', 'saturday', 'sunday', 'next week'])}${chips('p' + n, placeList)}${chips('b' + n, ['£0', 'under £10', 'under £25', 'my treat'])}</div>`).join('')}
        <p class="p5-muted p5-small">Somewhere public is a good shout for now.</p>
        <div class="p5-row">${btn('send', 'send both options')}</div></div>`, Object.assign(
        ...[1, 2].flatMap(n => ['d', 'p', 'b'].map(k => ({['chip:' + k + n]: chk}))),
        {send: () => {
          const o = [1, 2].map(n => ({d: CH['d' + n][0], p: CH['p' + n][0], b: CH['b' + n][0]}));
          put('met-opts', o);
          const url = `${location.origin}${location.pathname}?m=met&d=5#s=${b64e({t: 'opts', o})}`;
          share('Round two? Two options. Pick one (or don\'t, that\'s fine too).', url).then(() =>
            finish(`<div class="p5-box"><p class="p5-label">sent</p><p>They'll see both options and tap one. Their answer comes back to you in your chat.</p></div>`));
        }}));
      enable('send', false);
      function chk() { enable('send', [1, 2].every(n => ['d', 'p', 'b'].every(k => (CH[k + n] || []).length))); }
    }
    function kind() {
      const T = ['I\'ve really enjoyed meeting you, and I want to be honest: I don\'t feel the spark for more. Thank you for the good chats.',
        'Thanks for the dates. I had a good time, but I don\'t think we\'re a match. Wishing you a great one.',
        'I\'ve liked getting to know you. I think we\'re better as friends, and I wanted to say so clearly.'];
      show(`<div>${step(2, 2, 'If it\'s a no, say thanks. Ending kindly is a skill too.')}
        <label class="p5-field"><textarea name="msg" rows="4">${esc(T[0])}</textarea></label>
        <div class="p5-row">${btn('other', 'another way to say it', 'p5-ghost')}${btn('send', 'send it')}</div>
        <div class="p5-row">${btn('fin', 'done')}</div></div>`, {
        other: () => { const t = G.querySelector('[name=msg]'); t.value = T[(T.indexOf(t.value) + 1) % T.length]; },
        send: () => share(G.querySelector('[name=msg]').value),
        fin: () => finish(`<div class="p5-box"><p class="p5-label">clear is kind</p><p>And quite attractive, for the next one.</p></div>`)
      });
    }
  }

  /* ── links opened from someone else's share ─────────────── */
  let IN_SHARED = false;
  function renderShared(s) {
    IN_SHARED = true;
    app.innerHTML = `<section class="p5-wrap"><header class="p5-head"><p class="p5-hand p5-tilt">someone sent you this.</p><h1 class="p5-h1">${s.t === 'tot' ? 'this or that.' : 'round two?'}</h1>
      <p class="p5-after">${s.t === 'tot' ? '(five tiny debates)' : '(pick one. or don\'t.)'}</p></header><div class="p5-stage" id="p5-stage" aria-live="polite"></div></section>`;
    G = document.getElementById('p5-stage');
    G.addEventListener('click', onClick);
    G.addEventListener('input', e => { const f = ACT['in:' + e.target.name]; if (f) f(e.target.value, e.target); });
    if (s.t === 'tot' && Array.isArray(s.a)) {
      const acts = {}; TOT.forEach((_, i) => acts['chip:b' + i] = () => enable('next', totDone('b')));
      show(`<div>${step(0, 0, 'Answer yours. Theirs are hidden until you lock in.')}${totHTML('b')}<div class="p5-row">${btn('next', 'locked in. show me.')}</div></div>`,
        Object.assign(acts, {next: () => {
          const mine = totVals('b');
          closing(mine, s.a, 'you', 'them');
          G.querySelector('.p5-row:last-child').insertAdjacentHTML('beforebegin', `<div class="p5-row">${btn('back', 'send your answers back')}</div>`);
          ACT.back = () => share(`My answers: ${TOT.map((p, i) => p[mine[i]]).join(', ')}. Discuss.`);
        }}));
      enable('next', false);
    } else if (s.t === 'opts' && Array.isArray(s.o)) {
      show(`<div>${step(0, 0, 'Two options. Tap the one you fancy.')}
        <div class="p5-opts">${s.o.map((o, i) => `<button type="button" class="p5-opt" data-act="pick" data-i="${i}"><span class="p5-label">option ${i + 1}</span><b>${esc(o.p)}</b><span>${esc(o.d)} · ${esc(o.b)}</span></button>`).join('')}</div>
        <div class="p5-row">${btn('no', 'not this time', 'p5-ghost')}</div></div>`, {
        pick: b => {
          const o = s.o[+b.dataset.i];
          show(`<div class="p5-center"><div class="p5-stamp" aria-hidden="true">it's a date.</div><p class="p5-ticket-t">${esc(o.p)}</p><p class="p5-muted">${esc(o.d)} · ${esc(o.b)}</p>
            <div class="p5-row">${btn('send', 'tell them')}</div>${sharedFooter()}</div>`, {send: () => share(`Option: ${o.p}, ${o.d}. Yes please.`)});
          burst();
        },
        no: () => show(`<div>${step(0, 0, 'Totally fine. Say it kindly.')}<label class="p5-field"><textarea name="msg" rows="3">Thank you for asking. I've enjoyed it, but I don't think we're a match. Wishing you a good one.</textarea></label>
          <div class="p5-row">${btn('send', 'send it')}</div>${sharedFooter()}</div>`, {send: () => share(G.querySelector('[name=msg]').value)})
      });
    } else { history.replaceState(null, '', location.pathname + location.search); SHARED_OFF(); }
  }
  function SHARED_OFF() { SHARED = null; IN_SHARED = false; render(); }
  const sharedFooter = () => `<div class="p5-box"><p class="p5-label">this came from the sense lab</p><p class="p5-muted">Five days, five senses, one small game a night. Free, by email.</p><a class="p5-btn p5-ghost" href="${esc(CFG.signup || '/pages/5-day-experience')}">try the 5 day experience</a></div>`;
  function sharedDone() { show(`<div class="p5-center"><div class="p5-stamp" aria-hidden="true">truce.</div>${sharedFooter()}</div>`); }

  /* ═══════════ WITH SOMEONE ═══════════ */
  function needNames(next) {
    if (S.names) return next();
    show(`<div>${step(0, 0, 'Who\'s playing? First names are plenty.')}
      <div class="p5-names"><input name="n1" placeholder="you" autocomplete="off" maxlength="20" data-focus><span class="p5-hand">&amp;</span><input name="n2" placeholder="them" autocomplete="off" maxlength="20"></div>
      <div class="p5-row">${btn('ok', 'let\'s go')}</div></div>`,
      {ok: () => { S.names = [G.querySelector('[name=n1]').value.trim() || 'you', G.querySelector('[name=n2]').value.trim() || 'them']; save(); next(); }});
  }
  const DUO_SECRETS = ['a job you nearly had', 'a talent nobody\'s seen', 'your worst haircut', 'something you believed until embarrassingly late', 'a tiny thing that makes your day', 'the first gig you went to', 'a fear that makes no sense', 'something you\'ve never told anyone at work'];

  function duoSight() {
    needNames(() => {
      const [A, B] = names();
      show(`<div class="p5-center">${step(1, 3, 'Sit facing each other. Knees touching if you\'re brave. Sixty seconds, just look. Giggling is allowed and expected.')}
        <div class="p5-eyes" data-eyes>${timerHTML(60, 'just look', 'lg')}</div>
        <div class="p5-row">${btn('go', 'start the sixty seconds')}</div></div>`, {
        go: b => { b.remove(); runTimer(60, looked); }
      });
      function looked() {
        show(`<div class="p5-center">${step(1, 3, 'Who looked away first?')}
          <div class="p5-row">${btn('lost', esc(A), 'p5-ghost').replace('data-act="lost"', 'data-act="lost" data-n="0"')}${btn('lost', esc(B), 'p5-ghost').replace('data-act="lost"', 'data-act="lost" data-n="1"')}${btn('lost', 'nobody. impressive.', 'p5-ghost').replace('data-act="lost"', 'data-act="lost" data-n="-1"')}</div></div>`, {
          lost: b => { const n = +b.dataset.n; put('duo-wild', n); if (n > -1) toast(`${names()[n]} brings the wildcard on day three.`); thanks(); }
        });
      }
      function thanks() {
        show(`<div>${step(2, 3, 'One thank-you each. Something they did this week that you noticed and never mentioned.')}
          <div class="p5-box"><p><b>${esc(A)}</b> goes first. Then <b>${esc(B)}</b>.</p>
          <label class="p5-tick"><input type="checkbox" name="t1"> ${esc(A)} said it</label><label class="p5-tick"><input type="checkbox" name="t2"> ${esc(B)} said it</label></div>
          <div class="p5-row">${btn('next', 'next: swap a secret')}</div></div>`, {
          next: () => secret(0)
        });
      }
      const sec = [];
      function secret(i) {
        const who = names()[i], other = names()[1 - i];
        show(`<div>${step(3, 3, `${who}: one thing ${other} probably doesn't know about you. Nothing dramatic. Unless it is.`)}
          <label class="p5-field"><textarea name="s" rows="3" placeholder="type it, then hide it" data-focus></textarea></label>
          <div class="p5-row">${btn('idea', 'need an idea?', 'p5-ghost')}${btn('hide', i ? 'hide it and reveal both' : `hide it. pass to ${esc(other)}`)}</div><p class="p5-muted p5-small" data-idea></p></div>`, {
          idea: () => { G.querySelector('[data-idea]').textContent = `Try: ${pick(DUO_SECRETS)}.`; },
          'in:s': v => enable('hide', v.trim().length > 2),
          hide: () => { sec[i] = G.querySelector('[name=s]').value.trim(); i ? reveal() : pass(other, () => secret(1)); }
        });
        enable('hide', false);
      }
      function reveal() {
        show(`<div>${step(0, 0, 'On three. Tap to flip. Questions are allowed.')}
          <div class="p5-cards two">${sec.map((s, i) => `<button type="button" class="p5-card" data-act="flip"><span class="p5-card-in"><span class="p5-card-f"><span class="p5-hand">${esc(names()[i])}</span></span><span class="p5-card-b"><span class="p5-card-k">${esc(names()[i])}'s secret</span><span class="p5-card-t">${esc(s)}</span></span></span></button>`).join('')}</div>
          <div class="p5-row">${btn('fin', 'did you know?')}</div></div>`, {
          flip, fin: () => finish(`<div class="p5-box"><p class="p5-label">bonus round</p><p>Take one unposed photo of them right now (yes, they'll notice). Don't show them until day five.</p></div>`)
        });
      }
    });
  }

  function duoSound() {
    needNames(() => {
      const [A, B] = names();
      const QS = ['Who picked who up?', 'Who takes longer to leave the house?', 'Who\'s the better cook?', 'Who\'d last longer on a desert island?'];
      const ans = [[], []];
      const ask = (p) => {
        show(`<div>${step(1, 3, `${names()[p]}, answer in secret.`)}
          ${QS.map((qq, i) => `<div class="p5-who"><p>${esc(qq)}</p>${chips(`q${p}-${i}`, [A, B, 'both'])}</div>`).join('')}
          <div class="p5-row">${btn('next', p ? 'to the courtroom' : `done. pass to ${esc(B)}`)}</div></div>`,
          Object.assign(...QS.map((_, i) => ({['chip:q' + p + '-' + i]: () => enable('next', QS.every((_, j) => (CH[`q${p}-${j}`] || []).length))})),
            {next: () => { ans[p] = QS.map((_, i) => CH[`q${p}-${i}`][0]); p ? court(0) : pass(B, () => ask(1)); }}));
        enable('next', false);
      };
      const court = i => {
        if (i >= QS.length) return playlist();
        const same = ans[0][i] === ans[1][i];
        show(`<div class="p5-center">${step(2, 3, 'Read them out in your best courtroom voice.')}
          <p class="p5-court-q">${esc(QS[i])}</p>
          <div class="p5-court"><div><span class="p5-label">${esc(A)} says</span><b>${esc(ans[0][i])}</b></div><div><span class="p5-label">${esc(B)} says</span><b>${esc(ans[1][i])}</b></div></div>
          <div class="p5-stamp ${same ? '' : 'red'}" aria-hidden="true">${same ? 'agreed.' : 'objection!'}</div>
          <div class="p5-row">${btn('next', i < QS.length - 1 ? 'next case' : 'case closed')}</div></div>`, {next: () => court(i + 1)});
        buzz(same ? 20 : [40, 40, 40]);
      };
      const playlist = () => {
        show(`<div>${step(3, 3, 'Build a three-song playlist: one each that sounds like "us", plus one you pick together.')}
          ${[[A, 'p0'], [B, 'p1'], ['together', 'p2']].map(([l, n]) => `<label class="p5-field"><span class="p5-label">${esc(l)}</span><input name="${n}" placeholder="song, artist" autocomplete="off"></label>`).join('')}
          <div class="p5-row">${btn('next', 'press play')}</div></div>`, {
          next: () => { const s = ['p0', 'p1', 'p2'].map(n => G.querySelector(`[name=${n}]`).value.trim()).filter(Boolean); put('duo-songs', s); play(s, 0); }
        });
      };
      const play = (s, i) => {
        if (!s.length || i >= s.length) return finish(`<div class="p5-box"><p class="p5-label">bonus round</p><p>Next time they tell you good news, react like it's yours. Ask two questions before you say "nice".</p></div>`);
        show(`<div class="p5-center">${step(0, 0, 'A minute of each. Lights low. No skipping, even the embarrassing one.')}
          <div class="p5-vinyl spin"><div class="p5-vinyl-l"><span>${esc(s[i])}</span></div></div>
          <a class="p5-link" target="_blank" rel="noopener" href="https://open.spotify.com/search/${encodeURIComponent(s[i])}">play it ↗</a>
          ${timerHTML(60, `song ${i + 1} of ${s.length}`, 'sm')}<div class="p5-row">${btn('go', 'start the minute')}${btn('next', 'next song', 'p5-ghost')}</div></div>`,
          {go: b => { b.disabled = true; runTimer(60, () => play(s, i + 1)); }, next: () => play(s, i + 1)});
      };
      ask(0);
    });
  }

  function duoTaste() {
    needNames(() => {
      const [A, B] = names();
      const wild = got('duo-wild'), score = [0, 0], bites = [[], []];
      show(`<div>${step(0, 0, 'Before anything: check allergies. Obviously.')}
        <label class="p5-tick"><input type="checkbox" name="al"> allergies checked</label>
        ${wild > -1 && wild != null ? `<p class="p5-muted">${esc(names()[wild])} looked away first on day one, so ${esc(names()[wild])} brings the wildcard.</p>` : ''}
        <p class="p5-muted">Each of you secretly gathers three small bites: something sweet, something salty, something wildcard. Budget: whatever's in the cupboard.</p>
        <div class="p5-row">${btn('go', 'bites ready')}</div></div>`, {
        go: () => G.querySelector('[name=al]').checked ? setup(0) : toast('Tick the allergy check first.')
      });
      function setup(chef) {
        const c = names()[chef], t = names()[1 - chef];
        show(`<div>${step(0, 0, `${c} is chef. ${t}, eyes closed or blindfold on. ${c}: label your bites secretly.`)}
          ${['sweet', 'salty', 'wildcard'].map((k, i) => `<label class="p5-field"><span class="p5-label">${k}</span><input name="b${i}" placeholder="what is it?" autocomplete="off"></label>`).join('')}
          <div class="p5-row">${btn('go', 'start feeding')}</div></div>`, {
          go: () => { bites[chef] = [0, 1, 2].map(i => G.querySelector(`[name=b${i}]`).value.trim() || ['something sweet', 'something salty', 'the wildcard'][i]); round(chef, 0); }
        });
      }
      function round(chef, i) {
        const c = names()[chef], t = names()[1 - chef];
        if (i > 2) return chef === 0 ? pass(B, () => setup(1), `${A}, eyes closed now. ${B} is chef.`) : result();
        show(`<div class="p5-center">${step(i + 1, 3, `${c}: feed one bite. Slowly. ${t} guesses out loud.`)}
          <p class="p5-label">bite ${i + 1}: ${['sweet', 'salty', 'wildcard'][i]}</p><p class="p5-secret" data-secret>tap to see the answer (chef only)</p>
          <div class="p5-row">${btn('s2', 'nailed it', '')}${btn('s1', 'close', 'p5-ghost')}${btn('s0', 'not even close', 'p5-ghost')}</div>
          <p class="p5-muted p5-small">Then tell the story: why this one? A memory, a place, a person.</p></div>`, {
          s2: () => { score[1 - chef] += 2; next(); }, s1: () => { score[1 - chef] += 1; next(); }, s0: next
        });
        G.querySelector('[data-secret]').onclick = e => { e.target.textContent = bites[chef][i]; e.target.classList.add('on'); };
        function next() { buzz(20); round(chef, i + 1); }
      }
      function result() {
        const win = score[0] === score[1] ? -1 : score[0] > score[1] ? 0 : 1;
        put('duo-guesser', win);
        show(`<div class="p5-center">${step(0, 0, 'The scores.')}
          <div class="p5-court"><div><span class="p5-label">${esc(A)}</span><b>${score[0]}</b></div><div><span class="p5-label">${esc(B)}</span><b>${score[1]}</b></div></div>
          <div class="p5-stamp" aria-hidden="true">${win < 0 ? 'a tie.' : `${esc(names()[win])} wins.`}</div>
          <p class="p5-muted">${win < 0 ? 'Tomorrow you flip a coin for the card.' : `${esc(names()[win])} picks tomorrow's card.`}</p>
          <label class="p5-field"><span class="p5-label">the bite that surprised you most</span><input name="sur" placeholder="it comes back on day five" autocomplete="off"></label>
          <div class="p5-row">${btn('fin', 'done')}</div></div>`, {
          fin: () => { put('duo-bite', G.querySelector('[name=sur]').value.trim()); finish(nudge('playmate-chocolate', 'Short on sweet? Snap\'d is milk chocolate hearts made for two.')); }
        });
      }
    });
  }

  function duoTouch() {
    needNames(() => {
      const g = got('duo-guesser'), chooser = g === 0 || g === 1 ? names()[g] : null;
      const cards = [
        {k: 'mild', t: 'Trace a word on their back with a fingertip. They guess it. Three words, increasing in nerve.'},
        {k: 'warm', t: 'Two-minute hand massage. Then they tell you their first impression of you, honestly.'},
        {k: 'spicy', t: 'Blindfold on. Clear the floor, then guide them across the room by touch alone. Reward on arrival is your call.'}
      ];
      const WORDS = [['tea', 'sun', 'yes', 'cat', 'hi'], ['dance', 'cheeky', 'later', 'sofa', 'wink'], ['closer', 'tonight', 'yours', 'kiss', 'stay']];
      show(`<div>${step(0, 0, `${chooser ? `${chooser} picks.` : 'Flip a coin for who picks.'} Pick a number before you look. Either of you can pass on anything, no explanation needed.`)}
        ${cardsHTML(cards)}<div data-after></div>
        <p class="p5-muted p5-center p5-small">Can't choose? Do all three. We won't tell anyone.</p></div>`, {
        flip: b => {
          flip(b); const c = cards[+b.dataset.i], box = G.querySelector('[data-after]');
          const tool = c.k === 'mild' ? `<div class="p5-box p5-center"><p class="p5-label">your three words</p><div class="p5-words">${WORDS.map((w, i) => `<button type="button" class="p5-word" data-act="word" data-l="${i}"><span>level ${i + 1}</span><b>tap to see</b></button>`).join('')}</div><p class="p5-muted p5-small">Only the tracer looks.</p></div>`
            : c.k === 'warm' ? `<div class="p5-box p5-center"><p class="p5-label">two minutes</p>${timerHTML(120, 'hand massage', 'sm')}${btn('go', 'start')}</div>`
            : `<div class="p5-box"><p class="p5-label">before you start</p><p>Clear the floor. Go slowly. Either of you can stop at any point.</p></div>`;
          box.insertAdjacentHTML('beforeend', `<div class="p5-in">${tool}</div>`);
          if (!G.querySelector('[data-act=fin]')) box.insertAdjacentHTML('afterend', `<div class="p5-row">${btn('pass', 'pass', 'p5-ghost')}${btn('fin', 'done')}</div>`);
        },
        word: b => { b.querySelector('b').textContent = pick(WORDS[+b.dataset.l]); b.classList.add('on'); },
        go: b => { b.disabled = true; runTimer(120, () => toast('Time. Now: first impression, honestly.')); },
        pass: () => G.querySelector('[data-after]').insertAdjacentHTML('afterbegin', `<div class="p5-box p5-forfeit p5-in"><p class="p5-label">forfeit</p><p>A compliment that isn't about looks.</p></div>`),
        fin: () => finish(`<div class="p5-box"><p class="p5-label">bonus round</p><p>Ten-second hug before you sleep. Count out loud. It's sillier than it sounds.</p></div>${nudge('nude-stacked', 'Liked picking a card? Nude Stack\'d is a whole game of wooden blocks and prompt cards. Every card is optional.')}`)
      });
    });
  }

  function duoSixth() {
    needNames(() => {
      const [A, B] = names();
      const T = ['friday night', 'saturday lunch', 'sunday morning', 'a weeknight'];
      const P = ['somewhere new', 'our usual', 'outdoors', 'at home', 'a show or a gig', 'a long dinner'];
      const BU = ['£0', 'under £30', 'under £80', 'treat ourselves'];
      const pred = [];
      const predict = i => {
        const me = names()[i], them = names()[1 - i];
        show(`<div>${step(1, 3, `${me}: predict ${them}'s perfect date. No conferring. Mind-reading only.`)}
          <p class="p5-label">when</p>${chips(`t${i}`, T)}<p class="p5-label">where</p>${chips(`p${i}`, P)}<p class="p5-label">budget</p>${chips(`b${i}`, BU)}
          <div class="p5-row">${btn('fold', i ? 'fold it. reveal time.' : `fold it. pass to ${esc(them)}`)}</div></div>`,
          Object.assign(...['t', 'p', 'b'].map(k => ({[`chip:${k}${i}`]: () => enable('fold', ['t', 'p', 'b'].every(j => (CH[j + i] || []).length))})), {
            fold: () => { pred[i] = ['t', 'p', 'b'].map(k => CH[k + i][0]); i ? score(0) : pass(B, () => predict(1)); }
          }));
        enable('fold', false);
      };
      const pts = [0, 0];
      const score = i => {
        const them = names()[1 - i];
        show(`<div>${step(2, 3, `${them}: here's what ${names()[i]} predicted for you. Tap every detail they nailed.`)}
          <div class="p5-fold">${pred[i].map((v, j) => `<button type="button" class="p5-fold-r" data-act="hit" aria-pressed="false"><span class="p5-label">${['when', 'where', 'budget'][j]}</span><b>${esc(v)}</b><span class="p5-fold-m">✓</span></button>`).join('')}</div>
          <div class="p5-row">${btn('next', i ? 'see who won' : 'next prediction')}</div></div>`, {
          hit: b => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); buzz(15); },
          next: () => { pts[i] = G.querySelectorAll('[aria-pressed=true]').length; i ? won() : score(1); }
        });
      };
      const won = () => {
        const w = pts[0] === pts[1] ? -1 : pts[0] > pts[1] ? 0 : 1, plan = w < 0 ? null : pred[w];
        show(`<div class="p5-center">${step(3, 3, 'The winner\'s date gets booked. Tonight. Not "we should". Booked.')}
          <div class="p5-court"><div><span class="p5-label">${esc(A)}</span><b>${pts[0]}</b></div><div><span class="p5-label">${esc(B)}</span><b>${pts[1]}</b></div></div>
          <div class="p5-stamp" aria-hidden="true">${w < 0 ? 'a tie.' : 'mind reader.'}</div>
          ${w < 0 ? `<p class="p5-muted">A tie. Flip for it.</p><div class="p5-row">${btn('coin', 'flip a coin')}</div><div data-coin></div>` : planBox(pred[w], names()[w])}
          </div>`, {
          coin: b => { b.disabled = true; const c = G.querySelector('[data-coin]'); c.innerHTML = `<div class="p5-coin${reduced ? '' : ' spin'}">?</div>`;
            setTimeout(() => { const x = Math.random() < 0.5 ? 0 : 1; c.innerHTML = planBox(pred[x], names()[x]); bind(); }, reduced ? 50 : 1300); },
          ...binds()
        });
        function planBox(p, who) {
          return `<div class="p5-ticket"><p class="p5-label">${esc(who)}'s prediction wins</p><p class="p5-ticket-t">${esc(p[1])}</p><p class="p5-ticket-w">${esc(p[0])} · ${esc(p[2])}</p></div>
            ${whenHTML('bk')}<div class="p5-row">${btn('cal', 'add it to the calendar')}</div>
            <label class="p5-tick"><input type="checkbox" name="booked"> booked. actually booked.</label>
            <div class="p5-row">${btn('reveal', 'the reveal')}</div>`;
        }
        function binds() {
          return {
            'chip:bk-d': () => enable('cal', !!whenOf('bk')), 'chip:bk-t': () => enable('cal', !!whenOf('bk')),
            cal: () => { const p = G.querySelector('.p5-ticket-t').textContent; ics(`Date night: ${p}`, whenOf('bk'), 150, 'Booked in the Sense Lab. Not "we should". Booked.'); },
            reveal
          };
        }
        function bind() { Object.assign(ACT, binds()); enable('cal', false); }
        enable('cal', false);
      };
      const reveal = () => {
        const bite = got('duo-bite');
        finish(`<div class="p5-box"><p class="p5-label">the reveal</p><ol class="p5-list">
          <li>Show them the day-one photo.</li>
          <li>Name the day-three bite that surprised you${bite ? `: <b>${esc(bite)}</b>` : ''}.</li>
          <li>Tell them which night was your favourite, and why.</li></ol></div>`);
      };
      predict(0);
    });
  }

  render();
})();
