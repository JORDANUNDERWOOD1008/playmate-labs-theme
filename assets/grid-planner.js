/* Grid planner. Config: window.GP_CONFIG = {library: [..] | url, api: 'https://…workers.dev' (optional), store: 'gp-plan'} */
(() => {
'use strict';
const CFG = window.GP_CONFIG || {};
const KEY = CFG.store || 'gp-plan';
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
const uid = () => Math.random().toString(36).slice(2, 9);
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

/* ---------- icons ---------- */
const I = {
  plus: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  xl: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>',
  grid: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
  reels: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 8h18M8 3l3 5M14 3l3 5"/><path d="M10 11.5v6l5-3z" fill="currentColor"/></svg>',
  tagged: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M10 18l2 3 2-3h5a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z"/><circle cx="12" cy="9" r="2.5"/><path d="M7.5 15c1-2 2.5-3 4.5-3s3.5 1 4.5 3"/></svg>',
  multi: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h2V9a2 2 0 012-2z"/><rect x="8" y="8" width="13" height="13" rx="2"/></svg>',
  reel: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7a4 4 0 00-4 4v10a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4zm-7 5.5l5 3.5-5 3.5z"/></svg>',
  heart: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7.5-4.5-9.3-9.2C1.4 7.3 3.6 4 7 4c2.1 0 3.5 1.2 5 3 1.5-1.8 2.9-3 5-3 3.4 0 5.6 3.3 4.3 6.8C19.5 15.5 12 20 12 20z"/></svg>',
  comment: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.7 16.6A9 9 0 1117 4.4a9 9 0 013.7 12.2L22 22z"/></svg>',
  send: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M22 3L9.2 10.1M22 3l-7 18-5.8-10.9L2 7z"/></svg>',
  save: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M19 21l-7-6-7 6V3h14z"/></svg>',
  dots: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
  menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  left: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  caption: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16v2H4zm0 6h16v2H4zm0 6h10v2H4z"/></svg>',
  undo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/></svg>',
  link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>',
  layers: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.2 2.6l6.2 6.2-1.6 1.1-1.3-.4-3.4 3.4.4 3.9-1.6 1.6-3.8-3.8-5.6 5.6-1.1-1.1 5.6-5.6-3.8-3.8 1.6-1.6 3.9.4 3.4-3.4-.4-1.3z"/></svg>',
  rows: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/></svg>'
};
const icon = (n, cls) => h('span', {class: cls, html: I[n], 'aria-hidden': 'true'});

/* ---------- library & media ---------- */
let LIB = [], BYID = {};
const isWide = img => img && img.w / img.h >= 1.25;
function url(img, w) {
  if (!img) return '';
  if (img.local || img.up || !w) return img.src;
  return img.src + (img.src.includes('?') ? '&' : '?') + 'width=' + w;
}
/* ref: {img, part: 'full'|'L'|'R', x, y, z}. x/y shift the image (fraction of its size), z zooms. */
function cropTransform(ref) {
  const x = ref.x || 0, y = ref.y || 0, z = ref.z || 1;
  return `translate(-50%,-50%) translate(${x * 100}%,${y * 100}%) scale(${z})`;
}
function media(ref, {w = 640, fit = false, cls = '', pan = true} = {}) {
  const img = ref && BYID[ref.img];
  const box = h('div', {class: 'm ' + (fit ? 'fit ' : '') + cls});
  if (!img) return box;
  const half = ref.part === 'L' || ref.part === 'R';
  box.style.setProperty('--ra', (img.w / img.h) / (half ? 2 : 1));
  box.style.setProperty('--rs', half ? 2 : 1);
  box.style.setProperty('--ro', ref.part === 'R' ? 1 : 0);
  const crop = h('div', {class: 'crop'});
  if (pan && !fit && (ref.x || ref.y || (ref.z && ref.z !== 1))) crop.style.transform = cropTransform(ref);
  const z = pan && ref.z > 1 ? ref.z : 1;
  if (img.kind === 'video') crop.append(img.poster ? h('video', {src: img.src, poster: img.poster, muted: true, playsinline: true, preload: 'none', loop: true})
    : h('video', {src: img.src + '#t=0.5', muted: true, playsinline: true, preload: 'metadata', loop: true}));
  else crop.append(h('img', {src: url(img, Math.min(2160, Math.round((half ? w * 2 : w) * z))), alt: img.name, decoding: 'async', draggable: 'false'}));
  box.append(crop);
  return box;
}
/* a 9:16 story frame, as Instagram shows it */
function storyNode(item, {w = 540} = {}) {
  const fr = h('div', {class: 'sframe'});
  if (!item || !BYID[item.img]) return fr;
  const fitMode = item.fit || 'blur';
  if (fitMode === 'fill') fr.append(media(item, {w}));
  else {
    if (fitMode === 'color') fr.style.background = item.bg || '#111';
    else fr.append(h('div', {class: 'sblur'}, media({img: item.img, part: item.part}, {w: 160, pan: false})));
    fr.append(media({img: item.img, part: item.part}, {w, fit: true, pan: false}));
  }
  if (item.text) fr.append(h('div', {class: 'stext ' + (item.textStyle || 'plain'), style: `top:${Math.round((item.ty ?? 0.72) * 100)}%`}, h('span', {}, item.text)));
  return fr;
}

/* ---------- state ---------- */
const emptyPost = () => ({id: uid(), type: 'single', slides: [], cover: null, caption: ''});
const fresh = () => ({
  v: 1, ratio: '3/4',
  profile: {username: CFG.username || 'playmatelabs', name: CFG.name || 'Playmate Labs', bio: '', link: 'playmatelabs.com', avatar: null, followers: '', following: ''},
  highlights: [], posts: Array.from({length: 12}, emptyPost)
});
let S = fresh(), mode = 'plan', undoStack = [];
const isEmpty = p => !p.slides.length && !p.cover;
const coverOf = p => p.cover || p.slides[0] || null;
const hlCover = x => x.cover || x.items[0] || null;
/* Pinned posts (up to 3, like Instagram) sit at the front of S.posts, newest pin first.
   pinFrom remembers where the post was among the unpinned ones, so unpinning puts it back. */
const PIN_MAX = 3;
const pinCount = () => S.posts.filter(p => p.pinned).length;
const normPins = () => { S.posts = [...S.posts.filter(p => p.pinned), ...S.posts.filter(p => !p.pinned)]; };
function togglePin(id) {
  const post = S.posts.find(x => x.id === id);
  if (!post || isEmpty(post)) return;
  if (!post.pinned && pinCount() >= PIN_MAX) { toast(`You can pin up to ${PIN_MAX} posts. Unpin one first.`); return; }
  const was = !!post.pinned;
  commit(() => {
    const i = S.posts.indexOf(post); S.posts.splice(i, 1);
    const n = pinCount();
    if (was) { const back = Math.min(n + (post.pinFrom || 0), S.posts.length); delete post.pinned; delete post.pinFrom; S.posts.splice(back, 0, post); }
    else { post.pinned = true; post.pinFrom = i - n; S.posts.unshift(post); }
  });
  toast(was ? 'Unpinned. It\'s back in its place in the grid.' : 'Pinned to the top of the grid.');
}
function insertRow(at) { // three empty slots, so the columns below keep lining up
  commit(() => S.posts.splice(Math.max(0, Math.min(at, S.posts.length)), 0, emptyPost(), emptyPost(), emptyPost()));
  toast('Row added');
}
const hasContent = P => P && (P.posts.some(p => !isEmpty(p)) || P.highlights.length);

/* ---------- sync: shared views over the API, or this device only ---------- */
const API = (CFG.api || '').replace(/\/$/, '');
let TEAM = null, ME = ls.get('gp-me') || '', VIEW = null, VIEWS = [], online = false;
let pending = false, saving = false, saveT = null, lastSync = 0, syncErr = false;
const canEdit = () => !online || (VIEW && VIEW.owner === ME);
async function api(method, path, body) {
  const r = await fetch(API + path, {method, headers: {'Content-Type': 'application/json', 'X-Team-Key': TEAM}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store'});
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || r.status); e.status = r.status; e.data = d; throw e; }
  return d;
}
const summary = P => ({n: P.posts.filter(p => !isEmpty(p)).length, h: P.highlights.length,
  c: P.posts.slice(0, 9).map(p => { const c = coverOf(p); return c ? {img: c.img, part: c.part, x: c.x, y: c.y, z: c.z} : null; })});

function commit(fn, {render: r = true} = {}) {
  if (!canEdit()) { if (VIEW) toast('This is ' + VIEW.owner + '\'s view. Duplicate it to make changes.'); return; }
  undoStack.push(JSON.stringify(S)); if (undoStack.length > 60) undoStack.shift();
  fn(); save(); if (r) render();
}
function undo() {
  if (!undoStack.length || !canEdit()) return;
  S = JSON.parse(undoStack.pop()); save(); render(); closeAll(); toast('Undone');
}
function save() {
  if (!online) { clearTimeout(saveT); saveT = setTimeout(() => ls.set(KEY, JSON.stringify(S)), 250); return; }
  pending = true; renderStatus();
  clearTimeout(saveT); saveT = setTimeout(pushSave, 900);
}
async function pushSave() {
  if (saving) { saveT = setTimeout(pushSave, 400); return; }
  if (!VIEW || !canEdit()) { pending = false; return; }
  saving = true; pending = false;
  const id = VIEW.id;
  try {
    const r = await api('PUT', '/views/' + id, {plan: S, summary: summary(S), baseVersion: VIEW.version, editor: ME});
    if (VIEW && VIEW.id === id) { VIEW.version = r.version; VIEW.updated_at = r.updated_at; VIEW.updated_by = ME; }
    syncErr = false; lastSync = Date.now();
  } catch (e) {
    if (e.status === 409 && VIEW && VIEW.id === id) {
      VIEW.version = e.data.version; S = e.data.plan; undoStack = [];
      render(); toast('This view was changed on another device, so it has reloaded. Your last change may not have saved.');
    } else { syncErr = true; pending = true; saveT = setTimeout(pushSave, 5000); }
  }
  saving = false; renderStatus();
}
async function poll() {
  if (!online || !VIEW || document.hidden || pending || saving) return;
  if (canEdit() && layers.length) return; // don't swap the plan under an open editor
  const id = VIEW.id;
  try {
    const r = await api('GET', `/views/${id}?v=${VIEW.version}`);
    syncErr = false; lastSync = Date.now();
    if (!r.unchanged && VIEW && VIEW.id === id && !pending && !saving) {
      Object.assign(VIEW, {version: r.version, name: r.name, updated_at: r.updated_at, updated_by: r.updated_by});
      S = r.plan; render();
      if (await ensureImages(S)) render();
    }
  } catch (e) {
    if (e.status === 404) { toast('This view was deleted.'); VIEW = null; await pickView(); }
    else syncErr = true;
  }
  renderStatus();
}
async function loadViews() { VIEWS = (await api('GET', '/views')).views; return VIEWS; }
async function openView(id) {
  const r = await api('GET', '/views/' + id);
  VIEW = {id: r.id, name: r.name, owner: r.owner, version: r.version, updated_at: r.updated_at, updated_by: r.updated_by};
  S = r.plan && r.plan.v === 1 ? r.plan : fresh();
  undoStack = []; ls.set('gp-view', id);
  mode = canEdit() ? 'plan' : 'preview';
  closeAll(); render();
  if (await ensureImages(S)) render();
}
async function createView(name, plan) {
  const r = await api('POST', '/views', {name, owner: ME, plan, summary: summary(plan)});
  await loadViews(); await openView(r.id);
  return r.id;
}
async function pickView(preferId) {
  await loadViews();
  const id = [preferId, ls.get('gp-view')].find(i => i && VIEWS.some(v => v.id === i))
    || (VIEWS.find(v => v.owner === ME) || VIEWS[0] || {}).id;
  if (id) await openView(id);
  else await createView(ME + '\'s grid', fresh());
}

/* ---------- small UI helpers ---------- */
let toastT;
function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = h('div', {class: 'toast', role: 'status'}, msg); document.body.append(t);
  clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 3200);
}
const layers = [];
function openLayer(el, onClose) {
  document.body.append(el); layers.push({el, onClose}); document.body.style.overflow = 'hidden';
  el.addEventListener('click', e => { if (e.target === el && !el.dataset.modal) closeTop(); });
  return el;
}
function closeTop() {
  const l = layers.pop(); if (!l) return;
  l.el.remove(); l.onClose && l.onClose();
  if (!layers.length) document.body.style.overflow = '';
}
function closeAll() { while (layers.length) closeTop(); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && layers.length && !layers[layers.length - 1].el.dataset.modal) { e.preventDefault(); closeTop(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); undo(); }
});
function sheet(title, body, footer, cls = '') {
  return h('div', {class: 'shade ' + cls},
    h('div', {class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title},
      h('header', {}, h('h2', {}, title), h('button', {'aria-label': 'Close', onclick: closeTop}, icon('x'))),
      body, footer || ''));
}
function sortable(el, onEnd, opts = {}) {
  if (!window.Sortable) return;
  Sortable.create(el, Object.assign({animation: 150, delay: 120, delayOnTouchOnly: true, onEnd: e => { if (e.oldIndex !== e.newIndex) onEnd(e.oldIndex, e.newIndex); }}, opts));
}
const move = (arr, a, b) => arr.splice(b, 0, arr.splice(a, 1)[0]);
function usage() {
  const u = {};
  const add = r => { if (r) u[r.img] = (u[r.img] || 0) + 1; };
  S.posts.forEach(p => { p.slides.forEach(add); if (p.cover && !p.slides.some(s => s.img === p.cover.img)) add(p.cover); });
  return u;
}

