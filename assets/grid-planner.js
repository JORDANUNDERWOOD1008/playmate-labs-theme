/* Grid planner. Config: window.GP_CONFIG = {library: [..] | url, store: 'gp-plan'} */
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
const clone = o => JSON.parse(JSON.stringify(o));

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
  play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
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
  link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>'
};
const icon = (n, cls) => h('span', {class: cls, html: I[n], 'aria-hidden': 'true'});

/* ---------- library ---------- */
let LIB = [], BYID = {};
const isWide = img => img && img.w / img.h >= 1.25;
function url(img, w) {
  if (!img) return '';
  if (img.local || !w) return img.src;
  return img.src + (img.src.includes('?') ? '&' : '?') + 'width=' + w;
}
/* A slide/cover reference: {img: id, part: 'full'|'L'|'R'} */
function media(ref, {w = 640, fit = false, cls = ''} = {}) {
  const img = ref && BYID[ref.img];
  const box = h('div', {class: 'm ' + (fit ? 'fit ' : '') + cls});
  if (!img) return box;
  const half = ref.part === 'L' || ref.part === 'R';
  const ra = (img.w / img.h) / (half ? 2 : 1);
  box.style.setProperty('--ra', ra);
  box.style.setProperty('--rs', half ? 2 : 1);
  box.style.setProperty('--ro', ref.part === 'R' ? 1 : 0);
  const crop = h('div', {class: 'crop'});
  const src = url(img, half ? w * 2 : w);
  if (img.kind === 'video') crop.append(h('video', {src: img.src + '#t=0.5', muted: true, playsinline: true, preload: 'metadata', loop: true}));
  else crop.append(h('img', {src, alt: img.name, decoding: 'async', draggable: 'false'}));
  box.append(crop);
  return box;
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

function commit(fn, {render: r = true} = {}) {
  undoStack.push(JSON.stringify(S)); if (undoStack.length > 60) undoStack.shift();
  fn(); save(); if (r) render();
}
function undo() {
  if (!undoStack.length) return;
  S = JSON.parse(undoStack.pop()); save(); render(); closeAll(); toast('Undone');
}
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }, 250);
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) S = s; } catch (e) {}
}

/* share links: plan JSON, deflated, base64url, in the hash */
async function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let out = bytes;
  if (window.CompressionStream) {
    const s = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    out = new Uint8Array(await new Response(s).arrayBuffer());
  }
  let bin = ''; out.forEach(b => bin += String.fromCharCode(b));
  return (window.CompressionStream ? 'z' : 'j') + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function decode(str) {
  const kind = str[0], b64 = str.slice(1).replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  if (kind === 'j') return JSON.parse(new TextDecoder().decode(bytes));
  const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(s).text());
}
async function shareLink() {
  const link = location.origin + location.pathname + '#p=' + await encode(S);
  try { await navigator.clipboard.writeText(link); toast('Link copied. Anyone with it sees this exact plan.'); }
  catch (e) { prompt('Copy this link:', link); }
}

/* ---------- small UI helpers ---------- */
let toastT;
function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = h('div', {class: 'toast', role: 'status'}, msg); document.body.append(t);
  clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2800);
}
const layers = [];
function openLayer(el, onClose) {
  document.body.append(el); layers.push({el, onClose}); document.body.style.overflow = 'hidden';
  el.addEventListener('click', e => { if (e.target === el) closeTop(); });
  return el;
}
function closeTop() {
  const l = layers.pop(); if (!l) return;
  l.el.remove(); l.onClose && l.onClose();
  if (!layers.length) document.body.style.overflow = '';
}
function closeAll() { while (layers.length) closeTop(); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && layers.length) { e.preventDefault(); closeTop(); }
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

