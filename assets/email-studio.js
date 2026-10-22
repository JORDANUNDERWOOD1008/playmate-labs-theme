/* Email Studio: a repository of designed emails. Edit text and images, set "Ready for Klaviyo", then Claude uploads them. */
(function () {
  const CFG = window.ES_CONFIG || {}, API = CFG.api, ES = window.EmailSections;
  const STATUS = [['draft', 'Draft'], ['review', 'In review'], ['ready', 'Ready for Klaviyo'], ['klaviyo', 'In Klaviyo'], ['sent', 'Sent']];
  const SLABEL = Object.fromEntries(STATUS);
  const LIVE = 'https://grid-planner-api.playmatelabs.workers.dev'; // logos live on the production worker
  const LOGOS = {burgundy: LIVE + '/img/143h5l0u2l', ivory: LIVE + '/img/2s683j0i5h', black: LIVE + '/img/1s2s5o4t1i'};
  const $ = s => document.querySelector(s);
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => c != null && c !== false && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  }
  const ls = {get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }};
  const uid = () => Math.random().toString(36).slice(2, 9);
  let TEAM = null, ME = '', EMAILS = [], OPEN = null, SEL = null, FILTER = ls.get('es-filter') || 'all', LIB = [], LIBMAP = {};
  let saveT = null, saving = false, dirty = false, lastEdit = 0;

  function toast(msg) { const t = h('div', {class: 'toast', role: 'status', text: msg}); document.body.append(t); setTimeout(() => t.remove(), 3400); }
  async function api(method, path, body, raw) {
    const r = await fetch(API + path, {method, cache: 'no-store', headers: raw ? {'Content-Type': raw.type, 'X-Team-Key': TEAM} : {'Content-Type': 'application/json', 'X-Team-Key': TEAM},
      body: raw ? raw.body : body ? JSON.stringify(body) : undefined});
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(d.error || r.status); e.status = r.status; e.data = d; throw e; }
    return d;
  }
  function sheet(title, body, foot) {
    const sh = h('div', {class: 'shade', onclick: e => { if (e.target === sh) sh.remove(); }},
      h('div', {class: 'sheet', role: 'dialog', 'aria-label': title}, h('header', {}, h('h3', {text: title}), h('button', {class: 'btn small quiet', onclick: () => sh.remove()}, 'Close')), h('div', {class: 'body'}, body), foot ? h('footer', {}, foot) : null));
    document.body.append(sh); return sh;
  }
  function ask(title, text, yes) {
    return new Promise(res => { const sh = sheet(title, h('p', {text}), [h('button', {class: 'btn', onclick: () => { sh.remove(); res(false); }}, 'Cancel'), h('button', {class: 'btn primary', onclick: () => { sh.remove(); res(true); }}, yes)]); });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const s = document.querySelector('.shade:last-of-type'); if (s) s.remove(); } });

  /* images */
  function srcOf(id, w = 1200) {
    if (!id) return '';
    if (id.startsWith('u-')) return API + '/img/' + id.slice(2);
    const l = LIBMAP[id]; return l ? l.src + (l.src.includes('?') ? '&' : '?') + 'width=' + w : '';
  }
  function ctx() {
    return {logos: LOGOS, img: (sec, slot) => { const r = (sec.images || {})[slot]; return r && r.id ? {slot, src: srcOf(r.id), x: r.x, y: r.y, z: r.z} : {slot}; }};
  }
  async function loadLibrary() {
    const out = [];
    try { (await (await fetch(CFG.library)).json()).forEach(i => out.push({id: i.id, src: i.src, name: i.name, w: i.w, h: i.h})); } catch (e) {}
    for (const q of ['', '?cat=studio']) {
      try { (await api('GET', '/images' + q)).images.forEach(i => out.push({id: 'u-' + i.id, src: API + '/img/' + i.id, name: i.name, w: i.w, h: i.h, mine: q !== ''})); } catch (e) {}
    }
    LIB = out; LIBMAP = Object.fromEntries(out.map(i => [i.id, i]));
  }
  async function toJpeg(file) {
    let bmp; try { bmp = await createImageBitmap(file, {imageOrientation: 'from-image'}); } catch (e) { return null; }
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height)), W = Math.round(bmp.width * k), H = Math.round(bmp.height * k);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(bmp, 0, 0, W, H);
    for (const q of [0.88, 0.8, 0.7, 0.6]) { const b = await new Promise(r => c.toBlob(r, 'image/jpeg', q)); if (b && b.size <= 1300 * 1024) return {blob: b, w: W, h: H}; }
    return null;
  }
  async function uploadFile(f) {
    const j = await toJpeg(f);
    if (!j) { toast(/\.(heic|heif)$/i.test(f.name) ? 'HEIC photos: save as JPG first.' : 'Couldn\'t read that file.'); return null; }
    const qs = new URLSearchParams({name: ('email · ' + f.name).slice(0, 70), cat: 'studio', w: j.w, h: j.h, by: ME});
    const r = await api('POST', '/images?' + qs, null, {type: 'image/jpeg', body: j.blob});
    const item = {id: 'u-' + r.id, src: API + '/img/' + r.id, name: f.name, w: j.w, h: j.h, mine: true};
    LIB.unshift(item); LIBMAP[item.id] = item; return item.id;
  }
  function pickImage(onPick) {
    let filter = 'all';
    const grid = h('div', {class: 'lib'});
    const draw = () => {
      grid.innerHTML = '';
      LIB.filter(i => filter === 'all' || (filter === 'mine' ? i.mine : !i.mine)).forEach(i => grid.append(h('button', {title: i.name, 'aria-label': i.name, style: `background-image:url("${srcOf(i.id, 300)}")`, onclick: () => { sh.remove(); onPick(i.id); }})));
    };
    const chips = h('div', {class: 'filters', style: 'padding:0 0 10px'}, [['all', 'All'], ['lib', 'Grid library'], ['mine', 'Email uploads']].map(([k, l]) => h('button', {class: 'chip' + (k === filter ? ' on' : ''), onclick: e => { filter = k; chips.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); e.currentTarget.classList.add('on'); draw(); }}, l)));
    const file = h('input', {type: 'file', accept: 'image/*', hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; toast('Uploading…'); const id = await uploadFile(f).catch(() => null); if (id) { sh.remove(); onPick(id); } }});
    const sh = sheet('Choose an image', [chips, grid], [file, h('button', {class: 'btn primary', onclick: () => file.click()}, 'Upload a photo')]);
    draw();
  }

  /* Auto headline colour: brightness of the image area behind the text */
  const lumCache = {};
  function autoColor(sec) {
    const t = ES.types[sec.type]; if (!t.autoArea || (sec.fields || {}).color !== 'auto') return;
    const ref = (sec.images || {}).photo; if (!ref || !ref.id) return;
    const key = ref.id + '|' + (ref.y ?? 50) + '|' + (ref.z || 1);
    const apply = L => { const c = L > 0.55 ? '#2C1810' : '#FAF7F2'; if (sec.fields.autoColor !== c) { sec.fields.autoColor = c; change(sec); } };
    if (lumCache[key] != null) return apply(lumCache[key]);
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => {
      try {
        const c = document.createElement('canvas'), W = 60, H = Math.round(60 * im.height / im.width); c.width = W; c.height = H;
        const g = c.getContext('2d'); g.drawImage(im, 0, 0, W, H);
        const d = g.getImageData(0, 0, W, Math.max(1, Math.round(H * t.autoArea.height))).data; let s = 0;
        for (let i = 0; i < d.length; i += 4) s += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
        lumCache[key] = s / (d.length / 4); apply(lumCache[key]);
      } catch (e) {}
    };
    im.src = srcOf(ref.id, 300);
  }

  /* list */
  function face(em) { return em.face || {}; }
  function drawList() {
    const box = $('#emails'); box.innerHTML = '';
    const rows = EMAILS.filter(e => !e.archived && (FILTER === 'all' || e.stage === FILTER));
    $('#sum').textContent = `${EMAILS.filter(e => !e.archived).length} emails · ${EMAILS.filter(e => e.stage === 'ready').length} ready for Klaviyo`;
    if (!rows.length) box.append(h('p', {class: 'hint', style: 'padding:10px', text: FILTER === 'all' ? 'No emails yet. Start one below.' : 'Nothing with this status.'}));
    rows.forEach(e => box.append(h('button', {class: 'erow' + (OPEN && OPEN.id === e.id ? ' on' : ''), onclick: () => openEmail(e.id)},
      h('span', {class: 'th', style: face(e).thumb ? `background-image:url("${srcOf(face(e).thumb, 200)}")` : ''}),
      h('span', {}, h('b', {text: face(e).name || 'Untitled email'}), h('small', {text: face(e).subject || 'No subject yet'}), h('span', {class: 'pill ' + e.stage, text: SLABEL[e.stage] || e.stage})))));
  }
  function drawFilters() {
    const f = $('#filters'); f.innerHTML = '';
    [['all', 'All'], ...STATUS].forEach(([k, l]) => f.append(h('button', {class: 'chip' + (FILTER === k ? ' on' : ''), onclick: () => { FILTER = k; ls.set('es-filter', k); drawFilters(); drawList(); }}, l)));
  }
  async function loadList() { try { EMAILS = (await api('GET', '/emails')).emails; drawList(); } catch (e) { if (e.status === 401) return askTeam(); } }

  /* open + save */
  async function openEmail(id) {
    if (dirty) await flush();
    try { OPEN = await api('GET', '/emails/' + id); } catch (e) { return toast('Couldn\'t open that email.'); }
    OPEN.data.sections = OPEN.data.sections || []; SEL = OPEN.data.sections[0] ? OPEN.data.sections[0].id : null;
    history.replaceState(null, '', '?email=' + id); drawList(); drawStage(); drawSide(); $('#list').classList.remove('open');
  }
  function thumbOf() { const s = OPEN.data.sections.find(x => x.images && Object.values(x.images).some(r => r && r.id)); return s ? Object.values(s.images).find(r => r && r.id).id : ''; }
  function refresh(sec) {
    const el = document.querySelector(`.sec[data-id="${sec.id}"]`); if (!el) return drawStage();
    el.innerHTML = ES.render(sec, ctx()); el.prepend(tagFor(sec)); autoColor(sec); fit();
  }
  function change(what) {
    if (!OPEN) return; dirty = true; lastEdit = Date.now();
    OPEN.face = {...OPEN.face, thumb: thumbOf()};
    if (what === true) drawStage(); else if (what && what.id) refresh(what);
    $('#saving').textContent = 'Saving…';
    clearTimeout(saveT); saveT = setTimeout(flush, 800);
  }
  async function flush() {
    if (!OPEN || !dirty) return; if (saving) { saveT = setTimeout(flush, 400); return; }
    saving = true; dirty = false; const em = OPEN;
    try {
      const r = await api('PUT', '/emails/' + em.id, {face: em.face, data: em.data, baseVersion: em.version, by: ME});
      em.version = r.version; $('#saving').textContent = 'Saved';
      const row = EMAILS.find(e => e.id === em.id); if (row) { row.face = em.face; row.version = r.version; } drawList();
    } catch (e) {
      if (e.status === 409 && e.data.card) { OPEN = e.data.card; toast(`${OPEN.updated_by || 'Someone'} changed this email, so it reloaded with their version.`); drawStage(); drawSide(); }
      else if (e.status === 413) toast('This email is too big to save. Remove a section.');
      else { dirty = true; $('#saving').textContent = 'Offline, retrying…'; saveT = setTimeout(flush, 5000); }
    }
    saving = false;
  }
  async function setStatus(st) {
    if (!OPEN) return;
    if (st === 'ready' && !(await ask('Ready for Klaviyo?', 'Claude will render this email and build it as a Klaviyo template on the next Klaviyo run. Nothing gets sent.', 'Mark ready'))) { drawStage(); return; }
    await flush();
    await api('POST', '/emails/' + OPEN.id + '/move', {stage: st, pos: OPEN.pos, by: ME});
    OPEN.stage = st; const row = EMAILS.find(e => e.id === OPEN.id); if (row) row.stage = st;
    drawList(); drawStage(); toast(st === 'ready' ? 'Marked ready. Tell Claude: "do a Klaviyo run".' : 'Status: ' + SLABEL[st]);
  }

  /* preview */
  let SORT = null;
  function tagFor(sec) { return h('span', {class: 'tag', title: 'Drag to move this section'}, '⠿ ' + ES.types[sec.type].label); }
  function selectSec(id, focus) {
    SEL = id; document.querySelectorAll('.sec').forEach(x => x.classList.toggle('on', x.dataset.id === SEL)); drawSide(); $('#side').classList.add('open');
    if (focus) { const s0 = $('#side'); s0.scrollTop = 0; }
  }
  function drawStage() {
    const st = $('#stage'), keep = st.scrollTop; st.innerHTML = ''; requestAnimationFrame(() => { st.scrollTop = keep; });
    st.append(h('div', {class: 'mobiletabs'}, h('button', {class: 'btn small', onclick: () => $('#list').classList.add('open')}, 'All emails'), OPEN ? h('button', {class: 'btn small', onclick: () => $('#side').classList.add('open')}, 'Edit section') : null));
    if (!OPEN) { st.append(h('div', {class: 'empty'}, h('h2', {text: 'Pick an email to edit'}), h('p', {text: 'Or start a new one from the list. Each email is built from sections you can reorder, swap images in and rewrite.'}))); return; }
    const f = OPEN.face, sel = h('select', {class: 'fi', style: 'width:auto', 'aria-label': 'Status', onchange: e => setStatus(e.target.value)}, STATUS.map(([k, l]) => h('option', {value: k, selected: OPEN.stage === k}, l)));
    const inp = (k, ph) => h('input', {class: 'fi', value: f[k] || '', placeholder: ph, 'aria-label': ph, oninput: e => { OPEN.face[k] = e.target.value; drawInbox(); change(); }});
    st.append(h('div', {class: 'topbar'},
      h('div', {class: 'r1'}, h('input', {class: 'name', value: f.name || '', placeholder: 'Email name', 'aria-label': 'Email name', oninput: e => { OPEN.face.name = e.target.value; change(); }}), h('span', {class: 'saving', id: 'saving'}), sel,
        OPEN.stage !== 'ready' ? h('button', {class: 'btn primary', onclick: () => setStatus('ready')}, 'Ready for Klaviyo') : h('span', {class: 'pill ready', text: 'Waiting for the Klaviyo run'})),
      h('div', {class: 'r2'}, inp('subject', 'Subject line'), inp('preheader', 'Preheader (the grey line after it)'), h('input', {class: 'fi', type: 'date', value: f.send_date || '', 'aria-label': 'Send date', onchange: e => { OPEN.face.send_date = e.target.value; change(); }}))));
    st.append(h('div', {class: 'inbox', id: 'inbox'}));
    const es = h('div', {class: 'es', id: 'es'});
    OPEN.data.sections.forEach(sec => {
      const d = h('div', {class: 'sec' + (sec.id === SEL ? ' on' : ''), 'data-id': sec.id, tabindex: 0, html: ES.render(sec, ctx()), onclick: e => {
        const slot = e.target.closest('[data-slot]');
        if (slot && slot.dataset.slot) { selectSec(sec.id); pickImage(id => { sec.images = sec.images || {}; sec.images[slot.dataset.slot] = {id, x: 50, y: 50, z: 1}; change(sec); drawSide(); }); return; }
        selectSec(sec.id, true);
      }});
      d.prepend(tagFor(sec));
      es.append(d); autoColor(sec);
    });
    if (!OPEN.data.sections.length) es.append(h('div', {class: 'empty', style: 'margin:auto'}, h('p', {text: 'No sections yet. Add the first one.'})));
    const frame = h('div', {class: 'frame'}, es); st.append(frame);
    st.append(h('div', {class: 'addbar'}, h('button', {class: 'btn', onclick: addSection}, '+ Add section')));
    drawInbox(); fit();
    if (SORT) SORT.destroy();
    if (window.Sortable) SORT = Sortable.create(es, {animation: 150, draggable: '.sec', handle: '.tag', onEnd: () => { const ids = [...es.querySelectorAll('.sec')].map(x => x.dataset.id); OPEN.data.sections.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)); change(); }});
  }
  function drawInbox() { const b = $('#inbox'); if (!b || !OPEN) return; b.innerHTML = ''; b.append(h('b', {text: 'Jordan at Playmate'}), (OPEN.face.subject || 'Subject line'), ' ', h('span', {text: '· ' + (OPEN.face.preheader || 'preheader')})); }
  function fit() { const fr = document.querySelector('.frame'), es = $('#es'); if (!fr || !es) return; const k = Math.min(1, fr.clientWidth / 600); es.style.transform = k < 1 ? `scale(${k})` : ''; fr.style.height = k < 1 ? es.offsetHeight * k + 'px' : ''; }
  window.addEventListener('resize', fit);

  /* editor */
  function secOf() { return OPEN && OPEN.data.sections.find(s => s.id === SEL); }
  function drawSide() {
    const side = $('#side'); side.innerHTML = '';
    side.append(h('div', {style: 'display:flex;justify-content:space-between;align-items:center'}, h('h2', {text: 'Edit section'}), h('button', {class: 'btn small quiet', onclick: () => side.classList.remove('open')}, 'Close')));
    const sec = secOf();
    if (!sec) { side.append(h('p', {class: 'hint', text: OPEN ? 'Click a section in the preview to edit it.' : 'Open an email first.'})); return; }
    const t = ES.types[sec.type], f = sec.fields = sec.fields || {};
    side.append(h('p', {class: 'hint'}, h('b', {text: t.label}), (t.images || []).length ? ' · click any photo in the email to swap it' : ''));
    if ((t.images || []).length) { side.append(h('span', {class: 'lbl', text: 'Photos'})); (t.images || []).forEach(([slot, label]) => side.append(slotEditor(sec, slot, label))); }
    side.append(h('details', {class: 'words'}, h('summary', {class: 'lbl', text: 'Words (optional: ask Claude for bigger changes)'}), ...wordFields(sec, t, f)));
    side.append(actions(sec)); return;
  }
  function wordFields(sec, t, f) {
    const out = [];
    t.fields.forEach(([k, label, kind, opts]) => {
      let input;
      if (kind === 'select') input = h('select', {class: 'fi', onchange: e => { f[k] = e.target.value; change(sec); }}, Object.entries(opts).map(([v, l]) => h('option', {value: v, selected: (f[k] ?? t.defaults[k]) === v}, l)));
      else if (kind === 'textarea') input = h('textarea', {class: 'fi', rows: Math.min(8, Math.max(2, String(f[k] || '').split('\n').length + 1)), oninput: e => { f[k] = e.target.value; change(sec); }}, f[k] || '');
      else input = h('input', {class: 'fi', type: kind === 'link' ? 'url' : 'text', value: f[k] || '', oninput: e => { f[k] = e.target.value; change(sec); }});
      out.push(h('label', {class: 'fld'}, h('span', {class: 'lbl', text: label}), input));
    });
    return out;
  }
  function actions(sec) {
    const side = {append: x => x};
    const i = OPEN.data.sections.indexOf(sec), move = d => { const a = OPEN.data.sections; a.splice(i, 1); a.splice(i + d, 0, sec); change(true); drawSide(); };
    return (h('div', {class: 'acts'},
      h('button', {class: 'btn small', disabled: i === 0, onclick: () => move(-1)}, 'Move up'),
      h('button', {class: 'btn small', disabled: i === OPEN.data.sections.length - 1, onclick: () => move(1)}, 'Move down'),
      h('button', {class: 'btn small', onclick: () => { const c = JSON.parse(JSON.stringify(sec)); c.id = uid(); OPEN.data.sections.splice(i + 1, 0, c); SEL = c.id; change(true); drawSide(); }}, 'Duplicate'),
      h('button', {class: 'btn small', onclick: async () => { if (await ask('Delete this section?', 'You can undo by adding it again; its text will be lost.', 'Delete')) { OPEN.data.sections.splice(i, 1); SEL = null; change(true); drawSide(); } }}, 'Delete')));
  }
  function slotEditor(sec, slot, label) {
    sec.images = sec.images || {};
    const r = sec.images[slot] || {}, th = h('span', {class: 'th', style: r.id ? `background-image:url("${srcOf(r.id, 200)}")` : ''});
    const rng = (k, l, min, max, step, def) => h('label', {class: 'rng'}, l, h('input', {type: 'range', min, max, step, value: r[k] ?? def, disabled: !r.id, oninput: e => { sec.images[slot] = {...sec.images[slot], [k]: +e.target.value}; change(sec); }}));
    return h('div', {class: 'slot'}, th, h('div', {class: 'ctl'}, h('span', {class: 'lbl', text: label}),
      h('div', {class: 'acts'}, h('button', {class: 'btn small', onclick: () => pickImage(id => { sec.images[slot] = {id, x: 50, y: 50, z: 1}; change(sec); drawSide(); })}, r.id ? 'Replace' : 'Add image'),
        r.id ? h('button', {class: 'btn small quiet', onclick: () => { delete sec.images[slot]; change(sec); drawSide(); }}, 'Remove') : null),
      rng('x', 'Across', 0, 100, 1, 50), rng('y', 'Up/down', 0, 100, 1, 50), rng('z', 'Zoom', 1, 2.5, 0.05, 1)));
  }
  function addSection() {
    const box = h('div', {class: 'types'}, Object.entries(ES.types).map(([k, t]) => h('button', {onclick: () => {
      const s = {id: uid(), type: k, fields: ES.defaults(k), images: {}}; const at = SEL ? OPEN.data.sections.findIndex(x => x.id === SEL) + 1 : OPEN.data.sections.length;
      OPEN.data.sections.splice(at, 0, s); SEL = s.id; sh.remove(); change(true); drawSide(); $('#side').classList.add('open');
      requestAnimationFrame(() => { const el = document.querySelector(`.sec[data-id="${s.id}"]`); if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'}); }); toast(`Added ${t.label}, below the section you had selected.`);
    }}, h('b', {text: t.label}), h('span', {text: (t.images || []).length ? `${t.images.length} image${t.images.length > 1 ? 's' : ''}` : 'text only'}))));
    const sh = sheet('Add a section', box);
  }
  async function newEmail(from) {
    const base = from ? JSON.parse(JSON.stringify(from)) : {face: {name: 'New email', subject: '', preheader: ''}, data: {sections: ['hero', 'statement', 'product', 'signoff'].map(k => ({id: uid(), type: k, fields: ES.defaults(k), images: {}}))}};
    if (from) base.face.name = (from.face.name || 'Email') + ' (copy)';
    const r = await api('POST', '/emails', {stage: 'draft', face: base.face, data: base.data, by: ME});
    await loadList(); openEmail(r.id);
  }

  /* boot */
  function askTeam(msg) {
    return new Promise(res => {
      const inp = h('input', {class: 'fi', placeholder: 'Paste your team link or code'});
      const sh = sheet('Team code', [h('p', {class: 'hint', text: msg || 'Paste the team link Jordan shared (the same one as the grid planner).'}), inp],
        h('button', {class: 'btn primary', onclick: () => { const v = inp.value.trim(); const m = v.match(/team=([^&#\s]+)/); TEAM = m ? decodeURIComponent(m[1]) : v; ls.set('gp-team', TEAM); sh.remove(); res(); boot2(); }}, 'Continue'));
    });
  }
  function askName() {
    return new Promise(res => {
      const inp = h('input', {class: 'fi', placeholder: 'Your first name'});
      const sh = sheet('Who\'s editing?', [h('p', {class: 'hint', text: 'So the others can see who changed what.'}), inp], h('button', {class: 'btn primary', onclick: () => { ME = inp.value.trim() || 'Someone'; ls.set('gp-me', ME); sh.remove(); res(); }}, 'Continue'));
    });
  }
  function shell() {
    document.body.append(h('div', {class: 'app'},
      h('aside', {class: 'list', id: 'list'}, h('header', {}, h('h1', {text: 'Email Studio'}), h('p', {class: 'sum', id: 'sum'})), h('div', {class: 'filters', id: 'filters'}), h('div', {class: 'emails', id: 'emails'}),
        h('footer', {}, h('button', {class: 'btn primary', onclick: () => newEmail()}, '+ New email'), h('button', {class: 'btn', onclick: () => OPEN && newEmail(OPEN)}, 'Duplicate'))),
      h('main', {class: 'stage', id: 'stage'}), h('aside', {class: 'side', id: 'side'})));
    drawFilters(); drawStage(); drawSide();
  }
  async function boot2() {
    try { await api('GET', '/emails'); } catch (e) { if (e.status === 401) { ls.set('gp-team', ''); return askTeam('That code didn\'t work. Check it and try again.'); } }
    if (!ME) await askName();
    await loadLibrary(); await loadList();
    const want = new URLSearchParams(location.search).get('email'); if (want) openEmail(want);
    setInterval(async () => { if (document.hidden) return; await loadList(); if (OPEN && !dirty && Date.now() - lastEdit > 8000) { try { const r = await api('GET', `/emails/${OPEN.id}?v=${OPEN.version}`); if (!r.unchanged) { OPEN = r; drawStage(); drawSide(); } } catch (e) {} } }, 8000);
  }
  function boot() {
    const p = new URLSearchParams(location.search), t = p.get('team');
    if (t) { ls.set('gp-team', t); p.delete('team'); history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '')); }
    TEAM = ls.get('gp-team'); ME = ls.get('gp-me') || '';
    const css = document.createElement('style'); css.textContent = ES.css; document.head.append(css);
    shell();
    if (!TEAM) askTeam(); else boot2();
    window.addEventListener('beforeunload', e => { if (dirty) { flush(); e.preventDefault(); e.returnValue = ''; } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