/* ---------- uploads: images added from a computer go into the shared library (stored by the API) ---------- */
const upItem = r => ({id: 'u-' + r.id, uid: r.id, name: r.name, cat: r.cat, w: r.w, h: r.h, kind: 'image', src: API + '/img/' + r.id, up: true, by: r.created_by || ''});
const upVideo = r => ({...upItem(r), id: 'v-' + r.id, kind: 'video', src: API + '/vid/' + r.id, poster: API + '/vposter/' + r.id, vid: true});
function addUploads(rows) { // rows oldest first; each lands at the top of the library
  let n = 0;
  for (const r of rows) { const it = r.isVideo ? upVideo(r) : upItem(r); if (BYID[it.id]) continue; BYID[it.id] = it; LIB.unshift(it); n++; }
  return n;
}
async function loadUploads() {
  if (!online) return 0;
  try {
    const d = await api('GET', '/images');
    const rows = [...d.images, ...(d.videos || []).map(v => ({...v, isVideo: true}))].sort((a, b) => a.created_at - b.created_at);
    return addUploads(rows);
  } catch (e) { return 0; }
}
let upCheckT = 0;
async function ensureImages(P) { // a plan can use an image someone else uploaded after this page loaded
  if (!online || !P || Date.now() - upCheckT < 10000) return 0;
  const ids = [];
  const add = r => r && r.img && ids.push(r.img);
  P.posts.forEach(p => { p.slides.forEach(add); add(p.cover); });
  P.highlights.forEach(x => { x.items.forEach(add); add(x.cover); });
  add(P.profile && P.profile.avatar);
  if (!ids.some(i => !BYID[i])) return 0;
  upCheckT = Date.now(); return loadUploads();
}
const isBanner = r => r >= 2.2 && r <= 2.65; // three 4:5 posts side by side is 2.4
async function toJpeg(bmp, sx, sy, sw, sh, W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.imageSmoothingQuality = 'high';
  g.drawImage(bmp, sx, sy, sw, sh, 0, 0, W, H);
  for (const q of [0.86, 0.76, 0.66]) {
    const b = await new Promise(res => c.toBlob(res, 'image/jpeg', q));
    if (b && b.size <= 1300 * 1024) return b;
  }
  return null;
}
async function prepare(file, split) {
  let bmp; try { bmp = await createImageBitmap(file, {imageOrientation: 'from-image'}); } catch (e) { return null; }
  const base = file.name.replace(/\.[^.]+$/, '').slice(0, 60) || 'Upload', r = bmp.width / bmp.height;
  if (split && isBanner(r)) {
    const tw = bmp.width / 3, th = Math.round(1080 * bmp.height / tw);
    // right tile first, so the newest-first library shows them left, middle, right
    return Promise.all(['right', 'middle', 'left'].map(async pos => { const i = ['left', 'middle', 'right'].indexOf(pos);
      return {name: `${base} ${i + 1}/3 (${pos})`, w: 1080, h: th, blob: await toJpeg(bmp, i * tw, 0, tw, bmp.height, 1080, th)}; }));
  }
  const k = Math.min(1, 1440 / Math.max(bmp.width, bmp.height)), W = Math.round(bmp.width * k), H = Math.round(bmp.height * k);
  return [{name: base, w: W, h: H, blob: await toJpeg(bmp, 0, 0, bmp.width, bmp.height, W, H)}];
}
async function uploadOne(p, cat) {
  const qs = new URLSearchParams({name: p.name, cat, w: p.w, h: p.h, by: ME});
  const r = await fetch(`${API}/images?${qs}`, {method: 'POST', headers: {'Content-Type': 'image/jpeg', 'X-Team-Key': TEAM}, body: p.blob});
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || r.status);
  return d;
}
const VID_MAX = 200 * 1024 * 1024;
const isVideoFile = f => f.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(f.name);
const videoMime = f => /\.webm$/i.test(f.name) || f.type === 'video/webm' ? 'video/webm' : /\.mov$/i.test(f.name) || f.type === 'video/quicktime' ? 'video/quicktime' : 'video/mp4';
function videoInfo(file) { // size and a cover frame; fails if this browser can't decode the file
  return new Promise(res => {
    const v = document.createElement('video'), u = URL.createObjectURL(file);
    let done = false; const end = r => { if (done) return; done = true; URL.revokeObjectURL(u); res(r); };
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = u;
    v.onerror = () => end(null);
    setTimeout(() => end(null), 20000);
    v.onloadedmetadata = () => { if (!v.videoWidth) return end(null); v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
    v.onseeked = async () => {
      const k = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight)), W = Math.round(v.videoWidth * k), H = Math.round(v.videoHeight * k);
      const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(v, 0, 0, W, H);
      const poster = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
      end({w: v.videoWidth, h: v.videoHeight, poster});
    };
  });
}
async function uploadVideo(f, cat, progress) {
  const info = await videoInfo(f);
  if (!info) throw new Error('decode');
  const qs = new URLSearchParams({name: f.name.replace(/\.[^.]+$/, '').slice(0, 60) || 'Video', cat, w: info.w, h: info.h, size: f.size, mime: videoMime(f), by: ME});
  const hdr = {'X-Team-Key': TEAM};
  let r = await fetch(`${API}/videos?${qs}`, {method: 'POST', headers: {...hdr, 'Content-Type': 'image/jpeg'}, body: info.poster || new Blob([])});
  const v = await r.json().catch(() => ({})); if (!r.ok) throw new Error(v.error || r.status);
  for (let i = 0; i < v.chunks; i++) {
    const part = f.slice(i * v.chunkSize, (i + 1) * v.chunkSize);
    for (let t = 0; ; t++) { // a dropped chunk is retried, not the whole video
      try { r = await fetch(`${API}/videos/${v.id}/chunk/${i}`, {method: 'PUT', headers: {...hdr, 'Content-Type': 'application/octet-stream'}, body: part}); if (r.ok) break; }
      catch (e) { /* network blip */ }
      if (t >= 3) throw new Error('chunk');
      await new Promise(w => setTimeout(w, 1500 * (t + 1)));
    }
    progress((i + 1) / v.chunks);
  }
  r = await fetch(`${API}/videos/${v.id}/done`, {method: 'POST', headers: hdr});
  const row = await r.json().catch(() => ({})); if (!r.ok) throw new Error(row.error || r.status);
  return {...row, isVideo: true};
}
function uploadFlow(fileList, onDone) {
  const files = [...fileList].filter(f => f.type.startsWith('image/') || isVideoFile(f) || /\.(heic|heif)$/i.test(f.name));
  if (!files.length) { toast('Choose images (JPG, PNG, WebP) or videos (MP4, MOV).'); return; }
  let cat = 'lifestyle', split = true;
  const n = files.length, plural = n > 1 ? 's' : '', hasImg = files.some(f => !isVideoFile(f)), noun = hasImg ? (files.some(isVideoFile) ? 'file' : 'image') : 'video';
  const catChips = [['lifestyle', 'Lifestyle'], ['product', 'Product']].map(([k, label]) => h('button', {class: 'chip' + (k === cat ? ' on' : ''),
    onclick: e => { cat = k; catChips.forEach(c => c.classList.remove('on')); e.currentTarget.classList.add('on'); }}, label));
  const msg = h('p', {class: 'hint', 'aria-live': 'polite'}, '');
  const go = h('button', {class: 'btn primary grow', onclick: () => run()}, `Upload ${n} ${noun}${plural}`);
  const cancel = h('button', {class: 'btn', onclick: closeTop}, 'Cancel');
  const el = sheet(`Upload ${n} ${noun}${plural}`, h('div', {class: 'body upform'},
    h('p', {}, 'They go into the shared library, so everyone on the team can use them.'),
    h('p', {class: 'lbl'}, 'Library section'), h('div', {class: 'chips'}, catChips),
    hasImg ? h('label', {class: 'chk'}, h('input', {type: 'checkbox', checked: true, onchange: e => split = e.target.checked}),
      h('span', {}, 'Split 3-post banners into 3 grid tiles (left, middle, right)')) : '',
    files.some(isVideoFile) ? h('p', {class: 'hint'}, 'Videos upload at full quality, so a big file can take a minute or two. Keep this open until it finishes.') : '',
    msg), h('footer', {}, cancel, go), 'upload');
  openLayer(el);
  async function run() {
    go.disabled = cancel.disabled = true;
    const added = [], failed = [];
    for (const [i, f] of files.entries()) {
      msg.textContent = `Uploading ${i + 1} of ${n}…`;
      try {
        if (isVideoFile(f)) {
          if (f.size > VID_MAX) { failed.push(f.name + ' (over 200 MB: export it smaller)'); continue; }
          added.push(await uploadVideo(f, cat, x => msg.textContent = `Uploading ${n > 1 ? `${i + 1} of ${n}, ` : ''}${f.name}: ${Math.round(x * 100)}%`));
          continue;
        }
        const parts = await prepare(f, split);
        if (!parts) { failed.push(f.name + (/\.(heic|heif)$/i.test(f.name) ? ' (HEIC: save it as JPG first)' : ' (can\'t read this file)')); continue; }
        for (const p of parts) {
          if (!p.blob) { failed.push(p.name + ' (too big)'); continue; }
          added.push(await uploadOne(p, cat));
        }
      } catch (e) { failed.push(f.name + (e.message === 'too_big' ? ' (too big)' : e.message === 'decode' ? ' (this browser can\'t play it: export as MP4)' : '')); }
    }
    addUploads(added);
    closeTop();
    const ok = added.length ? `Uploaded ${added.length} ${added.every(r => r.isVideo) ? 'video' : added.some(r => r.isVideo) ? 'file' : 'image'}${added.length > 1 ? 's' : ''}.` : '';
    toast(failed.length ? `${ok} Couldn't upload ${failed.join(', ')}.`.trim() : ok);
    const ids = new Set(added.map(r => (r.isVideo ? 'v-' : 'u-') + r.id));
    if (onDone) onDone(LIB.filter(i => ids.has(i.id)).map(i => i.id)); // library order: left tile before right
  }
}
async function deleteUpload(img) {
  if (!await askSheet('Delete this upload?', `"${img.name}" is removed from the library for everyone. Any grid that uses it will show a blank tile.`, 'Delete', 'Keep it')) return false;
  try { await api('DELETE', (img.vid ? '/videos/' : '/images/') + img.uid); } catch (e) { toast('Couldn\'t delete it. Try again.'); return false; }
  delete BYID[img.id]; LIB = LIB.filter(i => i.id !== img.id); toast('Deleted.'); return true;
}