/* ---------- picker ---------- */
/* opts: {title, multi, filter: 'all', onPick(imgs[])} */
function picker({title = 'Choose from library', multi = false, onPick, allowVideo = true}) {
  let filter = 'all', q = '', chosen = [];
  const used = usage();
  const lib = h('div', {class: 'lib'});
  const addBtn = h('button', {class: 'btn primary grow', disabled: true, onclick: () => { closeTop(); onPick(chosen.map(id => BYID[id])); }}, 'Add');
  const hasVideo = LIB.some(i => i.kind === 'video');
  const tabs = [['all', 'All'], ['product', 'Product'], ['lifestyle', 'Lifestyle'], ['wide', 'Wide (2-slide)'], ...(hasVideo && allowVideo ? [['video', 'Video']] : []), ['unused', 'Not used yet']];
  const chips = tabs.map(([k, label]) => h('button', {class: 'chip' + (k === filter ? ' on' : ''), onclick: e => { filter = k; chips.forEach(c => c.classList.remove('on')); e.currentTarget.classList.add('on'); draw(); }}, label));
  function draw() {
    lib.replaceChildren();
    const items = LIB.filter(i => (allowVideo || i.kind !== 'video') &&
      (filter === 'all' || i.cat === filter || (filter === 'wide' && isWide(i)) || (filter === 'video' && i.kind === 'video') || (filter === 'unused' && !used[i.id])) &&
      (!q || i.name.toLowerCase().includes(q)));
    if (!items.length) lib.append(h('div', {class: 'none'}, 'Nothing matches. Try another filter.'));
    for (const i of items) {
      const n = chosen.indexOf(i.id);
      const li = h('div', {class: 'li' + (isWide(i) ? ' wide' : '') + (n >= 0 ? ' on' : ''), tabindex: 0, role: 'button', 'aria-label': i.name,
        onclick: () => {
          if (!multi) { closeTop(); onPick([i]); return; }
          const k = chosen.indexOf(i.id); k >= 0 ? chosen.splice(k, 1) : chosen.push(i.id);
          addBtn.disabled = !chosen.length; addBtn.textContent = chosen.length ? `Add ${chosen.length}` : 'Add'; draw();
        },
        onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }},
        media({img: i.id, part: 'full'}, {w: isWide(i) ? 480 : 260}),
        i.kind === 'video' ? h('span', {class: 'tag'}, 'Video') : isWide(i) ? h('span', {class: 'tag'}, '2 slides') : '',
        used[i.id] ? h('span', {class: 'used'}, `Used ${used[i.id]}×`) : '',
        multi ? h('span', {class: 'sel'}, n >= 0 ? String(n + 1) : '') : '',
        h('span', {class: 'nm'}, i.name));
      lib.append(li);
    }
  }
  const search = h('input', {type: 'search', placeholder: 'Search by file name', 'aria-label': 'Search images', oninput: e => { q = e.target.value.toLowerCase().trim(); draw(); }});
  const el = sheet(title, h('div', {class: 'filters'}, search, chips), null, 'picker');
  $('.sheet', el).append(lib);
  if (multi) $('.sheet', el).append(h('footer', {}, h('span', {class: 'hint', style: 'flex:1;align-self:center'}, 'Tap in the order you want the slides.'), addBtn));
  draw(); openLayer(el); setTimeout(() => search.focus({preventScroll: true}), 50);
}

/* turn picked images into slides; wide images become a left/right pair */
const toSlides = (imgs, split = true) => imgs.flatMap(i => split && isWide(i) && i.kind !== 'video' ? [{img: i.id, part: 'L'}, {img: i.id, part: 'R'}] : [{img: i.id, part: 'full'}]);

