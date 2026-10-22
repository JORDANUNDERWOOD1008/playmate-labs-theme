/* Content Studio: one-page production board. Config: window.CS_CONFIG = {api: 'https://…workers.dev'} */
(() => {
'use strict';
const CFG = window.CS_CONFIG || {};
const API = (CFG.api || '').replace(/\/$/, '');
const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
};
const ls = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
};
const ago = t => {
  if (!t) return '';
  const s = (Date.now() - t) / 1000;
  if (s < 45) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  return new Date(t).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = d => d ? new Date(d + 'T12:00').toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : '';
const money = n => '£' + Math.round(n).toLocaleString('en-GB');

const STAGES = [
  {id: 'idea', name: 'Idea', hint: 'Write it with Claude, then paste the doc in.'},
  {id: 'shoot', name: 'Shoot', hint: 'Phone, camera or BeReal: get the raw clips and photos.'},
  {id: 'post', name: 'Post-production', hint: 'AI edits in ChatGPT, Runway or Gemini, then cut it in CapCut.'},
  {id: 'ready', name: 'Ready', hint: 'Exported. Add the post link once it\'s live.'}
];
const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn', 'Pinterest'];
const SECTIONS = [
  {id: 'script', name: 'Script', re: /^(the\s+)?script\b/i, mono: true},
  {id: 'shots', name: 'Shot list', re: /^shot\s*list|^shots?\b|^storyboard/i},
  {id: 'voiceover', name: 'Voiceover', re: /^voice\s*-?\s*over|^vo\b|^narration/i, mono: true},
  {id: 'onscreen', name: 'On-screen text', re: /^on[\s-]*screen|^text\s*overlay|^overlay|^texsta|^captions?\b|^supers?\b/i},
  {id: 'workflow', name: 'Workflow', re: /^workflow|^production\s*(steps|plan|workflow)|^steps\b|^process\b/i},
  {id: 'kit', name: 'Location & kit', re: /^location|^kit\b|^equipment|^logistics|^props/i}
];

/* ---------- icons ---------- */
const I = {
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  copy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></svg>',
  doc: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
  clip: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 11l-8.5 8.5a5 5 0 01-7-7L13 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L14 7"/></svg>',
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>',
  pdf: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><text x="12" y="17" font-size="5.5" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif" font-weight="700">PDF</text></svg>'
};
const icon = (n, cls) => h('span', {class: 'ic ' + (cls || ''), html: I[n], 'aria-hidden': 'true'});

/* ---------- layers: toast, sheets, drawer ---------- */
let toastT;
function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = h('div', {class: 'toast', role: 'status'}, msg); document.body.append(t);
  clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 3400);
}
const layers = [];
function openLayer(el, onClose) {
  document.body.append(el); layers.push({el, onClose}); document.body.classList.add('locked');
  el.addEventListener('click', e => { if (e.target === el && !el.dataset.modal) closeTop(); });
  return el;
}
function closeTop() {
  const l = layers.pop(); if (!l) return;
  l.el.remove(); l.onClose && l.onClose();
  if (!layers.length) document.body.classList.remove('locked');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && layers.length && !layers[layers.length - 1].el.dataset.modal && !/TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); closeTop(); }
});
function modal(title, body, footer, {lock = false} = {}) {
  const el = h('div', {class: 'shade'}, h('div', {class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title},
    h('header', {}, h('h2', {}, title), lock ? '' : h('button', {class: 'iconbtn', 'aria-label': 'Close', onclick: closeTop}, icon('x'))), body, footer || ''));
  if (lock) el.dataset.modal = '1';
  return openLayer(el);
}
function ask(title, text, yes, no) {
  return new Promise(res => {
    modal(title, h('div', {class: 'body'}, h('p', {}, text)),
      h('footer', {}, h('button', {class: 'btn', onclick: () => { closeTop(); res(false); }}, no), h('button', {class: 'btn primary', onclick: () => { closeTop(); res(true); }}, yes)));
  });
}

/* ---------- API ---------- */
let TEAM = ls.get('cs-team'), ME = ls.get('cs-me') || '';
async function api(method, path, body, raw) {
  const r = await fetch(API + path, {method, cache: 'no-store',
    headers: raw ? {'Content-Type': raw.type, 'X-Team-Key': TEAM} : {'Content-Type': 'application/json', 'X-Team-Key': TEAM},
    body: raw ? raw.body : body ? JSON.stringify(body) : undefined});
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || r.status); e.status = r.status; e.data = d; throw e; }
  return d;
}