/* ---------- picker ---------- */
function picker({title = 'Choose from library', multi = false, onPick, allowVideo = true, extra = null, start = 'all'}) {
  let filter = 'all', q = '', chosen = [];
  const used = usage();
  const lib = h('div', {class: 'lib'});
  const addBtn = h('button', {class: 'btn primary grow', disabled: true, onclick: () => { closeTop(); onPick(chosen.map(id => BYID[id])); }}, 'Add');
  const hasVideo = LIB.some(i => i.kind === 'video');
  const hasUp = online || LIB.some(i => i.up);
  const tabs = [...(extra ? [['extra', extra.label]] : []), ['all', 'All'], ['product', 'Product'], ['lifestyle', 'Lifestyle'], ...(hasUp ? [['uploaded', 'Uploaded']] : []), ['wide', 'Wide (2-slide)'], ...(hasVideo && allowVideo ? [['video', 'Video']] : []), ['unused', 'Not used yet']];
  if (extra) filter = 'extra'; else if (tabs.some(t => t[0] === start)) filter = start;
  const chips = tabs.map(([k, label]) => h('button', {class: 'chip' + (k === filter ? ' on' : ''), onclick: e => { filter = k; chips.forEach(c => c.classList.remove('on')); e.currentTarget.classList.add('on'); draw(); }}, label));
  function draw() {
    lib.replaceChildren();
    const extraIds = extra ? extra.ids : [];
    const items = (filter === 'extra' ? extraIds.map(id => BYID[id]).filter(Boolean) : LIB).filter(i => (allowVideo || i.kind !== 'video') &&
      (filter === 'all' || filter === 'extra' || i.cat === filter || (filter === 'uploaded' && i.up) || (filter === 'wide' && isWide(i)) || (filter === 'video' && i.kind === 'video') || (filter === 'unused' && !used[i.id])) &&
      (!q || i.name.toLowerCase().includes(q)));
    if (!items.length) lib.append(h('div', {class: 'none'}, 'Nothing matches. Try another filter.'));
    for (const i of items) {
      const n = chosen.indexOf(i.id);
      lib.append(h('div', {class: 'li' + (isWide(i) ? ' wide' : '') + (n >= 0 ? ' on' : ''), tabindex: 0, role: 'button', 'aria-label': i.name,
        onclick: () => {
          if (!multi) { closeTop(); onPick([i]); return; }
          const k = chosen.indexOf(i.id); k >= 0 ? chosen.splice(k, 1) : chosen.push(i.id);
          addBtn.disabled = !chosen.length; addBtn.textContent = chosen.length ? `Add ${chosen.length}` : 'Add'; draw();
        },
        onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }},
        media({img: i.id, part: 'full'}, {w: isWide(i) ? 480 : 260}),
        i.kind === 'video' ? h('span', {class: 'tag'}, 'Video') : isWide(i) ? h('span', {class: 'tag'}, '2 slides') : '',
        used[i.id] ? h('span', {class: 'used'}, `Used ${used[i.id]}×`) : '',
        i.up && i.by === ME && !used[i.id] ? h('button', {class: 'del', 'aria-label': 'Delete ' + i.name, title: 'Delete upload', onclick: async e => { e.stopPropagation(); if (await deleteUpload(i)) { const k = chosen.indexOf(i.id); if (k >= 0) chosen.splice(k, 1); draw(); } }}, icon('x')) : '',
        multi ? h('span', {class: 'sel'}, n >= 0 ? String(n + 1) : '') : '',
        h('span', {class: 'nm'}, i.name)));
    }
  }
  const search = h('input', {type: 'search', placeholder: 'Search by file name', 'aria-label': 'Search images', oninput: e => { q = e.target.value.toLowerCase().trim(); draw(); }});
  const afterUpload = ids => {
    if (!ids.length) return;
    if (!chips.some(c => c.textContent === 'Uploaded')) { closeTop(); picker({title, multi, onPick, allowVideo, extra, start: 'uploaded'}); return; }
    filter = 'uploaded'; chips.forEach(c => c.classList.toggle('on', c.textContent === 'Uploaded'));
    if (multi) { chosen.push(...ids.filter(id => !chosen.includes(id))); addBtn.disabled = !chosen.length; addBtn.textContent = `Add ${chosen.length}`; }
    draw();
  };
  const fileIn = h('input', {type: 'file', accept: allowVideo ? 'image/*,video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v' : 'image/*', multiple: true, hidden: true, onchange: e => { uploadFlow(e.target.files, afterUpload); e.target.value = ''; }});
  const upBtn = online ? h('button', {class: 'btn upbtn', onclick: () => fileIn.click()}, icon('plus'), 'Upload') : '';
  const el = sheet(title, h('div', {class: 'filters'}, search, upBtn, fileIn, chips), null, 'picker');
  if (online) {
    const sh = $('.sheet', el);
    sh.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); sh.classList.add('dropping'); } });
    sh.addEventListener('dragleave', e => { if (!sh.contains(e.relatedTarget)) sh.classList.remove('dropping'); });
    sh.addEventListener('drop', e => { e.preventDefault(); sh.classList.remove('dropping'); if (e.dataTransfer.files.length) uploadFlow(e.dataTransfer.files, afterUpload); });
    lib.dataset.drop = allowVideo ? 'Drop images or videos to upload them' : 'Drop images to upload them';
  }
  $('.sheet', el).append(lib);
  if (multi) $('.sheet', el).append(h('footer', {}, h('span', {class: 'hint', style: 'flex:1;align-self:center'}, 'Tap in the order you want them.'), addBtn));
  draw(); openLayer(el);
}
const toSlides = (imgs, split = true) => imgs.flatMap(i => split && isWide(i) && i.kind !== 'video' ? [{img: i.id, part: 'L'}, {img: i.id, part: 'R'}] : [{img: i.id, part: 'full'}]);

