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
const P = window.StudioParse;
const {PLATFORMS, SECTIONS, safeUrl, domain} = P;

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

/* ---------- the Claude doc ---------- */
// escape everything, then allow **bold**, *italic*, lists, [text](https://…) and bare https links; checklists render as tick boxes
function richText(text, {checks = false} = {}) {
  const out = []; let list = null, box = -1;
  const link = (u, t) => { const s = safeUrl(u.replace(/&amp;/g, '&')); return s ? `<a href="${esc(s)}" target="_blank" rel="noopener">${t}</a>` : t; };
  for (const line of String(text || '').split('\n')) {
    let s = esc(line).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|\s)\*([^*\s][^*]*)\*(?=\s|$)/g, '$1<i>$2</i>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, t, u) => link(u, t))
      .replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, (m, pre, u) => pre + link(u, esc(P.domain(u.replace(/&amp;/g, '&')) || u)));
    const ck = s.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (ck && checks) { box++; if (!list || list.tag !== 'ul class="checks"') { list && out.push('</ul>'); list = {tag: 'ul class="checks"'}; out.push('<ul class="checks">'); }
      out.push(`<li><label><input type="checkbox" data-n="${box}"${ck[1] !== ' ' ? ' checked' : ''}> <span>${ck[2]}</span></label></li>`); continue; }
    const li = s.match(/^\s*(?:[-*•]|(\d+)[.)])\s+(.*)$/);
    if (li) { const tag = li[1] ? 'ol' : 'ul'; if (!list || list.tag !== tag) { list && out.push(`</${list.tag.split(' ')[0]}>`); list = {tag}; out.push(`<${tag}>`); } out.push(`<li>${li[2]}</li>`); continue; }
    if (list) { out.push(`</${list.tag.split(' ')[0]}>`); list = null; }
    out.push(s.trim() ? `<p>${s}</p>` : '');
  }
  if (list) out.push(`</${list.tag.split(' ')[0]}>`);
  return out.join('');
}
const plain = t => String(t || '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 ($2)').replace(/^#+\s*/gm, '');
async function copyText(t, what) {
  try { await navigator.clipboard.writeText(t); toast(`${what} copied`); }
  catch (e) { const ta = h('textarea', {}, t); document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast(`${what} copied`); }
}
// for anyone without the content-concept skill: the same format, as a prompt
const PROMPT = `You're planning a piece of social content for Playmate Labs (playmatelabs.com), a UK date-night brand for couples. Products: Nude Stack'd (a stacking game for couples) and Snap'd chocolates.
Tone: warm, cheeky, confident. 18+ but never explicit. No health, mood or performance claims. Don't mention events or monthly drops. Say "designed in the UK" for the brand.
Music must come from libraries brand accounts may use (TikTok Commercial Music Library, Meta Sound Collection, CapCut commercial-use tracks), never chart tracks.
Only give location links you have actually opened; mark each "Verified <date>" or "Unverified". Write "ask" for any price you couldn't see.

The idea: [describe it]
Platform: [Instagram / TikTok / LinkedIn / Pinterest]
Format and length: [e.g. 20-second reel]
Area: [e.g. London, or "at home"]

Write ONE document. Start with "# Title", then a line "Platform: … | Format: … | Length: … | Where: …", then exactly these headings (skip any that don't apply):
## Concept  (hook in one line, why it fits the brand in one line)
## Locations  (2-4 numbered options: **Name** — [link](https://…) — why it fits — cost or "ask" — best time — Verified <date> / Unverified)
## Shoot day  (date/call time, who's on camera, props and products, weather backup, permissions and release forms)
## Kit  (bullets; mark hire items with a cost)
## Budget  (line items and "Total: £X", or "Extra budget: £0 — none needed")
## Shot list
## Script
## Voiceover
## On-screen text  (timed)
## Music
## Tech stack
## Workflow  (numbered steps, with the AI prompts to use)
## Captions  (per platform, with hashtags)
## Open questions  (checklist: "- [ ] …")
End with a fenced block labelled studio containing JSON: {"platforms":[…],"budget":number,"kit":[…],"locations":[{"name":"","url":"","notes":"","verified":""}]}`;

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
    f.loc ? h('span', {class: 'cloc'}, icon('pin'), f.loc) : '',
    h('span', {class: 'meta'},
      f.owner ? h('span', {class: 'who', title: f.owner}, f.owner.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()) : '',
      f.due ? h('span', {class: 'due' + (late ? ' late' : '')}, (late ? 'Overdue ' : '') + fmtDate(f.due)) : '',
      f.budget > 0 ? h('span', {class: 'cost', title: 'Extra budget'}, money(f.budget)) : '',
      f.open > 0 ? h('span', {class: 'open', title: 'Open questions'}, `${f.open} to decide`) : '',
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
let TAB = 'plan', OPEN = null, saveT = null, saving = false, dirty = false, drawerEl = null;
async function openCard(id, {fresh = false} = {}) {
  let card;
  try { card = await api('GET', '/cards/' + id); } catch (e) { toast('Couldn\'t open it. Check your connection and try again.'); return; }
  OPEN = card; OPEN.data = OPEN.data || {}; dirty = false; TAB = 'plan'; pickingLoc = false;
  drawerEl = h('div', {class: 'shade drawer-shade'}, h('aside', {class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': card.face.title || 'Idea'}));
  openLayer(drawerEl, () => { flush(); OPEN = null; drawerEl = null; });
  drawDrawer();
  if (fresh) { const t = $('.dtitle', drawerEl); t.focus(); t.select(); }
}
function faceFrom() {
  const d = OPEN.data, f = OPEN.face, sh = d.shoot || {};
  f.budget = +sh.budget || 0;
  f.doc = !!(d.doc && Object.keys(d.doc.sections || {}).length + (d.doc.raw ? 1 : 0));
  f.refs = (d.refs || []).length;
  f.posted = !!safeUrl(d.post_url);
  f.open = d.doc && d.doc.sections ? P.openCount(d.doc.sections.questions) : 0;
  const lk = sh.locked && (sh.options || []).find(o => o.id === sh.locked);
  f.loc = lk ? lk.name : '';
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
  const body = {face: card.face, data: card.data, baseVersion: card.version, by: ME};
  if (new Blob([JSON.stringify(body)]).size > 580 * 1024) { saving = false; setStatus('Not saved: this idea is too big'); toast('This idea is too big to save. Shorten the doc, or move long notes into a linked Google Doc in Resources.'); return; }
  try {
    const r = await api('PUT', '/cards/' + card.id, body);
    card.version = r.version; card.updated_at = r.updated_at; card.updated_by = ME; lastList = '';
    setStatus('Saved');
  } catch (e) {
    if (e.status === 409 && OPEN === card) {
      const who = e.data.card.updated_by || 'Someone';
      Object.assign(OPEN, e.data.card); drawDrawer();
      toast(`${who} just changed this idea, so it now shows their version. Re-add your last edit if it's missing.`);
    } else if (e.status === 413) { setStatus('Not saved: this idea is too big'); toast('This idea is too big to save. Shorten the doc, or move long notes into a linked Google Doc in Resources.'); }
    else { dirty = true; setStatus('Not saved. Retrying…'); saveT = setTimeout(pushSave, 4000); }
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
  d.shoot = d.shoot || {}; d.refs = d.refs || []; d.shoot.options = d.shoot.options || [];
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

  const nRes = d.refs.filter(r => r.group === 'resource').length + (d.res_notes && d.res_notes.trim() ? 1 : 0);
  const tabs = h('div', {class: 'dtabs', role: 'tablist'}, [['plan', 'Plan'], ['res', `Resources${nRes ? ` (${nRes})` : ''}`]].map(([k, label]) =>
    h('button', {role: 'tab', class: TAB === k ? 'on' : '', 'aria-selected': String(TAB === k), onclick: () => { TAB = k; drawDrawer(); }}, label)));
  const body = h('div', {class: 'dbody'}, TAB === 'res' ? resourcesBlock() : [docBlock(), shootBlock(), filesBlock()]);
  const aside = $('.drawer', drawerEl);
  aside.replaceChildren(
    h('header', {class: 'dhead'},
      h('div', {class: 'dtop'}, h('span', {class: 'dstatus'}, OPEN.updated_by ? `Edited by ${OPEN.updated_by}, ${ago(OPEN.updated_at)}` : ''),
        h('button', {class: 'iconbtn', 'aria-label': 'Close', onclick: closeTop}, icon('x'))),
      title, step,
      next ? h('button', {class: 'btn primary next', onclick: () => { moveCard(OPEN.id, next.id, Math.min(0, ...CARDS.filter(c => c.stage === next.id).map(c => c.pos)) - 1); drawDrawer(); toast(`Moved to ${next.name}`); }}, `Move to ${next.name} →`) : '',
      meta, tabs),
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

/* doc: import, sections, copy */
function docBlock() {
  const doc = OPEN.data.doc = OPEN.data.doc || {sections: {}};
  const has = Object.keys(doc.sections || {}).length || (doc.extra || []).length || doc.raw;
  const wrap = h('section', {class: 'blk doc'}, h('div', {class: 'bh'}, h('h3', {}, 'Concept doc'),
    h('button', {class: 'btn small', onclick: importDoc}, has ? 'Replace with a new version' : 'Add the concept doc')));
  if (!has) { wrap.append(h('p', {class: 'empty'}, 'Paste or upload the doc Claude wrote. It fills in this card: locations, kit, budget, script, shot list, voiceover, music, workflow and captions, each with its own copy button.')); return wrap; }
  if (doc.imported_at) wrap.append(h('p', {class: 'hint'}, `Added by ${doc.by || 'someone'}, ${ago(doc.imported_at)}.`));
  (doc.warnings || []).forEach(w => wrap.append(h('p', {class: 'warnline'}, w)));
  const secs = SECTIONS.filter(s => doc.sections && doc.sections[s.id] != null && s.id !== 'locations');
  if (!secs.length && !(doc.extra || []).length) {
    wrap.append(section({id: 'raw', name: 'Brief'}, doc.raw || '', v => change(() => doc.raw = v)));
    wrap.append(h('p', {class: 'hint'}, 'The headings didn\'t match the concept format, so the doc is kept as one block.')); return wrap;
  }
  for (const s of secs) wrap.append(section(s, doc.sections[s.id], v => change(() => doc.sections[s.id] = v)));
  (doc.extra || []).forEach((x, i) => wrap.append(section({id: 'x' + i, name: x.heading}, x.text, v => change(() => doc.extra[i].text = v))));
  return wrap;
}
function section(s, text, onSave) {
  const box = h('div', {class: 'sec' + (s.mono ? ' mono' : ''), 'data-sec': s.id});
  const view = () => {
    const txt = h('div', {class: 'txt', html: richText(text, {checks: s.id === 'questions'}) || '<p class="hint">Empty</p>'});
    txt.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', () => { text = P.toggleCheck(text, +cb.dataset.n); onSave(text); }));
    box.replaceChildren(
      h('div', {class: 'sh'}, h('h4', {}, s.name), h('span', {class: 'grow'}),
        h('button', {class: 'btn small ghost', onclick: () => edit()}, 'Edit'),
        h('button', {class: 'btn small', onclick: () => copyText(plain(text), s.name)}, icon('copy'), 'Copy')), txt);
  };
  const edit = () => {
    const t = area(text, v => text = v, {rows: 6});
    box.replaceChildren(h('div', {class: 'sh'}, h('h4', {}, s.name), h('span', {class: 'grow'}), h('button', {class: 'btn small primary', onclick: () => { onSave(text); view(); }}, 'Done')), t);
    t.focus();
  };
  view(); return box;
}
const sameVal = (a, b) => JSON.stringify(a ?? '') === JSON.stringify(b ?? '');
/* bring a parsed doc into the card. A field the doc filled last time is updated; a field someone typed into is left alone. */
function applyDoc(raw, p) {
  const d = OPEN.data, f = OPEN.face, sh = d.shoot = d.shoot || {}, ap = (d.doc && d.doc.applied) || {};
  const set = (key, cur, val, put) => { if (val == null || val === '' || (Array.isArray(val) && !val.length)) return; if (!cur || (Array.isArray(cur) && !cur.length) || sameVal(cur, ap[key])) put(val); ap[key] = val; };
  set('title', f.title === 'Untitled idea' ? '' : f.title, p.title, v => f.title = v);
  set('platforms', f.platforms, p.platforms, v => f.platforms = v.slice());
  set('budget', sh.budget, p.budget === 0 ? null : p.budget, v => sh.budget = v);
  if (p.budget === 0 && !sh.budget) ap.budget = 0;
  set('kit', sh.kit, p.kit.length ? p.kit.join('\n') : '', v => sh.kit = v);
  set('setting', sh.setting, p.setting, v => sh.setting = v);
  // location options: the doc's list is replaced; options added by hand and a locked choice are kept
  const old = sh.options || [], keep = old.filter(o => o.src !== 'doc' || o.id === sh.locked);
  const fresh = p.options.map(o => ({id: Math.random().toString(36).slice(2, 9), src: 'doc', ...o}));
  for (const k of keep) { const same = fresh.find(o => o.name.toLowerCase() === k.name.toLowerCase()); if (same && k.id === sh.locked) { same.id = k.id; } }
  sh.options = [...fresh, ...keep.filter(k => !fresh.some(o => o.id === k.id)).map(k => k.src === 'doc' ? {...k, stale: true} : k)];
  d.doc = {v: 2, raw: raw.length > 100000 ? '' : raw, imported_at: Date.now(), by: ME, sections: p.sections, extra: p.extra, meta: p.meta, warnings: p.warnings, applied: ap};
}
function importDoc() {
  const doc = OPEN.data.doc || {};
  const t = h('textarea', {class: 'in', rows: 12, placeholder: 'Paste the full concept doc from Claude here', 'aria-label': 'Concept doc'});
  const fileIn = h('input', {type: 'file', accept: '.md,.markdown,.txt,text/plain,text/markdown', hidden: true, onchange: async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (/\.docx?$/i.test(f.name)) { toast('Word files can\'t be read here. In Claude, copy the doc and paste it, or download it as Markdown (.md).'); return; }
    if (f.size > 400 * 1024) { toast('That file is too big for one idea. Check it\'s the concept doc.'); return; }
    t.value = await f.text(); go();
  }});
  const go = async () => {
    const raw = t.value.trim(); if (!raw) { t.focus(); return; }
    if ((doc.sections && Object.keys(doc.sections).length || doc.raw) && !await ask('Replace the doc?', 'The script, shot list and the rest are replaced with this version. Anything you typed into the shoot plan, a locked location and your uploads stay as they are.', 'Replace it', 'Cancel')) return;
    const p = P.parseDoc(raw);
    closeTop();
    change(() => applyDoc(raw, p), {redraw: true});
    const bits = [`${p.matched} section${p.matched === 1 ? '' : 's'}`, p.options.length ? `${p.options.length} location option${p.options.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' and ');
    toast(p.matched ? `Doc added: ${bits} found.` : 'Doc added as one block. The headings didn\'t match the concept format.');
  };
  modal(doc.sections && Object.keys(doc.sections).length ? 'Add the new version' : 'Add the concept doc', h('div', {class: 'body'}, t,
    h('div', {class: 'withbtn'}, h('button', {class: 'btn small ghost', onclick: () => fileIn.click()}, icon('clip'), 'Upload a .md or .txt file'), fileIn),
    h('p', {class: 'hint'}, 'Best results: write it with the content-concept skill in Claude, or start Claude with "Copy the Claude prompt" at the top of the board.')),
    h('footer', {}, h('button', {class: 'btn', onclick: closeTop}, 'Cancel'), h('button', {class: 'btn primary', onclick: go}, 'Add the doc')));
  setTimeout(() => t.focus(), 50);
}

/* shoot plan: location options from the doc, lock one in */
let pickingLoc = false;
function locationChooser() {
  const sh = OPEN.data.shoot, opts = sh.options || [];
  const locked = opts.find(o => o.id === sh.locked);
  const lock = o => change(() => { sh.locked = o.id; sh.location = o.name; sh.location_url = safeUrl(o.url); pickingLoc = false; }, {redraw: true});
  const row = (o, isLocked) => {
    const url = safeUrl(o.url), dom = url ? domain(url) : '';
    return h('li', {class: 'opt' + (isLocked ? ' locked' : '') + (o.stale ? ' stale' : '')},
      h('div', {class: 'oinfo'},
        h('div', {class: 'oname'}, isLocked ? icon('pin') : '', h('b', {}, o.name),
          o.verified && !/not\s*needed|n\/a/i.test(o.verified) ? h('span', {class: 'vtag' + (/unverified/i.test(o.verified) ? ' warn' : '')}, /unverified/i.test(o.verified) ? 'Unverified' : ('Verified ' + o.verified.replace(/^verified\s*/i, '')).trim()) : '',
          o.stale ? h('span', {class: 'vtag warn'}, 'Not in the latest doc') : ''),
        o.notes ? h('div', {class: 'onotes', html: richText(o.notes)}) : ''),
      h('div', {class: 'oacts'},
        url ? h('a', {class: 'btn small', href: url, target: '_blank', rel: 'noopener', title: url}, 'Open ', h('span', {class: 'dom'}, dom), ' ↗') : h('span', {class: 'hint'}, 'No link'),
        isLocked && pickingLoc ? h('span', {class: 'vtag'}, 'Locked')
          : isLocked ? h('button', {class: 'btn small ghost', onclick: () => { pickingLoc = true; drawDrawer(); }}, 'Change')
          : h('button', {class: 'btn small primary', onclick: () => lock(o)}, 'Lock this one'),
        o.src === 'manual' && !isLocked ? h('button', {class: 'iconbtn', 'aria-label': 'Remove ' + o.name, onclick: () => change(() => sh.options = opts.filter(x => x !== o), {redraw: true})}, icon('x')) : ''));
  };
  const addName = h('input', {class: 'in', placeholder: 'Another place', 'aria-label': 'Location name'});
  const addUrl = h('input', {class: 'in', type: 'url', placeholder: 'Link (optional)', 'aria-label': 'Location link'});
  const add = () => { const n = addName.value.trim(); if (!n) { addName.focus(); return; } const u = addUrl.value.trim();
    if (u && !safeUrl(u)) { toast('Paste a full link starting with https://'); addUrl.focus(); return; }
    change(() => sh.options = [...opts, {id: Math.random().toString(36).slice(2, 9), src: 'manual', name: n, url: safeUrl(u), notes: ''}], {redraw: true}); };
  const adder = h('div', {class: 'optadd'}, addName, addUrl, h('button', {class: 'btn small', onclick: add}, 'Add option'));
  if (locked && !pickingLoc) return h('div', {class: 'fld'}, h('span', {class: 'lbl'}, 'Location: locked in'), h('ul', {class: 'opts'}, row(locked, true)),
    opts.length > 1 ? h('span', {class: 'hint'}, `${opts.length - 1} other option${opts.length > 2 ? 's' : ''}. Tap Change to compare.`) : '');
  return h('div', {class: 'fld'}, h('span', {class: 'lbl'}, opts.length ? `Location options (${opts.length})` : 'Location options'),
    opts.length ? h('ul', {class: 'opts'}, opts.map(o => row(o, o.id === sh.locked))) : h('p', {class: 'hint'}, 'The doc\'s location options appear here, each with a link. Or add one yourself.'),
    adder, locked ? h('button', {class: 'linkbtn', onclick: () => { pickingLoc = false; drawDrawer(); }}, `Keep ${locked.name}`) : '');
}
function shootBlock() {
  const sh = OPEN.data.shoot;
  const url = safeUrl(sh.location_url) || (sh.location ? 'https://www.google.com/maps/search/' + encodeURIComponent(sh.location) : '');
  return h('section', {class: 'blk'}, h('div', {class: 'bh'}, h('h3', {}, 'Shoot plan')),
    locationChooser(),
    h('div', {class: 'row2'},
      field('Chosen location', h('div', {class: 'withbtn'}, inp(sh.location, v => change(() => { sh.location = v; if (sh.locked) { const o = (sh.options || []).find(x => x.id === sh.locked); if (o && o.name !== v) sh.locked = null; } }), {placeholder: 'e.g. Primrose Hill, or at home'}),
        url ? h('a', {class: 'iconbtn', href: url, target: '_blank', rel: 'noopener', title: 'Open the location', 'aria-label': 'Open the location'}, icon('pin')) : '')),
      field('Location link', inp(sh.location_url, v => change(() => sh.location_url = v.trim()), {type: 'url', placeholder: 'Maps, Airbnb or venue link'}))),
    field('Setting', area(sh.setting, v => change(() => sh.setting = v), {rows: 2, placeholder: 'Time of day, mood, styling, who\'s in it'})),
    field('Kit needed', area(sh.kit, v => change(() => sh.kit = v), {rows: 3, placeholder: 'Tripod, ring light, 35mm lens, the Nude Stack\'d box…'}), 'One item per line.'),
    h('div', {class: 'row2'},
      field('Extra budget (£)', inp(sh.budget || '', v => change(() => sh.budget = Math.max(0, +v || 0)), {type: 'number', min: 0, step: 1, inputmode: 'decimal', placeholder: '0'})),
      h('span')),
    field('Budget notes', area(sh.notes, v => change(() => sh.notes = v), {rows: 2, placeholder: 'What the money is for: camera hire, location fee, props'})),
    refsBlock('quote'));
}
/* quotes (shoot plan) and resources (Resources tab) share one list, told apart by group */
function refsBlock(group) {
  const all = OPEN.data.refs, isRes = group === 'resource';
  const mine = all.map((r, i) => ({r, i})).filter(x => (x.r.group || 'quote') === group);
  const list = h('ul', {class: 'refs'}, mine.map(({r}) => {
    const href = r.img ? API + '/img/' + encodeURIComponent(r.img) : safeUrl(r.url);
    return h('li', {class: 'ref'},
      r.img && r.mime !== 'application/pdf' ? h('a', {href, target: '_blank', rel: 'noopener', class: 'thumb'}, h('img', {src: href, alt: r.label || 'Reference', loading: 'lazy'}))
        : h('a', {href: href || null, target: '_blank', rel: 'noopener', class: 'thumb icon'}, icon(r.img ? 'pdf' : 'link')),
      h('div', {class: 'rinfo'}, inp(r.label, v => change(() => r.label = v), {'aria-label': 'Label', placeholder: isRes ? 'What is it? e.g. Moodboard' : 'What is it? e.g. Lens hire quote'}),
        href ? h('a', {href, target: '_blank', rel: 'noopener', class: 'rlink'}, r.img ? (r.mime === 'application/pdf' ? 'Open PDF' : 'Open image') : (domain(href) || href).slice(0, 48)) : h('span', {class: 'rlink warn'}, 'This link isn\'t a web address')),
      h('button', {class: 'iconbtn', 'aria-label': 'Remove ' + (r.label || 'item'), onclick: async () => {
        if (!await ask('Remove this?', `"${r.label || 'This item'}" comes off the idea.`, 'Remove', 'Keep it')) return;
        change(() => all.splice(all.indexOf(r), 1), {redraw: true});
        if (r.img) api('DELETE', '/images/' + encodeURIComponent(r.img)).catch(() => {});
      }}, icon('x')));
  }));
  const fileIn = h('input', {type: 'file', accept: 'image/*,application/pdf,.pdf', multiple: true, hidden: true, onchange: e => { upload(e.target.files, group); e.target.value = ''; }});
  const linkIn = h('input', {class: 'in', type: 'url', placeholder: isRes ? 'Paste a link (Google Doc, moodboard, Pinterest board)' : 'Paste a link (hire shop, quote, venue)', 'aria-label': 'Link'});
  const addLink = () => { const u = safeUrl(linkIn.value); if (!u) { toast('Paste a full link starting with https://'); linkIn.focus(); return; }
    change(() => all.push({group, label: '', url: u, by: ME, at: Date.now()}), {redraw: true}); };
  linkIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } });
  const zone = h('div', {class: 'refadd'}, h('div', {class: 'withbtn'}, linkIn, h('button', {class: 'btn small', onclick: addLink}, 'Add link')),
    h('button', {class: 'btn small ghost', onclick: () => fileIn.click()}, icon('clip'), isRes ? 'Upload a file' : 'Upload a quote or reference'), fileIn,
    h('span', {class: 'hint'}, 'Photos, screenshots or PDFs (up to 1.4 MB). You can also drop files here.'));
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drop'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drop'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drop'); upload(e.dataTransfer.files, group); });
  return h('div', {class: 'fld'}, h('span', {class: 'lbl'}, isRes ? 'Links and files' : 'Quotes and references'), mine.length ? list : '', zone);
}
function resourcesBlock() {
  const d = OPEN.data;
  return h('section', {class: 'blk'}, h('div', {class: 'bh'}, h('h3', {}, 'Resources')),
    h('p', {class: 'hint'}, 'Anything else for this idea: moodboards, brand assets, reference videos, contracts, release forms, research.'),
    refsBlock('resource'),
    field('Notes', area(d.res_notes, v => change(() => d.res_notes = v), {rows: 4, placeholder: 'Anything worth keeping: contacts, ideas, feedback from Jordan'})));
}
async function toJpeg(file) {
  let bmp; try { bmp = await createImageBitmap(file, {imageOrientation: 'from-image'}); } catch (e) { return null; }
  const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height)), W = Math.round(bmp.width * k), H = Math.round(bmp.height * k);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(bmp, 0, 0, W, H);
  for (const q of [0.86, 0.76, 0.64]) { const b = await new Promise(r => c.toBlob(r, 'image/jpeg', q)); if (b && b.size <= 1300 * 1024) return {blob: b, w: W, h: H}; }
  return null;
}
async function upload(files, group = 'quote') {
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
      if (OPEN === card) change(() => card.data.refs.push({group, label: f.name.replace(/\.[^.]+$/, ''), img: r.id, mime: type, by: ME, at: Date.now()}), {redraw: true});
    } catch (e) { failed.push(f.name); }
  }
  toast(failed.length ? `Couldn't upload ${failed.join(', ')}.` : 'Uploaded');
}

/* files + post link */
function filesBlock() {
  const d = OPEN.data;
  const open = u => safeUrl(u) ? h('a', {class: 'iconbtn', href: safeUrl(u), target: '_blank', rel: 'noopener', 'aria-label': 'Open link', title: 'Open'}, icon('link')) : '';
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