/* ---------- post editor ---------- */
function editPost(id) {
  const p = () => S.posts.find(x => x.id === id);
  if (!p()) return;
  const body = h('div', {class: 'body'});
  const el = sheet('Post ' + (S.posts.indexOf(p()) + 1), body,
    h('footer', {},
      h('button', {class: 'btn danger', onclick: () => { commit(() => Object.assign(p(), emptyPost(), {id})); closeTop(); toast('Slot cleared'); }}, 'Clear slot'),
      h('button', {class: 'btn', onclick: () => { if (!isEmpty(p())) viewPost(id); }}, 'Preview'),
      h('button', {class: 'btn primary grow', onclick: closeTop}, 'Done')));
  const title = $('h2', el);
  function draw() {
    const post = p(); body.replaceChildren();
    title.textContent = 'Post ' + (S.posts.indexOf(post) + 1);
    // type
    const types = [['single', 'Single'], ['carousel', 'Carousel'], ['reel', 'Reel / video']];
    body.append(h('div', {}, h('h3', {}, 'Format'),
      h('div', {class: 'seg2', role: 'tablist'}, types.map(([k, label]) => h('button', {class: post.type === k ? 'on' : '', role: 'tab', 'aria-selected': String(post.type === k),
        onclick: () => commit(() => { post.type = k; if (k !== 'carousel' && post.slides.length > 1) post.slides = post.slides.slice(0, 1); }) || draw()},
        k === 'carousel' ? icon('multi') : k === 'reel' ? icon('reel') : '', label)))));
    // slides
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
      picker({title: post.type === 'carousel' ? 'Add slides' : post.type === 'reel' ? 'Choose the video or image' : 'Choose an image', multi: post.type === 'carousel',
        onPick: imgs => {
          commit(() => {
            if (post.type === 'carousel') post.slides.push(...toSlides(imgs));
            else if (post.type === 'single' && isWide(imgs[0]) && imgs[0].kind !== 'video') { post.type = 'carousel'; post.slides = toSlides(imgs); toast('Wide image: made a 2-slide carousel. Switch to Single to use one half.'); }
            else post.slides = [{img: imgs[0].id, part: 'full'}];
            post.slides = post.slides.slice(0, 20);
          }); draw();
        }});
    }}, icon('plus')));
    body.append(h('div', {}, h('h3', {}, post.type === 'carousel' ? `Slides (${post.slides.length}/20)` : post.type === 'reel' ? 'Video' : 'Image'), strip,
      post.type === 'carousel' && post.slides.length > 1 ? h('p', {class: 'hint'}, 'Drag to reorder. Wide images split into two slides that join up when swiped.') : '',
      post.type === 'reel' && !LIB.some(i => i.kind === 'video') ? h('p', {class: 'hint'}, 'No videos in the library yet, so pick a still to stand in for the reel.') : ''));
    sortable(strip, (a, b) => { if (b >= post.slides.length) return draw(); commit(() => move(post.slides, a, b)); draw(); }, {filter: '.add,.x,.act', preventOnFilter: false, draggable: '.it'});
    // cover
    const cov = coverOf(post), covImg = cov && BYID[cov.img];
    body.append(h('div', {}, h('h3', {}, 'Grid cover'),
      h('div', {class: 'cover-row'}, media(cov, {w: 240}),
        h('div', {class: 'opts'},
          h('button', {class: 'chip' + (!post.cover ? ' on' : ''), onclick: () => { commit(() => post.cover = null); draw(); }}, 'Use first slide'),
          h('button', {class: 'chip' + (post.cover ? ' on' : ''), onclick: () => picker({title: 'Choose a cover', onPick: imgs => { commit(() => post.cover = {img: imgs[0].id, part: 'full'}); draw(); }})}, 'Pick a different cover'),
          post.cover && covImg && isWide(covImg) ? ['L', 'full', 'R'].map(k => h('button', {class: 'chip' + (post.cover.part === k ? ' on' : ''), onclick: () => { commit(() => post.cover.part = k); draw(); }}, k === 'L' ? 'Left half' : k === 'R' ? 'Right half' : 'Whole')) : '')),
      h('p', {class: 'hint'}, 'This is the image the grid shows. It doesn\'t have to be in the post.')));
    // caption
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