/* ---------- reposition & zoom (grid covers, highlight covers, stories) ---------- */
function framer({title, ref, aspect, round = false, onDone}) {
  const work = {...ref, x: ref.x || 0, y: ref.y || 0, z: ref.z || 1};
  const frame = h('div', {class: 'framer' + (round ? ' round' : ''), style: `aspect-ratio:${aspect}`});
  let m;
  const draw = () => { m = media(work, {w: 900}); m.classList.add('fill'); frame.replaceChildren(m, h('div', {class: 'framer-grid'})); };
  draw();
  const crop = () => m.querySelector('.crop');
  const clamp = () => {
    const c = crop(); if (!c) return;
    const fw = frame.clientWidth, fh = frame.clientHeight, cw = c.offsetWidth, ch = c.offsetHeight;
    const mx = Math.max(0, (work.z * cw - fw) / 2) / cw, my = Math.max(0, (work.z * ch - fh) / 2) / ch;
    work.x = Math.max(-mx, Math.min(mx, work.x)); work.y = Math.max(-my, Math.min(my, work.y));
    c.style.transform = cropTransform(work);
  };
  let drag = null;
  frame.addEventListener('pointerdown', e => { drag = {sx: e.clientX, sy: e.clientY, x: work.x, y: work.y}; frame.setPointerCapture(e.pointerId); });
  frame.addEventListener('pointermove', e => {
    if (!drag) return; const c = crop(); if (!c) return;
    work.x = drag.x + (e.clientX - drag.sx) / c.offsetWidth; work.y = drag.y + (e.clientY - drag.sy) / c.offsetHeight; clamp();
  });
  frame.addEventListener('pointerup', () => drag = null);
  frame.addEventListener('pointercancel', () => drag = null);
  const zoom = h('input', {type: 'range', min: 1, max: 3, step: 0.01, value: work.z, 'aria-label': 'Zoom', oninput: e => { work.z = +e.target.value; clamp(); }});
  const body = h('div', {class: 'body'}, frame, h('label', {class: 'zoom'}, 'Zoom', zoom), h('p', {class: 'hint'}, 'Drag the picture to move it.'));
  const el = sheet(title, body, h('footer', {},
    h('button', {class: 'btn', onclick: () => { work.x = 0; work.y = 0; work.z = 1; zoom.value = 1; clamp(); }}, 'Reset'),
    h('button', {class: 'btn primary grow', onclick: () => { closeTop(); onDone({x: +work.x.toFixed(4), y: +work.y.toFixed(4), z: +work.z.toFixed(3)}); }}, 'Done')), 'framer-sheet');
  openLayer(el); requestAnimationFrame(clamp);
}

