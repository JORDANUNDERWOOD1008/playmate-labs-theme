/* Content Studio doc parser. Pure functions, shared by the page (window.StudioParse) and tests (require).
   Contract: the content-concept skill writes markdown with "## Heading" sections and ends with a ```studio JSON block.
   The JSON is trusted field by field; anything missing falls back to reading the markdown. */
(function (root) {
'use strict';
const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn', 'Pinterest'];
// order = display order on the card. re is tested against the cleaned heading text.
const SECTIONS = [
  {id: 'concept', name: 'Concept', re: /^(the\s+)?(concept|idea|hook|overview|summary)\b/i},
  {id: 'locations', name: 'Locations', re: /^(locations?|location\s+options|where\s+to\s+shoot|venues?)\b(?!\s*(&|and)\s*kit)/i},
  {id: 'shootday', name: 'Shoot day', re: /^(shoot\s*day|on\s+the\s+day|call\s*sheet|logistics)\b/i},
  {id: 'kit', name: 'Kit', re: /^(kit|equipment|gear|props|location\s*(&|and)\s*kit)\b/i},
  {id: 'budget', name: 'Budget', re: /^(budget|costs?)\b/i},
  {id: 'shots', name: 'Shot list', re: /^(shot\s*list|shots|storyboard)\b/i},
  {id: 'script', name: 'Script', re: /^(the\s+)?script\b/i, mono: true},
  {id: 'voiceover', name: 'Voiceover', re: /^(voice\s*-?\s*over|vo|narration)\b/i, mono: true},
  {id: 'onscreen', name: 'On-screen text', re: /^(on[\s-]*screen(\s+text)?|text\s*overlays?|overlays?|texsta|supers)\b/i},
  {id: 'music', name: 'Music', re: /^(music|sound(track)?|audio|background\s+music)\b/i},
  {id: 'techstack', name: 'Tech stack', re: /^(tech\s*stack|tools|software)\b/i},
  {id: 'workflow', name: 'Workflow', re: /^(workflow|production\s+(steps|plan|workflow)|process|steps)\b/i},
  {id: 'captions', name: 'Captions', re: /^(captions?|post\s+copy|copy\s*(&|and)\s*hashtags|hashtags)\b/i},
  {id: 'questions', name: 'Open questions', re: /^(open\s+questions|decisions|questions|to\s+decide|tbc)\b/i}
];
const SYN = {instagram: 'Instagram', ig: 'Instagram', insta: 'Instagram', reels: 'Instagram', reel: 'Instagram', tiktok: 'TikTok', 'tik tok': 'TikTok',
             linkedin: 'LinkedIn', pinterest: 'Pinterest', pin: 'Pinterest', pins: 'Pinterest'};

const safeUrl = u => { try { const x = new URL(String(u || '').trim()); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } };
const domain = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
function clean(t) {
  return String(t).replace(EMOJI, '').replace(/[*_`#]/g, '').replace(/^\s*(step\s+)?\d+\s*[.):-]\s*/i, '').replace(/\s*:\s*$/, '').replace(/\s+/g, ' ').trim();
}
const sectionFor = t => SECTIONS.find(s => s.re.test(t));

/* money: "£40–60" -> 60 (with a warning), "£1.2k" -> 1200, "none needed" -> 0 */
function money(s) {
  const n = (v, k) => parseFloat(v.replace(/,/g, '')) * (k ? 1000 : 1), out = [];
  for (const x of String(s).matchAll(/£\s*([\d,]+(?:\.\d+)?)\s*(k)?(?:\s*[–—-]\s*£?\s*([\d,]+(?:\.\d+)?)\s*(k)?)?/gi)) {
    out.push(n(x[1], x[2] || x[4])); if (x[3]) out.push(n(x[3], x[4]));
  }
  return out;
}
function parseBudget(text) {
  const t = String(text || ''), warnings = [];
  if (!t.trim()) return {total: null, warnings};
  const total = t.match(/^\s*[-*]?\s*\**\s*(?:total|extra\s+budget|budget)\b[^:\n]*:?\**\s*(.+)$/im);
  const line = total ? total[1] : t;
  if (/\b(none|nothing|no\s+(extra\s+)?budget|not\s+needed|£\s*0\b)/i.test(line) && !money(line).some(n => n > 0)) return {total: 0, warnings};
  let nums = money(line);
  if (!nums.length && total) nums = money(t);
  if (!nums.length) return {total: null, warnings};
  if (/[–—-]\s*£?\s*\d/.test(line) && nums.length > 1) warnings.push('Budget is a range, so the top figure is used.');
  return {total: Math.round(Math.max(...nums)), warnings};
}

/* location options from a markdown table, list items or bold-name lines */
function parseOptions(text) {
  const lines = String(text || '').split('\n'), out = [];
  const linkOf = s => { const md = s.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/); if (md) return {label: md[1], url: md[2]};
    const bare = s.match(/https?:\/\/[^\s<>()\]]+/); return bare ? {label: '', url: bare[0].replace(/[.,;:!?'"]+$/, '')} : null; };
  const tableRows = lines.filter(l => /^\s*\|.*\|\s*$/.test(l));
  if (tableRows.length >= 2) {
    const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    const head = cells(tableRows[0]).map(c => clean(c).toLowerCase());
    const ni = Math.max(0, head.findIndex(c => /name|location|venue|place|option/.test(c)));
    for (const r of tableRows.slice(1)) {
      if (/^\s*\|?\s*:?-{2,}/.test(r)) continue;
      const c = cells(r), joined = c.join(' '), l = linkOf(joined);
      const name = clean((c[ni] || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'));
      if (!name) continue;
      out.push({name, url: l ? safeUrl(l.url) : '', notes: c.filter((_, i) => i !== ni).map(x => x.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').trim()).filter(Boolean).join(' · ')});
    }
  } else {
    let cur = null;
    for (const raw of lines) {
      const l = raw.replace(/\r/g, '');
      const item = l.match(/^\s{0,3}(?:[-*•]|\d+[.)])\s+(.*)$/) || l.match(/^\s*(\*\*[^*]+\*\*.*)$/);
      const top = item && !/^\s{2,}[-*•]/.test(l);
      if (top) {
        const body = item[1], link = linkOf(body);
        const bold = body.match(/\*\*([^*]+)\*\*/);
        let name = bold ? bold[1] : link && link.label ? link.label : body.split(/\s+[—–]\s+|\s+-\s+|:\s|\s\|\s/)[0];
        name = clean(name.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, ''));
        if (!name) continue;
        const rest = body.replace(/\*\*[^*]+\*\*/, '').replace(/\[([^\]]+)\]\([^)]*\)/g, (m, a) => link && a === link.label && !bold ? '' : a).replace(/https?:\/\/\S+/g, '')
          .replace(/^\s*[—–:|-]+\s*/, '').replace(/\s*[—–|]\s*[—–|]\s*/g, ' — ').trim();
        cur = {name, url: link ? safeUrl(link.url) : '', notes: rest.replace(/^[—–\s|-]+|[—–\s|-]+$/g, '')};
        out.push(cur);
      } else if (cur && l.trim()) { // indented detail lines belong to the option above
        const link = !cur.url && linkOf(l); if (link) cur.url = safeUrl(link.url);
        const t = l.replace(/^\s*[-*•]\s*/, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').trim();
        if (t) cur.notes = (cur.notes ? cur.notes + ' · ' : '') + t;
      }
    }
  }
  return out.slice(0, 6).map(o => ({...o, notes: o.notes.replace(/\s*·\s*·\s*/g, ' · ').replace(/^\s*·\s*|\s*·\s*$/g, '').slice(0, 400)}));
}
function parseKit(text) {
  const lines = String(text || '').split('\n');
  const items = lines.map(l => l.match(/^\s*(?:[-*•]|\d+[.)]|\[[ x]\])\s+(.*)$/i)).filter(Boolean).map(m => m[1].replace(/\*\*/g, '').trim()).filter(Boolean);
  if (items.length) return items;
  // text pulled from a PDF loses its bullet marks: treat each short line as an item
  return lines.map(l => l.replace(/\*\*/g, '').trim()).filter(l => l && l.length < 90);
}
function parsePlatforms(s) {
  const out = [];
  for (const w of String(s || '').toLowerCase().split(/[^a-z ]+|\s{2,}|,|\/|\band\b/)) {
    const k = w.trim(); if (SYN[k] && !out.includes(SYN[k])) out.push(SYN[k]);
  }
  for (const [k, v] of Object.entries(SYN)) if (new RegExp('\\b' + k + '\\b', 'i').test(s) && !out.includes(v)) out.push(v);
  return PLATFORMS.filter(p => out.includes(p));
}

function parseDoc(raw) {
  let text = String(raw || '').replace(/\r/g, '');
  const warnings = [];
  // the machine-readable block: ```studio { ... } ```
  let J = null;
  text = text.replace(/```\s*studio\s*\n([\s\S]*?)```/i, (m, body) => { try { J = JSON.parse(body); } catch (e) { warnings.push('The ```studio block at the end isn\'t valid JSON, so it was read from the text instead.'); } return ''; });
  const lines = text.split('\n');
  const atx = lines.some(l => /^\s{0,3}#{1,4}\s+\S/.test(l));
  let title = '', titleLine = -1;
  const h1 = lines.findIndex(l => /^\s{0,3}#\s+\S/.test(l));
  if (h1 >= 0) { title = clean(lines[h1]); titleLine = h1; }
  const sections = {}, extra = [], intro = [];
  let cur = null; // {kind:'sec', id} | {kind:'extra', i}
  const push = l => {
    if (!cur) { intro.push(l); return; }
    if (cur.kind === 'sec') sections[cur.id] += l + '\n'; else extra[cur.i].text += l + '\n';
  };
  lines.forEach((l, i) => {
    if (i === titleLine) return;
    let head = null;
    if (atx) { const m = l.match(/^\s{0,3}#{2,4}\s+(.+?)\s*#*\s*$/); if (m) head = clean(m[1]); }
    else {
      const b = l.match(/^\s*\*\*([^*]{2,60})\*\*\s*:?\s*$/);
      const c = l.match(/^\s*([A-Za-z][\w &/-]{1,30}):\s*$/);
      const prevBlank = i === 0 || !lines[i - 1].trim();
      if (b) head = clean(b[1]);
      else if (c && prevBlank && sectionFor(clean(c[1]))) head = clean(c[1]); // plain "Label:" only for known names after a gap
    }
    if (head == null) { push(l); return; }
    const sec = sectionFor(head);
    if (sec) { cur = {kind: 'sec', id: sec.id}; sections[sec.id] = sections[sec.id] != null ? sections[sec.id] + '\n' : ''; }
    else { extra.push({heading: head, text: ''}); cur = {kind: 'extra', i: extra.length - 1}; }
  });
  const trim = s => s.replace(/^\n+|\s+$/g, '');
  for (const k of Object.keys(sections)) sections[k] = trim(sections[k]);
  extra.forEach(e => e.text = trim(e.text));
  const introText = trim(intro.join('\n'));
  if (!title) { const first = intro.find(l => l.trim()); if (first && first.length < 90) title = clean(first); }

  // meta line: "Platform: … | Format: … | Length: …" anywhere in the intro
  const meta = {};
  for (const m of introText.matchAll(/\b(platforms?|format|length|where|area|city)\s*:\s*([^|\n]+)/gi)) meta[m[1].toLowerCase().replace(/s$/, '')] = m[2].replace(/\*\*/g, '').trim();
  const legacyKit = sections.kit && !sections.locations ? sections.kit : ''; // old "## Location & kit" docs
  const legacy = s => { const g = re => { const m = String(s).match(re); return m ? m[1].replace(/\*\*/g, '').trim() : ''; };
    return {location: g(/^\s*[-*]?\s*\**location\**\s*:\s*(.+)$/im), setting: g(/^\s*[-*]?\s*\**setting\**\s*:\s*(.+)$/im)}; };

  // structured values: JSON first, then the markdown
  const js = J && typeof J === 'object' ? J : {};
  let options = Array.isArray(js.locations) ? js.locations.filter(o => o && o.name).slice(0, 6).map(o => ({name: String(o.name).slice(0, 120), url: safeUrl(o.url), notes: String(o.notes || o.why || '').slice(0, 400), verified: o.verified ? String(o.verified).slice(0, 40) : ''}))
    : parseOptions(sections.locations);
  if (!options.length && legacyKit) { const lg = legacy(legacyKit); if (lg.location) options = [{name: lg.location, url: '', notes: ''}]; }
  options.forEach(o => { if (!o.verified) { const v = (o.notes || '').match(/\b(verified[^·—|]*|unverified)\b/i); o.verified = v ? v[1].trim() : ''; } });
  let budget = typeof js.budget === 'number' ? {total: Math.max(0, Math.round(js.budget)), warnings: []} : parseBudget(sections.budget || legacyKit);
  warnings.push(...budget.warnings);
  const kit = Array.isArray(js.kit) ? js.kit.map(String).filter(Boolean).slice(0, 60) : parseKit(sections.kit);
  const platforms = Array.isArray(js.platforms) ? PLATFORMS.filter(p => js.platforms.some(x => String(x).toLowerCase() === p.toLowerCase() || SYN[String(x).toLowerCase()] === p)) : parsePlatforms(meta.platform || '');
  const setting = js.setting ? String(js.setting) : legacy(legacyKit).setting;
  return {v: 2, title, meta, intro: introText, sections, extra, options, budget: budget.total, kit, platforms, setting, warnings,
          matched: Object.keys(sections).length, json: !!J};
}
/* tick boxes in a checklist section: "- [ ] x" <-> "- [x] x" */
function toggleCheck(text, n) {
  let i = -1;
  return String(text).split('\n').map(l => { if (/^\s*[-*]\s+\[[ xX]\]/.test(l) && ++i === n) return l.replace(/\[([ xX])\]/, (m, c) => c === ' ' ? '[x]' : '[ ]'); return l; }).join('\n');
}
const openCount = text => (String(text || '').match(/^\s*[-*]\s+\[ \]/gm) || []).length;

const api = {PLATFORMS, SECTIONS, parseDoc, parseOptions, parseBudget, parseKit, parsePlatforms, safeUrl, domain, clean, toggleCheck, openCount};
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StudioParse = api;
})(typeof window !== 'undefined' ? window : globalThis);
