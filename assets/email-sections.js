/* Email Studio section library. Each section type is designed at 600px wide and rendered at 2x (1200px images) for Klaviyo.
   The same file renders the live preview in the page and the final images, so what you see is what goes out.
   Text markup: [[words]] = highlighter box, ~~words~~ = struck through, a blank line = new paragraph. */
(function (root) {
  const C = {bur: '#6B1E3A', deep: '#4A1228', ivory: '#FAF7F2', cream: '#F5EFE6', esp: '#2C1810', blush: '#E8C4BC', blush2: '#F2DDD8', gold: '#C9A96E'};
  const COLORS = {auto: 'Auto', black: 'Black', white: 'White', burgundy: 'Burgundy'};
  const HEX = {black: C.esp, white: C.ivory, burgundy: C.bur};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const inline = s => esc(s).replace(/\[\[(.+?)\]\]/g, '<span class="es-hl">$1</span>').replace(/~~(.+?)~~/g, '<s>$1</s>').replace(/\n/g, '<br>');
  const paras = s => String(s || '').split(/\n\s*\n/).filter(x => x.trim()).map(p => `<p>${inline(p.trim())}</p>`).join('');
  const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean).map(x => x.split('|').map(y => y.trim()));
  const pill = (t, light) => t ? `<span class="es-pill${light ? ' light' : ''}">${esc(t)}</span>` : '';
  // img(slot) returns {src, x, y, z} or null; the section decides the frame size
  const pic = (im, cls = '', alt = '') => im && im.src ? `<div class="es-pic ${cls}" data-slot="${esc(im.slot || '')}"><img src="${esc(im.src)}" alt="${esc(alt)}" crossorigin="anonymous" style="object-position:${im.x ?? 50}% ${im.y ?? 50}%;transform:scale(${im.z || 1});transform-origin:${im.x ?? 50}% ${im.y ?? 50}%"></div>` : `<div class="es-pic es-empty ${cls}" data-slot="${esc((im && im.slot) || '')}"><span>Add an image</span></div>`;
  const colorOf = f => f.color && f.color !== 'auto' ? HEX[f.color] : (f.autoColor || C.esp);
  const logoFor = hex => hex === C.ivory ? 'ivory' : hex === C.esp ? 'black' : 'burgundy';

  const T = {
    hero: {label: 'Hero', images: [['photo', 'Photo']],
      fields: [['strike', 'Struck-through line', 'text'], ['headline', 'Headline', 'text'], ['sub', 'Subline ([[bold]] for emphasis)', 'textarea'], ['button', 'Button', 'text'], ['href', 'Button link', 'link'],
               ['layout', 'Layout', 'select', {overlay: 'Text on the photo', stack: 'Text above the photo'}], ['bg', 'Background (text above)', 'select', {cream: 'Cream', ivory: 'Ivory', blush: 'Blush', burgundy: 'Burgundy'}],
               ['color', 'Text colour', 'select', COLORS], ['shadow', 'Soft shadow behind text', 'select', {no: 'Off', yes: 'On'}], ['height', 'Photo height', 'select', {tall: 'Tall', short: 'Short'}]],
      defaults: {strike: 'same old friday', headline: 'play night.', sub: "We're not promising fireworks. Just [[a better reason to put the phone down.]]", button: 'pull a block', href: 'https://playmatelabs.com/products/nude-stacked', layout: 'overlay', bg: 'cream', color: 'auto', shadow: 'no', height: 'tall'},
      autoArea: {top: 0, height: .45}, // where the text sits, for the Auto colour
      render(f, img, x) {
        const stack = f.layout === 'stack';
        const hex = stack ? (f.color && f.color !== 'auto' ? HEX[f.color] : f.bg === 'burgundy' ? C.ivory : C.esp) : colorOf(f);
        const text = `<div class="hin"><img class="logo" src="${x.logos[logoFor(hex)]}" alt="playmate?">
          ${f.strike ? `<div class="disp strike">${esc(f.strike)}</div>` : ''}<div class="disp big">${inline(f.headline)}</div>
          ${f.sub ? `<p class="sub">${inline(f.sub).replace(/<span class="es-hl">(.+?)<\/span>/g, '<b>$1</b>')}</p>` : ''}${pill(f.button, hex === C.ivory)}</div>`;
        if (stack) return `<div class="es-hero stack hbg-${f.bg || 'cream'} ${f.height === 'short' ? 'short' : ''}" style="--tc:${hex}">${text}${pic(img('photo'), 'below', f.headline)}</div>`;
        return `<div class="es-hero ${f.height === 'short' ? 'short' : ''} ${f.shadow === 'yes' ? 'shadow' : ''}" style="--tc:${hex}">${pic(img('photo'), 'fill', f.headline)}${text}</div>`;
      }, link: f => f.href},
    strip: {label: 'Top strip', fields: [['text', 'Text', 'text'], ['bg', 'Colour', 'select', {burgundy: 'Burgundy', espresso: 'Espresso', blush: 'Blush'}]],
      defaults: {text: 'out now · free UK delivery over £49', bg: 'burgundy'},
      render: f => `<div class="es-strip sbg-${f.bg || 'burgundy'}">${esc(f.text)}</div>`},
    image: {label: 'Photo', images: [['photo', 'Photo']], fields: [['caption', 'Handwritten caption (optional)', 'text'], ['shape', 'Shape', 'select', {square: 'Square', tall: 'Tall', wide: 'Wide'}], ['href', 'Link (optional)', 'link']],
      defaults: {caption: '', shape: 'square', href: ''},
      render: (f, img) => `<div class="es-image shape-${f.shape || 'square'}">${pic(img('photo'), 'full', f.caption || 'photo')}${f.caption ? `<div class="icap">${esc(f.caption)}</div>` : ''}</div>`, link: f => f.href},
    split: {label: 'Photo + text', images: [['photo', 'Photo']], fields: [['eyebrow', 'Small label', 'text'], ['title', 'Title', 'text'], ['body', 'Text', 'textarea'], ['button', 'Button', 'text'], ['href', 'Link', 'link'], ['side', 'Photo side', 'select', {left: 'Left', right: 'Right'}], ['bg', 'Background', 'select', {cream: 'Cream', white: 'White', blush: 'Blush', burgundy: 'Burgundy'}]],
      defaults: {eyebrow: 'inside the lab', title: 'good products.\ncloser moments.', body: 'Every object starts as a question about people and ends as something you can hold.', button: 'read our story', href: 'https://playmatelabs.com/pages/about', side: 'left', bg: 'cream'},
      render: (f, img) => `<div class="es-split bg-${f.bg || 'cream'} ${f.side === 'right' ? 'rev' : ''}">${pic(img('photo'), 'sp', f.title)}<div class="stx"><div class="eyebrow">${esc(f.eyebrow)}</div><h3 class="disp">${inline(f.title)}</h3><p>${inline(f.body)}</p>${pill(f.button, f.bg === 'burgundy')}</div></div>`, link: f => f.href},
    prompts: {label: 'Prompt cards', fields: [['title', 'Title', 'text'], ['cards', 'Cards, one per line: level | prompt (3)', 'textarea'], ['sub', 'Line under (optional)', 'text']],
      defaults: {title: 'pull one tonight', cards: 'mild | Tell me the moment you knew you fancied me.\nspicy | Kiss me somewhere you never have before.\nwild | Blindfold on. Your partner picks the next block.', sub: '162 prompts. Every card is optional.'},
      render(f) {
        const cs = lines(f.cards).slice(0, 3), rot = [-7, 0, 7], dy = [16, 0, 16];
        return `<div class="es-prompts"><h2 class="disp">${inline(f.title)}</h2><div class="fan">${cs.map(([l, t], i) => `<div class="pc lv-${esc((l || '').toLowerCase())}" style="transform:translateY(${dy[i]}px) rotate(${rot[i]}deg)"><div class="lv">${esc(l)}</div><p>${esc(t || '')}</p><div class="pm">playmate?</div></div>`).join('')}</div>${f.sub ? `<p class="psub">${inline(f.sub)}</p>` : ''}</div>`;
      }},
    stats: {label: 'Numbers', fields: [['title', 'Title (optional)', 'text'], ['items', 'Numbers, one per line: number | label (3)', 'textarea'], ['bg', 'Background', 'select', {cream: 'Cream', blush: 'Blush', burgundy: 'Burgundy'}]],
      defaults: {title: '', items: '54 | wooden blocks\n162 | prompts, 3 levels\n1 | travel bag + blindfold', bg: 'cream'},
      render: f => `<div class="es-stats bg-${f.bg || 'cream'}">${f.title ? `<h3 class="disp">${inline(f.title)}</h3>` : ''}<div class="sg">${lines(f.items).slice(0, 3).map(([n, l]) => `<div><b class="disp">${esc(n)}</b><span>${esc(l || '')}</span></div>`).join('')}</div></div>`},
    statement: {label: 'Statement', fields: [['text', 'Text ([[highlight]])', 'textarea'], ['bg', 'Background', 'select', {cream: 'Cream', white: 'White', blush: 'Blush'}]],
      defaults: {text: 'Life-changing is a stretch.\n[[Friday-changing, definitely.]]', bg: 'cream'},
      render: f => `<div class="es-statement bg-${f.bg || 'cream'}"><p>${inline(f.text)}</p></div>`},
    diagram: {label: 'Diagram', images: [['photo', 'Product photo']], fields: [['title', 'Title', 'text'], ['callouts', 'Callouts, one per line: label | value (up to 6)', 'textarea']],
      defaults: {title: "what's in the box", callouts: 'wooden blocks | 54\nprompt cards | 162\nlevels | 3\nmystery blocks | 17 ?\ncard types | 6\nbag + blindfold | 1 + 1'},
      render(f, img) {
        const cs = lines(f.callouts).slice(0, 6), L = cs.filter((_, i) => i % 2 === 0), R = cs.filter((_, i) => i % 2 === 1);
        const col = (arr, side) => arr.map(([l, v]) => `<div class="cal ${side}"><span>${esc(l)}</span><i>${esc(v || '')}</i><b class="dot"></b></div>`).join('');
        return `<div class="es-diag grid"><h3 class="disp">${inline(f.title)}</h3><div class="drow"><div class="dside">${col(L, 'l')}</div>${pic(img('photo'), 'dframe', f.title)}<div class="dside">${col(R, 'r')}</div></div></div>`;
      }},
    steps: {label: 'Steps', fields: [['title', 'Title', 'text'], ['steps', 'Steps, one per line: title | text (up to 5)', 'textarea']],
      defaults: {title: 'how a round works', steps: 'pull a block | Any block. Gently. The tower is watching.\nread the card | Mild, spicy or wild. Every card is optional.\nyour move | Answer it, do it, or pass with a forfeit.\nit falls | Whoever knocks it over, their partner calls the shots.'},
      render: f => `<div class="es-steps"><h2 class="disp">${inline(f.title)}</h2><div class="slist">${lines(f.steps).slice(0, 5).map(([t, d], i) => `<div class="st"><div class="n ${i ? '' : 'on'}">${i + 1}</div><div class="card ${i ? '' : 'on'}"><b>${esc(t)}</b><span>${esc(d || '')}</span></div></div>`).join('')}</div></div>`},
    note: {label: 'Note', fields: [['eyebrow', 'Small label', 'text'], ['title', 'Title', 'text'], ['body', 'Letter (blank line = new paragraph)', 'textarea'], ['sig', 'Signature', 'text']],
      defaults: {eyebrow: 'Lab notes · from Bali', title: 'this week\nin the lab.', body: 'The new box samples landed. Lighter, cheaper to ship, and it finally closes with a proper click.\n\nTwo prompts didn\'t make the deck. One was too cheesy. One was too much. You\'ll never know which.', sig: 'Jordan x'},
      render: f => `<div class="es-note"><div class="paper"><div class="tape"></div><div class="eyebrow">${esc(f.eyebrow)}</div><h2 class="disp">${inline(f.title)}</h2>${paras(f.body)}<div class="sig">${esc(f.sig)}</div></div></div>`},
    polaroids: {label: 'Polaroids', images: [['p1', 'Photo 1'], ['p2', 'Photo 2'], ['p3', 'Photo 3']], fields: [['captions', 'Captions, one per line (1 to 3 photos)', 'textarea']],
      defaults: {captions: 'the lab, this week\nv3 finally fits'},
      render(f, img) {
        const caps = String(f.captions || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 3), n = Math.max(1, caps.length);
        const tilt = [[-2.5], [-4, 3], [-4, 2, -2]][n - 1];
        return `<div class="es-pols n${n}">${caps.map((c, i) => `<div class="pol" style="transform:rotate(${tilt[i]}deg)">${pic(img('p' + (i + 1)), 'sq', c)}<div class="cap">${esc(c)}</div></div>`).join('')}</div>`;
      }},
    product: {label: 'Product', images: [['photo', 'Product photo']], fields: [['name', 'Name', 'text'], ['blurb', 'Line', 'textarea'], ['price', 'Price', 'text'], ['sticker', 'Sticker (2 short lines)', 'textarea'], ['button', 'Button', 'text'], ['href', 'Link', 'link'], ['tone', 'Card colour', 'select', {burgundy: 'Burgundy', blush: 'Blush', white: 'White'}]],
      defaults: {name: "nude.\nstack'd", blurb: 'The stacking game that turns a quiet night in into a long one.', price: '£39.99', sticker: 'free UK\nover £49', button: 'play tonight', href: 'https://playmatelabs.com/products/nude-stacked', tone: 'burgundy'},
      render(f, img) {
        const st = String(f.sticker || '').split('\n').filter(Boolean);
        return `<div class="es-prod"><div class="pcard tone-${f.tone || 'burgundy'}">${st.length ? `<div class="burst"><svg viewBox="0 0 200 200"><polygon points="100,6 118,42 156,22 152,64 194,70 166,100 194,130 152,136 156,178 118,158 100,194 82,158 44,178 48,136 6,130 34,100 6,70 48,64 44,22 82,42"/></svg><span>${st.map(esc).join('<br>')}</span></div>` : ''}
          ${pic(img('photo'), 'pp', f.name)}<div class="tx"><h3 class="disp">${inline(f.name)}</h3><p>${inline(f.blurb)}</p>${f.price ? `<div class="price">${esc(f.price)}</div>` : ''}${pill(f.button, (f.tone || 'burgundy') === 'burgundy')}</div></div></div>`;
      }, link: f => f.href},
    cards: {label: 'Cards', images: [['c1', 'Card 1 image'], ['c2', 'Card 2 image'], ['c3', 'Card 3 image']], fields: [['title', 'Title', 'text'], ['items', 'Cards, one per line: label | title | line (2 or 3)', 'textarea'], ['href', 'Link', 'link']],
      defaults: {title: 'date night, sorted.', items: '01 · at home | 40 ideas at home | None of them Netflix.\n02 · questions | 155 questions | Pick one, ask it tonight.\n03 · under £10 | 36 cheap dates | Tested by actual couples.', href: 'https://playmatelabs.com/blogs/the-playmate-journal'},
      render(f, img) {
        const it = lines(f.items).slice(0, 3);
        return `<div class="es-cards n${it.length}"><h2 class="disp">${inline(f.title)}</h2><div class="g">${it.map(([l, t, d], i) => `<div class="c">${pic(img('c' + (i + 1)), 'ci', t)}<div class="ct"><small>${esc(l)}</small><b>${esc(t || '')}</b><span>${esc(d || '')}</span></div></div>`).join('')}</div></div>`;
      }, link: f => f.href},
    ticket: {label: 'Ticket', fields: [['eyebrow', 'Small label', 'text'], ['title', 'Title', 'text'], ['rows', 'Rows, one per line: label | value', 'textarea'], ['button', 'Button', 'text'], ['href', 'Link', 'link']],
      defaults: {eyebrow: "you're invited", title: 'no small talk\nsupper.', rows: 'when | Wednesday 10 February, 7pm\nwhere | Venue, London\nticket | £XX, three courses, one game', button: 'save my seat', href: 'https://playmatelabs.com'},
      render: f => `<div class="es-ticket"><div class="tk"><div class="eyebrow">${esc(f.eyebrow)}</div><h2 class="disp">${inline(f.title)}</h2><div class="rows">${lines(f.rows).map(([l, v]) => `<div><small>${esc(l)}</small><b>${esc(v || '')}</b></div>`).join('')}</div>${pill(f.button)}</div></div>`, link: f => f.href},
    countdown: {label: 'Countdown', fields: [['eyebrow', 'Small label', 'text'], ['date', 'Big date or number', 'text'], ['text', 'Line', 'textarea'], ['button', 'Button', 'text'], ['href', 'Link', 'link']],
      defaults: {eyebrow: 'last UK order for valentine\'s', date: 'wed 10 feb', text: 'Order by midnight for delivery before the weekend.', button: 'get it in time', href: 'https://playmatelabs.com'},
      render: f => `<div class="es-count"><div class="eyebrow">${esc(f.eyebrow)}</div><div class="disp date">${inline(f.date)}</div><p>${inline(f.text)}</p>${pill(f.button)}</div>`, link: f => f.href},
    compare: {label: 'Compare', images: [['a', 'Left image'], ['b', 'Right image']], fields: [['title', 'Title', 'text'], ['la', 'Left label', 'text'], ['lb', 'Right label', 'text'], ['text', 'Line', 'textarea']],
      defaults: {title: 'old box vs new box', la: 'the old one', lb: 'the new one', text: 'Lighter, cheaper to ship, and it closes with a proper click.'},
      render: (f, img) => `<div class="es-compare"><h2 class="disp">${inline(f.title)}</h2><div class="two"><div>${pic(img('a'), 'cp', f.la)}<span class="ctag">${esc(f.la)}</span></div><div class="vs">vs</div><div>${pic(img('b'), 'cp', f.lb)}<span class="ctag on">${esc(f.lb)}</span></div></div><p>${inline(f.text)}</p></div>`},
    question: {label: 'Question', fields: [['eyebrow', 'Small label', 'text'], ['q', 'Question', 'textarea']],
      defaults: {eyebrow: "tonight's question", q: "What's something you've always wanted to ask me, but never have?"},
      render: f => `<div class="es-q"><div class="eyebrow">${esc(f.eyebrow)}</div><p class="disp">${inline(f.q)}</p></div>`},
    review: {label: 'Review', fields: [['quote', 'Quote', 'textarea'], ['name', 'Name', 'text'], ['stars', 'Stars', 'select', {'5': '5', '4': '4'}]],
      defaults: {quote: '"We played until 1am on a Tuesday. On a Tuesday."', name: 'Sam & Alex', stars: '5'},
      render: f => `<div class="es-review"><div class="rc"><div class="stars">${'★'.repeat(+f.stars || 5)}</div><p>${inline(f.quote)}</p><b>${esc(f.name)}</b></div></div>`},
    vote: {label: 'Vote', fields: [['title', 'Title', 'text'], ['sub', 'Line', 'textarea'], ['options', 'Options, one per line: label | link (2 or 3)', 'textarea']],
      defaults: {title: 'you tell us. we make it.', sub: 'The next card pack is yours to pick.', options: 'Travel edition | https://playmatelabs.com\nParty edition | https://playmatelabs.com\nAfter dark | https://playmatelabs.com'},
      render: f => `<div class="es-vote"><h2 class="disp">${inline(f.title)}</h2><p>${inline(f.sub)}</p><div class="opts">${lines(f.options).slice(0, 3).map(([l]) => `<span class="es-pill light">${esc(l)}</span>`).join('')}</div></div>`,
      liveButtons: f => lines(f.options).slice(0, 3).map(([l, h]) => ({text: l, href: h}))},
    signoff: {label: 'Sign-off', fields: [['text', 'Closing lines', 'textarea'], ['sig', 'Signature', 'text']],
      defaults: {text: "Right, that's the sensible bit done.\nGo and lose a game.", sig: 'Jordan x'},
      render: f => `<div class="es-sign"><p>${inline(f.text)}</p><div class="sig">${esc(f.sig)}</div></div>`},
  };

  const CSS = `
.es *{box-sizing:border-box;margin:0}
.es{width:600px;font-family:Inter,-apple-system,'Helvetica Neue',Arial,sans-serif;color:${C.esp};-webkit-font-smoothing:antialiased}
.es>.sec{width:600px;position:relative;overflow:hidden;background:${C.cream}}
.es .disp{font-family:Jost,Futura,'Century Gothic',sans-serif;font-weight:800;letter-spacing:-.03em;line-height:.94;text-transform:lowercase}
.es .es-hl{background:${C.blush};color:${C.bur};padding:0 .12em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.es s{text-decoration-thickness:.09em}
.es .es-pill{display:inline-block;font-family:Jost,sans-serif;font-weight:700;font-size:16px;letter-spacing:.14em;text-transform:uppercase;background:${C.bur};color:${C.ivory};border:2px solid ${C.esp};border-radius:999px;padding:14px 36px;box-shadow:0 4px 0 ${C.esp}}
.es .es-pill.light{background:${C.ivory};color:${C.bur}}
.es .eyebrow{font-family:Jost,sans-serif;font-weight:700;letter-spacing:.18em;font-size:13px;text-transform:uppercase;color:${C.gold}}
.es .es-pic{overflow:hidden;position:relative;background:${C.blush2}}
.es .es-pic img{width:100%;height:100%;object-fit:cover;display:block}
.es .es-empty{display:grid;place-items:center;border:2px dashed ${C.bur}}
.es .es-empty span{font-size:13px;font-weight:600;color:${C.bur}}
.es .grid{background-image:linear-gradient(rgba(107,30,58,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(107,30,58,.09) 1px,transparent 1px);background-size:48px 48px}
.es .sig{font-family:Caveat,cursive;font-weight:700;font-size:52px;color:${C.bur}}
/* hero: text sits on the photo, no colour block */
.es .es-hero{height:860px;color:var(--tc)}
.es .es-hero.short{height:640px}
.es .es-hero .fill{position:absolute;inset:0}
.es .es-hero .hin{position:absolute;z-index:2;top:46px;left:24px;right:24px;text-align:center}
.es .es-hero.shadow .hin{text-shadow:0 2px 18px rgba(0,0,0,.35)}
.es .es-hero .logo{width:130px}
.es .es-hero .strike{font-size:58px;text-decoration:line-through;text-decoration-thickness:6px;opacity:.85;margin-top:34px}
.es .es-hero .big{font-size:96px;margin-top:2px}
.es .es-hero .sub{font-size:19px;line-height:1.4;margin:16px auto 24px;max-width:440px}
.es .es-hero .sub b{font-weight:700}
.es .es-hero .es-pill{box-shadow:0 4px 0 ${C.esp}}
.es .es-hero.stack{height:auto;padding-top:46px}
.es .es-hero.stack .hin{position:relative;top:auto;left:auto;right:auto;padding:0 24px 34px}
.es .es-hero.stack .below{height:520px}
.es .es-hero.stack.short .below{height:380px}
.es .hbg-cream{background:#F5EFE6}.es .hbg-ivory{background:#FAF7F2}.es .hbg-blush{background:#F2DDD8}.es .hbg-burgundy{background:#4A1228}
.es .es-strip{padding:13px 20px;text-align:center;font-family:Jost,sans-serif;font-weight:700;font-size:12px;letter-spacing:.2em;text-transform:uppercase}
.es .sbg-burgundy{background:#6B1E3A;color:#FAF7F2}.es .sbg-espresso{background:#2C1810;color:#F2DDD8}.es .sbg-blush{background:#E8C4BC;color:#6B1E3A}
.es .es-image{position:relative}
.es .es-image .full{width:600px}.es .shape-square .full{height:600px}.es .shape-tall .full{height:750px}.es .shape-wide .full{height:400px}
.es .es-image .icap{position:absolute;left:0;right:0;bottom:22px;text-align:center;font-family:Caveat,cursive;font-weight:700;font-size:44px;color:#FAF7F2;text-shadow:0 2px 14px rgba(0,0,0,.4)}
.es .es-split{display:grid;grid-template-columns:270px 1fr;gap:28px;align-items:center;padding:44px 36px}
.es .es-split.rev{grid-template-columns:1fr 270px}.es .es-split.rev .sp{order:2}
.es .es-split .sp{width:270px;height:338px;border-radius:20px;border:3px solid #2C1810;box-shadow:7px 7px 0 #6B1E3A}
.es .es-split h3{font-size:40px;margin:8px 0 12px}
.es .es-split p{font-size:16px;line-height:1.5;margin-bottom:18px}
.es .es-split.bg-burgundy{background:#4A1228;color:#FAF7F2}.es .es-split.bg-burgundy .sp{box-shadow:7px 7px 0 #E8C4BC}
.es .es-prompts{padding:50px 30px 54px;text-align:center;background:#F2DDD8}
.es .es-prompts h2{font-size:50px;margin-bottom:30px;color:#6B1E3A}
.es .es-prompts .fan{display:flex;justify-content:center;gap:0;padding:6px 0 24px}
.es .es-prompts .pc{width:168px;height:246px;background:#FAF7F2;border:3px solid #2C1810;border-radius:16px;padding:16px 14px;display:flex;flex-direction:column;text-align:left;margin:0 -8px;box-shadow:0 10px 18px rgba(44,24,16,.16)}
.es .es-prompts .fan .pc{margin:0 3px}
.es .es-prompts .pc:nth-child(2){z-index:2}
.es .es-prompts .lv{align-self:flex-start;font-family:Jost,sans-serif;font-weight:800;font-size:12px;letter-spacing:.14em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:#E8C4BC;color:#6B1E3A}
.es .es-prompts .lv-spicy .lv{background:#6B1E3A;color:#FAF7F2}.es .es-prompts .lv-wild .lv{background:#2C1810;color:#F2DDD8}
.es .es-prompts .pc p{font-family:Jost,sans-serif;font-weight:700;font-size:18px;line-height:1.2;margin-top:14px;flex:1;color:#2C1810}
.es .es-prompts .pm{font-family:Jost,sans-serif;font-weight:800;font-size:13px;color:#6B1E3A}
.es .es-prompts .psub{font-size:16px;margin-top:6px}
.es .es-stats{padding:40px 36px;text-align:center}
.es .es-stats h3{font-size:34px;margin-bottom:20px}
.es .es-stats .sg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.es .es-stats b{display:block;font-size:56px;color:#6B1E3A;line-height:1}
.es .es-stats span{display:block;font-size:14px;margin-top:6px}
.es .es-stats.bg-burgundy{background:#6B1E3A;color:#FAF7F2}.es .es-stats.bg-burgundy b{color:#F2DDD8}
/* statement */
.es .es-statement{padding:52px 56px 20px;text-align:center}
.es .es-statement p{font-family:Jost,sans-serif;font-weight:700;font-size:30px;line-height:1.3}
.es .bg-white{background:#fff}.es .bg-blush{background:${C.blush2}}
/* diagram */
.es .es-diag{padding:28px 20px 40px}
.es .es-diag h3{text-align:center;font-size:32px;margin-bottom:18px}
.es .es-diag .drow{display:grid;grid-template-columns:150px 1fr 150px;align-items:center;gap:6px}
.es .es-diag .dframe{height:520px;border-radius:20px;border:3px solid ${C.esp};box-shadow:8px 8px 0 ${C.bur}}
.es .es-diag .dside{display:grid;gap:86px}
.es .cal{font-family:Jost,sans-serif;font-weight:600;font-size:15px;letter-spacing:.04em;text-transform:uppercase;line-height:1.1;position:relative}
.es .cal span{display:block;max-width:120px}
.es .cal i{display:inline-block;font-style:normal;background:${C.blush};color:${C.bur};font-weight:800;font-size:24px;padding:2px 8px;margin-top:6px;letter-spacing:0;text-transform:none}
.es .cal.r{text-align:right;padding-left:10px}.es .cal.r span{margin-left:auto}
.es .cal .dot{position:absolute;top:50%;width:10px;height:10px;border-radius:50%;background:${C.esp}}
.es .cal.l .dot{right:-2px}.es .cal.r .dot{left:-2px}
/* steps */
.es .es-steps{padding:54px 56px 56px}
.es .es-steps h2{font-size:56px;text-align:center;margin-bottom:34px}
.es .es-steps .slist{display:grid;gap:22px;position:relative}
.es .es-steps .slist:before{content:"";position:absolute;left:26px;top:30px;bottom:30px;width:3px;background:${C.esp}}
.es .es-steps .st{display:grid;grid-template-columns:56px 1fr;gap:18px;align-items:center;position:relative}
.es .es-steps .n{width:54px;height:54px;border-radius:50%;border:3px solid ${C.esp};background:${C.ivory};display:grid;place-items:center;font-family:Jost,sans-serif;font-weight:800;font-size:26px;color:${C.bur};z-index:1}
.es .es-steps .n.on{background:${C.bur};color:${C.ivory}}
.es .es-steps .card{background:${C.ivory};border:3px solid ${C.esp};border-radius:18px;padding:18px 22px;box-shadow:6px 6px 0 ${C.esp}}
.es .es-steps .card.on{background:${C.blush2}}
.es .es-steps .card b{display:block;font-family:Jost,sans-serif;font-weight:800;font-size:26px;text-transform:lowercase;color:${C.bur}}
.es .es-steps .card span{font-size:17px;line-height:1.4}
/* note */
.es .es-note{padding:54px 44px 60px}
.es .es-note .paper{background:#fff;border-radius:3px;padding:54px 48px 44px;box-shadow:0 15px 30px rgba(44,24,16,.18);transform:rotate(-1.2deg);position:relative}
.es .es-note .tape{position:absolute;top:-18px;left:50%;width:150px;height:40px;margin-left:-75px;background:rgba(232,196,188,.8);transform:rotate(2deg)}
.es .es-note h2{font-size:50px;margin:10px 0 18px;color:${C.bur}}
.es .es-note p{font-size:18px;line-height:1.55;margin-bottom:14px}
/* polaroids */
.es .es-pols{padding:44px 20px 50px;display:flex;justify-content:center;gap:14px}
.es .es-pols .pol{background:#fffefb;padding:12px 12px 0;box-shadow:4px 10px 20px rgba(44,24,16,.22)}
.es .es-pols.n1 .pol{width:360px}.es .es-pols.n2 .pol{width:255px}.es .es-pols.n3 .pol{width:178px}
.es .es-pols .sq{aspect-ratio:1/1;width:100%}
.es .es-pols .cap{font-family:Caveat,cursive;font-size:28px;text-align:center;padding:10px 4px 14px;color:${C.esp};line-height:1.1}
.es .es-pols.n3 .cap{font-size:22px}
/* product */
.es .es-prod{padding:54px 50px 64px}
.es .pcard{border:3px solid ${C.esp};border-radius:24px;box-shadow:0 9px 0 ${C.esp};display:grid;grid-template-columns:210px 1fr;gap:26px;padding:26px;align-items:center;position:relative}
.es .tone-burgundy{background:${C.bur};color:${C.ivory}}.es .tone-blush{background:${C.blush2}}.es .tone-white{background:#fff}
.es .pcard .pp{width:210px;height:252px;border-radius:14px;border:3px solid ${C.esp}}
.es .pcard h3{font-size:42px}
.es .pcard p{font-size:16px;line-height:1.4;margin:10px 0 14px;opacity:.9}
.es .pcard .price{font-family:Jost,sans-serif;font-weight:800;font-size:34px;margin-bottom:16px}
.es .burst{position:absolute;top:-40px;right:-22px;width:112px;height:112px;z-index:2}
.es .burst svg{position:absolute;inset:0;fill:${C.blush};stroke:${C.esp};stroke-width:5}
.es .burst span{position:absolute;inset:0;display:grid;place-items:center;text-align:center;font-family:Jost,sans-serif;font-weight:800;font-size:15px;line-height:1.05;color:${C.bur}}
/* cards */
.es .es-cards{padding:50px 32px 56px}
.es .es-cards h2{font-size:48px;text-align:center;margin-bottom:26px}
.es .es-cards .g{display:grid;gap:14px}
.es .es-cards.n2 .g{grid-template-columns:1fr 1fr}.es .es-cards.n3 .g{grid-template-columns:1fr 1fr 1fr}
.es .es-cards .c{background:#fff;border:3px solid ${C.esp};border-radius:18px;overflow:hidden;box-shadow:5px 5px 0 ${C.esp}}
.es .es-cards .ci{aspect-ratio:4/5;width:100%}
.es .es-cards .ct{padding:12px 12px 14px}
.es .es-cards small{display:block;font-family:Jost,sans-serif;font-weight:700;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${C.gold};margin-bottom:4px}
.es .es-cards b{display:block;font-family:Jost,sans-serif;font-weight:800;font-size:19px;line-height:1.1;text-transform:lowercase;color:${C.bur}}
.es .es-cards span{display:block;font-size:13px;line-height:1.35;margin-top:4px}
/* ticket */
.es .es-ticket{padding:50px 44px 60px}
.es .es-ticket .tk{background:#fff;border:3px dashed ${C.bur};border-radius:24px;padding:36px 34px 38px;text-align:center;position:relative}
.es .es-ticket .tk:before,.es .es-ticket .tk:after{content:"";position:absolute;top:50%;width:34px;height:34px;margin-top:-17px;border-radius:50%;background:${C.cream};border:3px dashed ${C.bur}}
.es .es-ticket .tk:before{left:-19px}.es .es-ticket .tk:after{right:-19px}
.es .es-ticket h2{font-size:52px;color:${C.bur};margin:10px 0 22px}
.es .es-ticket .rows{display:grid;gap:0;margin-bottom:26px;text-align:left}
.es .es-ticket .rows div{display:grid;grid-template-columns:100px 1fr;gap:12px;padding:12px 4px;border-top:1px solid ${C.blush}}
.es .es-ticket small{font-family:Jost,sans-serif;font-weight:700;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:${C.gold};padding-top:3px}
.es .es-ticket b{font-size:17px;line-height:1.35;font-weight:600}
/* countdown */
.es .es-count{padding:50px 40px 54px;text-align:center;background:${C.blush2}}
.es .es-count .date{font-size:96px;color:${C.bur};margin:12px 0 14px}
.es .es-count p{font-size:18px;line-height:1.45;margin-bottom:24px}
/* compare */
.es .es-compare{padding:50px 32px 50px;text-align:center}
.es .es-compare h2{font-size:48px;margin-bottom:24px}
.es .es-compare .two{display:grid;grid-template-columns:1fr 46px 1fr;align-items:center}
.es .es-compare .cp{aspect-ratio:4/5;width:100%;border-radius:18px;border:3px solid ${C.esp}}
.es .es-compare .vs{font-family:Jost,sans-serif;font-weight:800;font-size:22px;color:${C.bur}}
.es .es-compare .ctag{display:inline-block;margin-top:12px;font-family:Jost,sans-serif;font-weight:700;font-size:15px;letter-spacing:.06em;text-transform:lowercase;background:${C.ivory};border:2px solid ${C.esp};border-radius:999px;padding:6px 14px}
.es .es-compare .ctag.on{background:${C.bur};color:${C.ivory}}
.es .es-compare p{font-size:18px;line-height:1.45;margin-top:22px}
/* question */
.es .es-q{padding:46px 50px 50px;text-align:center;background:${C.blush2}}
.es .es-q .eyebrow{color:${C.bur}}
.es .es-q p{font-size:34px;line-height:1.12;margin-top:14px;text-transform:none;letter-spacing:-.01em;font-weight:700}
/* review */
.es .es-review{padding:44px 50px}
.es .es-review .rc{background:#fff;border:3px solid ${C.esp};border-radius:22px;padding:28px 30px;box-shadow:6px 6px 0 ${C.bur}}
.es .es-review .stars{color:${C.bur};font-size:26px;letter-spacing:3px}
.es .es-review p{font-size:20px;line-height:1.45;margin:10px 0 12px}
.es .es-review b{font-family:Jost,sans-serif;font-weight:700;font-size:16px}
/* vote */
.es .es-vote{padding:50px 40px 56px;text-align:center}
.es .es-vote h2{font-size:50px;color:${C.bur}}
.es .es-vote p{font-size:18px;margin:14px 0 24px}
.es .es-vote .opts{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
/* sign-off */
.es .es-sign{padding:14px 56px 60px;text-align:center}
.es .es-sign p{font-size:20px;line-height:1.5}
.es .es-sign .sig{margin-top:6px}
`;
  const api = {types: T, css: CSS, colors: COLORS, palette: C,
    defaults: type => JSON.parse(JSON.stringify(T[type].defaults || {})),
    // ctx: {img: (section, slot) => {src,x,y,z}|null, logos: {burgundy, ivory, black}}
    render(section, ctx) { const t = T[section.type]; if (!t) return ''; return t.render(section.fields || {}, slot => ctx.img(section, slot), ctx); },
    linkOf(section) { const t = T[section.type]; return t && t.link ? t.link(section.fields || {}) : ''; },
    liveButtons(section) { const t = T[section.type]; return t && t.liveButtons ? t.liveButtons(section.fields || {}) : []; },
    altOf(section) { const f = section.fields || {}; return String(f.headline || f.title || f.text || f.q || f.name || f.quote || T[section.type].label).replace(/\[\[|\]\]|~~/g, '').replace(/\s+/g, ' ').slice(0, 150); }};
  if (typeof module !== 'undefined') module.exports = api; else root.EmailSections = api;
})(typeof window !== 'undefined' ? window : globalThis);