/* ---------- the Claude doc: split into sections on its headings ---------- */
function parseDoc(raw) {
  const lines = String(raw || '').replace(/\r/g, '').split('\n');
  const sections = {}; let cur = null, title = '', intro = [];
  const head = l => {
    const m = l.match(/^\s{0,3}#{1,4}\s+(.+?)\s*#*\s*$/) || l.match(/^\s*\*\*([^*]{2,60})\*\*\s*:?\s*$/) || l.match(/^\s*([A-Z][\w\s&/-]{1,40}):\s*$/);
    return m ? m[1].replace(/[*_`]/g, '').replace(/^\d+[.)]\s*/, '').trim() : null;
  };
  for (const l of lines) {
    const t = head(l);
    const sec = t && SECTIONS.find(s => s.re.test(t));
    if (sec) { cur = sec.id; sections[cur] = sections[cur] ? sections[cur] + '\n' : ''; continue; }
    if (!cur && !title && /^\s{0,3}#\s+/.test(l)) { title = t; continue; }
    if (cur) sections[cur] += l + '\n'; else intro.push(l);
  }
  for (const k of Object.keys(sections)) sections[k] = sections[k].replace(/^\n+|\s+$/g, '');
  if (!title) { const first = intro.find(l => l.trim()); if (first && first.length < 90) title = first.replace(/^[#*\s]+|[*\s]+$/g, ''); }
  return {sections, title, matched: Object.keys(sections).length};
}
function kitFields(text) { // "Location: …", "Setting: …", "Extra budget: £…" lines pre-fill the shoot plan
  const get = re => { const m = String(text || '').match(re); return m ? m[1].trim() : ''; };
  const budget = get(/^\s*[-*]?\s*\**(?:extra\s+)?budget\**\s*:\s*\**\s*(.+)$/im);
  const n = budget.match(/£\s*([\d,]+(?:\.\d+)?)/);
  return {location: get(/^\s*[-*]?\s*\**location\**\s*:\s*\**\s*(.+)$/im), setting: get(/^\s*[-*]?\s*\**setting\**\s*:\s*\**\s*(.+)$/im),
          budget: n ? +n[1].replace(/,/g, '') : null};
}
function richText(text) { // escape, then **bold**, bullet lists and links; nothing else is interpreted
  const out = []; let list = null;
  for (const line of String(text || '').split('\n')) {
    let s = esc(line).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|\s)\*([^*\s][^*]*)\*(?=\s|$)/g, '$1<i>$2</i>')
      .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    const li = s.match(/^\s*(?:[-*•]|(\d+)[.)])\s+(.*)$/);
    if (li) { const tag = li[1] ? 'ol' : 'ul'; if (!list || list.tag !== tag) { list && out.push(`</${list.tag}>`); list = {tag}; out.push(`<${tag}>`); } out.push(`<li>${li[2]}</li>`); continue; }
    if (list) { out.push(`</${list.tag}>`); list = null; }
    out.push(s.trim() ? `<p>${s}</p>` : '');
  }
  if (list) out.push(`</${list.tag}>`);
  return out.join('');
}
const plain = t => String(t || '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/^#+\s*/gm, '');
async function copyText(t, what) {
  try { await navigator.clipboard.writeText(t); toast(`${what} copied`); }
  catch (e) { const ta = h('textarea', {}, t); document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast(`${what} copied`); }
}
const PROMPT = `You're helping plan a piece of social content for Playmate Labs (playmatelabs.com), a UK date-night brand for couples. Products: Nude Stack'd, a stacking game for couples, and Snap'd chocolates.
Tone: warm, cheeky, confident. 18+ but never explicit.
Rules: no health, mood or performance claims. Don't mention events or monthly drops. Say "designed in the UK" for the brand.

The idea: [describe it in a sentence or two]
Platform: [Instagram / TikTok / LinkedIn / Pinterest]
Format and length: [e.g. 20-second reel, 5-slide carousel]

Write ONE document. Start with a one-line title as "# Title", then use exactly these headings, in this order:

## Script
What happens, beat by beat.

## Shot list
Numbered shots: framing, action, duration. Say which shots are phone, camera or BeReal.

## Voiceover
Only the words to record.

## On-screen text
Each caption on its own line, with its timing.

## Workflow
Step by step: capture, which AI tool to use for each edit (ChatGPT, Runway or Gemini) with the prompt to give it, then the CapCut edit and export settings.

## Location & kit
Location: …
Setting: …
Kit: a bullet list of everything we need
Extra budget: £… and what it's for (hire, props, location)`;

/* ---------- board state ---------- */
let CARDS = [], PEOPLE = new Set(), online = false;
let filter = {q: '', platform: '', archived: false}, curStage = ls.get('cs-stage') || 'idea', dragging = false, lastList = '';
const app = h('div', {class: 'app'});
const visible = c => (filter.archived ? c.archived : !c.archived) &&
  (!filter.platform || (c.face.platforms || []).includes(filter.platform)) &&
  (!filter.q || JSON.stringify(c.face).toLowerCase().includes(filter.q));
async function loadCards() {
  const d = await api('GET', '/cards');
  const sig = JSON.stringify(d.cards);
  if (sig === lastList) return false;
  lastList = sig; CARDS = d.cards;
  CARDS.forEach(c => { c.face.owner && PEOPLE.add(c.face.owner); c.created_by && PEOPLE.add(c.created_by); });
  return true;
}
function cardFace(c) {
  const f = c.face, late = f.due && f.due < today() && c.stage !== 'ready' && !f.posted;
  return h('button', {class: 'card' + (f.posted ? ' posted' : ''), 'data-id': c.id, onclick: () => openCard(c.id)},
    h('span', {class: 'ct'}, f.title || 'Untitled idea'),
    (f.platforms || []).length ? h('span', {class: 'plats'}, f.platforms.map(p => h('span', {class: 'plat'}, p))) : '',
    h('span', {class: 'meta'},
      f.owner ? h('span', {class: 'who', title: f.owner}, f.owner.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()) : '',
      f.due ? h('span', {class: 'due' + (late ? ' late' : '')}, (late ? 'Overdue ' : '') + fmtDate(f.due)) : '',
      f.budget > 0 ? h('span', {class: 'cost', title: 'Extra budget'}, money(f.budget)) : '',
      f.posted ? h('span', {class: 'tag'}, 'Posted') : '',
      h('span', {class: 'grow'}),
      f.doc ? icon('doc', 'dim') : '', f.refs ? h('span', {class: 'dim n'}, icon('clip'), String(f.refs)) : ''));
}
function render() {
  const live = CARDS.filter(c => !c.archived);
  const budget = live.filter(c => !c.face.posted).reduce((t, c) => t + (+c.face.budget || 0), 0);
  const budgetN = live.filter(c => !c.face.posted && c.face.budget > 0).length;
  const ready = live.filter(c => c.stage === 'ready' && !c.face.posted).length;
  const summary = [budget ? `${money(budget)} extra budget across ${budgetN} idea${budgetN > 1 ? 's' : ''}` : 'No extra budget planned', `${ready} ready to post`].join('. ') + '.';
  const search = h('input', {type: 'search', class: 'search', placeholder: 'Search ideas', value: filter.q, 'aria-label': 'Search ideas',
    oninput: e => { filter.q = e.target.value.toLowerCase().trim(); drawBoard(); }});
  const plats = h('div', {class: 'chips', role: 'group', 'aria-label': 'Platform'},
    [['', 'All'], ...PLATFORMS.map(p => [p, p])].map(([k, label]) => h('button', {class: 'chip' + (filter.platform === k ? ' on' : ''), 'aria-pressed': String(filter.platform === k),
      onclick: () => { filter.platform = k; render(); }}, label)));
  app.replaceChildren(
    h('header', {class: 'top'},
      h('div', {class: 'brand'}, h('h1', {}, 'Content Studio'), h('p', {class: 'sum'}, summary)),
      h('div', {class: 'tools'}, search, plats,
        h('button', {class: 'btn ghost', onclick: () => copyText(PROMPT, 'Claude prompt')}, icon('copy'), h('span', {class: 'long'}, 'Copy the '), 'Claude prompt'),
        h('button', {class: 'btn primary', onclick: newCard}, icon('plus'), 'New idea'),
        h('button', {class: 'me', title: 'Change name', onclick: () => nameSheet(render)}, ME || 'Name'))),
    h('nav', {class: 'stagetabs', 'aria-label': 'Stages'}, STAGES.map(s => h('button', {class: curStage === s.id ? 'on' : '', 'data-stage': s.id,
      onclick: () => { curStage = s.id; ls.set('cs-stage', s.id); render(); }}, s.name, h('span', {class: 'n'}, String(CARDS.filter(c => c.stage === s.id && visible(c)).length))))),
    h('main', {class: 'board', id: 'board'}),
    h('footer', {class: 'foot'}, h('button', {class: 'linkbtn', onclick: () => { filter.archived = !filter.archived; render(); }}, filter.archived ? 'Back to the board' : 'Show archived ideas'),
      online ? '' : h('span', {class: 'warn'}, 'Not connected. Changes won\'t save until the team link works.')));
  drawBoard();
}
function drawBoard() {
  const board = $('#board'); if (!board) return;
  board.replaceChildren(...STAGES.map(s => {
    const list = CARDS.filter(c => c.stage === s.id && visible(c)).sort((a, b) => a.pos - b.pos);
    const col = h('div', {class: 'cards', 'data-stage': s.id}, list.map(cardFace));
    if (!list.length) col.append(h('p', {class: 'empty'}, filter.archived ? 'Nothing archived here.' : filter.q || filter.platform ? 'No matches here.' :
      s.id === 'idea' ? 'No ideas yet. Copy the Claude prompt, write one with Claude, then tap New idea and paste it in.' : 'Nothing here yet.'));
    if (online && !filter.archived && window.Sortable) Sortable.create(col, {group: 'cards', animation: 160, delay: 150, delayOnTouchOnly: true, filter: '.empty', draggable: '.card',
      onStart: () => dragging = true, onEnd: e => { dragging = false; dropped(e); }});
    return h('section', {class: 'col' + (curStage === s.id ? ' cur' : ''), 'data-stage': s.id, 'aria-label': s.name},
      h('header', {}, h('h2', {}, s.name, h('span', {class: 'n'}, String(list.length))), h('p', {}, s.hint)), col);
  }));
}
function posBetween(prev, next) {
  const p = prev && CARDS.find(c => c.id === prev.dataset.id), n = next && CARDS.find(c => c.id === next.dataset.id);
  if (p && n) return (p.pos + n.pos) / 2;
  if (p) return p.pos + 1; if (n) return n.pos - 1; return 1000;
}
async function moveCard(id, stage, pos) {
  const c = CARDS.find(x => x.id === id); if (!c) return;
  const from = c.stage; c.stage = stage; c.pos = pos;
  if (OPEN && OPEN.id === id) OPEN.stage = stage;
  try { await api('POST', `/cards/${id}/move`, {stage, pos, by: ME}); lastList = ''; }
  catch (e) { c.stage = from; toast('Couldn\'t move it. Check your connection and try again.'); }
  render();
}
function dropped(e) {
  const id = e.item.dataset.id, stage = e.to.dataset.stage;
  if (e.from === e.to && e.oldIndex === e.newIndex) return;
  moveCard(id, stage, posBetween(e.item.previousElementSibling, e.item.nextElementSibling));
  const s = STAGES.find(x => x.id === stage); if (e.from !== e.to) toast(`Moved to ${s.name}`);
}
async function newCard() {
  if (!online) { toast('Connect with the team link first, so ideas save where everyone can see them.'); return; }
  try {
    const r = await api('POST', '/cards', {stage: 'idea', face: {title: 'Untitled idea', owner: ME, platforms: []}, data: {}, by: ME});
    await loadCards(); curStage = 'idea'; render(); openCard(r.id, {fresh: true});
  } catch (e) { toast('Couldn\'t create the idea. Check your connection and try again.'); }
}

/* ---------- quick view ---------- */
let OPEN = null, saveT = null, saving = false, dirty = false, drawerEl = null;
async function openCard(id, {fresh = false} = {}) {
  let card;
  try { card = await api('GET', '/cards/' + id); } catch (e) { toast('Couldn\'t open it. Check your connection and try again.'); return; }
  OPEN = card; OPEN.data = OPEN.data || {}; dirty = false;
  drawerEl = h('div', {class: 'shade drawer-shade'}, h('aside', {class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': card.face.title || 'Idea'}));
  openLayer(drawerEl, () => { flush(); OPEN = null; drawerEl = null; });
  drawDrawer();
  if (fresh) { const t = $('.dtitle', drawerEl); t.focus(); t.select(); }
}
function faceFrom() {
  const d = OPEN.data, f = OPEN.face;
  f.budget = +(d.shoot && d.shoot.budget) || 0;
  f.doc = !!(d.doc && (d.doc.raw || '').trim());
  f.refs = (d.refs || []).length;
  f.posted = !!(d.post_url || '').trim();
}
function change(fn, {redraw = false} = {}) {
  fn(); faceFrom(); dirty = true;
  const c = CARDS.find(x => x.id === OPEN.id); if (c) { c.face = {...OPEN.face}; drawBoard(); }
  clearTimeout(saveT); saveT = setTimeout(pushSave, 800);
  if (redraw) drawDrawer();
  setStatus('Saving…');
}
async function pushSave() {
  if (!OPEN || !dirty) return;
  if (saving) { saveT = setTimeout(pushSave, 400); return; }
  saving = true; dirty = false;
  const card = OPEN;
  try {
    const r = await api('PUT', '/cards/' + card.id, {face: card.face, data: card.data, baseVersion: card.version, by: ME});
    card.version = r.version; card.updated_at = r.updated_at; card.updated_by = ME; lastList = '';
    setStatus('Saved');
  } catch (e) {
    if (e.status === 409 && OPEN === card) {
      const who = e.data.card.updated_by || 'Someone';
      Object.assign(OPEN, e.data.card); drawDrawer();
      toast(`${who} just changed this idea, so it now shows their version. Re-add your last edit if it's missing.`);
    } else { dirty = true; setStatus('Not saved. Retrying…'); saveT = setTimeout(pushSave, 4000); }
  }
  saving = false;
}
function flush() { if (dirty) { clearTimeout(saveT); pushSave(); } }
function setStatus(t) { const s = drawerEl && $('.dstatus', drawerEl); if (s) s.textContent = t; }

function field(label, input, hint) { return h('label', {class: 'fld'}, h('span', {class: 'lbl'}, label), input, hint ? h('span', {class: 'hint'}, hint) : ''); }
function inp(value, onInput, attrs = {}) { return h('input', {class: 'in', value: value || '', ...attrs, oninput: e => onInput(e.target.value)}); }
function area(value, onInput, attrs = {}) {
  const t = h('textarea', {class: 'in', rows: 3, ...attrs, oninput: e => { onInput(e.target.value); grow(e.target); }}, value || '');
  requestAnimationFrame(() => grow(t)); return t;
}
const grow = t => { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 520) + 'px'; };

function drawDrawer() {
  if (!drawerEl || !OPEN) return;
  const d = OPEN.data, f = OPEN.face;
  d.shoot = d.shoot || {}; d.refs = d.refs || [];
  const si = STAGES.findIndex(s => s.id === OPEN.stage);
  const title = h('textarea', {class: 'dtitle', rows: 1, 'aria-label': 'Idea title', oninput: e => { change(() => f.title = e.target.value.replace(/\n/g, ' ')); grow(e.target); }}, f.title || '');
  requestAnimationFrame(() => grow(title));
  const step = h('ol', {class: 'stepper', 'aria-label': 'Stage'}, STAGES.map((s, i) => h('li', {class: i < si ? 'done' : i === si ? 'on' : ''},
    h('button', {onclick: () => { if (i !== si) { moveCard(OPEN.id, s.id, Math.min(0, ...CARDS.filter(c => c.stage === s.id).map(c => c.pos)) - 1); drawDrawer(); toast(`Moved to ${s.name}`); } }, 'aria-current': i === si ? 'step' : null},
      h('span', {class: 'dot'}, String(i + 1)), h('span', {}, s.name)))));
  const next = STAGES[si + 1];
  const people = [...new Set([ME, ...PEOPLE].filter(Boolean))];
  const meta = h('div', {class: 'dmeta'},
    h('div', {class: 'chips'}, PLATFORMS.map(p => h('button', {class: 'chip' + ((f.platforms || []).includes(p) ? ' on' : ''), 'aria-pressed': String((f.platforms || []).includes(p)),
      onclick: () => change(() => { const a = f.platforms = f.platforms || []; a.includes(p) ? a.splice(a.indexOf(p), 1) : a.push(p); }, {redraw: true})}, p))),
    h('div', {class: 'row2'},
      field('Owner', inp(f.owner, v => change(() => f.owner = v.trim()), {list: 'cs-people', placeholder: 'Who\'s on it'})),
      field('Due', inp(f.due, v => change(() => f.due = v), {type: 'date'}))),
    h('datalist', {id: 'cs-people'}, people.map(p => h('option', {value: p}))));

  const body = h('div', {class: 'dbody'}, docBlock(), shootBlock(), filesBlock());
  const aside = $('.drawer', drawerEl);
  aside.replaceChildren(
    h('header', {class: 'dhead'},
      h('div', {class: 'dtop'}, h('span', {class: 'dstatus'}, OPEN.updated_by ? `Edited by ${OPEN.updated_by}, ${ago(OPEN.updated_at)}` : ''),
        h('button', {class: 'iconbtn', 'aria-label': 'Close', onclick: closeTop}, icon('x'))),
      title, step,
      next ? h('button', {class: 'btn primary next', onclick: () => { moveCard(OPEN.id, next.id, Math.min(0, ...CARDS.filter(c => c.stage === next.id).map(c => c.pos)) - 1); drawDrawer(); toast(`Moved to ${next.name}`); }}, `Move to ${next.name} →`) : '',
      meta),
    body,
    h('footer', {class: 'dfoot'},
      OPEN.archived
        ? h('button', {class: 'btn', onclick: () => archive(false)}, 'Restore to the board')
        : h('button', {class: 'btn quiet', onclick: () => archive(true)}, 'Archive this idea'),
      h('span', {class: 'hint'}, OPEN.created_by ? `Added by ${OPEN.created_by}, ${ago(OPEN.created_at)}` : '')));
}
async function archive(on) {
  if (on && !await ask('Archive this idea?', 'It leaves the board. You can bring it back from "Show archived ideas" at the bottom.', 'Archive', 'Keep it')) return;
  flush();
  try { await api('POST', `/cards/${OPEN.id}/${on ? 'archive' : 'restore'}`, {by: ME}); lastList = ''; await loadCards(); closeTop(); render(); toast(on ? 'Archived' : 'Restored to the board'); }
  catch (e) { toast('Couldn\'t do that. Check your connection and try again.'); }
}

/* doc: paste, sections, copy */
function docBlock() {
  const doc = OPEN.data.doc = OPEN.data.doc || {raw: '', sections: {}};
  const wrap = h('section', {class: 'blk doc'}, h('div', {class: 'bh'}, h('h3', {}, 'Claude doc'),
    h('button', {class: 'btn small', onclick: pasteDoc}, doc.raw ? 'Replace with a new version' : 'Paste Claude\'s doc')));
  if (!doc.raw) { wrap.append(h('p', {class: 'empty'}, 'Paste the whole document Claude wrote. It splits into script, shot list, voiceover, on-screen text and workflow, each with its own copy button.')); return wrap; }
  const secs = SECTIONS.filter(s => doc.sections && doc.sections[s.id] != null);
  if (!secs.length) { wrap.append(section({id: 'raw', name: 'Brief', mono: false}, doc.raw, v => change(() => doc.raw = v))); wrap.append(h('p', {class: 'hint'}, 'The headings didn\'t match the Claude prompt, so the doc is kept as one block.')); return wrap; }
  for (const s of secs) wrap.append(section(s, doc.sections[s.id], v => change(() => doc.sections[s.id] = v)));
  return wrap;
}
function section(s, text, onSave) {
  const box = h('div', {class: 'sec' + (s.mono ? ' mono' : '')});
  const view = () => box.replaceChildren(
    h('div', {class: 'sh'}, h('h4', {}, s.name), h('span', {class: 'grow'}),
      h('button', {class: 'btn small ghost', onclick: () => edit()}, 'Edit'),
      h('button', {class: 'btn small', onclick: () => copyText(plain(text), s.name)}, icon('copy'), 'Copy')),
    h('div', {class: 'txt', html: richText(text) || '<p class="hint">Empty</p>'}));
  const edit = () => {
    const t = area(text, v => text = v, {rows: 6});
    box.replaceChildren(h('div', {class: 'sh'}, h('h4', {}, s.name), h('span', {class: 'grow'}), h('button', {class: 'btn small primary', onclick: () => { onSave(text); view(); }}, 'Done')), t);
    t.focus();
  };
  view(); return box;
}
function pasteDoc() {
  const doc = OPEN.data.doc;
  const t = h('textarea', {class: 'in', rows: 12, placeholder: 'Paste the full document from Claude here', 'aria-label': 'Claude doc'});
  const go = async () => {
    const raw = t.value.trim(); if (!raw) { t.focus(); return; }
    if (doc.raw && !await ask('Replace the doc?', 'The script, shot list and the rest are replaced with this new version. Your shoot plan stays as it is.', 'Replace it', 'Cancel')) return;
    const p = parseDoc(raw);
    closeTop();
    change(() => {
      OPEN.data.doc = {raw, sections: p.sections};
      if (p.title && (!OPEN.face.title || OPEN.face.title === 'Untitled idea')) OPEN.face.title = p.title;
      const k = kitFields(p.sections.kit), sh = OPEN.data.shoot = OPEN.data.shoot || {};
      if (k.location && !sh.location) sh.location = k.location;
      if (k.setting && !sh.setting) sh.setting = k.setting;
      if (k.budget != null && !sh.budget) sh.budget = k.budget;
    }, {redraw: true});
    toast(p.matched ? `Doc added: ${p.matched} section${p.matched > 1 ? 's' : ''} found` : 'Doc added as one block. The headings didn\'t match the Claude prompt.');
  };
  modal(doc.raw ? 'Paste the new version' : 'Paste Claude\'s doc', h('div', {class: 'body'}, t,
    h('p', {class: 'hint'}, 'Tip: start Claude with "Copy the Claude prompt" at the top of the board, so the sections split cleanly.')),
    h('footer', {}, h('button', {class: 'btn', onclick: closeTop}, 'Cancel'), h('button', {class: 'btn primary', onclick: go}, 'Add the doc')));
  setTimeout(() => t.focus(), 50);
}

/* shoot plan */
function shootBlock() {
  const sh = OPEN.data.shoot;
  const mapUrl = sh.location_url || (sh.location ? 'https://www.google.com/maps/search/' + encodeURIComponent(sh.location) : '');
  return h('section', {class: 'blk'}, h('div', {class: 'bh'}, h('h3', {}, 'Shoot plan')),
    h('div', {class: 'row2'},
      field('Location', h('div', {class: 'withbtn'}, inp(sh.location, v => change(() => sh.location = v), {placeholder: 'e.g. Jordan\'s flat, Shoreditch rooftop'}),
        mapUrl ? h('a', {class: 'iconbtn', href: mapUrl, target: '_blank', rel: 'noopener', title: 'Open the location', 'aria-label': 'Open the location'}, icon('pin')) : '')),
      field('Location link', inp(sh.location_url, v => change(() => sh.location_url = v.trim()), {type: 'url', placeholder: 'Maps, Airbnb or venue link'}))),
    field('Setting', area(sh.setting, v => change(() => sh.setting = v), {rows: 2, placeholder: 'Time of day, mood, styling, who\'s in it'})),
    field('Kit needed', area(sh.kit, v => change(() => sh.kit = v), {rows: 3, placeholder: 'Tripod, ring light, 35mm lens, the Nude Stack\'d box…'}), 'One item per line.'),
    h('div', {class: 'row2'},
      field('Extra budget (£)', inp(sh.budget || '', v => change(() => sh.budget = Math.max(0, +v || 0)), {type: 'number', min: 0, step: 1, inputmode: 'decimal', placeholder: '0'})),
      h('span')),
    field('Budget notes', area(sh.notes, v => change(() => sh.notes = v), {rows: 2, placeholder: 'What the money is for: camera hire, location fee, props'})),
    refsBlock());
}
function refsBlock() {
  const refs = OPEN.data.refs;
  const list = h('ul', {class: 'refs'}, refs.map((r, i) => {
    const href = r.img ? API + '/img/' + r.img : r.url;
    return h('li', {class: 'ref'},
      r.img && r.mime !== 'application/pdf' ? h('a', {href, target: '_blank', rel: 'noopener', class: 'thumb'}, h('img', {src: href, alt: r.label || 'Reference', loading: 'lazy'}))
        : h('a', {href, target: '_blank', rel: 'noopener', class: 'thumb icon'}, icon(r.img ? 'pdf' : 'link')),
      h('div', {class: 'rinfo'}, inp(r.label, v => change(() => r.label = v), {'aria-label': 'Label', placeholder: 'What is it? e.g. Lens hire quote'}),
        h('a', {href, target: '_blank', rel: 'noopener', class: 'rlink'}, r.img ? (r.mime === 'application/pdf' ? 'Open PDF' : 'Open image') : r.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 48))),
      h('button', {class: 'iconbtn', 'aria-label': 'Remove ' + (r.label || 'reference'), onclick: async () => {
        if (!await ask('Remove this?', `"${r.label || 'This reference'}" comes off the idea.`, 'Remove', 'Keep it')) return;
        change(() => refs.splice(i, 1), {redraw: true});
        if (r.img) api('DELETE', '/images/' + r.img).catch(() => {});
      }}, icon('x')));
  }));
  const fileIn = h('input', {type: 'file', accept: 'image/*,application/pdf,.pdf', multiple: true, hidden: true, onchange: e => { upload(e.target.files); e.target.value = ''; }});
  const linkIn = h('input', {class: 'in', type: 'url', placeholder: 'Paste a link (hire shop, quote, Pinterest ref)', 'aria-label': 'Reference link'});
  const addLink = () => { const u = linkIn.value.trim(); if (!/^https?:\/\//.test(u)) { toast('Paste a full link starting with https://'); linkIn.focus(); return; }
    change(() => refs.push({label: '', url: u}), {redraw: true}); };
  linkIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } });
  const zone = h('div', {class: 'refadd'}, h('div', {class: 'withbtn'}, linkIn, h('button', {class: 'btn small', onclick: addLink}, 'Add link')),
    h('button', {class: 'btn small ghost', onclick: () => fileIn.click()}, icon('clip'), 'Upload a quote or reference'), fileIn,
    h('span', {class: 'hint'}, 'Photos, screenshots or PDFs. You can also drop files here.'));
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drop'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drop'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drop'); upload(e.dataTransfer.files); });
  return h('div', {class: 'fld'}, h('span', {class: 'lbl'}, 'Quotes and references'), refs.length ? list : '', zone);
}
async function toJpeg(file) {
  let bmp; try { bmp = await createImageBitmap(file, {imageOrientation: 'from-image'}); } catch (e) { return null; }
  const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height)), W = Math.round(bmp.width * k), H = Math.round(bmp.height * k);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(bmp, 0, 0, W, H);
  for (const q of [0.86, 0.76, 0.64]) { const b = await new Promise(r => c.toBlob(r, 'image/jpeg', q)); if (b && b.size <= 1300 * 1024) return {blob: b, w: W, h: H}; }
  return null;
}
async function upload(files) {
  const card = OPEN; if (!card) return;
  const fs = [...files]; if (!fs.length) return;
  toast(`Uploading ${fs.length} file${fs.length > 1 ? 's' : ''}…`);
  const failed = [];
  for (const f of fs) {
    const pdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    try {
      let body, type = 'image/jpeg', w = 1, hh = 1;
      if (pdf) { if (f.size > 1400 * 1024) { failed.push(f.name + ' (PDF over 1.4 MB: add it as a link instead)'); continue; } body = f; type = 'application/pdf'; }
      else { const j = await toJpeg(f); if (!j) { failed.push(f.name + (/\.(heic|heif)$/i.test(f.name) ? ' (HEIC: save it as JPG first)' : ' (can\'t read this file)')); continue; } body = j.blob; w = j.w; hh = j.h; }
      const qs = new URLSearchParams({name: f.name.slice(0, 70), cat: 'studio', w, h: hh, by: ME});
      const r = await api('POST', '/images?' + qs, null, {type, body});
      if (OPEN === card) change(() => card.data.refs.push({label: f.name.replace(/\.[^.]+$/, ''), img: r.id, mime: type}), {redraw: true});
    } catch (e) { failed.push(f.name); }
  }
  toast(failed.length ? `Couldn't upload ${failed.join(', ')}.` : 'Uploaded');
}

/* files + post link */
function filesBlock() {
  const d = OPEN.data;
  const open = u => u ? h('a', {class: 'iconbtn', href: u, target: '_blank', rel: 'noopener', 'aria-label': 'Open link', title: 'Open'}, icon('link')) : '';
  return h('section', {class: 'blk'}, h('div', {class: 'bh'}, h('h3', {}, 'Files and posting')),
    field('Raw and edited files', h('div', {class: 'withbtn'}, inp(d.files_url, v => change(() => d.files_url = v.trim()), {type: 'url', placeholder: 'Google Drive or Dropbox folder link'}), open(d.files_url)),
      'Keep the clips in one shared folder, then link it here.'),
    field('Post link', h('div', {class: 'withbtn'}, inp(d.post_url, v => change(() => d.post_url = v.trim()), {type: 'url', placeholder: 'Paste once it\'s live'}), open(d.post_url)),
      'Adding this marks the idea as posted.'));
}

/* ---------- identity ---------- */
function nameSheet(onDone) {
  const i = h('input', {class: 'in', placeholder: 'Your first name', maxlength: 30, 'aria-label': 'Your name', value: ME});
  const go = () => { const n = i.value.trim(); if (!n) { i.focus(); return; } ME = n; ls.set('cs-me', n); closeTop(); onDone && onDone(); };
  i.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  modal('Who\'s this?', h('div', {class: 'body'}, h('p', {}, 'Your name goes on the ideas you add and edit, so everyone can see who did what.'), i),
    h('footer', {}, h('button', {class: 'btn primary', onclick: go}, 'Continue')), {lock: !ME});
  setTimeout(() => i.focus(), 50);
}
function teamSheet(err) {
  return new Promise(res => {
    const i = h('input', {class: 'in', placeholder: 'Team link or code', 'aria-label': 'Team code'});
    const go = () => { const v = i.value.trim(); if (!v) { i.focus(); return; } const m = v.match(/team=([\w-]+)/); const code = m ? m[1] : v; ls.set('cs-team', code); closeTop(); res(code); };
    i.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    modal('Open Content Studio', h('div', {class: 'body'}, h('p', {}, err || 'Paste the team link Jordan sent you.'), i),
      h('footer', {}, h('button', {class: 'btn primary', onclick: go}, 'Open the board')), {lock: true});
    setTimeout(() => i.focus(), 50);
  });
}

/* ---------- boot + live updates ---------- */
async function poll() {
  if (!online || document.hidden || dragging) return;
  try {
    if (await loadCards() && !layers.some(l => l.el !== drawerEl)) { const f = document.activeElement; if (!f || !f.classList.contains('search')) render(); else drawBoard(); }
    if (OPEN && !dirty && !saving && !drawerEl.contains(document.activeElement)) {
      const r = await api('GET', `/cards/${OPEN.id}?v=${OPEN.version}`);
      if (!r.unchanged && OPEN && OPEN.id === r.id) { Object.assign(OPEN, r); drawDrawer(); }
    }
  } catch (e) { /* next tick */ }
}
async function boot() {
  document.body.append(app);
  const q = new URLSearchParams(location.search), hq = new URLSearchParams(location.hash.slice(1));
  const teamIn = q.get('team') || hq.get('team');
  if (teamIn) { ls.set('cs-team', teamIn); TEAM = teamIn; q.delete('team'); const s = q.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); }
  render();
  if (!TEAM) TEAM = await teamSheet();
  for (let tries = 0; tries < 3 && !online; tries++) {
    try { await loadCards(); online = true; }
    catch (e) {
      if (e.status === 401) { ls.set('cs-team', ''); TEAM = await teamSheet('That team link didn\'t work. Check you copied all of it and try again.'); }
      else { toast('Can\'t reach the board right now. It retries automatically.'); break; }
    }
  }
  render();
  if (!ME) nameSheet(render);
  const open = q.get('idea'); if (open && online) openCard(open);
  setInterval(() => { if (!online) loadCards().then(() => { online = true; render(); }).catch(() => {}); else poll(); }, 4000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
  window.addEventListener('beforeunload', e => { if (dirty || saving) { flush(); e.preventDefault(); e.returnValue = ''; } });
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
