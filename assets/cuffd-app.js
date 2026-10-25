/* Cuff'd (DRAFT) v2 engine. You play cuffed together from the first card until you've earned your way out.
   Team ("partners in crime"): shared keys, 5 or 10 to unlock. Duels still pick a loser, who takes a forfeit.
   Head to head ("cuffs on"): your own keys, first to 3 (or 6) unlocks and wins; the loser takes a final forfeit.
   Every challenge has its props built in, plus an optional "turn it up" line. Fail a card and you draw a forfeit.
   Wild cards change the next round. Nothing leaves the phone. */
(() => {
  const C = window.CUFFD_CARDS, app = document.getElementById('cf-app');
  if (!C || !app) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
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
  ICO.heart = '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>';
  const ico = (k, cls = '') => `<svg class="cf-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[k] || ICO.star}</svg>`;
  const TYPE = C.types;

  let G = null, S = {};
  try { S = JSON.parse(localStorage.getItem('cuffd:draft')) || {}; } catch (_) {}
  const keep = () => { try { localStorage.setItem('cuffd:draft', JSON.stringify(S)); } catch (_) {} };
  const target = () => G.mode === 'team' ? G.keysTo : (G.keysTo === 5 ? 3 : 6);

  let ACT = {}, T = 0, RAF = 0;
  const show = (html, acts) => { cancelAnimationFrame(RAF); clearTimeout(T); app.innerHTML = `<div class="cf-screen${still ? '' : ' in'}">${html}</div>`; ACT = acts || {}; scrollTo({top: 0, behavior: 'auto'}); };
  app.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (b && ACT[b.dataset.act]) return ACT[b.dataset.act](b, e);
    const c = e.target.closest('[data-chip]');
    if (c) { const g = c.dataset.g; app.querySelectorAll(`[data-g="${g}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === c))); ACT['chip:' + g] && ACT['chip:' + g](c.dataset.chip); }
  });
  const btn = (act, label, cls = '') => `<button type="button" class="cf-btn ${cls}" data-act="${act}">${label}</button>`;
  const chips = (g, opts, sel) => `<div class="cf-chips">${opts.map(([v, l, sub]) => `<button type="button" class="cf-chip" data-g="${g}" data-chip="${v}" aria-pressed="${v === sel}"><b>${l}</b>${sub ? `<small>${sub}</small>` : ''}</button>`).join('')}</div>`;
  const back = '<button type="button" class="cf-back" data-act="back">← back</button>';

  /* ── home, how to play, safety ── */
  function home() {
    show(`<div class="cf-home"><h1 class="cf-logo">Cuff'd.</h1><p class="cf-sub">couples game</p>
      <p class="cf-tag">Playful challenges, deeper conversations, and a little mischief. For couples at every stage.</p>
      <span class="cf-pill">18+</span><p class="cf-hand">play closer.</p>
      <div class="cf-stack">${btn('play', 'play')}${btn('how', 'how to play', 'ghost')}</div>
      <div class="cf-links"><button type="button" data-act="safety">safety</button><button type="button" data-act="get">get cuff'd</button></div></div>`,
      {play: setup, how: howTo, safety, get: () => show(`${back}<h2 class="cf-h2">get cuff'd.</h2><p class="cf-lede">The box: soft cuffs, a blindfold and a deck of illustrated challenge cards. Coming soon.</p><div class="cf-row">${btn('back', 'back to the game')}</div>`, {back: home})});
  }
  function howTo() {
    show(`${back}<h2 class="cf-h2">how to play.</h2>
      <ol class="cf-steps">
        <li><div><b>cuff up</b>One wrist each, cuffed together. The key goes in a glass where you can both see it. It stays there until you've earned your way out.</div></li>
        <li><div><b>draw a card</b>Every card has its props built in. Do it before the timer runs out. Tap "turn it up" if you're feeling brave.</div></li>
        <li><div><b>earn keys</b>Complete a card, earn a key. Fail it, draw a forfeit. Duels always have a loser, and the loser takes the forfeit.</div></li>
        <li><div><b>get out</b>Partners in crime: earn 5 or 10 keys together. Cuffs on: you each earn your own, first to 3 or 6 holds the key.</div></li>
      </ol>
      <p class="cf-label">the decks</p>
      <div class="cf-decklist">${Object.values(TYPE).map(x => `<div>${ico(x.ico)}<span><b>${esc(x.name)}</b></span></div>`).join('')}</div>
      <p class="cf-muted">Wild cards turn up now and then: reversal, not a word, half time, double or nothing, your partner's pick, a lucky break, and a breather.</p>
      <div class="cf-row">${btn('play', 'play')}</div>`, {back: home, play: setup});
  }
  function safety() {
    show(`${back}<h2 class="cf-h2">safety.</h2><ul class="cf-rules" style="margin-top:16px">
        <li>Cuffs go on wrists only, never tight. You should fit a finger between cuff and wrist.</li>
        <li>The key stays in the room where you can both see it. If anything feels wrong, unlock. Keys don't matter.</li>
        <li>Never cuff anyone to furniture, and never leave a cuffed person alone.</li>
        <li>Blindfolds come off any time. Clear the floor before anything blindfolded and move slowly.</li>
        <li>The safe word is <b>pineapple</b>. Say it and everything stops, no questions.</li>
        <li>Every card is optional, and so is every forfeit. Use your pass, or just skip it.</li>
        <li>For adults (18+) who both want to play.</li></ul>
      <div class="cf-row">${btn('back', 'got it')}</div>`, {back: home});
  }

  /* ── setup and cuffing up ── */
  function setup() {
    const s = Object.assign({names: ['', ''], mode: 'team', keysTo: 5}, S.last || {});
    show(`${back}<h2 class="cf-h2">who's playing?</h2>
      <div class="cf-names"><input name="n1" maxlength="16" placeholder="you" value="${esc(s.names[0])}"><span class="cf-hand">&amp;</span><input name="n2" maxlength="16" placeholder="them" value="${esc(s.names[1])}"></div>
      <p class="cf-label">how are you playing?</p>
      ${chips('mode', [['team', 'partners in crime', 'one team. earn the keys together. duels still have a loser.'], ['versus', 'cuffs on', 'head to head. you each earn your own keys. first out wins.']], s.mode)}
      <p class="cf-label">how many keys to get out?</p>
      ${chips('keys', [['5', '5 keys', 'about 20 minutes'], ['10', '10 keys', 'a proper night of it']], String(s.keysTo))}
      <p class="cf-muted" style="margin-top:20px">Safe word: <b>pineapple</b>. You each get one pass per game.</p>
      <div class="cf-row">${btn('go', 'next: cuff up')}</div>`, {
      back: home, 'chip:mode': v => s.mode = v, 'chip:keys': v => s.keysTo = +v,
      go: () => {
        const n = [app.querySelector('[name=n1]').value.trim(), app.querySelector('[name=n2]').value.trim()];
        S.last = {names: n, mode: s.mode, keysTo: s.keysTo}; keep();
        G = {names: [n[0] || 'player one', n[1] || 'player two'], mode: s.mode, keysTo: s.keysTo, keys: 0, own: [0, 0], turn: 0, round: 0, passes: [1, 1], next: {}, deck: shuffle(C.challenges), wildIn: 2, hc: [null, null]};
        cuffUp();
      }
    });
  }
  function cuffUp() {
    show(`<div class="cf-center">${ico('cuffs', 'huge')}<h2 class="cf-h2">cuff up.</h2>
      <p class="cf-lede">One wrist each, cuffed together. Put the key in a glass where you can both see it.</p>
      <p class="cf-muted">${G.mode === 'team' ? `It stays there until the two of you have earned ${G.keysTo} keys.` : `Whoever earns ${target()} keys first gets to unlock you both. And chooses the loser's forfeit.`}</p>
      <div class="cf-row">${btn('go', 'we\'re cuffed')}</div></div>`, {go: round});
  }

  /* ── the board ── */
  function board() {
    if (G.mode === 'team') {
      const k = Array.from({length: G.keysTo}, (_, i) => `<span class="${i < G.keys ? 'on' : ''}">${ico('key')}</span>`).join('');
      return `<div class="cf-board"><div><small>keys to get out</small><div class="cf-pips">${k}</div></div><div style="text-align:right"><small>${G.keys} of ${G.keysTo}</small></div></div>`;
    }
    return `<div class="cf-board vs">${G.names.map((n, i) => `<div class="${G.turn === i ? 'me' : ''}"><small>${esc(n)}</small><b>${G.own[i]}</b></div>`).join('<i>vs</i>')}<em>first to ${target()} keys</em></div>`;
  }

  /* ── a round ── */
  const leader = () => G.names[G.turn], other = () => G.names[1 - G.turn];
  function round() {
    G.round++;
    show(`${board()}<p class="cf-hand cf-center">round ${G.round}.</p>
      <h2 class="cf-h2 cf-center">${esc(leader())}, you lead.</h2>
      <p class="cf-muted cf-center">${G.mode === 'team' ? `${esc(other())} is cuffed to you, so ${esc(other())} is in it too.` : `${esc(other())} times it and judges. Fairly.`}</p>
      ${nextTags()}
      <div class="cf-deck" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="cf-row">${btn('draw', 'draw a card')}</div>`, {draw: () => drawCard()});
  }
  /* head to head: whoever lost the last round plays their next hands-on card with one handicap */
  const HANDICAPS = [['hand', 'wrong hand'], ['hand', 'free hand behind your back'], ['shh', 'not a word']];
  const handsOn = c => c && ['cuffs', 'blind', 'draw'].includes(c.p);
  const nextTags = c => {
    const n = G.next, t = [];
    if (G.mode === 'versus' && G.hc[G.turn] && (!c || handsOn(c))) t.push(G.hc[G.turn]);
    if (n.silent) t.push(['shh', 'not a word']); if (n.half) t.push(['clock', 'half time · worth 2 keys']); if (n.double) t.push(['key', 'double or nothing']);
    return t.length ? `<div class="cf-tags cf-tags-c">${t.map(([i, l]) => `<span>${ico(i)}${l}</span>`).join('')}</div>` : '';
  };
  function nextChallenge() { if (!G.deck.length) G.deck = shuffle(C.challenges); return G.deck.pop(); }
  function drawCard() {
    if (G.round >= G.wildIn && Math.random() < 0.3) { G.wildIn = G.round + 3; return wild(pick(C.wilds.filter(w => G.mode === 'team' ? !w.versus : !w.team))); }
    reveal(nextChallenge());
  }
  const flipIn = () => { const c = app.querySelector('.cf-card'); if (c && !still) c.animate([{transform: 'rotateY(90deg) scale(.9)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.2)'}); buzz(15); };
  const secsOf = c => G.next.half ? Math.round(c.s / 2) : c.s;
  function cardHTML(c, up) {
    const ty = TYPE[c.p];
    return `<div class="cf-card d-${c.p}"><div class="cf-card-in">${ico(ty.ico, 'big')}<small>${esc(ty.name)} · ${secsOf(c)}s</small><h3>${esc(c.t)}</h3><p>${esc(c.how)}</p>
      ${up ? `<div class="cf-up"><small>turn it up</small><p>${esc(c.up)}</p></div>` : ''}</div></div>`;
  }
  function reveal(c, up = false) {
    show(`${board()}${cardHTML(c, up)}${nextTags(c)}
      <div class="cf-row">${btn('up', up ? 'turn it down' : 'turn it up', 'ghost up')}</div>
      <div class="cf-row">${btn('go', 'start the clock')}${G.passes[G.turn] ? btn('pass', `pass (${esc(leader())})`, 'ghost') : ''}</div>`, {
      up: () => reveal(c, !up), go: () => play(c, up),
      pass: () => { G.passes[G.turn] = 0; reveal(nextChallenge()); }
    });
    if (!up) flipIn();
  }

  /* ── wild cards ── */
  function wild(w) {
    show(`${board()}<div class="cf-card wild"><div class="cf-card-in">${ico('star', 'big')}<small>wild card</small><h3>${esc(w.t)}</h3><p>${esc(w.d)}</p></div></div>
      <div class="cf-row">${btn('ok', w.fx === 'breather' ? 'cuffs off' : w.fx === 'key' || w.fx === 'steal' ? 'take it' : 'got it')}</div>`, {
      ok: () => {
        const fx = w.fx;
        if (fx === 'key') { G.keys++; return after('lucky.'); }
        if (fx === 'steal') { if (G.own[1 - G.turn] > 0) { G.own[1 - G.turn]--; G.own[G.turn]++; } return after('pickpocketed.'); }
        if (fx === 'breather') return breather();
        if (fx === 'swap') { G.turn = 1 - G.turn; G.round--; return round(); }
        if (fx === 'pick') return partnerPick();
        G.next[fx] = true; G.round--; round();
      }
    });
    flipIn();
  }
  function breather() {
    show(`<div class="cf-center">${ico('cuffs', 'huge')}<h2 class="cf-h2">breather.</h2><p class="cf-lede">Cuffs off. Stretch, drink some water, swap wrists if you like.</p>
      <div class="cf-row">${btn('go', 'cuffed back up')}</div></div>`, {go: () => { G.turn = 1 - G.turn; round(); }});
  }
  function partnerPick() {
    const three = [nextChallenge(), nextChallenge(), nextChallenge()];
    show(`${board()}<p class="cf-label cf-center">${esc(other())}, pick ${esc(leader())}'s card</p>
      <div class="cf-picks">${three.map((c, i) => `<button type="button" class="cf-pickc" data-act="p" data-i="${i}">${ico(TYPE[c.p].ico)}<span><small>${esc(TYPE[c.p].name)} · ${c.s}s</small><b>${esc(c.t)}</b></span></button>`).join('')}</div>`,
      {p: b => reveal(three[+b.dataset.i])});
  }

  /* ── beat the clock ── */
  function play(c, up) {
    const secs = secsOf(c), duel = c.p === 'duel', ty = TYPE[c.p];
    show(`${board()}<div class="cf-mini d-${c.p}">${ico(ty.ico)}<div><small>${esc(ty.name)} · ${esc(duel ? 'head to head' : leader() + ' leads')}</small><b>${esc(c.t)}</b></div></div>
      ${up ? `<div class="cf-tags"><span>${ico('heart')}${esc(c.up)}</span></div>` : ''}${nextTags(c)}
      <div class="cf-timer" data-timer><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="tr"/><circle cx="60" cy="60" r="52" class="tp" pathLength="100"/></svg><b data-n>${secs}</b></div>
      <div class="cf-row" data-go>${btn('start', 'go')}</div>
      <div class="cf-row" data-res hidden>${duel ? G.names.map((n, i) => `<button type="button" class="cf-btn ${i ? 'ghost' : ''}" data-act="win" data-i="${i}">${esc(n)} won</button>`).join('') : btn('yes', 'done it!') + btn('no', 'ran out', 'ghost')}</div>`, {
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
      yes: () => outcome(true), no: () => outcome(false),
      win: b => duelWon(+b.dataset.i)
    });
  }

  /* ── outcomes ── */
  const worth = () => (G.next.half || G.next.double) ? 2 : 1;
  function outcome(ok) {
    const w = worth(), dbl = G.next.double; G.next = {};
    if (G.mode === 'versus') G.hc = ok ? [G.turn === 0 ? null : pick(HANDICAPS), G.turn === 1 ? null : pick(HANDICAPS)] : [G.turn === 0 ? pick(HANDICAPS) : null, G.turn === 1 ? pick(HANDICAPS) : null];
    if (ok) {
      if (G.mode === 'team') G.keys += w; else G.own[G.turn] += w;
      return after(w > 1 ? 'two keys.' : pick(['a key. smooth.', 'clean getaway.', 'one step closer.']));
    }
    if (dbl) { if (G.mode === 'team') G.keys = Math.max(0, G.keys - 1); else G.own[G.turn] = Math.max(0, G.own[G.turn] - 1); }
    forfeit(G.mode === 'team' ? null : G.turn, dbl ? 'double or nothing. you lose a key, and' : 'ran out of time.');
  }
  function duelWon(i) {
    const w = worth(); G.next = {};
    if (G.mode === 'versus') G.hc = [i === 0 ? null : pick(HANDICAPS), i === 1 ? null : pick(HANDICAPS)];
    if (G.mode === 'team') G.keys += w; else G.own[i] += w;
    forfeit(1 - i, G.mode === 'team' ? `a key for the team. ${esc(G.names[i])} won the duel, so` : `${esc(G.names[i])} takes the key, and`);
  }
  function forfeit(who, lead) {
    const f = pick(C.forfeits), name = who == null ? 'you both' : G.names[who];
    show(`${board()}<p class="cf-muted cf-center">${lead}</p><p class="cf-label cf-center">${esc(name)} ${who == null ? 'take' : 'takes'} a forfeit</p>
      <div class="cf-card forfeit"><div class="cf-card-in">${ico('heart', 'big')}<small>forfeit</small><h3>${esc(f.t)}</h3><p>${esc(f.d)}</p></div></div>
      <div class="cf-row">${btn('ok', 'done')}${btn('skip', 'skip it', 'ghost')}</div>`, {ok: () => after(null), skip: () => after(null)});
    flipIn();
  }
  function after(line) {
    if (G.mode === 'team' && G.keys >= G.keysTo) return escape();
    if (G.mode === 'versus' && Math.max(...G.own) >= target()) return winner(G.own[0] >= target() ? 0 : 1);
    if (!line) { G.turn = 1 - G.turn; return round(); }
    show(`${board()}<div class="cf-stamp">${esc(line)}</div><div class="cf-row">${btn('n', 'next card')}</div>`, {n: () => { G.turn = 1 - G.turn; round(); }});
    if (!still) confetti();
  }

  /* ── getting out ── */
  function escape() {
    show(`<div class="cf-end">${ico('key', 'huge')}<h2 class="cf-h2">unlocked.</h2>
      <p class="cf-lede">${esc(G.names[0])} and ${esc(G.names[1])}: ${G.keysTo} keys, ${G.round} rounds. Take the key out of the glass. Or don't.</p>
      <div class="cf-row">${btn('again', 'cuff up again')}${btn('home', 'home', 'ghost')}</div></div>`, {again: setup, home});
    if (!still) confetti(true);
  }
  function winner(w) {
    const l = 1 - w;
    show(`<div class="cf-end">${ico('key', 'huge')}<h2 class="cf-h2">${esc(G.names[w])} holds the key.</h2>
      <p class="cf-lede">${G.own[w]} to ${G.own[l]}. ${esc(G.names[w])}, draw ${esc(G.names[l])}'s forfeit. Then decide when to unlock.</p>
      <div class="cf-reels"><div class="cf-reel wide" data-r><span>?</span></div></div>
      <div class="cf-row" data-spin>${btn('spin', 'draw the forfeit')}</div><div class="cf-row" data-after hidden>${btn('again', 'rematch')}${btn('home', 'home', 'ghost')}</div></div>`, {
      spin: b => {
        b.closest('[data-spin]').hidden = true; const span = app.querySelector('[data-r] span'); let k = 0; const total = still ? 1 : 20, fin = pick(C.forfeits);
        const tick = () => { k++; const f = k >= total ? fin : pick(C.forfeits); span.innerHTML = `${ico('heart')}<b>${esc(f.t)}</b>${k >= total ? `<small>${esc(f.d)}</small>` : ''}`;
          if (k >= total) { app.querySelector('[data-r]').classList.add('set'); buzz(40); app.querySelector('[data-after]').hidden = false; confetti(true); return; }
          T = setTimeout(tick, 40 + k * k * 0.6); };
        tick();
      },
      again: setup, home
    });
  }

  function confetti(big) {
    const l = document.createElement('div'); l.className = 'cf-burst'; l.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < (big ? 26 : 12); i++) { const s = document.createElement('span'); s.innerHTML = ico(i % 3 ? 'key' : 'star');
      s.style.setProperty('--x', `${(Math.random() - .5) * 340}px`); s.style.setProperty('--y', `${-140 - Math.random() * 260}px`); s.style.setProperty('--r', `${(Math.random() - .5) * 200}deg`); s.style.animationDelay = `${Math.random() * 150}ms`; l.appendChild(s); }
    document.body.appendChild(l); setTimeout(() => l.remove(), 1700);
  }

  home();
})();
