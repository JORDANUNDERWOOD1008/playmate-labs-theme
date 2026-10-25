/* Cuff'd (DRAFT) v3 engine.
   Partners in crime (team): cuffed together, shared keys (5 or 10) and busts. Three busts = a forfeit, busts reset.
   Duels inside the team game: the team still earns the key, the duel loser takes a forfeit.
   Cuffs on (head to head): one player is cuffed (solo) and earns keys (3 or 5) while the other is the warden.
   Escape, then the cuffs switch. Fewer cards wins the round. Best of three rounds; the loser takes a final forfeit.
   Each challenge says cuff'd together or cuff'd solo. Complications are a separate deck: draw one per challenge,
   and if its type isn't one the challenge allows, draw again (the box works the same way). */
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
  const TYPE = C.types, CX = C.complications;

  let G = null, S = {};
  try { S = JSON.parse(localStorage.getItem('cuffd:draft')) || {}; } catch (_) {}
  const keep = () => { try { localStorage.setItem('cuffd:draft', JSON.stringify(S)); } catch (_) {} };
  const team = () => G.mode === 'team';

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
      {play: setup, how: howTo, safety, get: () => show(`${back}<h2 class="cf-h2">get cuff'd.</h2><p class="cf-lede">The box: soft cuffs, a blindfold, illustrated challenge cards and a deck of complications. Coming soon.</p><div class="cf-row">${btn('back', 'back to the game')}</div>`, {back: home})});
  }
  function howTo() {
    show(`${back}<h2 class="cf-h2">how to play.</h2>
      <p class="cf-label">partners in crime</p>
      <ol class="cf-steps">
        <li><div><b>cuff up together</b>Wrist to wrist. The key goes in a glass where you can both see it.</div></li>
        <li><div><b>draw a challenge, then a complication</b>Each challenge shows the twists that suit it. Draw a complication that doesn't fit? Draw again.</div></li>
        <li><div><b>keys and busts</b>Beat the clock for a key. Run out and it's a bust. Three busts and you both take a forfeit, then the busts reset.</div></li>
        <li><div><b>get out</b>Earn 5 or 10 keys between you and you're free. Duels still have a loser: the team gets the key, the loser takes a forfeit.</div></li>
      </ol>
      <p class="cf-label">cuffs on</p>
      <ol class="cf-steps">
        <li><div><b>one of you is cuffed</b>Wrists cuffed in front. The other is the warden: runs the clock, judges, plays fair.</div></li>
        <li><div><b>escape</b>Earn 3 or 5 keys to get out. Every card counts, so fewer is better. Three busts and the cuffed player takes a forfeit.</div></li>
        <li><div><b>switch the cuffs</b>Then the other one tries to escape. Whoever got out in fewer cards wins the round. Best of three.</div></li>
      </ol>
      <p class="cf-muted">Wild cards turn up now and then: reversal, not a word, half time, double or nothing, your partner's pick, lucky break, clean record, and a breather.</p>
      <div class="cf-row">${btn('play', 'play')}</div>`, {back: home, play: setup});
  }
  function safety() {
    show(`${back}<h2 class="cf-h2">safety.</h2><ul class="cf-rules" style="margin-top:16px">
        <li>Cuffs go on wrists and ankles only, never tight. You should fit a finger between cuff and skin.</li>
        <li>The key stays in the room where you can both see it. If anything feels wrong, unlock. Keys don't matter.</li>
        <li>Never cuff anyone to furniture, and never leave a cuffed person alone.</li>
        <li>Ankle complications: sit down, or stay on carpet. Behind the back: no standing tasks.</li>
        <li>Blindfolds come off any time. Clear the floor before anything blindfolded and move slowly.</li>
        <li>The safe word is <b>pineapple</b>. Say it and everything stops, no questions.</li>
        <li>Every card is optional, and so is every forfeit. For adults (18+) who both want to play.</li></ul>
      <div class="cf-row">${btn('back', 'got it')}</div>`, {back: home});
  }

  /* ── setup ── */
  function setup() {
    const s = Object.assign({names: ['', ''], mode: 'team', len: 'short'}, S.last || {});
    const lenChips = () => chips('len', s.mode === 'team' ? [['short', '5 keys', 'about 20 minutes'], ['long', '10 keys', 'a proper night of it']] : [['short', '3 keys each', 'about 25 minutes, best of three'], ['long', '5 keys each', 'a long night, best of three']], s.len);
    const draw = () => show(`${back}<h2 class="cf-h2">who's playing?</h2>
      <div class="cf-names"><input name="n1" maxlength="16" placeholder="you" value="${esc(s.names[0])}"><span class="cf-hand">&amp;</span><input name="n2" maxlength="16" placeholder="them" value="${esc(s.names[1])}"></div>
      <p class="cf-label">how are you playing?</p>
      ${chips('mode', [['team', 'partners in crime', 'cuffed together. earn your way out as a team.'], ['versus', 'cuffs on', 'one of you cuffed at a time. fastest escape wins.']], s.mode)}
      <p class="cf-label">how long?</p>${lenChips()}
      <p class="cf-muted" style="margin-top:20px">Safe word: <b>pineapple</b>. You each get one pass per game.</p>
      <div class="cf-row">${btn('go', 'next: cuff up')}</div>`, {
      back: home,
      'chip:mode': v => { s.mode = v; s.names = [app.querySelector('[name=n1]').value.trim(), app.querySelector('[name=n2]').value.trim()]; draw(); },
      'chip:len': v => s.len = v,
      go: () => {
        const n = [app.querySelector('[name=n1]').value.trim(), app.querySelector('[name=n2]').value.trim()];
        S.last = {names: n, mode: s.mode, len: s.len}; keep();
        const isTeam = s.mode === 'team';
        G = {names: [n[0] || 'player one', n[1] || 'player two'], mode: s.mode,
          keysTo: isTeam ? (s.len === 'long' ? 10 : 5) : (s.len === 'long' ? 5 : 3),
          keys: 0, busts: 0, bTot: 0, cards: 0, turn: 0, cuffed: 0, round: 0, passes: [1, 1], next: {},
          esc: [], rounds: [0, 0], set: 1,
          deck: shuffle(C.challenges.filter(c => c.c === 'any' || c.c === (isTeam ? 'together' : 'solo'))),
          comps: shuffle(C.compDeck), wildIn: 2};
        cuffUp();
      }
    });
    draw();
  }
  function cuffUp() {
    const who = G.names[G.cuffed], warden = G.names[1 - G.cuffed];
    show(`<div class="cf-center">${ico('cuffs', 'huge')}<h2 class="cf-h2">${team() ? 'cuff up.' : `${esc(who)}, cuff up.`}</h2>
      <p class="cf-lede">${team() ? 'One wrist each, cuffed together. Put the key in a glass where you can both see it.' : `Wrists cuffed in front. ${esc(warden)} is the warden: they run the clock, judge, and keep the key.`}</p>
      <p class="cf-muted">${team() ? `It stays there until the two of you have earned ${G.keysTo} keys.` : `Earn ${G.keysTo} keys to get out, in as few cards as you can. Round ${G.set}, best of three.`}</p>
      <div class="cf-row">${btn('go', 'cuffed')}</div></div>`, {go: round});
  }

  /* ── the board ── */
  const pips = (n, on, ic, cls = '') => Array.from({length: n}, (_, i) => `<span class="${i < on ? 'on ' + cls : ''}">${ico(ic)}</span>`).join('');
  function board() {
    const top = team() ? '' : `<div class="cf-tally"><span>${esc(G.names[0])} <b>${G.rounds[0]}</b></span><i>round ${G.set} · best of three</i><span><b>${G.rounds[1]}</b> ${esc(G.names[1])}</span></div>`;
    return `${top}<div class="cf-board"><div><small>${team() ? 'keys to get out' : `${esc(G.names[G.cuffed])} is cuffed`}</small><div class="cf-pips">${pips(G.keysTo, G.keys, 'key')}</div></div>
      <div style="text-align:right"><small>busts${team() ? '' : ` · ${G.cards} card${G.cards === 1 ? '' : 's'}`}</small><div class="cf-pips" style="justify-content:flex-end">${pips(3, G.busts, 'lock', 'bust')}</div></div></div>`;
  }

  /* ── a round ── */
  const leader = () => team() ? G.names[G.turn] : G.names[G.cuffed];
  const partner = () => team() ? G.names[1 - G.turn] : G.names[1 - G.cuffed];
  function round() {
    G.round++;
    show(`${board()}<p class="cf-hand cf-center">${team() ? `card ${G.round}.` : `card ${G.cards + 1}.`}</p>
      <h2 class="cf-h2 cf-center">${esc(leader())}, you ${team() ? 'lead' : 'play'}.</h2>
      <p class="cf-muted cf-center">${team() ? `${esc(partner())} is cuffed to you, so ${esc(partner())} is in it too.` : `${esc(partner())} times it and judges. Fairly.`}</p>
      ${nextTags()}
      <div class="cf-deck" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="cf-row">${btn('draw', 'draw a challenge')}</div>`, {draw: drawCard});
  }
  const nextTags = () => {
    const n = G.next, t = [];
    if (n.silent) t.push(['shh', 'not a word']); if (n.half) t.push(['clock', 'half time · worth 2 keys']); if (n.double) t.push(['key', 'double or nothing']);
    return t.length ? `<div class="cf-tags cf-tags-c">${t.map(([i, l]) => `<span>${ico(i)}${l}</span>`).join('')}</div>` : '';
  };
  function nextChallenge() { if (!G.deck.length) G.deck = shuffle(C.challenges.filter(c => c.c === 'any' || c.c === (team() ? 'together' : 'solo'))); return G.deck.pop(); }
  function drawCard() {
    if (G.round >= G.wildIn && Math.random() < 0.28) { G.wildIn = G.round + 3; return wild(pick(C.wilds.filter(w => team() || !w.team))); }
    reveal(nextChallenge());
  }
  const flipIn = sel => { const c = app.querySelector(sel || '.cf-card'); if (c && !still) c.animate([{transform: 'rotateY(90deg) scale(.9)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.2)'}); buzz(15); };
  const secsOf = c => G.next.half ? Math.round(c.s / 2) : c.s;
  const cuffLabel = c => (c.c === 'any' ? (team() ? 'together' : 'solo') : c.c);
  const fits = c => (c.cx || []).filter(k => CX[k] && CX[k][cuffLabel(c)]);
  function cardHTML(c, up) {
    const ty = TYPE[c.p], ok = fits(c);
    return `<div class="cf-card d-${c.p}"><div class="cf-card-in"><span class="cf-cuffline">cuff'd ${cuffLabel(c)}</span>${ico(ty.ico, 'big')}<small>${esc(ty.name)} · ${secsOf(c)}s</small><h3>${esc(c.t)}</h3><p>${esc(c.how)}</p>
      ${up ? `<div class="cf-up"><small>turn it up</small><p>${esc(c.up)}</p></div>` : ''}
      <div class="cf-fits" title="complications that suit this card">${ok.length ? ok.map(k => `<span title="${esc(CX[k].t)}">${ico(CX[k].ico)}</span>`).join('') : '<em>played straight</em>'}</div></div></div>`;
  }
  function reveal(c, up = false) {
    G.cards++;
    show(`${board()}${cardHTML(c, up)}${nextTags()}
      <div class="cf-row">${btn('up', up ? 'turn it down' : 'turn it up', 'ghost up')}</div>
      <div class="cf-row">${btn('comp', fits(c).length ? 'draw a complication' : 'start the clock')}${G.passes[team() ? G.turn : G.cuffed] ? btn('pass', `pass (${esc(leader())})`, 'ghost') : ''}</div>`, {
      up: () => { G.cards--; reveal(c, !up); }, comp: () => fits(c).length ? compDraw(c, up) : play(c, up, null),
      pass: () => { G.passes[team() ? G.turn : G.cuffed] = 0; G.cards--; reveal(nextChallenge()); }
    });
    if (!up) flipIn();
  }

  /* ── the complication deck: draw until one suits the card ── */
  function nextComp() { if (!G.comps.length) G.comps = shuffle(C.compDeck); return G.comps.pop(); }
  function compDraw(c, up) {
    const ok = fits(c), mode = cuffLabel(c); let tries = [], comp;
    for (let i = 0; i < 12; i++) { comp = nextComp(); if (comp.k === 'none' || (ok.includes(comp.k) && comp[mode])) break; tries.push(comp); comp = null; }
    if (!comp) comp = {k: 'none', t: 'as it comes', together: 'No twist this time.', solo: 'No twist this time.'};
    const icoK = comp.k === 'none' ? 'star' : CX[comp.k].ico;
    show(`${board()}<div class="cf-mini d-${c.p}">${ico(TYPE[c.p].ico)}<div><small>cuff'd ${mode} · ${esc(TYPE[c.p].name)}</small><b>${esc(c.t)}</b></div></div>
      ${tries.length ? `<p class="cf-muted cf-center cf-small">${tries.length === 1 ? `Drew "${esc(tries[0].t)}", which doesn't suit this card. Drew again.` : `${tries.length} complications didn't suit this card. Drew again.`}</p>` : ''}
      <div class="cf-card comp"><div class="cf-card-in">${ico(icoK, 'big')}<small>complication</small><h3>${esc(comp.t)}</h3><p>${esc(comp[mode])}</p></div></div>
      <div class="cf-row">${btn('go', 'start the clock')}</div>`, {go: () => play(c, up, comp)});
    flipIn('.cf-card.comp');
  }

  /* ── wild cards ── */
  function wild(w) {
    show(`${board()}<div class="cf-card wild"><div class="cf-card-in">${ico('star', 'big')}<small>wild card</small><h3>${esc(w.t)}</h3><p>${esc(w.d)}</p></div></div>
      <div class="cf-row">${btn('ok', w.fx === 'breather' ? 'cuffs off' : w.fx === 'key' ? 'take the key' : 'got it')}</div>`, {
      ok: () => {
        const fx = w.fx;
        if (fx === 'key') { G.keys++; return after('lucky.'); }
        if (fx === 'unbust') { G.busts = Math.max(0, G.busts - 1); return after('clean record.'); }
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
      <div class="cf-row">${btn('go', 'cuffed back up')}</div></div>`, {go: () => { if (team()) G.turn = 1 - G.turn; round(); }});
  }
  function partnerPick() {
    const three = [nextChallenge(), nextChallenge(), nextChallenge()];
    show(`${board()}<p class="cf-label cf-center">${esc(partner())}, pick ${esc(leader())}'s card</p>
      <div class="cf-picks">${three.map((c, i) => `<button type="button" class="cf-pickc" data-act="p" data-i="${i}">${ico(TYPE[c.p].ico)}<span><small>${esc(TYPE[c.p].name)} · ${c.s}s</small><b>${esc(c.t)}</b></span></button>`).join('')}</div>`,
      {p: b => reveal(three[+b.dataset.i])});
  }

  /* ── beat the clock ── */
  function play(c, up, comp) {
    const secs = secsOf(c), duel = c.p === 'duel', ty = TYPE[c.p];
    const winners = team() ? [0, 1] : [G.cuffed, 1 - G.cuffed];
    show(`${board()}<div class="cf-mini d-${c.p}">${ico(ty.ico)}<div><small>cuff'd ${cuffLabel(c)} · ${esc(duel ? 'head to head' : leader() + (team() ? ' leads' : ' plays'))}</small><b>${esc(c.t)}</b></div></div>
      <div class="cf-tags">${comp && comp.k !== 'none' ? `<span>${ico(CX[comp.k].ico)}${esc(comp.t)}</span>` : ''}${up ? `<span>${ico('heart')}${esc(c.up)}</span>` : ''}</div>${nextTags()}
      <div class="cf-timer" data-timer><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="tr"/><circle cx="60" cy="60" r="52" class="tp" pathLength="100"/></svg><b data-n>${secs}</b></div>
      <div class="cf-row" data-go>${btn('start', 'go')}</div>
      <div class="cf-row" data-res hidden>${duel ? winners.map((i, j) => `<button type="button" class="cf-btn ${j ? 'ghost' : ''}" data-act="win" data-i="${i}">${esc(G.names[i])} won</button>`).join('') : btn('yes', 'done it!') + btn('no', 'ran out', 'ghost')}</div>`, {
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

  /* ── keys, busts, forfeits ── */
  const worth = () => (G.next.half || G.next.double) ? 2 : 1;
  function outcome(ok) {
    const w = worth(), dbl = G.next.double; G.next = {};
    if (ok) { G.keys += w; return after(w > 1 ? 'two keys.' : pick(['a key. smooth.', 'clean getaway.', 'one step closer.'])); }
    if (dbl) G.keys = Math.max(0, G.keys - 1);
    bust(dbl ? 'double or nothing. a bust, and a key gone.' : 'busted.');
  }
  function duelWon(i) {
    const w = worth(); G.next = {};
    if (team()) { G.keys += w; return forfeit(1 - i, `a key for the team. ${esc(G.names[i])} won the duel, so`, () => after(null)); }
    if (i === G.cuffed) { G.keys += w; return after('won the duel. a key.'); }
    bust(`${esc(G.names[i])} won the duel. busted.`);
  }
  function bust(line) {
    G.busts++; G.bTot++;
    if (G.busts < 3) return after(line, true);
    G.busts = 0;
    forfeit(team() ? null : G.cuffed, 'three busts.', () => after(null));
  }
  function forfeit(who, lead, then) {
    const f = pick(C.forfeits), name = who == null ? 'you both' : G.names[who];
    show(`${board()}<p class="cf-muted cf-center">${lead}</p><p class="cf-label cf-center">${esc(name)} ${who == null ? 'take' : 'takes'} a forfeit</p>
      <div class="cf-card forfeit"><div class="cf-card-in">${ico('heart', 'big')}<small>forfeit</small><h3>${esc(f.t)}</h3><p>${esc(f.d)}</p></div></div>
      <div class="cf-row">${btn('ok', 'done')}${btn('skip', 'skip it', 'ghost')}</div>`, {ok: then, skip: then});
    flipIn();
  }
  function after(line, bad) {
    if (G.keys >= G.keysTo) return team() ? teamFree() : escaped();
    const nxt = () => { if (team()) G.turn = 1 - G.turn; round(); };
    if (!line) return nxt();
    show(`${board()}<div class="cf-stamp${bad ? ' red' : ''}">${esc(line)}</div><div class="cf-row">${btn('n', 'next card')}</div>`, {n: nxt});
    if (!still && !bad) confetti();
  }

  /* ── getting out ── */
  function teamFree() {
    show(`<div class="cf-end">${ico('key', 'huge')}<h2 class="cf-h2">unlocked.</h2>
      <p class="cf-lede">${esc(G.names[0])} and ${esc(G.names[1])}: ${G.keysTo} keys in ${G.round} cards. Take the key out of the glass. Or don't.</p>
      <div class="cf-row">${btn('again', 'cuff up again')}${btn('home', 'home', 'ghost')}</div></div>`, {again: setup, home});
    if (!still) confetti(true);
  }
  function escaped() {
    const who = G.cuffed; G.esc.push({who, cards: G.cards, busts: G.bTot});
    const first = G.esc.length % 2 === 1;
    if (first) {
      show(`<div class="cf-end">${ico('key', 'huge')}<h2 class="cf-h2">${esc(G.names[who])} is out.</h2>
        <p class="cf-lede">${G.cards} cards. Now switch the cuffs: ${esc(G.names[1 - who])}, beat ${G.cards}.</p>
        <div class="cf-row">${btn('go', 'switch the cuffs')}</div></div>`, {go: () => { G.cuffed = 1 - who; G.keys = 0; G.busts = 0; G.bTot = 0; G.cards = 0; G.next = {}; cuffUp(); }});
      return confetti();
    }
    const a = G.esc[G.esc.length - 2], b = G.esc[G.esc.length - 1];
    const w = a.cards !== b.cards ? (a.cards < b.cards ? a.who : b.who) : a.busts !== b.busts ? (a.busts < b.busts ? a.who : b.who) : -1;
    const tie = a.cards === b.cards && w > -1;
    if (w > -1) G.rounds[w]++;
    const done = Math.max(...G.rounds) >= 2;
    show(`<div class="cf-end">${ico('key', 'huge')}<h2 class="cf-h2">${w < 0 ? 'dead heat.' : `${esc(G.names[w])} takes round ${G.set}.`}</h2>
      <p class="cf-lede">${esc(G.names[a.who])} got out in ${a.cards} cards, ${esc(G.names[b.who])} in ${b.cards}.${tie ? ` Level on cards, so it went to busts: ${a.busts} to ${b.busts}.` : ''} Rounds: ${esc(G.names[0])} ${G.rounds[0]}, ${esc(G.names[1])} ${G.rounds[1]}.</p>
      <div class="cf-row">${btn('go', done ? 'the final forfeit' : 'next round')}</div></div>`, {
      go: () => {
        if (done) return winner(G.rounds[0] >= 2 ? 0 : 1);
        G.set++; G.cuffed = b.who; G.keys = 0; G.busts = 0; G.bTot = 0; G.cards = 0; G.next = {}; cuffUp();
      }
    });
    if (!still) confetti(true);
  }
  function winner(w) {
    const l = 1 - w;
    show(`<div class="cf-end">${ico('key', 'huge')}<h2 class="cf-h2">${esc(G.names[w])} wins.</h2>
      <p class="cf-lede">${G.rounds[w]} rounds to ${G.rounds[l]}. ${esc(G.names[w])}, draw ${esc(G.names[l])}'s forfeit.</p>
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
