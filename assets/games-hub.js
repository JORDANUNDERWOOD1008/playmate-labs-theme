/* The games room: one menu for every Playmate web game.
   The Sense Lab is open to everyone. Nude Stack'd unlocks by scanning the QR code in the box: the
   in-page scanner reads it, or arriving from the code itself (?k=) unlocks this device. Cuff'd is
   coming soon. Unlocks live in localStorage on this device only. */
(() => {
  const CFG = window.PMG || {};
  const KEYS = ['DAWB4Z'];               /* box codes printed in the QR (one per print run for now) */
  const UK = 'pmg:v1';
  const cards = document.getElementById('g-cards');
  if (!cards) return;

  let G = {};
  try { G = JSON.parse(localStorage.getItem(UK)) || {}; } catch (_) { G = {}; }
  const save = () => { try { localStorage.setItem(UK, JSON.stringify(G)); } catch (_) {} };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const keyOf = text => { const m = /[?&]k=([A-Za-z0-9]{4,16})/.exec(text || ''); return m && KEYS.includes(m[1].toUpperCase()) ? m[1].toUpperCase() : null; };

  /* arriving from the box's QR code unlocks this device */
  const qk = keyOf(location.search);
  if (qk) { G.nude = qk; save(); history.replaceState(null, '', location.pathname); }

  /* where they are in the Sense Lab, read from its own progress on this device */
  function senseState() {
    let S = null; try { S = JSON.parse(localStorage.getItem('pm5:v1')); } catch (_) {}
    if (!S || !S.mode || !S.done) return null;
    const n = Object.keys(S.done).filter(k => k.startsWith(S.mode + '-')).length;
    return {mode: S.mode, done: n};
  }
  const LABEL = {solo: 'for me', met: 'just met', duo: 'with someone'};

  const lock = '<svg class="g-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const qr = '<svg class="g-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/></svg>';

  function render() {
    const s = senseState(), open = !!G.nude;
    const senseBtn = !s ? 'start the five nights' : s.done >= 5 ? 'play it again' : `carry on: day ${s.done + 1}`;
    cards.innerHTML = `
      <article class="g-card g-feature">
        <p class="g-kick"><span>free</span><span>five nights</span></p>
        <h2 class="g-t">the sense lab.</h2>
        <p class="g-hand g-after">(the 5 day experience)</p>
        <p>Five nights, five senses, one small game a night. For couples, first dates, or just you.</p>
        ${s ? `<p class="g-prog"><span style="--p:${Math.min(5, s.done) / 5}"></span>${s.done >= 5 ? 'all five done' : `${s.done} of 5 done`}, ${esc(LABEL[s.mode] || '')}</p>` : ''}
        <div class="g-row"><a class="g-btn g-light" href="${esc(CFG.senseLab)}">${senseBtn}</a>${s ? '' : `<a class="g-link g-link-l" href="${esc(CFG.senseSignup)}">get it by email instead</a>`}</div>
      </article>
      <article class="g-card g-nude${open ? '' : ' is-locked'}">
        <p class="g-kick"><span>${open ? 'unlocked' : 'in the box'}</span><span>for two</span></p>
        <h2 class="g-t">nude stack'd.</h2>
        <p>The digital deck: the rules and every prompt card, Mild to Wild, in six languages.</p>
        ${open ? `<div class="g-row"><a class="g-btn g-light" href="${esc(CFG.nudePlay)}?k=${esc(G.nude)}">play</a></div>`
          : `<div class="g-lock">${lock}<p>Scan the QR code inside your box to unlock it on this phone.</p></div>
             <div class="g-row"><button type="button" class="g-btn g-light" data-scan>${qr} scan the code</button></div>
             <p class="g-small-p">Don't have it yet? <a class="g-link" href="${esc(CFG.nudeShop)}">get nude stack'd</a></p>`}
      </article>
      <article class="g-card g-soon">
        <p class="g-kick"><span>coming soon</span></p>
        <h2 class="g-t">cuff'd.</h2>
        <p>Something new for two. We're not saying much yet.</p>
      </article>`;
    const b = cards.querySelector('[data-scan]'); if (b) b.onclick = scan;
  }

  /* the in-page scanner: camera + jsQR (BarcodeDetector where the browser has it) */
  const dlg = document.getElementById('g-scan'), video = document.getElementById('g-video'), msg = document.getElementById('g-scan-msg');
  let stream = null, raf = 0, lib = null;
  const loadLib = () => lib || (lib = new Promise((ok, no) => { if (window.jsQR) return ok(); const s = document.createElement('script'); s.src = CFG.qrLib; s.onload = ok; s.onerror = no; document.head.appendChild(s); }));
  function stop() { cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; video.srcObject = null; }
  function close() { stop(); if (dlg.open) dlg.close(); }
  dlg.querySelector('[data-close]').onclick = close;
  dlg.addEventListener('close', stop);
  async function scan() {
    msg.textContent = 'Point the camera at the QR code in your box.';
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { msg.textContent = 'This browser can\'t open the camera. Point your phone\'s camera app at the code instead.'; return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}, audio: false});
      video.srcObject = stream; await video.play();
    } catch (_) { msg.textContent = 'Camera blocked. Allow it in your browser settings, or point your phone\'s camera app at the code.'; return; }
    const det = 'BarcodeDetector' in window ? new window.BarcodeDetector({formats: ['qr_code']}) : null;
    if (!det) { try { await loadLib(); } catch (_) { msg.textContent = 'Couldn\'t load the scanner. Point your phone\'s camera app at the code instead.'; return; } }
    const c = document.createElement('canvas'), x = c.getContext('2d', {willReadFrequently: true});
    let wrong = 0;
    const tick = async () => {
      if (!stream) return;
      let text = null;
      if (video.readyState >= 2) {
        try {
          if (det) { const r = await det.detect(video); text = r[0] && r[0].rawValue; }
          else {
            const w = c.width = Math.min(640, video.videoWidth), h = c.height = Math.round(video.videoHeight * w / video.videoWidth);
            x.drawImage(video, 0, 0, w, h); const r = window.jsQR(x.getImageData(0, 0, w, h).data, w, h, {inversionAttempts: 'dontInvert'}); text = r && r.data;
          }
        } catch (_) {}
      }
      if (text) {
        const k = keyOf(text);
        if (k) { G.nude = k; save(); try { navigator.vibrate && navigator.vibrate(30); } catch (_) {} msg.textContent = 'Unlocked. Opening the game…'; stop(); setTimeout(() => { close(); render(); location.href = `${CFG.nudePlay}?k=${k}`; }, 700); return; }
        if (!wrong++) msg.textContent = 'That\'s a different code. Look for the one in your Nude Stack\'d box.';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  render();
  addEventListener('pageshow', render);
})();
