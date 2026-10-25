/* Cuff'd (DRAFT): a challenge game for two with cuffs, a blindfold and cards.
   Two modes: "partners in crime" (co-op: collect keys before you get busted) and "cuffs on"
   (versus: first to N points; the loser of a round carries a complication into their next turn;
   the winner spins the loser's forfeit). Each round: draw a challenge card, spin a complication,
   beat the clock. Wild cards shake things up. Hidden draft page; nothing is stored off the phone. */
(() => {
  const C = window.CUFFD_CARDS, app = document.getElementById('cf-app');
  if (!C || !app) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

  const ICO = {
    cuffs: '<circle cx="7" cy="15" r="4.5"/><circle cx="17" cy="15" r="4.5"/><path d="M9.5 11.2 11 8.5h2l1.5 2.7"/><path d="M5.2 10.8 7 9.6M18.8 10.8 17 9.6"/>',
    blind: '<path d="M2.5 11c2.8-2.2 6-3.3 9.5-3.3s6.7 1.1 9.5 3.3c-2.8 2.4-6 3.6-9.5 3.6S5.3 13.4 2.5 11z"/><path d="M8 11.3c1.2.7 2.6.7 3.6 0M12.4 11.3c1.2.7 2.6.7 3.6 0"/><path d="M21.5 11l1.2 4.5M21.5 11l-.5 5"/>',
    mask: '<path d="M4 4.5h11v6.5a5.5 5.5 0 0 1-11 0z"/><path d="M7 9h1.5M11 9h1.5M7.5 13c1.2 1 2.8 1 4 0"/><path d="M15 8h5v5.5a4.5 4.5 0 0 1-6.6 4"/><path d="M16.5 12h1.2"/>',
    pencil: '<path d="M4 20l1.2-4.3L16 4.9l3.1 3.1L8.3 18.8z"/><path d="M14 7l3 3M4 20l4.3-1.2"/>',
    bolt: '<path d="M13.5 2.5 4.5 14h7l-1 7.5 9-11.5h-7z"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 20 3M16.5 6.5l2.5 2.5M14.3 8.7l2 2"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1V4.5a1.5 1.5 0 0 1 3 0V12m0-6.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3 15a1.6 1.6 0 0 1 2.6-1.9L8 15"/>',
    shh: '<path d="M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0"/><path d="M12 6v8"/><path d="M8.5 15.5c2 1.3 5 1.3 7 0"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
  };
  const ico = (k, cls = '') => `<svg class="cf-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[k] || ICO.star}</svg>`;

  /* ── game state ── */
  let G = null;
  const DEF = {names: ['you', 'them'], mode: 'coop', vibe: 'playful', len: 'full'};
  let S = {}; try { S = JSON.parse(localStorage.getItem('cuffd:draft')) || {}; } catch (_) {}
  const keep = () => { try { localStorage.setItem('cuffd:draft', JSON.stringify(S)); } catch (_) {} };
  const goal = () => G.len === 'quick' ? 3 : 5;
  const deckFor = () => Object.entries(C.decks).filter(([, d]) => G.mode === 'versus' || !d.versus);
  const usable = list => list.filter(c => G.vibe === 'flirty' || !c.f);

  let ACT = {}, T = 0, RAF = 0;
  const show = (html, acts) => {
    cancelAnimationFrame(RAF); clearTimeout(T);
    app.innerHTML = `<div class="cf-screen${still ? '' : ' in'}">${html}</div>`; ACT = acts || {};
    scrollTo({top: 0, behavior: 'auto'});
  };
  app.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (b && ACT[b.dataset.act]) ACT[b.dataset.act](b, e);
    const c = e.target.closest('[data-chip]');
    if (c) { const g = c.dataset.g; app.querySelectorAll(`[data-g="${g}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === c))); ACT['chip:' + g] && ACT['chip:' + g](c.dataset.chip); }
  });
  const btn = (act, label, cls = '') => `<button type="button" class="cf-btn ${cls}" data-act="${act}">${label}</button>`;
  const chips = (g, opts, sel) => `<div class="cf-chips">${opts.map(([v, l, sub]) => `<button type="button" class="cf-chip" data-g="${g}" data-chip="${v}" aria-pressed="${v === sel}"><b>${l}</b>${sub ? `<small>${sub}</small>` : ''}</button>`).join('')}</div>`;

  /* ── the board strip: keys and busts (co-op) or the score (versus) ── */
  function board() {
    if (G.mode === 'coop') {
      const k = Array.from({length: goal()}, (_, i) => `<span class="${i < G.keys ? 'on' : ''}">${ico('key')}</span>`).join('');
      const b = Array.from({length: 3}, (_, i) => `<span class="${i < G.busts ? 'on bust' : ''}">${ico('lock')}</span>`).join('');
      return `<div class="cf-board"><div><small>keys</small><div class="cf-pips">${k}</div></div><div><small>busts</small><div class="cf-pips">${b}</div></div></div>`;
    }
    return `<div class="cf-board vs">${G.names.map((n, i) => `<div class="${G.turn === i ? 'me' : ''}"><small>${esc(n)}${G.cuffed[i] ? ' · cuffed' : ''}</small><b>${G.score[i]}</b></div>`).join('<i>vs</i>')}<em>first to ${goal()}</em></div>`;
  }

  /* ── 0. home, how to play, safety ── */
  function home() {
    show(`<div class="cf-home"><h1 class="cf-logo">Cuff'd.</h1><p class="cf-sub">couples game</p>
      <p class="cf-tag">Playful challenges, deeper conversations, and a little mischief. For couples at every stage.</p>
      <span class="cf-pill">18+</span><p class="cf-hand">play closer.</p>
      <div class="cf-stack">${btn('play', 'play')}${btn('how', 'how to play', 'ghost')}</div>
      <div class="cf-links"><button type="button" data-act="safety">safety</button><button type="button" data-act="get">get cuff'd</button></div></div>`,
      {play: setup, how: howTo, safety, get: () => show(`<button type="button" class="cf-back" data-act="back">← back</button><h2 class="cf-h2">get cuff'd.</h2>
        <p class="cf-lede">The box: soft cuffs, a blindfold and a deck of illustrated challenge cards. Coming soon.</p><div class="cf-row">${btn('back', 'back to the game')}</div>`, {back: home})});
  }
  function howTo() {
    const d = C.decks;
    show(`<button type="button" class="cf-back" data-act="back">← back</button><h2 class="cf-h2">how to play.</h2>
      <ol class="cf-steps">
        <li><div><b>pick your game</b>Partners in crime: same team, collect the keys before you get busted three times. Cuffs on: head to head, first to the target wins.</div></li>
        <li><div><b>draw a challenge</b>One of six decks, chosen by chance. Act it, draw it, do it, say it.</div></li>
        <li><div><b>spin a complication</b>This is where the props come in: cuffed together, blindfolded, wrong hand, whisper only, slow motion.</div></li>
        <li><div><b>beat the clock</b>Finish before the timer runs out. In cuffs on, the loser of a round plays their next turn with two complications.</div></li>
        <li><div><b>finish strong</b>Partners in crime ends with a jailbreak round. Cuffs on ends with the winner spinning the loser's forfeit.</div></li>
      </ol>
      <p class="cf-label">the decks</p>
      <div class="cf-decklist">${Object.values(d).map(x => `<div>${ico(x.ico)}<span><b>${esc(x.name)}</b><small>${esc(x.how)}</small></span></div>`).join('')}</div>
      <p class="cf-muted">Wild cards turn up now and then: a free key, swap roles, lockdown, plot twist, escape artist.</p>
      <div class="cf-row">${btn('play', 'play')}</div>`, {back: home, play: setup});
  }
  function safety() {
    show(`<button type="button" class="cf-back" data-act="back">← back</button><h2 class="cf-h2">safety.</h2>
      <ul class="cf-rules" style="margin-top:16px">
        <li>Cuffs go on wrists only, never tight. You should fit a finger between cuff and wrist.</li>
        <li>Keep the key in the room, where you can both see it. Cuffs off between rounds.</li>
        <li>Never cuff anyone to furniture, and never leave a cuffed person alone.</li>
        <li>Blindfolds come off any time. Clear the floor before anything blindfolded and move slowly.</li>
        <li>The safe word is <b>pineapple</b>. Say it and everything stops, no questions.</li>
        <li>Every card is optional. Use your pass, or just skip it.</li>
        <li>For adults (18+) who both want to play.</li></ul>
      <div class="cf-row">${btn('back', 'got it')}</div>`, {back: home});
  }

  /* ── 1. setup ── */
  function setup() {
    const s = Object.assign({}, DEF, S.last || {});
    show(`<button type="button" class="cf-back" data-act="back">← back</button><h2 class="cf-h2">who's playing?</h2>
      <div class="cf-names"><input name="n1" maxlength="16" placeholder="you" value="${esc(/^(you|player one)$/.test(s.names[0]) ? '' : s.names[0])}"><span class="cf-hand">&amp;</span><input name="n2" maxlength="16" placeholder="them" value="${esc(/^(them|player two)$/.test(s.names[1]) ? '' : s.names[1])}"></div>
      <p class="cf-label">how are you playing?</p>
      ${chips('mode', [['coop', 'partners in crime', 'same team. collect the keys before you get busted.'], ['versus', 'cuffs on', 'head to head. losers get handicaps. winner sets the forfeit.']], s.mode)}
      <p class="cf-label">the vibe</p>${chips('vibe', [['playful', 'playful'], ['flirty', 'flirty']], s.vibe)}
      <p class="cf-label">how long?</p>${chips('len', [['quick', 'quick', 'about 10 minutes'], ['full', 'full', 'about 25 minutes']], s.len)}
      <p class="cf-muted" style="margin-top:20px">Safe word: <b>pineapple</b>. You each get one pass per game.</p>
      <div class="cf-row">${btn('go', 'let\'s play')}</div>`, {
      back: home, 'chip:mode': v => s.mode = v, 'chip:vibe': v => s.vibe = v, 'chip:len': v => s.len = v,
      go: () => {
        const n = [app.querySelector('[name=n1]').value.trim() || 'player one', app.querySelector('[name=n2]').value.trim() || 'player two'];
        S.last = {names: n, mode: s.mode, vibe: s.vibe, len: s.len}; keep();
        G = {names: n, mode: s.mode, vibe: s.vibe, len: s.len, keys: 0, busts: 0, score: [0, 0], cuffed: [false, false], turn: 0, round: 0, passes: [1, 1], used: new Set()};
        round();
      }
    });
  }

  /* ── 2. a round ── */
  function draw() {
    if (Math.random() < 0.14 && G.round > 1) return {wild: pick(C.wilds)};
    const decks = deckFor(); let tries = 0, deck, card;
    do { const [k, d] = pick(decks); deck = Object.assign({k}, d); card = pick(usable(d.cards)); tries++; } while (G.used.has(deck.k + card.t) && tries < 30);
    G.used.add(deck.k + card.t); return {deck, card};
  }
  function round() {
    G.round++;
    const who = G.names[G.turn], other = G.names[1 - G.turn];
    show(`${board()}<p class="cf-hand cf-center">round ${G.round}.</p>
      <h2 class="cf-h2 cf-center">${G.mode === 'versus' ? `${esc(who)}, you're up.` : 'draw a card.'}</h2>
      <p class="cf-muted cf-center">${G.mode === 'versus' ? `${esc(other)} watches, guesses, and judges. Fairly.${G.cuffed[G.turn] ? `<br><b>${esc(who)} lost the last round, so they play this one with a handicap.</b>` : ''}` : `${esc(who)} leads this one. ${esc(other)} helps.`}</p>
      <div class="cf-deck" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="cf-row">${btn('draw', 'draw a card')}</div>`, {draw: () => reveal(draw())});
  }

  function cardHTML(x) {
    if (x.wild) return `<div class="cf-card wild"><div class="cf-card-in">${ico('star', 'big')}<small>wild card</small><h3>${esc(x.wild.t)}</h3><p>${esc(x.wild.d)}</p></div></div>`;
    return `<div class="cf-card d-${x.deck.k}"><div class="cf-card-in">${ico(x.deck.ico, 'big')}<small>${esc(x.deck.name)} · ${x.deck.time}s</small><h3>${esc(x.card.t)}</h3><p>${esc(x.deck.how)}</p></div></div>`;
  }
  function reveal(x) {
    const who = G.names[G.turn];
    if (x.wild) return wild(x);
    show(`${board()}${cardHTML(x)}
      <div class="cf-row">${btn('spin', 'spin a complication')}${G.passes[G.turn] ? btn('pass', `pass (${esc(who)})`, 'ghost') : ''}</div>`, {
      spin: () => spin(x, G.cuffed[G.turn] && G.mode === 'versus' ? 2 : 1),
      pass: () => { G.passes[G.turn] = 0; reveal(draw()); }
    });
    flipIn();
  }
  const flipIn = () => { const c = app.querySelector('.cf-card'); if (c && !still) c.animate([{transform: 'rotateY(90deg) scale(.9)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.2)'}); buzz(15); };

  function wild(x) {
    const fx = x.wild.fx;
    show(`${board()}${cardHTML(x)}<div class="cf-row">${btn('ok', fx === 'key' ? (G.mode === 'coop' ? 'take the key' : 'take the point') : 'got it')}</div>`, {
      ok: () => {
        if (fx === 'key') { G.mode === 'coop' ? G.keys++ : G.score[G.turn]++; return next(); }
        if (fx === 'pass') { G.passes[G.turn]++; return round0(); }
        const y = draw(); if (y.wild) return round0();
        if (fx === 'swap') { G.swap = true; }
        if (fx === 'double') return reveal2(y, 2);
        if (fx === 'pick') return pickComp(y);
        reveal(y);
      }
    });
    flipIn();
  }
  const round0 = () => { G.round--; round(); };
  function reveal2(y, n) { show(`${board()}${cardHTML(y)}<div class="cf-row">${btn('spin', 'spin two complications')}</div>`, {spin: () => spin(y, n)}); flipIn(); }
  function pickComp(y) {
    const other = G.names[1 - G.turn];
    show(`${board()}${cardHTML(y)}<p class="cf-label cf-center">${esc(other)}, pick their complication</p>
      <div class="cf-comps">${C.complications.filter(c => c.ico !== 'star').map((c, i) => `<button type="button" class="cf-comp" data-act="c" data-i="${i}">${ico(c.ico)}<b>${esc(c.t)}</b></button>`).join('')}</div>`,
      {c: b => play(y, [C.complications[+b.dataset.i]])});
  }

  /* ── 3. the complication spinner ── */
  function spin(x, n) {
    const pool = C.complications.filter(c => n === 1 || c.ico !== 'star'), out = [];
    while (out.length < n) { const c = pick(pool); if (!out.includes(c)) out.push(c); }
    show(`${board()}<p class="cf-label cf-center">${n > 1 ? 'two complications' : 'your complication'}</p>
      <div class="cf-reels">${out.map((_, i) => `<div class="cf-reel" data-r="${i}"><span>?</span></div>`).join('')}</div>
      <div class="cf-row" data-after hidden>${btn('go', 'start the clock')}</div>`, {go: () => play(x, out)});
    const reels = [...app.querySelectorAll('[data-r]')]; let done = 0;
    reels.forEach((r, i) => {
      const span = r.querySelector('span'); let k = 0; const total = still ? 1 : 16 + i * 8;
      const tick = () => {
        k++; const c = k >= total ? out[i] : pick(C.complications);
        span.innerHTML = `${ico(c.ico)}<b>${esc(c.t)}</b>${k >= total ? `<small>${esc(c.d)}</small>` : ''}`;
        if (k >= total) { r.classList.add('set'); buzz(25); if (++done === reels.length) app.querySelector('[data-after]').hidden = false; return; }
        T = setTimeout(tick, 40 + k * k * 0.7);
      };
      tick();
    });
  }

  /* ── 4. beat the clock ── */
  function play(x, comps) {
    let secs = x.deck.time; if (comps.some(c => c.t === 'half time')) secs = Math.round(secs / 2);
    const who = G.names[G.swap ? 1 - G.turn : G.turn], other = G.names[G.swap ? G.turn : 1 - G.turn];
    const duel = x.deck.kind === 'duel', guess = x.deck.kind === 'guess';
    show(`${board()}<div class="cf-mini d-${x.deck.k}">${ico(x.deck.ico)}<div><small>${esc(x.deck.name)}${duel ? '' : ` · ${esc(who)} ${guess ? 'acts, ' + esc(other) + ' guesses' : 'leads'}`}</small><b>${esc(x.card.t)}</b></div></div>
      <div class="cf-tags">${comps.map(c => `<span>${ico(c.ico)}${esc(c.t)}</span>`).join('')}</div>
      <div class="cf-timer" data-timer><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="tr"/><circle cx="60" cy="60" r="52" class="tp" pathLength="100"/></svg><b data-n>${secs}</b></div>
      <div class="cf-row" data-go>${btn('start', 'go')}</div>
      <div class="cf-row" data-res hidden>${duel ? G.names.map((n, i) => btn('win', `${esc(n)} won`, i ? 'ghost' : '').replace('data-act="win"', `data-act="win" data-i="${i}"`)).join('') : btn('yes', guess ? 'got it!' : 'done it!') + btn('no', 'ran out', 'ghost')}</div>`, {
      start: b => {
        b.closest('[data-go]').hidden = true; app.querySelector('[data-res]').hidden = false;
        const n = app.querySelector('[data-n]'), p = app.querySelector('.tp'), t0 = performance.now();
        const tick = () => {
          const left = secs - (performance.now() - t0) / 1000;
          n.textContent = Math.max(0, Math.ceil(left)); p.style.strokeDashoffset = String(100 - Math.max(0, left / secs) * 100);
          if (left <= 0) { app.querySelector('[data-timer]').classList.add('out'); buzz([120, 80, 120]); n.textContent = 'time'; return; }
          RAF = requestAnimationFrame(tick);
        };
        RAF = requestAnimationFrame(tick);
      },
      yes: () => result(true), no: () => result(false),
      win: b => { const i = +b.dataset.i; G.score[i]++; G.cuffed = [i !== 0, i !== 1]; G.swap = false; next(i === G.turn ? 'win' : 'lose'); }
    });
  }

  /* ── 5. results ── */
  function result(ok) {
    G.swap = false;
    if (G.mode === 'coop') { ok ? G.keys++ : G.busts++; return next(ok ? 'win' : 'lose'); }
    const w = ok ? G.turn : 1 - G.turn; G.score[w]++; G.cuffed = [w !== 0, w !== 1];
    next(ok ? 'win' : 'lose');
  }
  function next(how) {
    if (G.mode === 'coop' && G.keys >= goal()) return jailbreak();
    if (G.mode === 'coop' && G.busts >= 3) return end(false);
    if (G.mode === 'versus' && Math.max(...G.score) >= goal()) return end(G.score[0] > G.score[1] ? 0 : 1);
    const line = G.mode === 'coop' ? (how === 'win' ? pick(['a key. smooth.', 'clean getaway.', 'nobody saw a thing.']) : how === 'lose' ? pick(['busted.', 'sirens. keep moving.', 'that went badly. beautifully.']) : 'a free key.')
      : (how === 'win' ? 'point scored.' : 'point to the other side.');
    show(`${board()}<div class="cf-stamp ${how === 'lose' ? 'red' : ''}">${esc(line)}</div>
      <p class="cf-muted cf-center">${G.mode === 'versus' && G.cuffed.some(Boolean) ? `${esc(G.names[G.cuffed[0] ? 0 : 1])} carries a handicap into their next turn.` : 'Cuffs off between rounds. Stretch. Hydrate.'}</p>
      <div class="cf-row">${btn('n', 'next round')}</div>`, {n: () => { G.turn = 1 - G.turn; round(); }});
    if (!still && how === 'win') confetti();
  }

  function jailbreak() {
    const x = {deck: Object.assign({k: 'cuffed'}, C.decks.cuffed, {time: 120}), card: pick(usable(C.decks.cuffed.cards))};
    show(`${board()}<p class="cf-hand cf-center">the final round.</p><h2 class="cf-h2 cf-center">jailbreak.</h2>
      <p class="cf-muted cf-center">All the keys. One door left. Two minutes, two complications, cuffed together the whole time.</p>
      ${cardHTML(x)}<div class="cf-row">${btn('spin', 'spin two complications')}</div>`, {
      spin: () => { G.final = true; spin(x, 2); }
    });
    flipIn();
    const orig = result; result = ok => { result = orig; end(!!ok); };
  }

  /* ── 6. endings ── */
  function end(r) {
    if (G.mode === 'coop') {
      show(`<div class="cf-end ${r ? '' : 'lost'}">${ico(r ? 'key' : 'lock', 'huge')}<h2 class="cf-h2">${r ? 'you broke out.' : 'busted.'}</h2>
        <p class="cf-lede">${r ? `${esc(G.names[0])} and ${esc(G.names[1])}: partners in crime, ${G.keys} keys, ${G.busts} close calls.` : `The cuffs win this time. ${G.keys} keys between you.`}</p>
        <div class="cf-row">${btn('again', r ? 'one more heist' : 'rematch')}${btn('home', 'change the rules', 'ghost')}</div></div>`, {again: restart, home});
      if (r && !still) confetti(true);
      return;
    }
    const w = r, l = 1 - w, pool = usable(C.forfeits);
    show(`<div class="cf-end">${ico('star', 'huge')}<h2 class="cf-h2">${esc(G.names[w])} wins.</h2><p class="cf-lede">${G.score[w]} to ${G.score[l]}. ${esc(G.names[w])}, spin ${esc(G.names[l])}'s forfeit.</p>
      <div class="cf-reels"><div class="cf-reel wide" data-r="0"><span>?</span></div></div>
      <div class="cf-row">${btn('spin', 'spin the forfeit')}</div><div class="cf-row" data-after hidden>${btn('again', 'rematch')}${btn('home', 'change the rules', 'ghost')}</div></div>`, {
      spin: b => {
        b.remove(); const span = app.querySelector('[data-r] span'); let k = 0; const total = still ? 1 : 22, fin = pick(pool);
        const tick = () => { k++; const f = k >= total ? fin : pick(pool); span.innerHTML = `<b>${esc(G.names[l])} ${esc(f.t)}</b>`;
          if (k >= total) { app.querySelector('[data-r]').classList.add('set'); buzz(40); app.querySelector('[data-after]').hidden = false; confetti(true); return; }
          T = setTimeout(tick, 40 + k * k * 0.6); };
        tick();
      },
      again: restart, home
    });
  }
  const restart = () => { Object.assign(G, {keys: 0, busts: 0, score: [0, 0], cuffed: [false, false], turn: 0, round: 0, passes: [1, 1], used: new Set()}); round(); };

  function confetti(big) {
    const l = document.createElement('div'); l.className = 'cf-burst'; l.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < (big ? 26 : 12); i++) { const s = document.createElement('span'); s.innerHTML = ico(i % 3 ? 'key' : 'star');
      s.style.setProperty('--x', `${(Math.random() - .5) * 340}px`); s.style.setProperty('--y', `${-140 - Math.random() * 260}px`); s.style.setProperty('--r', `${(Math.random() - .5) * 200}deg`); s.style.animationDelay = `${Math.random() * 150}ms`; l.appendChild(s); }
    document.body.appendChild(l); setTimeout(() => l.remove(), 1700);
  }

  home();
})();