/* ---------- highlight editor ---------- */
function editHighlight(id) {
  const hl = () => S.highlights.find(x => x.id === id);
  const body = h('div', {class: 'body'});
  const el = sheet('Highlight', body, h('footer', {},
    h('button', {class: 'btn danger', onclick: () => { commit(() => S.highlights = S.highlights.filter(x => x.id !== id)); closeTop(); }}, 'Delete'),
    h('button', {class: 'btn', onclick: () => playStory(id)}, 'Play'),
    h('button', {class: 'btn primary grow', onclick: closeTop}, 'Done')));
  function draw() {
    const x = hl(); body.replaceChildren();
    const t = h('input', {class: 'field', maxlength: 15, placeholder: 'Title', value: x.title, 'aria-label': 'Highlight title'});
    let first = true;
    t.addEventListener('input', () => { if (first) { undoStack.push(JSON.stringify(S)); first = false; } x.title = t.value; save(); });
    body.append(h('div', {}, h('h3', {}, 'Title'), t, h('p', {class: 'hint'}, 'Up to 15 characters.')));
    const cv = h('div', {class: 'm hlc'});
    const c = media(x.cover || x.items[0], {w: 200}); c.classList.add('hlc');
    body.append(h('div', {}, h('h3', {}, 'Cover'), h('div', {class: 'cover-row'}, x.cover || x.items[0] ? c : cv,
      h('div', {class: 'opts'},
        h('button', {class: 'chip', onclick: () => picker({title: 'Highlight cover', onPick: imgs => { commit(() => x.cover = {img: imgs[0].id, part: 'full'}); draw(); }})}, 'Pick cover'),
        x.cover ? h('button', {class: 'chip', onclick: () => { commit(() => x.cover = null); draw(); }}, 'Use first story') : ''))));
    const strip = h('div', {class: 'strip'});
    x.items.forEach((s, i) => strip.append(h('div', {class: 'it'}, media(s, {w: 200}),
      h('button', {class: 'x', 'aria-label': 'Remove story', onclick: () => { commit(() => x.items.splice(i, 1)); draw(); }}, icon('x')),
      h('div', {class: 'lbl'}, String(i + 1)))));
    strip.append(h('button', {class: 'add', 'aria-label': 'Add stories', onclick: () => picker({title: 'Add stories', multi: true, onPick: imgs => { commit(() => x.items.push(...imgs.map(i => ({img: i.id, part: 'full'})))); draw(); }})}, icon('plus')));
    sortable(strip, (a, b) => { if (b >= x.items.length) return draw(); commit(() => move(x.items, a, b)); draw(); }, {filter: '.add,.x', preventOnFilter: false, draggable: '.it'});
    body.append(h('div', {}, h('h3', {}, `Stories (${x.items.length})`), strip, h('p', {class: 'hint'}, 'Drag to reorder. Each story shows full screen, like a real highlight.')));
  }
  draw(); openLayer(el, render);
}
function newHighlight() {
  picker({title: 'Pick the stories for this highlight', multi: true, onPick: imgs => {
    const id = uid();
    commit(() => S.highlights.push({id, title: 'New', cover: null, items: imgs.map(i => ({img: i.id, part: 'full'}))}));
    editHighlight(id);
  }});
}