/* ---------- post editor ---------- */
function editPost(id) {
  const p = () => S.posts.find(x => x.id === id);
  if (!p()) return;
  const body = h('div', {class: 'body'});
  const el = sheet('Post', body,
    h('footer', {},
      h('button', {class: 'btn danger', onclick: () => { commit(() => { const q = Object.assign(p(), emptyPost(), {id}); delete q.pinned; delete q.pinFrom; normPins(); }); closeTop(); toast('Slot cleared'); }}, 'Clear'),
      h('button', {class: 'btn danger', onclick: () => { commit(() => S.posts = S.posts.filter(x => x.id !== id)); closeTop(); toast('Slot deleted. The posts after it moved up.'); }}, 'Delete slot'),
      h('button', {class: 'btn', onclick: () => { if (!isEmpty(p())) viewPost(p()); }}, 'Preview'),
      h('button', {class: 'btn primary grow', onclick: closeTop}, 'Done')));
  const title = $('h2', el);
  function draw() {
    const post = p(); if (!post) { closeTop(); return; }
    body.replaceChildren();
    title.textContent = 'Post ' + (S.posts.indexOf(post) + 1);
    const types = [['single', 'Single'], ['carousel', 'Carousel'], ['reel', 'Reel / video']];
    body.append(h('div', {}, h('h3', {}, 'Format'),
      h('div', {class: 'seg2', role: 'tablist'}, types.map(([k, label]) => h('button', {class: post.type === k ? 'on' : '', role: 'tab', 'aria-selected': String(post.type === k),
        onclick: () => { commit(() => { post.type = k; if (k !== 'carousel' && post.slides.length > 1) post.slides = post.slides.slice(0, 1); }); draw(); }},
        k === 'carousel' ? icon('multi') : k === 'reel' ? icon('reel') : '', label)))));
    const strip = h('div', {class: 'strip'});
    const max = post.type === 'carousel' ? 20 : 1;
    post.slides.forEach((s, i) => {
      const img = BYID[s.img];
      strip.append(h('div', {class: 'it'},
        media(s, {w: 200}),
        h('button', {class: 'x', 'aria-label': 'Remove slide', onclick: () => { commit(() => post.slides.splice(i, 1)); draw(); }}, icon('x')),
        h('div', {class: 'lbl'}, post.type === 'carousel' ? `${i + 1}` + (s.part === 'L' ? ' · left half' : s.part === 'R' ? ' · right half' : '') : (s.part !== 'full' ? (s.part === 'L' ? 'Left half' : 'Right half') : '')),
        img && isWide(img) && post.type === 'carousel' && s.part === 'full' ? h('button', {class: 'act', onclick: () => { commit(() => post.slides.splice(i, 1, {img: s.img, part: 'L'}, {img: s.img, part: 'R'})); draw(); }}, 'Split into 2') : '',
        img && isWide(img) && post.type !== 'carousel' ? h('button', {class: 'act', onclick: () => { commit(() => s.part = s.part === 'L' ? 'R' : s.part === 'R' ? 'full' : 'L'); draw(); }}, s.part === 'L' ? 'Show right' : s.part === 'R' ? 'Show whole' : 'Show left') : ''));
    });
    if (post.slides.length < max) strip.append(h('button', {class: 'add', 'aria-label': 'Add media', onclick: () => {
      picker({title: post.type === 'carousel' ? 'Add slides' : post.type === 'reel' ? 'Choose the video or image' : 'Choose an image', multi: post.type === 'carousel', start: post.type === 'reel' ? 'video' : 'all',
        onPick: imgs => {
          commit(() => {
            if (post.type === 'carousel') post.slides.push(...toSlides(imgs));
            else if (post.type === 'single' && isWide(imgs[0]) && imgs[0].kind !== 'video') { post.type = 'carousel'; post.slides = toSlides(imgs); toast('Wide image: made a 2-slide carousel. Switch to Single to use one half.'); }
            else { post.slides = [{img: imgs[0].id, part: 'full'}]; if (imgs[0].kind === 'video' && post.type === 'single') post.type = 'reel'; }
            post.slides = post.slides.slice(0, 20);
          }); draw();
        }});
    }}, icon('plus')));
    body.append(h('div', {}, h('h3', {}, post.type === 'carousel' ? `Slides (${post.slides.length}/20)` : post.type === 'reel' ? 'Video' : 'Image'), strip,
      post.type === 'carousel' && post.slides.length > 1 ? h('p', {class: 'hint'}, 'Drag to reorder. Wide images split into two slides that join up when swiped.') : '',
      post.type === 'reel' && !LIB.some(i => i.kind === 'video') ? h('p', {class: 'hint'}, online ? 'No videos in the library yet. Tap + then Upload to add an MP4 or MOV, or pick a still to stand in.' : 'No videos in the library yet, so pick a still to stand in for the reel.') : ''));
    sortable(strip, (a, b) => { if (b >= post.slides.length) return draw(); commit(() => move(post.slides, a, b)); draw(); }, {filter: '.add,.x,.act', preventOnFilter: false, draggable: '.it'});
    const cov = coverOf(post), covImg = cov && BYID[cov.img];
    const ensureCover = () => { if (!post.cover && post.slides[0]) post.cover = {...post.slides[0]}; };
    const idx = S.posts.indexOf(post), rowStart = Math.floor(idx / 3) * 3;
    body.append(h('div', {}, h('h3', {}, 'Grid'),
      h('div', {class: 'gridacts'},
        isEmpty(post) ? '' : h('button', {class: 'btn' + (post.pinned ? ' on' : ''), onclick: () => { togglePin(post.id); draw(); }}, icon('pin'), post.pinned ? 'Unpin' : 'Pin to top'),
        h('button', {class: 'btn', onclick: () => { insertRow(rowStart); draw(); }}, 'Insert row above'),
        h('button', {class: 'btn', onclick: () => { insertRow(rowStart + 3); draw(); }}, 'Insert row below')),
      post.pinned ? h('p', {class: 'hint'}, 'Pinned posts stay at the top of the grid, up to 3.') : ''));
    body.append(h('div', {}, h('h3', {}, 'Grid cover'),
      h('div', {class: 'cover-row'}, media(cov, {w: 240}),
        h('div', {class: 'opts'},
          h('button', {class: 'chip' + (!post.cover ? ' on' : ''), onclick: () => { commit(() => post.cover = null); draw(); }}, 'Use first slide'),
          h('button', {class: 'chip' + (post.cover ? ' on' : ''), onclick: () => picker({title: 'Choose a cover', onPick: imgs => { commit(() => post.cover = {img: imgs[0].id, part: 'full'}); draw(); }})}, 'Pick a different cover'),
          cov ? h('button', {class: 'chip', onclick: () => framer({title: 'Adjust the grid crop', ref: cov, aspect: S.ratio, onDone: v => { commit(() => { ensureCover(); Object.assign(post.cover, v); }); draw(); }})}, 'Move & zoom') : '',
          post.cover && covImg && isWide(covImg) ? ['L', 'full', 'R'].map(k => h('button', {class: 'chip' + (post.cover.part === k ? ' on' : ''), onclick: () => { commit(() => post.cover.part = k); draw(); }}, k === 'L' ? 'Left half' : k === 'R' ? 'Right half' : 'Whole')) : '')),
      h('p', {class: 'hint'}, 'This is what the grid shows. It doesn\'t have to be in the post.')));
    const ta = h('textarea', {class: 'caption', placeholder: 'Write a caption…', 'aria-label': 'Caption', maxlength: 2200});
    ta.value = post.caption;
    const cnt = h('div', {class: 'count'});
    const upd = () => {
      const tags = (ta.value.match(/#[\p{L}\p{N}_]+/gu) || []).length;
      cnt.replaceChildren(h('span', {class: tags > 30 ? 'over' : ''}, `${tags}/30 hashtags`), h('span', {}, `${ta.value.length}/2,200`));
    };
    let first = true;
    ta.addEventListener('input', () => { if (first) { undoStack.push(JSON.stringify(S)); first = false; } post.caption = ta.value; save(); upd(); refreshTile(post); });
    upd();
    body.append(h('div', {}, h('h3', {}, 'Caption'), ta, cnt, h('p', {class: 'hint'}, 'The first line or so shows before "more" on the feed.')));
  }
  draw(); openLayer(el, render);
}

/* ---------- highlights, the Instagram way ---------- */
const newStory = img => ({id: uid(), img: img.id, part: 'full', fit: isWide(img) ? 'blur' : 'fill', bg: '#111111', text: '', textStyle: 'plain', ty: 0.72});
function editHighlight(id) {
  const hl = () => S.highlights.find(x => x.id === id);
  const body = h('div', {class: 'body'});
  const el = sheet('Edit highlight', body, h('footer', {},
    h('button', {class: 'btn danger', onclick: () => { if (confirm('Delete this highlight?')) { commit(() => S.highlights = S.highlights.filter(x => x.id !== id)); closeTop(); } }}, 'Delete'),
    h('button', {class: 'btn', onclick: () => playStory(S.highlights.indexOf(hl()), 0)}, 'Play'),
    h('button', {class: 'btn primary grow', onclick: closeTop}, 'Done')));
  function draw() {
    const x = hl(); if (!x) { closeTop(); return; } body.replaceChildren();
    const cov = hlCover(x);
    const c = media(cov, {w: 240}); c.classList.add('hlc');
    function coverMenu() {
      const ids = [...new Set(x.items.map(s => s.img))];
      picker({title: 'Highlight cover', extra: ids.length ? {label: 'From this highlight', ids} : null, onPick: imgs => {
        const ref = {img: imgs[0].id, part: 'full'};
        framer({title: 'Position the cover', ref, aspect: '1/1', round: true, onDone: v => { commit(() => x.cover = {...ref, ...v}); draw(); }});
      }});
    }
    const t = h('input', {class: 'field', maxlength: 15, placeholder: 'Highlights', value: x.title, 'aria-label': 'Highlight name'});
    let first = true;
    t.addEventListener('input', () => { if (first) { undoStack.push(JSON.stringify(S)); first = false; } x.title = t.value; save(); });
    body.append(h('div', {class: 'hl-head'},
      h('div', {class: 'hl-cov'},
        h('button', {class: 'hl-cover-btn', 'aria-label': 'Edit cover', onclick: coverMenu}, h('div', {class: 'ring big'}, c), h('span', {}, 'Edit cover')),
        x.cover ? h('div', {class: 'opts'},
          h('button', {class: 'chip', onclick: () => framer({title: 'Position the cover', ref: x.cover, aspect: '1/1', round: true, onDone: v => { commit(() => Object.assign(x.cover, v)); draw(); }})}, 'Move & zoom'),
          h('button', {class: 'chip', onclick: () => { commit(() => x.cover = null); draw(); }}, 'Use first story')) : ''),
      h('div', {style: 'flex:1'}, h('h3', {}, 'Name'), t, h('p', {class: 'hint'}, 'Instagram cuts names off at about 15 characters.'))));
    const strip = h('div', {class: 'strip stories'});
    x.items.forEach((s, i) => strip.append(h('div', {class: 'it'},
      h('button', {class: 'sthumb', 'aria-label': `Edit story ${i + 1}`, onclick: () => editStory(id, i, draw)}, storyNode(s, {w: 200})),
      h('button', {class: 'x', 'aria-label': 'Remove story', onclick: () => { commit(() => x.items.splice(i, 1)); draw(); }}, icon('x')),
      h('div', {class: 'lbl'}, String(i + 1)))));
    strip.append(h('button', {class: 'add sadd', 'aria-label': 'Add stories', onclick: () => picker({title: 'Add stories', multi: true, onPick: imgs => { commit(() => x.items.push(...imgs.map(newStory))); draw(); }})}, icon('plus')));
    sortable(strip, (a, b) => { if (b >= x.items.length) return draw(); commit(() => move(x.items, a, b)); draw(); }, {filter: '.add,.x', preventOnFilter: false, draggable: '.it'});
    body.append(h('div', {}, h('h3', {}, `Stories (${x.items.length})`), strip, h('p', {class: 'hint'}, 'Tap a story to change how it fills the screen or to add text. Drag to reorder.')));
  }
  draw(); openLayer(el, render);
}
function editStory(hid, idx, after) {
  const x = S.highlights.find(q => q.id === hid); const st = () => x.items[idx];
  if (!st()) return;
  const prev = h('div', {class: 'story-prev'});
  const ctl = h('div', {class: 'story-ctl'});
  const body = h('div', {class: 'body story-edit'}, prev, ctl);
  const el = sheet(`Story ${idx + 1}`, body, h('footer', {},
    h('button', {class: 'btn', onclick: () => picker({title: 'Replace image', onPick: imgs => { commit(() => Object.assign(st(), {img: imgs[0].id, part: 'full', x: 0, y: 0, z: 1})); draw(); }})}, 'Replace image'),
    h('button', {class: 'btn primary grow', onclick: closeTop}, 'Done')));
  function draw() {
    const s = st(); prev.replaceChildren(storyNode(s, {w: 540})); ctl.replaceChildren();
    const fits = [['fill', 'Fill screen'], ['blur', 'Fit, blurred'], ['color', 'Fit on colour']];
    ctl.append(h('div', {}, h('h3', {}, 'Fit'), h('div', {class: 'opts'}, fits.map(([k, l]) => h('button', {class: 'chip' + ((s.fit || 'blur') === k ? ' on' : ''), onclick: () => { commit(() => s.fit = k, {render: false}); draw(); }}, l)))));
    if (s.fit === 'fill') ctl.append(h('button', {class: 'chip', onclick: () => framer({title: 'Position the story', ref: s, aspect: '9/16', onDone: v => { commit(() => Object.assign(s, v), {render: false}); draw(); }})}, 'Move & zoom'));
    if (s.fit === 'color') {
      const c = h('input', {type: 'color', value: s.bg || '#111111', 'aria-label': 'Background colour'});
      c.addEventListener('input', () => { s.bg = c.value; save(); prev.replaceChildren(storyNode(s)); });
      c.addEventListener('focus', () => undoStack.push(JSON.stringify(S)), {once: true});
      ctl.append(h('label', {class: 'zoom'}, 'Background', c));
    }
    const t = h('input', {class: 'field', placeholder: 'Add text (optional)', value: s.text || '', maxlength: 120, 'aria-label': 'Story text'});
    let first = true;
    t.addEventListener('input', () => { if (first) { undoStack.push(JSON.stringify(S)); first = false; } s.text = t.value; save(); prev.replaceChildren(storyNode(s)); });
    const pos = h('input', {type: 'range', min: 0.1, max: 0.9, step: 0.01, value: s.ty ?? 0.72, 'aria-label': 'Text position'});
    pos.addEventListener('input', () => { s.ty = +pos.value; save(); prev.replaceChildren(storyNode(s)); });
    ctl.append(h('div', {}, h('h3', {}, 'Text'), t,
      h('div', {class: 'opts', style: 'margin-top:8px'}, [['plain', 'Classic'], ['box', 'White box'], ['dark', 'Dark box']].map(([k, l]) => h('button', {class: 'chip' + ((s.textStyle || 'plain') === k ? ' on' : ''), onclick: () => { commit(() => s.textStyle = k, {render: false}); draw(); }}, l))),
      h('label', {class: 'zoom'}, 'Height', pos)));
  }
  draw(); openLayer(el, after);
}
function newHighlight() {
  picker({title: 'Pick the stories for this highlight', multi: true, onPick: imgs => {
    const id = uid();
    commit(() => S.highlights.push({id, title: '', cover: null, items: imgs.map(newStory)}));
    editHighlight(id);
  }});
}

/* story player: tap right/left, hold to pause, runs on into the next highlight */
function playStory(hIdx, sIdx = 0, P = S) {
  const list = P.highlights.filter(x => x.items.length);
  let hi = list.indexOf(P.highlights[hIdx]); if (hi < 0) return;
  let si = sIdx, raf, start, elapsed = 0, paused = false, holdT = null, held = false;
  const DUR = 5000;
  const bars = h('div', {class: 'bars'}), stage = h('div', {class: 'main'}), head = h('div', {class: 'sh'});
  const frame = h('div', {class: 'frame'}, stage, bars, head);
  const el = h('div', {class: 'story', role: 'dialog', 'aria-label': 'Story'}, frame,
    h('button', {class: 'close-x', 'aria-label': 'Close', onclick: () => closeTop()}, icon('xl')));
  function show() {
    const x = list[hi], s = x.items[si];
    bars.replaceChildren(...x.items.map((_, k) => h('i', {}, h('b', {style: `width:${k < si ? 100 : 0}%`}))));
    const av = media(hlCover(x), {w: 120}); av.classList.add('av');
    head.replaceChildren(av, h('span', {}, x.title || 'Highlights'), h('span', {class: 'when'}, `${si + 1}/${x.items.length}`));
    stage.replaceChildren(storyNode(s, {w: 1080}));
    elapsed = 0; start = performance.now(); cancelAnimationFrame(raf); tick();
  }
  function go(d) {
    const x = list[hi];
    si += d;
    if (si >= x.items.length) { if (hi + 1 < list.length) { hi++; si = 0; } else { closeTop(); return; } }
    else if (si < 0) { if (hi > 0) { hi--; si = 0; } else si = 0; }
    show();
  }
  function tick() {
    raf = requestAnimationFrame(now => {
      if (!paused) { elapsed += now - start; }
      start = now;
      const b = bars.children[si]; if (b) b.firstChild.style.width = Math.min(100, elapsed / DUR * 100) + '%';
      elapsed >= DUR ? go(1) : tick();
    });
  }
  frame.addEventListener('pointerdown', e => { held = false; holdT = setTimeout(() => { held = true; paused = true; frame.classList.add('paused'); }, 220); });
  frame.addEventListener('pointerup', e => {
    clearTimeout(holdT);
    if (held) { paused = false; frame.classList.remove('paused'); return; }
    const r = frame.getBoundingClientRect();
    go(e.clientX - r.left < r.width * 0.33 ? -1 : 1);
  });
  frame.addEventListener('pointercancel', () => { clearTimeout(holdT); paused = false; });
  const key = e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
  document.addEventListener('keydown', key);
  openLayer(el, () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); });
  show();
}

