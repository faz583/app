/* Stories tab. The text is copied exactly from Stories of the Prophets by Sayyed Abul Hasan Ali Nadwi
   (UK Islamic Academy). Not part of the daily topic: it is the same every day.
   Remembers the story and screen on this device. No audio in this tab. */
(function () {
  "use strict";
  const KEY = "stories-state";
  const SOURCE = "From Stories of the Prophets by Sayyed Abul Hasan Ali Nadwi (UK Islamic Academy)";
  const PICTURES = { nuh: ["stories/scenes/parts.js", "stories/scenes/player.js", "stories/scenes/nuh.js"] };
  const e = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let DATA = null, err = "", host = null, player = null, panel = "", loaded = {};
  let st = { story: 0, screen: 0, done: [], pics: false, reports: [] };
  try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && typeof s === "object") st = Object.assign(st, s); } catch (x) {}
  if (!Array.isArray(st.done)) st.done = [];
  if (!Array.isArray(st.reports)) st.reports = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (x) {} }

  /* References in the authenticity check become links: Quran S:A (a range links its first ayah),
     Bukhari N, Muslim N, and web addresses as given. */
  function linkRefs(text) {
    let h = e(text);
    h = h.replace(/https?:\/\/[^\s)]+/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
    h = h.replace(/\b(Bukhari|Muslim) (\d{1,5})\b/g, (m, b, n) => `<a href="https://sunnah.com/${b.toLowerCase()}:${n}" target="_blank" rel="noopener">${m}</a>`);
    h = h.replace(/(^|[\s(,])(\d{1,3}):(\d{1,3})((?: to \d{1,3})?)/g, (m, pre, s, a, rest) => `${pre}<a href="https://quran.com/${s}/${a}" target="_blank" rel="noopener">${s}:${a}${rest}</a>`);
    return h;
  }
  function story() { return DATA.stories[Math.min(Math.max(st.story, 0), DATA.stories.length - 1)]; }
  function hasPics(s) { return !!PICTURES[s.id]; }
  function loadScripts(list) {
    return list.reduce((p, src) => p.then(() => loaded[src] || (loaded[src] = new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = src; sc.onload = ok; sc.onerror = () => { loaded[src] = null; no(new Error(src)); }; document.head.appendChild(sc); }))), Promise.resolve());
  }
  function stopPicture() { if (player) { try { player.stop(); } catch (x) {} player = null; } }
  function css() {
    if (document.getElementById("stories-css")) return;
    const s = document.createElement("style"); s.id = "stories-css";
    s.textContent = `
.st-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.st-title{font-size:1.45rem;line-height:1.25;margin:0}
.st-src{font-size:.85rem;color:var(--muted)}
.st-screen{touch-action:pan-y;user-select:text;-webkit-user-select:text}
.st-text p{font-size:1.2rem;line-height:1.75;margin:0 0 .9em}
.st-text h2{font-size:1.2rem;margin:0 0 .6em;color:var(--green)}
.st-note{font-size:.9rem;color:var(--muted);border-top:1px solid var(--line);padding-top:8px}
.st-pic{border-radius:12px;overflow:hidden;background:#cfe3f0;aspect-ratio:380/300}
.st-pic.big{aspect-ratio:auto;height:min(68vh,560px)}
.st-cap{font-size:.85rem;color:var(--muted);margin-top:6px}
.st-plain{height:10px;border-radius:12px;background:linear-gradient(90deg,var(--green-soft),var(--gold-soft))}
.st-nav{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.st-nav button{min-height:60px;font-size:1.1rem;border-radius:14px}
.st-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.9rem;color:var(--muted)}
.st-list button{width:100%;text-align:left;display:flex;justify-content:space-between;gap:8px;border:1px solid var(--line);background:var(--card);border-radius:12px;padding:12px;font-weight:700;font-size:1.02rem}
.st-list button[aria-current="true"]{border:2px solid var(--green)}
.st-list .tick{color:var(--green)}
.st-auth summary{font-weight:700;cursor:pointer;font-size:1.05rem}
.st-auth h3{font-size:1rem;margin:12px 0 6px}
.st-auth li{margin-bottom:6px;line-height:1.55}
.st-report textarea{width:100%;min-height:90px;font:inherit;font-size:1rem;border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--card);color:var(--ink)}
`;
    document.head.appendChild(s);
  }

  function render(container) {
    host = container; css(); stopPicture();
    if (err) { host.innerHTML = `<section class="card"><p>${e(err)}</p><div class="row"><button class="btn primary" id="stRetry">Try again</button></div></section>`; host.querySelector("#stRetry").onclick = () => { err = ""; render(host); }; return; }
    if (!DATA) {
      host.innerHTML = `<section class="card"><p class="note">Loading the stories.</p></section>`;
      fetch("stories/stories.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(j => { DATA = j; if (host === container && document.body.contains(container)) render(container); }).catch(() => { err = "The stories could not be loaded. Check your connection, then tap Try again."; render(container); });
      return;
    }
    const s = story(), n = s.screens.length;
    st.screen = Math.min(Math.max(st.screen, 0), n - 1);
    const sc = s.screens[st.screen], last = st.screen === n - 1, si = DATA.stories.indexOf(s);
    if (last && !st.done.includes(s.id)) st.done.push(s.id);
    save();
    const picsOnly = st.pics && hasPics(s);
    let h = `<section class="card">
      <div class="st-top"><div class="eyebrow">Story ${si + 1} of ${DATA.stories.length}</div>
        <div class="row"><button class="btn small" id="stList">Story list</button>
        <label class="row note" style="gap:6px"><input type="checkbox" id="stPics" ${st.pics ? "checked" : ""}> Pictures only</label></div></div>
      <h1 class="st-title">${e(s.title)}</h1>
      <div class="st-src">${e(SOURCE)}, pages ${e(s.source.pages)}.</div>
    </section>`;
    if (panel === "list") h += listHTML();
    h += `<section class="card st-screen" id="stScreen">`;
    if (hasPics(s)) h += `<div><div class="st-pic${picsOnly ? " big" : ""}" id="stPic"></div><div class="st-cap" id="stCap"></div><div class="row" style="margin-top:6px"><button class="btn small" id="stReplay">Play again</button></div></div>`;
    else h += `<div class="st-plain" aria-hidden="true"></div>`;
    if (!picsOnly) {
      h += `<div class="st-text">${sc.heading ? `<h2>${e(sc.heading)}</h2>` : ""}${sc.paragraphs.map(p => `<p>${e(p)}</p>`).join("")}</div>`;
      if (sc.note) h += `<div class="st-note">${e(sc.note)}</div>`;
    } else if (st.pics && !hasPics(s)) h += `<p class="note">This story has no pictures yet.</p>`;
    h += `<div class="st-meta"><span>Screen ${st.screen + 1} of ${n}${sc.page ? ", book page " + sc.page : ""}</span><button class="btn small" id="stReport">Report</button></div>`;
    if (panel === "report") h += `<div class="st-report"><label class="note" for="stNote">Your note about this screen (kept on this device only)</label><textarea id="stNote"></textarea><div class="row" style="margin-top:6px"><button class="btn primary small" id="stSave">Save note</button><button class="btn small" id="stCancel">Cancel</button></div></div>`;
    h += `</section>`;
    h += `<div class="st-nav"><button class="btn" id="stPrev" ${si === 0 && st.screen === 0 ? "disabled" : ""}>Previous</button><button class="btn primary" id="stNext" ${last && si === DATA.stories.length - 1 ? "disabled" : ""}>Next</button></div>`;
    if (last) {
      h += `<section class="card st-auth"><details><summary>Authenticity check</summary>
        <p class="note">Status: ${e(s.status)}. Checked against the Quran (Saheeh International) and sahih hadith. Tap a reference to open it.</p>
        <h3>Authenticated</h3><ul>${s.authenticated.map(a => `<li>${linkRefs(a)}</li>`).join("")}</ul>
        <h3>Differences</h3><ol>${s.differences.map(a => `<li>${linkRefs(a)}</li>`).join("")}</ol>
        ${s.pending ? `<p class="note">${e(s.pending)}</p>` : ""}
      </details></section>
      <section class="card"><div class="row">
        ${si > 0 ? `<button class="btn" id="stPrevStory">Previous story</button>` : ""}
        ${si < DATA.stories.length - 1 ? `<button class="btn primary" id="stNextStory">Next story</button>` : `<p><b>You have finished all stories.</b></p>`}
      </div></section>`;
    }
    host.innerHTML = h;
    bind(s, sc, si, n);
    if (hasPics(s)) showPicture(s);
  }
  function listHTML() {
    return `<section class="card st-list"><h2>Story list</h2>${DATA.stories.map((x, i) => `<button data-story="${i}" aria-current="${i === st.story}"><span>${i + 1}. ${e(x.title)}</span><span class="tick">${st.done.includes(x.id) ? "&#10003; Finished" : ""}</span></button>`).join("")}
      <div class="row"><button class="btn" id="stExport">Export reports (${st.reports.length})</button><button class="btn small" id="stClose">Close list</button></div></section>`;
  }
  function go(storyIdx, screenIdx) {
    st.story = storyIdx; st.screen = screenIdx; panel = ""; save(); render(host);
    const top = host.querySelector("#stScreen"); if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: "start" });
  }
  function next() { const s = story(), si = DATA.stories.indexOf(s); if (st.screen < s.screens.length - 1) go(si, st.screen + 1); else if (si < DATA.stories.length - 1) go(si + 1, 0); }
  function prev() { const s = story(), si = DATA.stories.indexOf(s); if (st.screen > 0) go(si, st.screen - 1); else if (si > 0) go(si - 1, DATA.stories[si - 1].screens.length - 1); }
  function bind(s, sc, si, n) {
    const $ = q => host.querySelector(q);
    $("#stNext").onclick = next; $("#stPrev").onclick = prev;
    $("#stList").onclick = () => { panel = panel === "list" ? "" : "list"; render(host); };
    $("#stPics").onchange = ev => { st.pics = ev.target.checked; save(); render(host); };
    $("#stReport").onclick = () => { panel = panel === "report" ? "" : "report"; render(host); if (panel === "report") $("#stNote") && host.querySelector("#stNote").focus(); };
    if ($("#stSave")) $("#stSave").onclick = () => { const v = host.querySelector("#stNote").value.trim(); if (v) { st.reports.push({ story: s.id, title: s.title, screen: st.screen + 1, page: sc.page, note: v, date: new Date().toISOString().slice(0, 10) }); save(); tell("Note saved."); } panel = ""; render(host); };
    if ($("#stCancel")) $("#stCancel").onclick = () => { panel = ""; render(host); };
    if ($("#stClose")) $("#stClose").onclick = () => { panel = ""; render(host); };
    if ($("#stExport")) $("#stExport").onclick = () => {
      if (!st.reports.length) { tell("No reports saved yet."); return; }
      const txt = "Stories reports\n\n" + st.reports.map(r => `${r.title}, screen ${r.screen}${r.page ? ", book page " + r.page : ""} (${r.date}):\n${r.note}`).join("\n\n");
      if (typeof window.copyText === "function") window.copyText(txt); else { try { navigator.clipboard.writeText(txt).then(() => tell("Copied.")); } catch (x) { tell("Could not copy."); } }
    };
    host.querySelectorAll("[data-story]").forEach(b => b.onclick = () => go(+b.dataset.story, 0));
    if ($("#stNextStory")) $("#stNextStory").onclick = () => go(si + 1, 0);
    if ($("#stPrevStory")) $("#stPrevStory").onclick = () => go(si - 1, 0);
    if ($("#stReplay")) $("#stReplay").onclick = () => { if (player) player.play(); };
    /* swipe left for next, right for previous */
    const area = $("#stScreen"); let x0 = null, y0 = null;
    area.addEventListener("touchstart", ev => { const t = ev.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
    area.addEventListener("touchend", ev => { if (x0 === null) return; const t = ev.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); } }, { passive: true });
  }
  function showPicture(s) {
    const box = host.querySelector("#stPic"), cap = host.querySelector("#stCap"), want = st.story * 1000 + st.screen;
    loadScripts(PICTURES[s.id]).then(() => {
      if (!document.body.contains(box) || st.story * 1000 + st.screen !== want) return;
      const def = (window.STORY_SCENES[s.id] || [])[st.screen];
      if (!def) { cap.textContent = ""; return; }
      cap.textContent = def.cap.includes("Picture is illustrative") ? def.cap : def.cap.replace(/\.?$/, ".") + " Picture is illustrative.";
      stopPicture(); player = window.ScenePlayer.mount(box, def);
    }).catch(() => { cap.textContent = "The picture could not be loaded."; });
  }
  function tell(m) { if (typeof window.toast === "function") window.toast(m); }
  function leave() { stopPicture(); }
  window.Stories = { render, leave };
})();