/* ---------- story player ---------- */
function playStory(id) {
  const x = S.highlights.find(q => q.id === id);
  if (!x) return;
  let i = 0, timer, start, paused = false;
  const DUR = 5000;
  const bars = h('div', {class: 'bars'}, x.items.map(() => h('i', {}, h('b'))));
  const stage = h('div', {class: 'main'}), blur = h('div', {class: 'blur'});
  const av = media(x.cover || x.items[0], {w: 120}); av.className += ' av';
  const frame = h('div', {class: 'frame'}, blur, stage, bars,
    h('div', {class: 'sh'}, av, h('span', {}, x.title || 'Highlight')),
    h('div', {class: 'tap l', onclick: () => go(i - 1)}), h('div', {class: 'tap r', onclick: () => go(i + 1)}));
  const el = h('div', {class: 'story', role: 'dialog', 'aria-label': x.title}, frame,
    h('button', {class: 'close-x', 'aria-label': 'Close', onclick: closeTop}, icon('xl')));
  function go(n) {
    if (n < 0) n = 0;
    if (n >= x.items.length) { closeTop(); return; }
    i = n; cancelAnimationFrame(timer);
    stage.replaceChildren(media(x.items[i], {w: 1080, fit: true, cls: 'abs'}));
        blur.replaceChildren(media(x.items[i], {w: 200}));
    [...bars.children].forEach((b, k) => b.firstChild.style.width = k < i ? '100%' : '0');
    start = performance.now(); tick();
  }
  function tick() {
    timer = requestAnimationFrame(now => {
      const f = Math.min(1, (now - start) / DUR);
      bars.children[i].firstChild.style.width = f * 100 + '%';
      f >= 1 ? go(i + 1) : tick();
    });
  }
  if (!x.items.length) frame.append(h('div', {class: 'empty-s'}, 'No stories in this highlight yet.'));
  openLayer(el, () => cancelAnimationFrame(timer));
  el.addEventListener('click', e => { if (e.target === el) closeTop(); });
  if (x.items.length) go(0);
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
function viewPost(id) {
  const post = S.posts.find(x => x.id === id);
  if (!post || isEmpty(post)) return;
  const slides = post.slides.length ? post.slides : [post.cover];
  const track = h('div', {class: 'track'}, slides.map(s => h('div', {class: 'slide'}, media(s, {w: 1080}))));
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
  const av = media(S.profile.avatar, {w: 100}); av.className += ' av';
  const vids = () => track.querySelectorAll('video');
  const card = h('article', {class: 'post'},
    h('div', {class: 'ph'}, av, h('b', {}, S.profile.username)),
    h('div', {class: 'media-wrap'}, track, pg, navL, navR, post.type === 'reel' ? h('span', {class: 'reel-badge'}, icon('reel'), 'Reel') : ''),
    dots,
    h('div', {class: 'acts'}, icon('heart'), icon('comment'), icon('send'), icon('save', 'r')),
    captionNode(post.caption, S.profile.username),
    mode === 'plan' ? h('div', {class: 'pe'}, h('button', {class: 'btn grow', onclick: () => { closeTop(); editPost(id); }}, 'Edit post')) : '');
  const el = h('div', {class: 'shade viewer', role: 'dialog', 'aria-modal': 'true'}, card, h('button', {class: 'close-x', 'aria-label': 'Close', onclick: closeTop}, icon('xl')));
  openLayer(el);
  vids().forEach(v => { v.muted = true; v.play().catch(() => {}); });
}

/* ---------- main render ---------- */
const app = h('div', {class: 'app'});
function editable(tag, cls, key, ph, multiline) {
  const el = h(tag, {class: cls, 'data-ph': ph});
  el.textContent = S.profile[key] || '';
  if (mode === 'plan') {
    el.contentEditable = 'plaintext-only';
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.spellcheck = true;
    el.addEventListener('focus', () => undoStack.push(JSON.stringify(S)));
    el.addEventListener('input', () => { S.profile[key] = el.innerText.replace(/\n$/, ''); save(); });
    if (!multiline) el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
  }
  return el;
}
function tileFor(post, idx) {
  const empty = isEmpty(post);
  const t = h('div', {class: 'tile' + (empty ? ' empty' : ''), 'data-id': post.id, tabindex: 0, role: 'button',
    'aria-label': empty ? `Empty slot ${idx + 1}` : `Post ${idx + 1}`,
    onclick: () => mode === 'plan' ? editPost(post.id) : viewPost(post.id),
    onkeydown: e => { if (e.key === 'Enter') e.currentTarget.click(); }});
  if (empty) { t.append(icon('plus')); return t; }
  t.append(media(coverOf(post), {w: 420}));
  if (post.type === 'carousel' && post.slides.length > 1) t.append(icon('multi', 'badge'));
  if (post.type === 'reel') t.append(icon('reel', 'badge'));
  t.append(h('span', {class: 'num'}, String(idx + 1)));
  if (post.caption.trim()) t.append(icon('caption', 'cap'));
  return t;
}
function refreshTile(post) {
  const old = app.querySelector(`.tile[data-id="${post.id}"]`);
  if (old) old.replaceWith(tileFor(post, S.posts.indexOf(post)));
}
function render() {
  document.body.classList.toggle('plan', mode === 'plan');
  document.body.classList.toggle('preview', mode === 'preview');
  document.documentElement.style.setProperty('--tile', S.ratio);
  const P = S.profile, count = S.posts.filter(p => !isEmpty(p)).length;
  const av = media(P.avatar, {w: 300}); av.classList.add('avatar'); if (!P.avatar) av.classList.add('empty');
  if (mode === 'plan') { av.style.cursor = 'pointer'; av.title = 'Change profile picture'; av.onclick = () => picker({title: 'Profile picture', onPick: imgs => commit(() => P.avatar = {img: imgs[0].id, part: 'full'})}); }
  const stat = (n, label, key) => h('div', {}, key ? editable('b', '', key, '0') : h('b', {}, n), h('span', {}, label));
  app.replaceChildren(
    h('div', {class: 'topbar'}, editable('div', 'handle', 'username', 'username'), icon('chev'), h('div', {class: 'spacer'}), icon('plus', 'ic'), icon('menu', 'ic')),
    h('section', {class: 'profile'}, av,
      h('div', {class: 'stats'}, stat(count, 'posts'), stat('', 'followers', 'followers'), stat('', 'following', 'following')),
      h('div', {class: 'bio'}, editable('div', 'name', 'name', 'Name'), editable('div', 'text', 'bio', mode === 'plan' ? 'Write a bio' : '', true), editable('div', 'link', 'link', mode === 'plan' ? 'Add a link' : '')),
      h('div', {class: 'profile-btns'}, h('span', {}, 'Edit profile'), h('span', {}, 'Share profile'))),
    h('div', {class: 'highlights'},
      S.highlights.map(x => {
        const m = media(x.cover || x.items[0], {w: 200});
        return h('button', {class: 'hl', onclick: () => mode === 'plan' ? editHighlight(x.id) : playStory(x.id)},
          h('div', {class: 'ring'}, m), h('div', {class: 't'}, x.title || ' '));
      }),
      mode === 'plan' ? h('button', {class: 'hl new', onclick: newHighlight}, h('div', {class: 'ring'}, h('div', {class: 'm'}, icon('plus'))), h('div', {class: 't'}, 'New')) : ''),
    h('div', {class: 'tabs'}, h('span', {class: 'on'}, icon('grid')), h('span', {}, icon('reels')), h('span', {}, icon('tagged'))),
    (() => { const g = h('div', {class: 'grid'}, S.posts.map(tileFor)); if (mode === 'plan') sortable(g, (a, b) => commit(() => move(S.posts, a, b))); return g; })(),
    h('button', {class: 'addrow', onclick: () => commit(() => S.posts.push(emptyPost(), emptyPost(), emptyPost()))}, '+ Add a row'));
  renderBar();
}

/* ---------- planner bar ---------- */
const bar = h('nav', {class: 'bar', 'aria-label': 'Planner'});
let menuEl = null;
function renderBar() {
  bar.replaceChildren(
    h('div', {class: 'seg'},
      h('button', {class: mode === 'plan' ? 'on' : '', onclick: () => { mode = 'plan'; render(); }}, 'Plan'),
      h('button', {class: mode === 'preview' ? 'on' : '', onclick: () => { mode = 'preview'; render(); }}, 'Preview')),
    h('button', {onclick: undo, disabled: !undoStack.length, 'aria-label': 'Undo'}, icon('undo'), 'Undo'),
    h('button', {onclick: shareLink}, icon('link'), 'Share'),
    h('button', {'aria-label': 'More options', onclick: toggleMenu}, icon('dots')));
}
function toggleMenu() {
  if (menuEl) { menuEl.remove(); menuEl = null; return; }
  const close = () => { menuEl && menuEl.remove(); menuEl = null; };
  menuEl = h('div', {class: 'menu'},
    h('button', {onclick: () => { close(); commit(() => S.ratio = S.ratio === '3/4' ? '1/1' : '3/4'); toast(S.ratio === '3/4' ? 'Grid shows 3:4 tiles (current Instagram)' : 'Grid shows square tiles (old Instagram)'); }}, S.ratio === '3/4' ? 'Show square grid' : 'Show 3:4 grid'),
    h('button', {onclick: () => { close(); commit(() => S.posts.unshift(emptyPost(), emptyPost(), emptyPost())); }}, 'Add a row at the top'),
    h('button', {onclick: () => { close(); commit(() => S.posts = S.posts.filter(p => !isEmpty(p))); toast('Empty slots removed'); }}, 'Remove empty slots'),
    h('hr'),
    h('button', {onclick: () => { close(); exportPlan(); }}, 'Download plan file'),
    h('button', {onclick: () => { close(); importPlan(); }}, 'Open a plan file'),
    h('hr'),
    h('button', {onclick: () => { close(); if (confirm('Start a blank plan? You can undo this.')) commit(() => { const keep = S.profile; S = fresh(); S.profile = keep; }); }}, 'Start a blank plan'));
  document.body.append(menuEl);
  setTimeout(() => document.addEventListener('click', function f(e) { if (menuEl && !menuEl.contains(e.target)) { close(); } document.removeEventListener('click', f); }), 0);
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

/* ---------- boot ---------- */
async function boot() {
  document.body.append(app, bar);
  const lib = CFG.library;
  LIB = Array.isArray(lib) ? lib : await fetch(lib).then(r => r.json()).catch(() => []);
  LIB.forEach(i => BYID[i.id] = i);
  load();
  const m = location.hash.match(/^#p=(.+)$/);
  if (m) {
    try {
      const shared = await decode(m[1]);
      const hasLocal = S.posts.some(p => !isEmpty(p));
      if (!hasLocal || confirm('Open the shared plan? It replaces the plan saved on this device (you can undo).')) { commit(() => S = shared, {render: false}); }
    } catch (e) { toast('That share link is broken or incomplete.'); }
    history.replaceState(null, '', location.pathname + location.search);
  }
  render();
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
