/* Cinematic theme behaviour: menu, cart drawer, shop filter, product form, the "pull one" game,
   the weekly postcard, the 5 Day Experience page, Playmates preferences and Klaviyo sign-ups.
   Plain JS, no dependencies. Classes added here are listed in the pm-* sections so Tailwind keeps them. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const PM = window.PM || {};
  const money = cents => '£' + (cents / 100).toFixed(2);

  /* ── Mobile menu ─────────────────────────────────────────── */
  const menu = $('#pm-menu');
  const setMenu = open => {
    if (!menu) return;
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    $$('[data-menu-open]').forEach(b => b.setAttribute('aria-expanded', String(open)));
    if (open) $('[data-menu-close]', menu)?.focus();
  };
  document.addEventListener('click', e => {
    if (e.target.closest('[data-menu-open]')) setMenu(true);
    else if (e.target.closest('[data-menu-close]')) setMenu(false);
    else if (menu && !menu.hidden && e.target.closest('#pm-menu a')) setMenu(false);
  });

  /* ── Cart ────────────────────────────────────────────────── */
  let cartOpen = false;
  const drawer = () => $('#pm-cart');
  const setCount = n => {
    $$('[data-cart-count]').forEach(el => { el.textContent = n; });
    $$('[data-cart-count-badge]').forEach(el => { el.textContent = n; el.hidden = n === 0; });
  };
  const setCart = open => {
    const d = drawer();
    if (!d) return;
    cartOpen = open;
    d.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('[data-cart-close]:not(.absolute)', d)?.focus();
  };
  async function refreshCart() {
    const res = await fetch(`${window.Shopify?.routes?.root || '/'}?section_id=pm-cart-drawer`);
    if (!res.ok) return;
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const fresh = doc.getElementById('pm-cart');
    const d = drawer();
    if (!fresh || !d) return;
    fresh.hidden = !cartOpen;
    d.replaceWith(fresh);
    setCount(Number(fresh.dataset.count || 0));
  }
  async function addToCart(items) {
    const res = await fetch('/cart/add.js', {
      method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify({items})
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.description || body.message || 'Could not add that to your cart.');
    await refreshCart();
    setCart(true);
    return body;
  }
  async function changeLine(key, quantity) {
    await fetch('/cart/change.js', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: key, quantity})});
    await refreshCart();
  }
  document.addEventListener('click', async e => {
    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); await refreshCart(); setCart(true); return; }
    if (e.target.closest('[data-cart-close]')) { setCart(false); return; }
    const line = e.target.closest('[data-cart-line]');
    if (line) { line.disabled = true; await changeLine(line.dataset.cartLine, Number(line.dataset.qty)); return; }
    const quick = e.target.closest('[data-add-to-cart]');
    if (quick && !quick.disabled) {
      const label = quick.textContent;
      quick.disabled = true; quick.textContent = 'Adding…';
      try { await addToCart([{id: Number(quick.dataset.addToCart), quantity: 1}]); }
      catch (err) { alert(err.message); }
      quick.disabled = false; quick.textContent = label;
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (cartOpen) setCart(false);
    if (menu && !menu.hidden) setMenu(false);
  });

  /* ── Shop filter: /collections/all?c=games ───────────────── */
  const shop = $('[data-shop]');
  if (shop) {
    const c = new URLSearchParams(location.search).get('c') || '';
    const chip = $(`[data-chip="${c}"]`, shop);
    if (c && chip) {
      $$('[data-category]', shop).forEach(card => card.classList.toggle('pm-filter-hidden', card.dataset.category !== c));
      $$('[data-chip]', shop).forEach(ch => {
        const on = ch === chip;
        ch.classList.toggle('border-primary', on); ch.classList.toggle('bg-primary', on); ch.classList.toggle('text-primary-foreground', on);
        ch.classList.toggle('border-border', !on); ch.classList.toggle('text-primary', !on);
        if (on) ch.setAttribute('aria-current', 'page'); else ch.removeAttribute('aria-current');
      });
      $('[data-shop-heading]', shop).textContent = c + '.';
      const line = $('[data-shop-line]', shop);
      line.textContent = chip.dataset.line || ''; line.hidden = !chip.dataset.line;
    }
  }

  /* ── Product page ────────────────────────────────────────── */
  const pp = $('[data-product-page]');
  if (pp) {
    const main = $('[data-main-image]', pp);
    $$('[data-thumbs] button', pp).forEach(btn => btn.addEventListener('click', () => {
      if (main) main.src = btn.dataset.full;
      $$('[data-thumbs] button', pp).forEach(b => { b.classList.toggle('border-primary', b === btn); b.classList.toggle('border-transparent', b !== btn); });
    }));
    const form = $('[data-product-form]', pp);
    const variants = JSON.parse($('[data-variants]', form).textContent);
    const idInput = form.elements.id;
    const addBtn = $('[data-add]', form), sticky = $('[data-sticky-add]', pp);
    let qty = 1;
    const current = () => variants.find(v => v.id === Number(idInput.value)) || variants[0];
    const render = () => {
      const v = current(), total = v.price * qty;
      $('[data-price]', pp).textContent = money(v.price);
      $('[data-qty]', form).textContent = qty;
      $('[data-sticky-price]', pp).textContent = money(total);
      addBtn.disabled = sticky.disabled = !v.available;
      addBtn.textContent = v.available ? `Add to cart · ${money(total)}` : 'Sold out';
      sticky.textContent = v.available ? 'Add to cart' : 'Sold out';
    };
    form.addEventListener('change', e => {
      if (!/^option\d$/.test(e.target.name)) return;
      const picked = [1, 2, 3].map(n => form.querySelector(`input[name="option${n}"]:checked`)?.value).filter(Boolean);
      const v = variants.find(x => picked.every((val, i) => x.options[i] === val));
      if (v) { idInput.value = v.id; const u = new URL(location.href); u.searchParams.set('variant', v.id); history.replaceState(null, '', u); }
      render();
    });
    $$('[data-qty-step]', form).forEach(b => b.addEventListener('click', () => { qty = Math.max(1, qty + Number(b.dataset.qtyStep)); render(); }));
    const submit = async () => {
      const err = $('[data-error]', form); err.hidden = true;
      const item = {id: Number(idInput.value), quantity: qty};
      const plan = form.querySelector('input[name="selling_plan"]:checked')?.value;
      if (plan) item.selling_plan = Number(plan);
      const gt = form.querySelector('[data-gift-toggle]');
      if (gt && gt.checked) {
        const props = {};
        form.querySelectorAll('[name^="properties["]').forEach(f => { if (f.value.trim()) props[f.name.slice(11, -1)] = f.value.trim(); });
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(props['Recipient email'] || '')) { err.textContent = 'Add their email so we know where to send it.'; err.hidden = false; return; }
        props.__shopify_send_gift_card_to_recipient = 'on';
        item.properties = props;
      }
      addBtn.disabled = sticky.disabled = true;
      try { await addToCart([item]); } catch (e) { err.textContent = e.message; err.hidden = false; }
      render();
    };
    form.addEventListener('submit', e => { e.preventDefault(); submit(); });
    const gt = form.querySelector('[data-gift-toggle]');
    if (gt) gt.addEventListener('change', () => { form.querySelector('[data-gift-fields]').hidden = !gt.checked; });
    sticky.addEventListener('click', submit);
    render();
  }

  /* ── Klaviyo ─────────────────────────────────────────────── */
  const KLAVIYO_REVISION = '2024-10-15';
  async function klaviyoSubscribe(listId, email, properties, source) {
    if (!PM.klaviyoKey || !listId) throw new Error('Sign-ups are not switched on yet.');
    const res = await fetch(`https://a.klaviyo.com/client/subscriptions/?company_id=${encodeURIComponent(PM.klaviyoKey)}`, {
      method: 'POST', headers: {'Content-Type': 'application/json', revision: KLAVIYO_REVISION},
      body: JSON.stringify({data: {type: 'subscription', attributes: {custom_source: source,
        profile: {data: {type: 'profile', attributes: {email, properties}}}},
        relationships: {list: {data: {type: 'list', id: listId}}}}})
    });
    if (!res.ok) throw new Error('That didn’t go through. Check your email and try again.');
  }
  async function klaviyoProfile(email, properties) {
    if (!PM.klaviyoKey) throw new Error('Saving is not switched on yet.');
    const res = await fetch(`https://a.klaviyo.com/client/profiles/?company_id=${encodeURIComponent(PM.klaviyoKey)}`, {
      method: 'POST', headers: {'Content-Type': 'application/json', revision: KLAVIYO_REVISION},
      body: JSON.stringify({data: {type: 'profile', attributes: {email, properties}}})
    });
    if (!res.ok) throw new Error('That didn’t save. Check your email and try again.');
  }
  $$('[data-klaviyo-form]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('[data-error]', form), btn = $('button[type="submit"], button:not([type])', form);
    const data = new FormData(form), props = {};
    for (const [k, v] of data) if (k !== 'email' && v) props[k] = v;
    if (err) err.hidden = true;
    if (btn) btn.disabled = true;
    try {
      await klaviyoSubscribe(PM.lists?.[form.dataset.klaviyoForm], String(data.get('email')), props, form.dataset.source || 'Website');
      form.hidden = true;
      const done = $('[data-done]', form.parentElement);
      if (done) done.hidden = false;
      window.dataLayer?.push({event: 'pm_signup', signup_form: form.dataset.source});
    } catch (x) { if (err) { err.textContent = x.message; err.hidden = false; } }
    if (btn) btn.disabled = false;
  }));

  /* ── 5 Day Experience page ───────────────────────────────── */
  const fd = $('[data-five-day]');
  if (fd) {
    const modes = ['solo', 'met', 'duo'];
    const show = mode => {
      $('[data-mode-picker]', fd).hidden = !!mode;
      $$('[data-mode-panel]', fd).forEach(p => { p.hidden = p.dataset.modePanel !== mode; });
      $$('[data-set-mode][role="radio"]', fd).forEach(b => {
        const on = b.dataset.setMode === mode;
        b.setAttribute('aria-checked', String(on));
        b.classList.toggle('bg-primary', on); b.classList.toggle('text-primary-foreground', on); b.classList.toggle('text-primary', !on);
      });
      if (mode && location.hash !== '#' + mode) history.replaceState(null, '', '#' + mode);
    };
    fd.addEventListener('click', e => {
      const m = e.target.closest('[data-set-mode]');
      if (m) { show(m.dataset.setMode); if (!m.matches('[role="radio"]')) scrollTo({top: 0}); return; }
      const day = e.target.closest('[data-day]');
      if (day) {
        const list = day.closest('[data-days]'), opening = day.getAttribute('aria-expanded') !== 'true';
        $$('[data-day]', list).forEach(d => {
          const on = d === day && opening;
          d.setAttribute('aria-expanded', String(on));
          $('[data-sign]', d).textContent = on ? '−' : '+';
          d.nextElementSibling.hidden = !on;
        });
      }
    });
    const h = location.hash.slice(1);
    if (modes.includes(h)) show(h);
  }

  /* ── Become a Playmate ───────────────────────────────────── */
  const pmq = $('[data-playmates]');
  if (pmq) {
    const KEY = 'playmate-prefs';
    let a = {};
    try { a = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { a = {}; }
    const consent = $('[data-consent]', pmq), save = $('[data-save]', pmq), saved = $('[data-saved]', pmq), email = $('[data-email]', pmq), err = $('[data-error]', pmq);
    const paint = () => $$('[data-q]', pmq).forEach(q => {
      const id = q.dataset.q, v = a[id];
      $$('[data-opt]', q).forEach(b => {
        const on = Array.isArray(v) ? v.includes(b.dataset.opt) : v === b.dataset.opt;
        b.setAttribute('aria-pressed', String(on));
        b.classList.toggle('border-primary', on); b.classList.toggle('bg-primary', on); b.classList.toggle('text-primary-foreground', on); b.classList.toggle('border-border', !on);
      });
      const r = $('input[type="range"]', q); if (r && v) r.value = v;
    });
    const dirty = () => { saved.hidden = true; save.textContent = 'Save my picks'; };
    pmq.addEventListener('click', e => {
      const b = e.target.closest('[data-opt]'); if (!b) return;
      const q = b.closest('[data-q]'), id = q.dataset.q, o = b.dataset.opt;
      if (q.dataset.kind === 'three') {
        const cur = Array.isArray(a[id]) ? a[id] : [];
        a[id] = cur.includes(o) ? cur.filter(x => x !== o) : cur.length < 3 ? [...cur, o] : cur;
      } else a[id] = a[id] === o ? '' : o;
      paint(); dirty();
    });
    pmq.addEventListener('input', e => { if (e.target.type === 'range') { a[e.target.closest('[data-q]').dataset.q] = Number(e.target.value); dirty(); } });
    consent.addEventListener('change', () => { save.disabled = !consent.checked; });
    save.addEventListener('click', async () => {
      err.hidden = true;
      try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (_) {}
      if (email.value) {
        const props = {pm_prefs_consent: true};
        for (const [k, v] of Object.entries(a)) props['pm_' + k] = Array.isArray(v) ? v.join(', ') : v;
        try { await klaviyoProfile(email.value, props); } catch (x) { err.textContent = x.message; err.hidden = false; return; }
      }
      saved.hidden = false; save.textContent = 'Saved ♥';
    });
    $('[data-wipe]', pmq).addEventListener('click', () => {
      try { localStorage.removeItem(KEY); } catch (_) {}
      a = {}; consent.checked = false; save.disabled = true; dirty(); paint();
      $$('input[type="range"]', pmq).forEach(r => { r.value = 3; });
    });
    if (Object.keys(a).length) { consent.checked = true; save.disabled = false; saved.hidden = false; save.textContent = 'Saved ♥'; }
    paint();
  }

  /* ── Pull one: the mini stacking game ────────────────────── */
  const po = $('[data-pull-one]');
  if (po) {
    const prompts = {
      lips: {label: 'kiss', qs: ['Kiss me somewhere you never have.', 'A slow kiss. Count to ten.', "Kiss my hand like it's our first date.", 'Forehead kiss, then tell me one thing you love.']},
      flame: {label: 'spicy', qs: ["When did you last want to kiss me and didn't?", 'Tell me what you noticed about me tonight.', 'Describe our perfect lazy Sunday.', "What's something you've always wanted to ask me?"]},
      mask: {label: 'blindfold', qs: ["Eyes closed. Guess what I'm drawing on your palm.", 'Blindfold on for the next turn.', 'Eyes closed. Describe my face from memory.', 'Close your eyes and let me feed you something sweet.']},
      bolt: {label: 'dare', qs: ['Swap seats for the rest of the game.', 'Whisper a compliment in my ear.', 'Thirty-second slow dance. No music allowed.', "Pick a dare for me. I'll pick one for you."]}
    };
    const paths = {
      flame: 'M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3-1-3 0-6 1-9.5Z',
      lips: 'M2 12c3-4 6-5 8-3 1-1 3-1 4 0 2-2 5-1 8 3-3 4-6 6-10 6s-7-2-10-6Zm3 0c2 1 4 1.5 7 1.5s5-.5 7-1.5c-3-.5-5-.5-7 0-2-.5-4-.5-7 0Z',
      mask: 'M2 9c3-2 7-2 10 0 3-2 7-2 10 0 0 4-2 7-5 7-2 0-3-2-5-2s-3 2-5 2c-3 0-5-3-5-7Zm4 2c0 1 1 2 2 2s2-1 2-2H6Zm8 0c0 1 1 2 2 2s2-1 2-2h-4Z',
      bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z'
    };
    const glyph = (i, cls) => `<svg viewBox="0 0 24 24" class="fill-primary-foreground ${cls}" aria-hidden="true"><path d="${paths[i]}"/></svg>`;
    const icons = ['flame', 'lips', 'mask', 'bolt'], ROWS = 5;
    const towerEl = $('[data-tower]', po), result = $('[data-result]', po);
    let tower, fallen, pulls, card;
    const build = () => Array.from({length: ROWS}, (_, r) => Array.from({length: 3}, (_, c) => ({icon: icons[(r * 5 + c * 3 + ((r * c) % 3)) % 4], out: false})));
    const stable = row => !row[1].out || (!row[0].out && !row[2].out);
    const esc = s => s.replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));
    const draw = () => {
      towerEl.innerHTML = '<div class="mt-1 h-2 w-64 md:w-72 rounded-full bg-foreground/10"></div>' + tower.map((row, r) =>
        `<div class="flex gap-1 pb-1">${row.map((b, c) => `<button type="button" data-r="${r}" data-c="${c}" ${b.out || fallen || r === ROWS - 1 ? 'disabled' : ''} aria-label="${b.out ? 'Empty slot' : 'Pull ' + prompts[b.icon].label + ' block'}" class="grid h-10 w-20 place-items-center rounded-[3px] md:h-12 md:w-24 transition ${b.out ? 'bg-transparent' : 'bg-block hover:brightness-110 active:translate-x-2 disabled:cursor-default'}">${b.out ? '' : glyph(b.icon, 'h-5 w-5')}</button>`).join('')}</div>`).join('');
      let html = '';
      if (fallen) html = '<p class="font-hand text-xl text-primary">timber. last pull owes a kiss.</p><button type="button" data-rebuild class="mt-3 rounded-full bg-primary px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">Rebuild</button>';
      else if (card) html = `<div class="mx-auto flex aspect-[5/7] w-48 -rotate-2 flex-col justify-between rounded-lg bg-block p-4 text-left text-primary-foreground shadow-lg animate-in fade-in zoom-in-95"><span class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em]">${glyph(card.icon, 'h-4 w-4')}${prompts[card.icon].label}</span><p class="font-heavy text-lg font-bold leading-snug">${esc(card.q)}</p><span class="self-end text-[9px] font-bold uppercase tracking-[0.25em] opacity-70">nude. stack'd</span></div>`;
      if (pulls >= 3 && !fallen) html += `<a href="${po.dataset.productUrl}" class="mt-3 inline-block border-b border-primary text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Get the real tower</a>`;
      result.innerHTML = html;
    };
    const motion = (cls) => { towerEl.classList.remove('rotate-[1.5deg]', 'translate-x-10', 'translate-y-6', 'rotate-[28deg]', 'opacity-60'); if (cls) towerEl.classList.add(...cls.split(' ')); };
    const reset = () => { tower = build(); fallen = false; pulls = 0; card = null; motion(''); draw(); };
    po.addEventListener('click', e => {
      if (e.target.closest('[data-rebuild]')) { reset(); return; }
      const b = e.target.closest('[data-r]'); if (!b || fallen) return;
      const r = Number(b.dataset.r), c = Number(b.dataset.c), blk = tower[r][c];
      if (r === ROWS - 1 || blk.out) return;
      blk.out = true;
      const qs = prompts[blk.icon].qs;
      card = {icon: blk.icon, q: qs[Math.floor(Math.random() * qs.length)]};
      const left = tower[r].filter(x => !x.out).length;
      const risk = 0.25 + pulls * 0.15 + (left === 1 ? 0.4 : 0);
      pulls++;
      motion('rotate-[1.5deg]');
      if (!stable(tower[r]) || Math.random() < risk) setTimeout(() => { fallen = true; motion('translate-x-10 translate-y-6 rotate-[28deg] opacity-60'); draw(); }, 450);
      else setTimeout(() => motion(''), 350);
      draw();
    });
    reset();
  }

  /* ── Scratch card ────────────────────────────────────────── */
  const sc = $('[data-scratch]');
  if (sc) {
    const modal = $('[data-scratch-modal]', sc), canvas = $('[data-scratch-canvas]', sc);
    const step = name => $$('[data-step]', sc).forEach(el => { el.hidden = el.dataset.step !== name; });
    let ready = false, done = false, drawing = false;
    const SEEN = 'pm-scratch-seen';
    const paint = () => {
      const ctx = canvas.getContext('2d'), css = getComputedStyle(document.documentElement);
      const dark = css.getPropertyValue('--choc').trim() || '#4a2c20', light = css.getPropertyValue('--choc-light').trim() || '#6b4430';
      const W = (canvas.width = canvas.offsetWidth * 2), H = (canvas.height = canvas.offsetHeight * 2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H);
      const cols = 4, rows = 2, g = 10, cw = (W - g * (cols + 1)) / cols, ch = (H - g * (rows + 1)) / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = g + c * (cw + g), y = g + r * (ch + g);
        ctx.fillStyle = light; ctx.fillRect(x, y, cw, ch);
        ctx.fillStyle = dark; ctx.fillRect(x + 8, y + 8, cw - 16, ch - 16);
      }
      ctx.fillStyle = light; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('SCRATCH ME', W / 2, H / 2 + 9);
      ctx.globalCompositeOperation = 'destination-out';
      ready = true;
    };
    /* Smooth scratching: continuous strokes from the last point, progress checked at most every 120ms
       (not on every move), and at 50% the rest of the foil fades out in place. The prize stays where it
       is and the email form slides in underneath, so nothing jumps or blinks. */
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prizeEl = $('[data-scratch-prize]', sc), claim = $('[data-claim]', sc), skip = $('[data-scratch-skip]', sc);
    let last = null, checkAt = 0;
    const reveal = () => {
      if (done) return; done = true; drawing = false;
      canvas.style.opacity = '0'; canvas.style.pointerEvents = 'none';
      skip.style.opacity = '0'; setTimeout(() => { skip.hidden = true; }, 300);
      if (prizeEl && !still && prizeEl.animate) prizeEl.animate([{transform: 'scale(1)'}, {transform: 'scale(1.08)'}, {transform: 'scale(1)'}], {duration: 600, easing: 'cubic-bezier(.3,1.4,.5,1)', delay: 250});
      try { navigator.vibrate && navigator.vibrate(20); } catch (_) {}
      setTimeout(() => {
        claim.hidden = false;
        if (!still && claim.animate) claim.animate([{opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'none'}], {duration: 450, easing: 'ease-out'});
      }, still ? 0 : 450);
    };
    const coverage = () => {
      const ctx = canvas.getContext('2d'), px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < px.length; i += 4 * 24) { total++; if (px[i] === 0) clear++; }
      return clear / total;
    };
    const pt = e => { const b = canvas.getBoundingClientRect(); return [(e.clientX - b.left) * 2, (e.clientY - b.top) * 2]; };
    const scratch = e => {
      if (!drawing || done || !ready) return;
      const ctx = canvas.getContext('2d'), [x, y] = pt(e);
      ctx.lineWidth = 64; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      if (last) { ctx.moveTo(last[0], last[1]); ctx.lineTo(x, y); ctx.stroke(); }
      else { ctx.arc(x, y, 32, 0, Math.PI * 2); ctx.fill(); }
      last = [x, y];
      const now = performance.now();
      if (now > checkAt) { checkAt = now + 120; if (coverage() > 0.5) reveal(); }
    };
    canvas.addEventListener('pointerdown', e => { drawing = true; last = null; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} scratch(e); });
    canvas.addEventListener('pointermove', scratch);
    ['pointerup', 'pointercancel'].forEach(t => canvas.addEventListener(t, () => { drawing = false; last = null; if (!done && ready && coverage() > 0.5) reveal(); }));
    const open = () => {
      modal.hidden = false; document.body.style.overflow = 'hidden';
      try { localStorage.setItem(SEEN, '1'); } catch (_) {}
      if (!ready) requestAnimationFrame(paint);
    };
    const close = () => { modal.hidden = true; document.body.style.overflow = ''; };
    $('[data-scratch-open]', sc).addEventListener('click', open);
    $('[data-scratch-skip]', sc).addEventListener('click', reveal);
    $$('[data-scratch-close]', sc).forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
    const delay = Number(sc.dataset.delay || 0);
    let seen = false; try { seen = !!localStorage.getItem(SEEN); } catch (_) {}
    if (delay > 0 && !seen) setTimeout(() => { if (modal.hidden && !cartOpen) open(); }, delay * 1000);
    $('[data-scratch-form]', sc).addEventListener('submit', async e => {
      e.preventDefault();
      const err = $('[data-error]', sc), btn = $('button', e.target), email = e.target.elements.email.value;
      err.hidden = true; btn.disabled = true;
      // Into the main Klaviyo email list (the one the newsletter popup used), marked with where it came from.
      try {
        await klaviyoSubscribe(PM.lists?.news, email, {scratch_card: true, scratch_prize: sc.dataset.prize || ''}, 'Scratch card');
        step('done');
        window.dataLayer?.push({event: 'pm_signup', signup_form: 'Scratch card'});
      } catch (_) { err.textContent = 'That didn’t go through. Check your email and try again.'; err.hidden = false; }
      btn.disabled = false;
    });
  }

  /* ── Wholesale order request ─────────────────────────────── */
  const ws = $('[data-wholesale]');
  if (ws && $('[data-line]', ws)) {
    let cur = 'GBP';
    const fmt = (c, v) => new Intl.NumberFormat('en-GB', {style: 'currency', currency: c}).format(v / 100);
    const lines = $$('[data-line]', ws);
    const recalc = () => {
      let total = 0; const order = [];
      lines.forEach(l => {
        const unit = Number(l.dataset[cur.toLowerCase()] || 0), qty = Math.max(0, Math.floor(Number($('input', l).value) || 0));
        $('[data-case-price]', l).textContent = unit ? fmt(cur, unit) : 'On request';
        total += unit * qty;
        if (qty) order.push(`${l.dataset.name}: ${qty} case${qty > 1 ? 's' : ''} × ${unit ? fmt(cur, unit) : 'price on request'}`);
      });
      lines.forEach(l => { const c = $(`[data-ws-case="${l.dataset.handle}"]`, ws); if (c) { const u = Number(l.dataset[cur.toLowerCase()] || 0); c.textContent = u ? fmt(cur, u) : 'On request'; } });
      $('[data-total]', ws).textContent = fmt(cur, total);
      const f = $('[data-order-field]', ws); if (f) f.value = order.join('\n') + (order.length ? `\nSubtotal ex VAT: ${fmt(cur, total)}` : '');
      const cf = $('[data-currency-field]', ws); if (cf) cf.value = cur;
      const note = $('[data-ws-note]', ws);
      $('[data-submit]', ws).disabled = !order.length && !(note && note.value.trim());
    };
    // product detail panels: native <dialog>, so focus is trapped and Esc closes
    let opener = null;
    const openDialog = (d, from) => { if (!d || d.open) return; opener = from || null; d.showModal(); document.documentElement.style.overflow = 'hidden'; history.replaceState(null, '', '#' + d.id); };
    $$('dialog', ws).forEach(d => {
      d.addEventListener('close', () => { document.documentElement.style.overflow = ''; if (location.hash === '#' + d.id) history.replaceState(null, '', location.pathname + location.search); if (opener) opener.focus(); });
      d.addEventListener('click', e => { if (e.target === d) d.close(); });
    });
    $$('[data-dialog-open]', ws).forEach(b => b.addEventListener('click', () => openDialog(document.getElementById(b.dataset.dialogOpen), b)));
    $$('[data-dialog-close]', ws).forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
    if (location.hash.startsWith('#ws-')) openDialog(document.getElementById(location.hash.slice(1)));
    // "Request" and "Request a sample" add a line to the order note, so they arrive with the order request
    $$('[data-ws-request]', ws).forEach(b => b.addEventListener('click', () => {
      const note = $('[data-ws-note]', ws); if (!note) return;
      const line = b.dataset.wsRequest;
      if (!note.value.includes(line)) note.value = (note.value.trim() ? note.value.trim() + '\n' : '') + line;
      b.textContent = 'Added to your request';
      recalc();
    }));
    ws.addEventListener('input', recalc);
    $$('[data-currency]', ws).forEach(b => b.addEventListener('click', () => {
      cur = b.dataset.currency;
      $$('[data-currency]', ws).forEach(x => {
        const on = x === b; x.setAttribute('aria-pressed', String(on));
        x.classList.toggle('bg-primary', on); x.classList.toggle('text-primary-foreground', on); x.classList.toggle('border-primary', on);
        x.classList.toggle('border-border', !on); x.classList.toggle('text-primary', !on);
      });
      recalc();
    }));
    recalc();
  }

  /* ── Weekly postcard ─────────────────────────────────────── */
  const pc = $('[data-postcard]');
  if (pc) {
    const notes = JSON.parse($('[data-notes]', pc).textContent || '[]');
    if (!notes.length) { pc.hidden = true; return; }
    const [y, m, d] = (pc.dataset.start || '2026-10-19').split('-').map(Number);
    const start = Date.UTC(y, m - 1, d), week = 7 * 864e5;
    const elapsed = Math.max(0, Math.floor((Date.now() - start) / week));
    const sched = {current: elapsed % notes.length, available: Math.min(elapsed + 1, notes.length)};
    const label = n => `note ${String(n).padStart(3, '0')}`;
    let selected = sched.current, flipped = false, archive = false;
    const flip = $('[data-flip]', pc), save = $('[data-save]', pc), back = $('[data-turn-back]', pc), tog = $('[data-archive-toggle]', pc);
    const render = () => {
      const note = notes[selected];
      $$('[data-edition]', pc).forEach(el => { el.textContent = label(note.number); });
      $('[data-text]', pc).textContent = note.text;
      flip.classList.toggle('is-turned', flipped);
      flip.setAttribute('aria-expanded', String(flipped));
      flip.setAttribute('aria-label', flipped ? 'Turn the postcard face down' : "Turn over this week's postcard");
      $('[data-front]', pc).setAttribute('aria-hidden', String(flipped));
      $('[data-back]', pc).setAttribute('aria-hidden', String(!flipped));
      save.hidden = back.hidden = !flipped;
      tog.setAttribute('aria-expanded', String(archive));
      $('[data-icon-history]', tog).toggleAttribute('hidden', archive);
      $('[data-icon-x]', tog).toggleAttribute('hidden', !archive);
      $('[data-archive]', pc).hidden = !archive;
      const list = $('[data-archive-list]', pc);
      list.innerHTML = notes.slice(0, sched.available).filter(n => n.number !== notes[sched.current].number)
        .map(n => `<button type="button" data-pick="${n.number - 1}" class="min-h-11 rounded-md border border-border bg-background px-4 text-sm text-primary hover:bg-card">${label(n.number)}</button>`).join('');
      $('[data-archive-empty]', pc).hidden = sched.available !== 1;
      $('[data-this-week]', pc).hidden = selected === sched.current;
    };
    flip.addEventListener('click', () => { flipped = !flipped; render(); });
    back.addEventListener('click', () => { flipped = false; render(); });
    tog.addEventListener('click', () => { archive = !archive; render(); });
    $('[data-this-week]', pc).addEventListener('click', () => { selected = sched.current; flipped = false; render(); });
    $('[data-archive-list]', pc).addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) { selected = Number(b.dataset.pick); flipped = true; render(); } });
    save.addEventListener('click', () => {
      const css = getComputedStyle(document.documentElement);
      const paper = css.getPropertyValue('--background').trim(), ink = css.getPropertyValue('--primary').trim();
      const note = notes[selected], lines = [];
      let line = '';
      for (const w of note.text.split(' ')) { if ((line + ' ' + w).trim().length > 30 && line) { lines.push(line); line = w; } else line = (line + ' ' + w).trim(); }
      if (line) lines.push(line);
      const x = s => s.replace(/[&<>]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[ch]));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="${paper}"/><g fill="${ink}" text-anchor="middle"><text x="600" y="130" font-family="serif" font-size="24">${label(note.number)} · Playmate Labs</text>${lines.map((t, i) => `<text x="600" y="${340 + i * 70}" font-family="Georgia, serif" font-style="italic" font-size="48">${x(t)}</text>`).join('')}<text x="600" y="700" font-family="serif" font-size="25">a little something to keep.</text></g></svg>`;
      const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}));
      const a = document.createElement('a'); a.href = url; a.download = `playmate-${label(note.number).replace(' ', '-')}.svg`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    render();
  }

  /* ── Copy buttons (press page) ───────────────────────────── */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const label = $('[data-copy-label]', btn) || btn;
    const was = label.textContent;
    try { await navigator.clipboard.writeText(btn.dataset.copy); label.textContent = 'Copied'; }
    catch (e) { label.textContent = 'Select and copy'; }
    setTimeout(() => { label.textContent = was; }, 2000);
  }));
})();