/* ---------- post viewer ---------- */
function captionNode(text, user, full) {
  const wrap = h('div', {class: 'ctext'});
  if (!text) return wrap;
  const short = !full && (text.length > 125 || text.split('\n').length > 2);
  const shown = short ? text.split('\n').slice(0, 2).join('\n').slice(0, 125).trimEnd() : text;
  wrap.append(h('b', {}, user), ' ');
  shown.split(/(#[\p{L}\p{N}_]+|@[\w.]+)/u).forEach(part => wrap.append(/^[#@]/.test(part) ? h('span', {class: 'tag'}, part) : part));
  if (short) wrap.append('… ', h('button', {class: 'more', onclick: () => wrap.replaceWith(captionNode(text, user, true))}, 'more'));
  return wrap;
}
function viewPost(post, P = S) {
  if (!post || isEmpty(post)) return;
  const slides = post.slides.length ? post.slides : [post.cover];
  const track = h('div', {class: 'track'}, slides.map(s => h('div', {class: 'slide'}, media({img: s.img, part: s.part}, {w: 1080}))));
  const dots = h('div', {class: 'dots'}, slides.length > 1 ? slides.map((_, k) => h('i', {class: k ? '' : 'on'})) : '');
  const pg = slides.length > 1 ? h('span', {class: 'pg'}, `1/${slides.length}`) : '';
  const navL = h('button', {class: 'nav l hide', 'aria-label': 'Previous slide', onclick: () => track.scrollBy({left: -track.clientWidth, behavior: 'smooth'})}, icon('left'));
  const navR = h('button', {class: 'nav r' + (slides.length > 1 ? '' : ' hide'), 'aria-label': 'Next slide', onclick: () => track.scrollBy({left: track.clientWidth, behavior: 'smooth'})}, icon('right'));
  track.addEventListener('scroll', () => {
    const k = Math.round(track.scrollLeft / track.clientWidth);
    [...dots.children].forEach((d, j) => d.classList.toggle('on', j === k));
    if (pg) pg.textContent = `${k + 1}/${slides.length}`;
    navL.classList.toggle('hide', k === 0); navR.classList.toggle('hide', k >= slides.length - 1);
  }, {passive: true});
  const av = media(P.profile.avatar, {w: 100}); av.className += ' av';
  const editable = P === S && canEdit();
  const card = h('article', {class: 'post'},
    h('div', {class: 'ph'}, av, h('b', {}, P.profile.username)),
    h('div', {class: 'media-wrap'}, track, pg, navL, navR, post.type === 'reel' ? h('span', {class: 'reel-badge'}, icon('reel'), 'Reel') : ''),
    dots,
    h('div', {class: 'acts'}, icon('heart'), icon('comment'), icon('send'), icon('save', 'r')),
    captionNode(post.caption, P.profile.username),
    editable ? h('div', {class: 'pe'}, h('button', {class: 'btn grow', onclick: () => { closeTop(); editPost(post.id); }}, 'Edit post')) : '');
  const el = h('div', {class: 'shade viewer', role: 'dialog', 'aria-modal': 'true'}, card, h('button', {class: 'close-x', 'aria-label': 'Close', onclick: closeTop}, icon('xl')));
  openLayer(el);
  track.querySelectorAll('video').forEach(v => { v.muted = true; v.play().catch(() => {}); v.onclick = () => { v.muted = !v.muted; toast(v.muted ? 'Sound off' : 'Sound on'); }; });
}

/* ---------- views: switch, create, duplicate, compare ---------- */
function viewsSheet() {
  let picking = false, chosen = [];
  const list = h('div', {class: 'views'});
  const cmpBtn = h('button', {class: 'btn', onclick: () => { picking = !picking; chosen = picking && VIEW ? [VIEW.id] : []; draw(); }}, 'Compare');
  const goCmp = h('button', {class: 'btn primary grow hide', onclick: () => { closeTop(); compare(chosen); }}, 'Compare');
  const el = sheet('Grid views', list, h('footer', {}, cmpBtn,
    h('button', {class: 'btn', onclick: async () => { const n = prompt('Name the new view', ME + '\'s grid ' + (VIEWS.filter(v => v.owner === ME).length + 1)); if (n) { closeTop(); await createView(n, fresh()); toast('New view created'); } }}, 'New blank'),
    h('button', {class: 'btn primary grow', onclick: async () => { const n = prompt('Name your copy', (VIEW ? VIEW.name : 'Grid') + ' (copy)'); if (n) { closeTop(); await createView(n, JSON.parse(JSON.stringify(S))); toast('Copied. This one is yours to edit.'); } }}, icon('copy'), 'Duplicate this'),
    goCmp));
  function row(v) {
    const mine = v.owner === ME, cur = VIEW && v.id === VIEW.id, sel = chosen.includes(v.id);
    const mini = h('div', {class: 'mini'}, (v.summary.c || []).slice(0, 6).map(c => c ? media(c, {w: 120}) : h('div', {class: 'm'})));
    while (mini.children.length < 6) mini.append(h('div', {class: 'm'}));
    return h('div', {class: 'vrow' + (cur ? ' cur' : '') + (sel ? ' sel' : ''), role: 'button', tabindex: 0,
      onclick: async e => {
        if (e.target.closest('.vact')) return;
        if (picking) { const k = chosen.indexOf(v.id); k >= 0 ? chosen.splice(k, 1) : chosen.length < 3 && chosen.push(v.id); draw(); return; }
        if (!cur) await openView(v.id); else closeTop();
      }},
      picking ? h('span', {class: 'tick'}, sel ? String(chosen.indexOf(v.id) + 1) : '') : '',
      mini,
      h('div', {class: 'vinfo'}, h('b', {}, v.name), h('span', {}, `${v.owner || 'Someone'}${mine ? ' (you)' : ''} · ${v.summary.n || 0} posts · ${v.summary.h || 0} highlights`),
        h('span', {}, `Edited ${ago(v.updated_at)}${v.updated_by && v.updated_by !== v.owner ? ' by ' + v.updated_by : ''}`)),
      mine && !picking ? h('div', {class: 'vact'},
        h('button', {class: 'chip', onclick: async () => { const n = prompt('Rename view', v.name); if (n && n !== v.name) { await api('PUT', '/views/' + v.id, {name: n, baseVersion: v.version, editor: ME}).catch(() => toast('Couldn\'t rename. Try again.')); if (cur) { VIEW.name = n; VIEW.version++; } await loadViews(); draw(); renderStatus(); } }}, 'Rename'),
        h('button', {class: 'chip', onclick: async () => { if (!confirm(`Delete "${v.name}" for everyone?`)) return; await api('DELETE', '/views/' + v.id); await loadViews(); if (cur) { closeTop(); await pickView(); } else draw(); }}, 'Delete')) : '');
  }
  function draw() {
    const mine = VIEWS.filter(v => v.owner === ME), others = VIEWS.filter(v => v.owner !== ME);
    list.replaceChildren(
      ...(picking ? [h('p', {class: 'hint pad'}, 'Pick up to 3 views to put side by side.')] : []),
      h('h3', {class: 'pad'}, 'Yours'), ...(mine.length ? mine.map(row) : [h('p', {class: 'hint pad'}, 'You haven\'t made a view yet. Duplicate one or start a blank one.')]),
      h('h3', {class: 'pad'}, 'Everyone else\'s'), ...(others.length ? others.map(row) : [h('p', {class: 'hint pad'}, 'Nobody else has saved a view yet.')]));
    cmpBtn.textContent = picking ? 'Cancel' : 'Compare';
    goCmp.classList.toggle('hide', !picking); goCmp.disabled = chosen.length < 2; goCmp.textContent = `Compare ${chosen.length || ''}`;
    [...el.querySelectorAll('footer > button')].forEach(b => { if (b !== cmpBtn && b !== goCmp) b.classList.toggle('hide', picking); });
  }
  openLayer(el);
  draw();
  loadViews().then(draw).catch(() => {});
  const t = setInterval(() => { if (!document.hidden) loadViews().then(draw).catch(() => {}); }, 10000);
  layers[layers.length - 1].onClose = () => clearInterval(t);
}
async function compare(ids) {
  const plans = await Promise.all(ids.map(id => api('GET', '/views/' + id)));
  const cols = plans.map(r => {
    const P = r.plan;
    const g = h('div', {class: 'grid', style: `--tile:${P.ratio || '3/4'}`}, P.posts.filter(p => !isEmpty(p)).map((p, i) => tileFor(p, i, P, true)));
    return h('section', {class: 'ccol'},
      h('header', {}, h('b', {}, r.name), h('span', {}, `${r.owner || 'Someone'} · edited ${ago(r.updated_at)}`)),
      h('div', {class: 'chl'}, P.highlights.map((x, k) => h('button', {class: 'hl sm', onclick: () => playStory(k, 0, P)}, h('div', {class: 'ring'}, media(hlCover(x), {w: 120})), h('div', {class: 't'}, x.title || ' ')))),
      g,
      h('button', {class: 'btn', style: 'margin:10px', onclick: async () => { closeTop(); await openView(r.id); }}, 'Open this view'));
  });
  const el = h('div', {class: 'compare', role: 'dialog', 'aria-label': 'Compare views'},
    h('div', {class: 'cbar'}, h('b', {}, 'Comparing ' + plans.length + ' views'), h('button', {class: 'btn', onclick: closeTop}, 'Close')),
    h('div', {class: 'ccols'}, cols));
  openLayer(el);
}
function nameSheet(onDone) {
  const inp = h('input', {class: 'field', placeholder: 'Your name', maxlength: 30, 'aria-label': 'Your name', value: ME});
  const go = () => { const n = inp.value.trim(); if (!n) { inp.focus(); return; } ME = n; ls.set('gp-me', n); closeTop(); onDone(); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  const el = h('div', {class: 'shade', 'data-modal': '1'}, h('div', {class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Who is planning?'},
    h('header', {}, h('h2', {}, 'Who\'s planning?')),
    h('div', {class: 'body'}, h('p', {}, 'Your name goes on the grid views you save, so everyone can see whose is whose.'), inp),
    h('footer', {}, h('button', {class: 'btn primary grow', onclick: go}, 'Continue'))));
  el.dataset.modal = '1'; openLayer(el); setTimeout(() => inp.focus(), 50);
}
function teamSheet(err) {
  return new Promise(res => {
    const inp = h('input', {class: 'field', placeholder: 'Team code or team link', 'aria-label': 'Team code'});
    const go = () => {
      const v = inp.value.trim(); if (!v) { inp.focus(); return; }
      const m = v.match(/team=([\w-]+)/); const code = m ? m[1] : v;
      ls.set('gp-team', code); closeTop(); res(code);
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    const el = h('div', {class: 'shade', 'data-modal': '1'}, h('div', {class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Join the team planner'},
      h('header', {}, h('h2', {}, 'Join the team planner')),
      h('div', {class: 'body'}, h('p', {}, err || 'Paste the team link or code Jordan sent you. Your grids then save where everyone can see them.'), inp),
      h('footer', {}, h('button', {class: 'btn', onclick: () => { closeTop(); res(null); }}, 'Just this device'), h('button', {class: 'btn primary grow', onclick: go}, 'Join'))));
    openLayer(el); setTimeout(() => inp.focus(), 50);
  });
}
function askSheet(title, text, yes, no) {
  return new Promise(res => {
    const el = h('div', {class: 'shade', 'data-modal': '1'}, h('div', {class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title},
      h('header', {}, h('h2', {}, title)), h('div', {class: 'body'}, h('p', {}, text)),
      h('footer', {}, h('button', {class: 'btn', onclick: () => { closeTop(); res(false); }}, no), h('button', {class: 'btn primary grow', onclick: () => { closeTop(); res(true); }}, yes))));
    openLayer(el);
  });
}

/* ---------- main render ---------- */
const app = h('div', {class: 'app'});
const status = h('div', {class: 'vstrip'});
function editable(tag, cls, key, ph, multiline) {
  const el = h(tag, {class: cls, 'data-ph': ph});
  el.textContent = S.profile[key] || '';
  if (mode === 'plan' && canEdit()) {
    el.contentEditable = 'plaintext-only';
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.addEventListener('focus', () => undoStack.push(JSON.stringify(S)));
    el.addEventListener('input', () => { S.profile[key] = el.innerText.replace(/\n$/, ''); save(); });
    if (!multiline) el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
  }
  return el;
}
function tileFor(post, idx, P = S, readOnly = false) {
  const empty = isEmpty(post);
  const t = h('div', {class: 'tile' + (empty ? ' empty' : ''), 'data-id': post.id, tabindex: 0, role: 'button',
    'aria-label': empty ? `Empty slot ${idx + 1}` : `Post ${idx + 1}`,
    onclick: () => (!readOnly && mode === 'plan' && canEdit()) ? editPost(post.id) : viewPost(post, P),
    onkeydown: e => { if (e.key === 'Enter') e.currentTarget.click(); }});
  if (empty) {
    t.append(icon('plus'));
    if (!readOnly && mode === 'plan' && canEdit()) t.append(h('button', {class: 'tdel', 'aria-label': `Delete empty slot ${idx + 1}`, title: 'Delete this slot',
      onclick: e => { e.stopPropagation(); commit(() => S.posts = S.posts.filter(x => x.id !== post.id)); }}, icon('x')));
    return t;
  }
  t.append(media(coverOf(post), {w: 420}));
  if (post.pinned) t.append(icon('pin', 'badge pin'));
  else if (post.type === 'carousel' && post.slides.length > 1) t.append(icon('multi', 'badge'));
  else if (post.type === 'reel') t.append(icon('reel', 'badge'));
  t.append(h('span', {class: 'num'}, String(idx + 1)));
  if (post.caption.trim()) t.append(icon('caption', 'cap'));
  return t;
}
/* ---------- row mode: select whole rows and move them together ---------- */
let rowMode = false; const rowSel = new Set(); // keys are the id of each row's first post, which travel with the row
const padRows = () => { while (S.posts.length % 3) S.posts.push(emptyPost()); };
const chunkRows = () => { const r = []; for (let i = 0; i < S.posts.length; i += 3) r.push(S.posts.slice(i, i + 3)); return r; };
const rowLocked = row => row.some(p => p.pinned); // pinned posts stay at the top
function setRowMode(on) { rowMode = on; rowSel.clear(); if (on) { mode = 'plan'; if (S.posts.length % 3) commit(padRows, {render: false}); } render(); }
function rowOp(kind) {
  if (!rowSel.size) return;
  const n = rowSel.size;
  commit(() => {
    padRows();
    let rows = chunkRows();
    const sel = r => rowSel.has(r[0].id);
    if (kind === 'up' || kind === 'down') {
      const d = kind === 'up' ? -1 : 1, order = rows.map((_, i) => i);
      if (d > 0) order.reverse();
      for (const i of order) { const j = i + d; if (j >= 0 && j < rows.length && sel(rows[i]) && !sel(rows[j]) && !rowLocked(rows[j])) [rows[i], rows[j]] = [rows[j], rows[i]]; }
    } else if (kind === 'top' || kind === 'bottom') {
      const lock = rows.filter(rowLocked), picked = rows.filter(r => sel(r)), rest = rows.filter(r => !sel(r) && !rowLocked(r));
      rows = kind === 'top' ? [...lock, ...picked, ...rest] : [...lock, ...rest, ...picked];
    } else if (kind === 'delete') { rows = rows.filter(r => !sel(r)); rowSel.clear(); }
    S.posts = rows.flat();
  });
  toast(kind === 'delete' ? `Deleted ${n} row${n > 1 ? 's' : ''}` : `Moved ${n} row${n > 1 ? 's' : ''}`);
}
function rowsView() {
  const rows = chunkRows();
  const list = h('div', {class: 'rowlist'}, rows.map((row, k) => {
    const key = row[0].id, locked = rowLocked(row), on = rowSel.has(key);
    const toggle = () => { if (locked) { toast('This row has a pinned post. Unpin it to move the row.'); return; } on ? rowSel.delete(key) : rowSel.add(key); render(); };
    return h('div', {class: 'rowgrp' + (on ? ' on' : '') + (locked ? ' locked' : ''), 'data-key': key, role: 'checkbox', 'aria-checked': String(on), tabindex: 0,
      'aria-label': `Row ${k + 1}` + (locked ? ', has a pinned post' : ''), onclick: toggle, onkeydown: e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } }},
      h('div', {class: 'grid'}, row.map((p, i) => tileFor(p, k * 3 + i, S, true))),
      h('span', {class: 'rowchk'}, locked ? icon('pin') : on ? icon('check') : ''));
  }));
  sortable(list, (a, b) => { // drag one row; any other selected rows come along, in their order, next to it
    const moved = rows[a], key = moved[0].id;
    const group = rowSel.has(key) ? rows.filter(r => rowSel.has(r[0].id)) : [moved];
    commit(() => {
      const order = rows.slice(); order.splice(b, 0, order.splice(a, 1)[0]);
      const out = [];
      for (const r of order) { if (r === moved) out.push(...group); else if (!group.includes(r)) out.push(r); }
      S.posts = [...out.filter(rowLocked), ...out.filter(r => !rowLocked(r))].flat();
    });
    toast(group.length > 1 ? `Moved ${group.length} rows` : 'Row moved');
  }, {filter: '.locked', preventOnFilter: false});
  return list;
}
let gridRO = null;
function gridWithInserts() {
  if (rowMode && mode === 'plan') return rowsView();
  const g = h('div', {class: 'grid'}, S.posts.map((p, i) => tileFor(p, i)));
  if (mode !== 'plan') return g;
  const ins = h('div', {class: 'rowins-layer'});
  const wrap = h('div', {class: 'gridwrap'}, g, ins);
  sortable(g, (a, b) => { const moved = S.posts[a]; commit(() => { move(S.posts, a, b); normPins(); });
    if (S.posts.indexOf(moved) !== b) toast(moved.pinned ? 'Pinned posts stay at the top. Unpin it to move it down.' : 'Pinned posts stay at the top of the grid.'); },
    {onStart: () => wrap.classList.add('dragging'), onUnchoose: () => wrap.classList.remove('dragging')});
  const place = () => { // one handle on each line between rows, plus the top edge
    const tiles = g.children, rows = Math.ceil(tiles.length / 3), gap = rows > 1 ? tiles[3].offsetTop - tiles[0].offsetTop - tiles[0].offsetHeight : 0;
    ins.replaceChildren();
    for (let k = 0; k < rows; k++) {
      const at = k * 3, top = k ? tiles[at].offsetTop - gap / 2 : 0;
      ins.append(h('button', {class: 'rowins' + (k ? '' : ' first'), style: `top:${top}px`, 'aria-label': k ? `Insert a row above row ${k + 1}` : 'Insert a row at the top',
        onclick: () => insertRow(k ? at : pinCount())}, h('span', {}, icon('plus'), h('b', {}, 'Insert row'))));
    }
  };
  requestAnimationFrame(place);
  if (gridRO) gridRO.disconnect();
  if (window.ResizeObserver) { gridRO = new ResizeObserver(() => place()); gridRO.observe(g); }
  return wrap;
}
function refreshTile(post) {
  const old = app.querySelector(`.tile[data-id="${post.id}"]`);
  if (old) old.replaceWith(tileFor(post, S.posts.indexOf(post)));
}
function renderStatus() {
  if (!online || !VIEW) { status.classList.add('hide'); return; }
  status.classList.remove('hide');
  const mine = canEdit();
  const state = syncErr ? h('span', {class: 'dot warn'}, 'Reconnecting…') : pending || saving ? h('span', {class: 'dot busy'}, 'Saving…') : h('span', {class: 'dot ok'}, mine ? 'Saved' : 'Live');
  status.replaceChildren(
    h('button', {class: 'vname', onclick: viewsSheet, 'aria-label': 'Switch grid view'}, icon('layers'), h('b', {}, VIEW.name), icon('chev')),
    h('span', {class: 'vmeta'}, mine ? 'Your view' : `${VIEW.owner}'s view, view only`),
    state);
}
function render() {
  const edit = canEdit();
  if (!edit) mode = 'preview';
  document.body.classList.toggle('plan', mode === 'plan');
  document.body.classList.toggle('preview', mode === 'preview');
  document.documentElement.style.setProperty('--tile', S.ratio);
  const P = S.profile, count = S.posts.filter(p => !isEmpty(p)).length;
  const av = media(P.avatar, {w: 300}); av.classList.add('avatar'); if (!P.avatar) av.classList.add('empty');
  if (mode === 'plan') { av.style.cursor = 'pointer'; av.title = 'Change profile picture'; av.onclick = () => picker({title: 'Profile picture', onPick: imgs => framer({title: 'Position your profile picture', ref: {img: imgs[0].id, part: 'full'}, aspect: '1/1', round: true, onDone: v => commit(() => P.avatar = {img: imgs[0].id, part: 'full', ...v})})}); }
  const stat = (n, label, key) => h('div', {}, key ? editable('b', '', key, '0') : h('b', {}, n), h('span', {}, label));
  const hlRow = h('div', {class: 'highlights'},
    S.highlights.map((x, k) => h('button', {class: 'hl', 'data-id': x.id, onclick: () => mode === 'plan' ? editHighlight(x.id) : playStory(k, 0)},
      h('div', {class: 'ring'}, media(hlCover(x), {w: 200})), h('div', {class: 't'}, x.title || 'Highlights'))),
    mode === 'plan' ? h('button', {class: 'hl new', onclick: newHighlight}, h('div', {class: 'ring'}, h('div', {class: 'm'}, icon('plus'))), h('div', {class: 't'}, 'New')) : '');
  if (mode === 'plan') sortable(hlRow, (a, b) => { if (b >= S.highlights.length) return render(); commit(() => move(S.highlights, a, b)); }, {filter: '.new', draggable: '.hl:not(.new)', direction: 'horizontal'});
  app.replaceChildren(
    h('div', {class: 'topbar'}, editable('div', 'handle', 'username', 'username'), h('button', {class: 'chevb', 'aria-label': 'Switch grid view', onclick: () => online ? viewsSheet() : toast('Views need the team link.')}, icon('chev')), h('div', {class: 'spacer'}), icon('plus', 'ic'), icon('menu', 'ic')),
    h('section', {class: 'profile'}, av,
      h('div', {class: 'stats'}, stat(count, 'posts'), stat('', 'followers', 'followers'), stat('', 'following', 'following')),
      h('div', {class: 'bio'}, editable('div', 'name', 'name', 'Name'), editable('div', 'text', 'bio', mode === 'plan' ? 'Write a bio' : '', true), editable('div', 'link', 'link', mode === 'plan' ? 'Add a link' : '')),
      h('div', {class: 'profile-btns'}, h('span', {}, 'Edit profile'), h('span', {}, 'Share profile'))),
    hlRow,
    h('div', {class: 'tabs'}, h('span', {class: 'on'}, icon('grid')), h('span', {}, icon('reels')), h('span', {}, icon('tagged'))),
    mode === 'plan' && edit ? h('div', {class: 'gridtools'}, rowMode
      ? [h('span', {}, rowSel.size ? h('b', {}, `${rowSel.size} row${rowSel.size > 1 ? 's' : ''} selected. `) : '', rowSel.size ? 'Move them with the bar below, or drag one and the rest come with it.' : 'Tap rows to select them, then move them together. You can also drag a row.'),
         h('button', {class: 'btn primary', onclick: () => setRowMode(false)}, 'Done')]
      : h('button', {class: 'btn', onclick: () => setRowMode(true)}, icon('rows'), 'Select rows')) : '',
    gridWithInserts(),
    h('button', {class: 'addrow', onclick: () => commit(() => S.posts.push(emptyPost(), emptyPost(), emptyPost()))}, '+ Add a row'));
  renderBar(); renderStatus();
}

/* ---------- planner bar ---------- */
const bar = h('nav', {class: 'bar', 'aria-label': 'Planner'});
let menuEl = null;
function renderBar() {
  const edit = canEdit();
  if (rowMode && mode === 'plan' && edit) {
    const n = rowSel.size, off = !n;
    bar.replaceChildren(
      h('button', {onclick: () => rowOp('up'), disabled: off, 'aria-label': 'Move selected rows up', title: 'Move up'}, '↑'),
      h('button', {onclick: () => rowOp('down'), disabled: off, 'aria-label': 'Move selected rows down', title: 'Move down'}, '↓'),
      h('button', {onclick: () => rowOp('top'), disabled: off, title: 'Move to the top'}, 'Top'),
      h('button', {onclick: () => rowOp('bottom'), disabled: off, title: 'Move to the bottom'}, 'Bottom'),
      h('button', {onclick: () => rowOp('delete'), disabled: off, class: 'warn'}, 'Delete'),
      h('button', {class: 'hi', onclick: () => setRowMode(false)}, 'Done'));
    bar.classList.add('rowbar');
    return;
  }
  bar.classList.remove('rowbar');
  bar.replaceChildren(
    edit ? h('div', {class: 'seg'},
      h('button', {class: mode === 'plan' ? 'on' : '', onclick: () => { mode = 'plan'; render(); }}, 'Plan'),
      h('button', {class: mode === 'preview' ? 'on' : '', onclick: () => { mode = 'preview'; rowMode = false; rowSel.clear(); render(); }}, 'Preview'))
      : h('button', {class: 'hi', onclick: async () => { const n = prompt('Name your copy', VIEW.name + ' (my version)'); if (n) { await createView(n, JSON.parse(JSON.stringify(S))); toast('Copied. This one is yours to edit.'); } }}, icon('copy'), 'Duplicate to edit'),
    online ? h('button', {onclick: viewsSheet}, icon('layers'), 'Views') : '',
    edit ? h('button', {onclick: undo, disabled: !undoStack.length, 'aria-label': 'Undo'}, icon('undo'), 'Undo') : '',
    h('button', {onclick: shareLink}, icon('link'), 'Share'),
    h('button', {'aria-label': 'More options', onclick: toggleMenu}, icon('dots')));
}
async function shareLink() {
  let link;
  if (online && VIEW) link = `${location.origin}${location.pathname}?team=${TEAM}&view=${VIEW.id}`;
  else link = location.origin + location.pathname + '#p=' + await encode(S);
  try { await navigator.clipboard.writeText(link); toast(online ? 'Link copied. It opens this view, and anyone with it can join the planning.' : 'Link copied. Anyone with it sees this exact plan.'); }
  catch (e) { prompt('Copy this link:', link); }
}
function toggleMenu() {
  if (menuEl) { menuEl.remove(); menuEl = null; return; }
  const close = () => { menuEl && menuEl.remove(); menuEl = null; };
  const edit = canEdit();
  menuEl = h('div', {class: 'menu'},
    edit ? h('button', {onclick: () => { close(); commit(() => S.ratio = S.ratio === '3/4' ? '1/1' : '3/4'); toast(S.ratio === '3/4' ? 'Grid shows 3:4 tiles (current Instagram)' : 'Grid shows square tiles (old Instagram)'); }}, S.ratio === '3/4' ? 'Show square grid' : 'Show 3:4 grid') : '',
    edit ? h('button', {onclick: () => { close(); insertRow(pinCount()); }}, 'Add a row at the top') : '',
    edit ? h('button', {onclick: () => { close(); commit(() => S.posts = S.posts.filter(p => !isEmpty(p))); toast('Empty slots removed'); }}, 'Remove empty slots') : '',
    edit ? h('hr') : '',
    h('button', {onclick: () => { close(); exportPlan(); }}, 'Download plan file'),
    edit ? h('button', {onclick: () => { close(); importPlan(); }}, 'Open a plan file') : '',
    online ? h('button', {onclick: () => { close(); nameSheet(() => { render(); toast('Name changed to ' + ME); }); }}, `Not ${ME}? Change name`) : '',
    edit ? h('hr') : '',
    edit ? h('button', {onclick: () => { close(); if (confirm('Clear this view to a blank plan? You can undo this.')) commit(() => { const keep = S.profile; S = fresh(); S.profile = keep; }); }}, 'Clear this view') : '');
  document.body.append(menuEl);
  setTimeout(() => document.addEventListener('click', function f(e) { if (menuEl && !menuEl.contains(e.target)) close(); document.removeEventListener('click', f); }), 0);
}
function exportPlan() {
  const a = h('a', {href: URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], {type: 'application/json'})), download: `grid-plan-${new Date().toISOString().slice(0, 10)}.json`});
  document.body.append(a); a.click(); a.remove();
}
function importPlan() {
  const inp = h('input', {type: 'file', accept: '.json,application/json'});
  inp.onchange = async () => {
    try { const s = JSON.parse(await inp.files[0].text()); if (s.v !== 1 || !Array.isArray(s.posts)) throw 0; commit(() => S = s); toast('Plan opened'); }
    catch (e) { toast('That file isn\'t a grid plan.'); }
  };
  inp.click();
}

/* share-link snapshots (plan in the hash) */
async function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let out = bytes;
  if (window.CompressionStream) out = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  let bin = ''; out.forEach(b => bin += String.fromCharCode(b));
  return (window.CompressionStream ? 'z' : 'j') + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function decode(str) {
  const kind = str[0], bytes = Uint8Array.from(atob(str.slice(1).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  if (kind === 'j') return JSON.parse(new TextDecoder().decode(bytes));
  return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text());
}

/* ---------- boot ---------- */
async function boot() {
  document.body.append(status, app, bar);
  LIB = Array.isArray(CFG.library) ? CFG.library : await fetch(CFG.library).then(r => r.json()).catch(() => []);
  LIB.forEach(i => BYID[i.id] = i);
  const hash = new URLSearchParams(location.hash.slice(1)), query = new URLSearchParams(location.search);
  const teamIn = hash.get('team') || query.get('team');
  if (teamIn) ls.set('gp-team', teamIn);
  TEAM = ls.get('gp-team');
  const wantView = hash.get('view') || query.get('view'), snap = hash.get('p');
  if (location.hash || teamIn) { query.delete('team'); query.delete('view'); const q = query.toString(); history.replaceState(null, '', location.pathname + (q ? '?' + q : '')); }
  if (API && !TEAM) TEAM = await teamSheet();
  let local = null; try { local = JSON.parse(ls.get(KEY)); } catch (e) {}
  let shared = null; if (snap) { try { shared = await decode(snap); } catch (e) { toast('That share link is broken or incomplete.'); } }

  if (API && TEAM) {
    try { await api('GET', '/views'); online = true; }
    catch (e) {
      if (e.status === 401) { ls.set('gp-team', ''); TEAM = await teamSheet('That team code didn\'t work. Check it and try again.'); if (TEAM) { try { await api('GET', '/views'); online = true; } catch (e2) { toast('That code didn\'t work either, so this is saving on this device only.'); } } }
      else toast('Can\'t reach the shared views right now, so this is saving on this device only.');
    }
  }
  if (!online) {
    if (local && local.v === 1) S = local;
    if (shared && (!hasContent(S) || confirm('Open the shared plan? It replaces the plan saved on this device (you can undo).'))) { undoStack.push(JSON.stringify(S)); S = shared; ls.set(KEY, JSON.stringify(S)); }
    render();
    return;
  }
  await loadUploads();
  render();
  await new Promise(res => ME ? res() : nameSheet(res));
  // a grid planned on this device before views existed becomes a saved view
  if (local && local.v === 1 && hasContent(local) && !ls.get('gp-migrated')) {
    if (await askSheet('Save your grid as a view?', 'You planned a grid on this device before shared views existed. Save it as a view so everyone can see it?', 'Save it as a view', 'Not now')) {
      await createView(ME + '\'s grid', local); ls.set('gp-migrated', '1'); toast('Saved. Everyone can see it now.');
    } else ls.set('gp-migrated', 'skipped');
  }
  if (shared) { if (await askSheet('Save this shared plan?', 'Someone sent you a snapshot of a grid. Save it as a new view?', 'Save as a view', 'No thanks')) { await createView('Shared grid', shared); } }
  if (!VIEW) await pickView(wantView);
  else if (wantView && wantView !== VIEW.id) await pickView(wantView);
  setInterval(poll, 4000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
  window.addEventListener('beforeunload', e => { if (pending || saving) { e.preventDefault(); e.returnValue = ''; } });
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
