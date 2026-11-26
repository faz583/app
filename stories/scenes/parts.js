/* Reusable picture parts for the Stories tab. SVG and code only: no image files.
   Rules built in: no prophet, angel or honoured woman is ever drawn; animals and people have
   no eyes, nose or mouth. Every part returns plain SVG groups plus an update function. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  let uid = 0;
  const id = p => p + "-" + (++uid);
  function el(t, a, p) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  const lerp = (a, b, f) => a + (b - a) * f;
  const cl = v => Math.max(0, Math.min(1, v));
  const ease = f => f * f * (3 - 2 * f);
  const ph = (t, a, b) => ease(cl((t - a) / (b - a)));
  const rgb = c => "rgb(" + c.map(v => Math.round(v)).join(",") + ")";
  const mixc = (a, b, f) => a.map((v, i) => lerp(v, b[i], f));
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const f1 = v => (Math.round(v * 10) / 10).toString();

  /* Sky colours: [top, bottom] */
  const SKY = {
    day: [[127, 182, 224], [205, 230, 245]],
    dawn: [[86, 104, 158], [247, 200, 150]],
    dusk: [[66, 64, 112], [238, 152, 112]],
    night: [[10, 16, 38], [36, 48, 84]],
    storm: [[48, 58, 72], [98, 112, 128]],
    drought: [[196, 172, 118], [246, 226, 176]],
    clear: [[110, 170, 220], [244, 222, 176]]
  };
  function skyMix(list) { /* list of [preset, weight] */
    let top = [0, 0, 0], bot = [0, 0, 0], w = 0;
    for (const [k, v] of list) { if (v <= 0) continue; top = top.map((x, i) => x + SKY[k][0][i] * v); bot = bot.map((x, i) => x + SKY[k][1][i] * v); w += v; }
    if (!w) return SKY.day;
    return [top.map(x => x / w), bot.map(x => x / w)];
  }
  function sky(svg, defs) {
    const gid = id("sky");
    const lg = el("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    const s1 = el("stop", { offset: 0 }, lg), s2 = el("stop", { offset: 1 }, lg);
    el("rect", { x: -400, y: -300, width: 1200, height: 900, fill: "url(#" + gid + ")" }, svg);
    return { set(c) { s1.setAttribute("stop-color", rgb(c[0])); s2.setAttribute("stop-color", rgb(c[1])); } };
  }
  function sun(g, x, y, r, color) {
    const s = el("g", {}, g);
    const glow = el("circle", { cx: x, cy: y, r: r * 2.2, fill: color || "#F6D27A", opacity: 0.18 }, s);
    el("circle", { cx: x, cy: y, r: r, fill: color || "#F6D27A" }, s);
    const rays = el("g", { stroke: color || "#F6D27A", "stroke-width": 2, "stroke-linecap": "round" }, s);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; el("line", { x1: x + Math.cos(a) * (r + 6), y1: y + Math.sin(a) * (r + 6), x2: x + Math.cos(a) * (r + 13), y2: y + Math.sin(a) * (r + 13) }, rays); }
    return { g: s, update(t, o) { rays.setAttribute("transform", "rotate(" + f1(t * 6) + "," + x + "," + y + ")"); glow.setAttribute("r", f1(r * (2.1 + 0.15 * Math.sin(t * 1.3)))); s.setAttribute("opacity", o === undefined ? 1 : f1(o)); }, move(nx, ny) { s.setAttribute("transform", "translate(" + f1(nx - x) + "," + f1(ny - y) + ")"); } };
  }
  function moon(g, x, y, r) {
    const s = el("g", {}, g);
    el("circle", { cx: x, cy: y, r: r * 2, fill: "#E8EEF8", opacity: 0.12 }, s);
    el("circle", { cx: x, cy: y, r: r, fill: "#EEF2F7" }, s);
    el("circle", { cx: x + r * 0.45, cy: y - r * 0.2, r: r * 0.92, fill: "#1A2442", opacity: 0.0 }, s);
    return { g: s, update(t, o) { s.setAttribute("opacity", o === undefined ? 1 : f1(o)); } };
  }
  function stars(g, n, seed, area) {
    const r = rng(seed || 7), s = el("g", {}, g), a = area || [-20, -20, 420, 160], list = [];
    for (let i = 0; i < n; i++) list.push({ e: el("circle", { cx: f1(a[0] + r() * (a[2] - a[0])), cy: f1(a[1] + r() * (a[3] - a[1])), r: f1(0.5 + r() * 1.1), fill: "#F4F6FF" }, s), p: r() * 6, sp: 0.8 + r() * 2 });
    return { g: s, update(t, o) { s.setAttribute("opacity", f1(o === undefined ? 1 : o)); for (const x of list) x.e.setAttribute("opacity", f1(0.45 + 0.55 * Math.abs(Math.sin(t * x.sp + x.p)))); } };
  }
  function cloud(g, cx, cy, s) {
    const c = el("g", {}, g);
    [[0, 0, 34, 12], [-24, 4, 24, 9], [26, 4, 26, 9], [-6, -8, 20, 10]].forEach(([dx, dy, rx, ry]) => el("ellipse", { cx: cx + dx * s, cy: cy + dy * s, rx: rx * s, ry: ry * s }, c));
    return c;
  }
  function clouds(g, list, wrap) {
    const s = el("g", {}, g), cs = list.map(([x, y, k, sp]) => ({ e: cloud(s, 0, 0, k), x, y, sp: sp || 4 }));
    const w = wrap || 520;
    return { g: s, update(t, color, o) { s.setAttribute("fill", color); s.setAttribute("opacity", f1(o === undefined ? 1 : o)); for (const c of cs) { const x = ((c.x + t * c.sp + 80) % w + w) % w - 80; c.e.setAttribute("transform", "translate(" + f1(x) + "," + c.y + ")"); } } };
  }
  /* Mountain range: peaks [[x, height, halfWidth]] standing on baseY */
  function mountains(g, baseY, peaks, color, snow) {
    const s = el("g", { fill: color }, g);
    for (const [x, h, w] of peaks) {
      el("path", { d: "M" + (x - w) + " " + baseY + " L" + (x - w * 0.25) + " " + (baseY - h * 0.75) + " L" + x + " " + (baseY - h) + " L" + (x + w * 0.3) + " " + (baseY - h * 0.7) + " L" + (x + w) + " " + baseY + " Z" }, s);
      if (snow) el("path", { d: "M" + (x - w * 0.12) + " " + (baseY - h * 0.88) + " L" + x + " " + (baseY - h) + " L" + (x + w * 0.1) + " " + (baseY - h * 0.9) + " Z", fill: snow }, s);
    }
    return s;
  }
  function hills(g, baseY, seed, color, amp, step) {
    const r = rng(seed || 3); let d = "M-200 400 L-200 " + baseY;
    for (let x = -200; x <= 600; x += (step || 40)) d += " Q" + (x + 20) + " " + f1(baseY - amp * r()) + " " + (x + 40) + " " + f1(baseY - amp * 0.4 * r());
    d += " L600 400 Z";
    return el("path", { d, fill: color }, g);
  }
  function ground(g, y, color) { return el("rect", { x: -300, y, width: 1000, height: 400, fill: color }, g); }
  /* Crops in rows; update(t, wind, dry 0..1) */
  function field(g, x, y, w, rows, seed) {
    const s = el("g", {}, g), r = rng(seed || 11), stalks = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < w / 6; i++) {
      const sx = x + i * 6 + r() * 3, sy = y + j * 5, h = 7 + r() * 4;
      stalks.push({ e: el("path", { d: "M" + f1(sx) + " " + sy + " q1 " + f1(-h / 2) + " 0 " + f1(-h), stroke: "#6E9B45", "stroke-width": 1.4, fill: "none", "stroke-linecap": "round" }, s), sx, sy, p: r() * 6 });
    }
    return { g: s, update(t, wind, dry) { const c = rgb(mixc([110, 155, 69], [176, 150, 92], dry || 0)); for (const k of stalks) { k.e.setAttribute("stroke", c); k.e.setAttribute("transform", "rotate(" + f1(Math.sin(t * 2 + k.p) * (3 + (wind || 0) * 10) + (dry || 0) * 18) + "," + f1(k.sx) + "," + k.sy + ")"); } } };
  }
  function tree(g, x, y, s, palm) {
    const t = el("g", {}, g);
    if (palm) {
      el("path", { d: "M" + x + " " + y + " Q" + (x + 4 * s) + " " + (y - 20 * s) + " " + (x + 2 * s) + " " + (y - 40 * s), stroke: "#7A5A36", "stroke-width": 3.2 * s, fill: "none" }, t);
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55; el("path", { d: "M" + (x + 2 * s) + " " + (y - 40 * s) + " q" + f1(Math.cos(a) * 10 * s) + " " + f1(Math.sin(a) * 10 * s - 4 * s) + " " + f1(Math.cos(a) * 20 * s) + " " + f1(Math.sin(a) * 12 * s + 6 * s), stroke: "#4E8A3E", "stroke-width": 3 * s, fill: "none", "stroke-linecap": "round" }, t); }
    } else {
      el("rect", { x: x - 2.5 * s, y: y - 26 * s, width: 5 * s, height: 26 * s, fill: "#6B4A2B" }, t);
      [[0, -34, 13], [-9, -28, 10], [9, -28, 10], [0, -44, 9]].forEach(([dx, dy, r]) => el("circle", { cx: x + dx * s, cy: y + dy * s, r: r * s, fill: "#4E8A3E" }, t));
    }
    const leafs = t.querySelectorAll("circle, path");
    return { g: t, x, y, update(tm, wind, dry) { t.setAttribute("transform", "rotate(" + f1(Math.sin(tm * 1.4 + x) * 1.5 + (wind || 0) * (Math.sin(tm * 6 + x) * 5 - 7)) + "," + x + "," + y + ")"); if (dry !== undefined) { const c = rgb(mixc([78, 138, 62], [150, 130, 70], dry)); leafs.forEach(l => { if (l.tagName === "circle") l.setAttribute("fill", c); }); } } };
  }
  /* Flat roofed mud house; returns lamp element so a scene can light it */
  function house(g, x, y, w, h, color) {
    const s = el("g", {}, g), c = color || "#C9A27A";
    el("rect", { x, y: y - h, width: w, height: h, fill: c }, s);
    el("rect", { x: x - 2, y: y - h - 3, width: w + 4, height: 4, fill: "#8C6A4A" }, s);
    el("rect", { x: x + w * 0.38, y: y - h * 0.55, width: w * 0.24, height: h * 0.55, fill: "#5A3E28", rx: 1.5 }, s);
    const lamp = el("rect", { x: x + w * 0.1, y: y - h * 0.75, width: w * 0.18, height: h * 0.2, fill: "#3A2A1C", rx: 1 }, s);
    return { g: s, lamp, light(o) { lamp.setAttribute("fill", rgb(mixc([58, 42, 28], [250, 214, 130], o))); } };
  }
  /* Plain stone pillar on a plinth (the statues and idols of the text), never with a face */
  function pillar(g, x, y, h, color) {
    const s = el("g", {}, g), c = color || "#9A958C";
    el("rect", { x: x - 9, y: y - 6, width: 18, height: 6, fill: "#7D776E" }, s);
    el("rect", { x: x - 6, y: y - 6 - h, width: 12, height: h, rx: 5, fill: c }, s);
    el("ellipse", { cx: x, cy: y - 6 - h, rx: 6.5, ry: 6, fill: c }, s);
    return s;
  }
  /* Simple person with NO face: round head, robe, legs and arms. update(t, walking, armsUp) */
  function person(g, x, y, opt) {
    const o = opt || {}, s = o.s || 1, c = o.color || "#6F7F8C", skin = o.skin || "#B98C68";
    const p = el("g", {}, g), body = el("g", {}, p);
    const legs = [el("rect", { x: -2.6, y: -9, width: 2.4, height: 9, rx: 1, fill: "#4A4038" }, body), el("rect", { x: 0.4, y: -9, width: 2.4, height: 9, rx: 1, fill: "#4A4038" }, body)];
    const upper = el("g", {}, body);
    el("path", { d: "M-5 -8 L-3.5 -24 L3.5 -24 L5 -8 Z", fill: c }, upper);
    const arms = [el("rect", { x: -5.5, y: -23, width: 2, height: 10, rx: 1, fill: c }, upper), el("rect", { x: 3.5, y: -23, width: 2, height: 10, rx: 1, fill: c }, upper)];
    el("circle", { cx: 0, cy: -28, r: 4.2, fill: skin }, upper);
    if (o.headcloth) el("path", { d: "M-4.6 -28 Q0 -35 4.6 -28 L4.6 -26 L-4.6 -26 Z", fill: o.headcloth }, upper);
    const st = { x, y, s, dir: 1 };
    /* lean: small sway of the whole figure; bow: bend forward at the waist (degrees) */
    function draw(t, walking, armsUp, lean, bow) {
      const ph2 = t * 9 + x;
      p.setAttribute("transform", "translate(" + f1(st.x) + "," + f1(st.y - (walking ? Math.abs(Math.sin(ph2)) * 0.8 : 0)) + ") scale(" + f1(st.s * st.dir) + "," + f1(st.s) + ") rotate(" + f1(lean || 0) + ")");
      upper.setAttribute("transform", "rotate(" + f1(bow || 0) + ",0,-9)");
      legs[0].setAttribute("transform", "rotate(" + f1(walking ? Math.sin(ph2) * 22 : 0) + ",-1.4,-9)");
      legs[1].setAttribute("transform", "rotate(" + f1(walking ? -Math.sin(ph2) * 22 : 0) + ",1.6,-9)");
      const up = armsUp || 0;
      arms[0].setAttribute("transform", "rotate(" + f1(walking ? -Math.sin(ph2) * 18 : 0 + up * 150) + ",-4.5,-22)");
      arms[1].setAttribute("transform", "rotate(" + f1(walking ? Math.sin(ph2) * 18 : 0 - up * 150) + ",4.5,-22)");
    }
    draw(0);
    return { g: p, st, draw };
  }
  function crowd(g, list, opt) { return list.map(([x, y, k, c]) => person(g, x, y, Object.assign({}, opt || {}, { s: k || 1, color: c || (opt && opt.color) }))); }

  /* Animals: simple shapes with NO eyes, nose or mouth. */
  function legs(g, list, c) { return list.map(([x, y, w, h]) => { const lg = el("g", {}, g); el("rect", { x, y, width: w, height: h, rx: 1.2, fill: c }, lg); return { g: lg, px: x + w / 2, py: y }; }); }
  const ANIMALS = {
    elephant(g) { const c = "#8E9AA6", d = "#76838F"; const T = el("path", { d: "M-17 -20 Q-23 -14 -21 -7", stroke: c, "stroke-width": 2, fill: "none", "stroke-linecap": "round" }, g); const L = legs(g, [[-13, -10, 5, 10], [-7, -10, 5, 10], [5, -10, 5, 10], [11, -10, 5, 10]], c); el("ellipse", { cx: 0, cy: -18, rx: 18, ry: 12, fill: c }, g); const H = el("g", {}, g); el("circle", { cx: 16, cy: -24, r: 9, fill: c }, H); el("ellipse", { cx: 11, cy: -24, rx: 5, ry: 7, fill: d }, H); el("path", { d: "M23 -21 Q31 -13 26 -5", stroke: c, "stroke-width": 4, fill: "none", "stroke-linecap": "round" }, H); return { L, H, hp: [12, -22], T, tp: [-17, -20] }; },
    giraffe(g) { const c = "#E3B451", s = "#B07A30"; const T = el("path", { d: "M-13 -30 L-17 -20", stroke: c, "stroke-width": 1.5, "stroke-linecap": "round" }, g); const L = legs(g, [[-11, -24, 3, 24], [-6, -24, 3, 24], [5, -24, 3, 24], [10, -24, 3, 24]], c); el("ellipse", { cx: 0, cy: -29, rx: 14, ry: 8, fill: c }, g); [[-6, -30], [2, -27], [6, -32], [-1, -33]].forEach(([x, y]) => el("circle", { cx: x, cy: y, r: 2.2, fill: s }, g)); const H = el("g", {}, g); el("path", { d: "M7 -33 L17 -58 L23 -56 L14 -29 Z", fill: c }, H); el("circle", { cx: 15, cy: -46, r: 2, fill: s }, H); el("ellipse", { cx: 23, cy: -60, rx: 7, ry: 4, fill: c }, H); el("line", { x1: 20, y1: -63, x2: 19, y2: -68, stroke: s, "stroke-width": 1.5 }, H); el("line", { x1: 24, y1: -63, x2: 24, y2: -68, stroke: s, "stroke-width": 1.5 }, H); return { L, H, hp: [10, -32], T, tp: [-13, -30] }; },
    camel(g) { const c = "#C9A064"; const T = el("path", { d: "M-14 -26 L-17 -16", stroke: c, "stroke-width": 1.5, "stroke-linecap": "round" }, g); const L = legs(g, [[-10, -20, 3, 20], [-5, -20, 3, 20], [5, -20, 3, 20], [10, -20, 3, 20]], c); el("ellipse", { cx: 0, cy: -25, rx: 15, ry: 8, fill: c }, g); el("ellipse", { cx: -2, cy: -32, rx: 7, ry: 6, fill: c }, g); const H = el("g", {}, g); el("path", { d: "M10 -28 Q20 -32 18 -44 L23 -45 Q26 -30 14 -23 Z", fill: c }, H); el("ellipse", { cx: 24, cy: -45, rx: 6, ry: 3.5, fill: c }, H); return { L, H, hp: [12, -27], T, tp: [-14, -26] }; },
    sheep(g) { const d = "#4A4A4A"; const L = legs(g, [[-8, -8, 3, 8], [-3, -8, 3, 8], [3, -8, 3, 8], [7, -8, 3, 8]], d); [[-7, -15], [0, -18], [7, -15], [-3, -12], [4, -12]].forEach(([x, y]) => el("circle", { cx: x, cy: y, r: 7, fill: "#F2EEE6" }, g)); const H = el("g", {}, g); el("ellipse", { cx: 13, cy: -17, rx: 5, ry: 4, fill: d }, H); el("ellipse", { cx: 11, cy: -20, rx: 2.5, ry: 1.5, fill: d }, H); return { L, H, hp: [10, -17], T: null }; },
    lion(g) { const c = "#D9A441", m = "#A86A26"; const T = el("path", { d: "M-14 -16 Q-24 -18 -24 -9", stroke: c, "stroke-width": 1.8, fill: "none", "stroke-linecap": "round" }, g); const L = legs(g, [[-11, -10, 3.4, 10], [-6, -10, 3.4, 10], [5, -10, 3.4, 10], [10, -10, 3.4, 10]], c); el("ellipse", { cx: 0, cy: -15, rx: 15, ry: 7.5, fill: c }, g); const H = el("g", {}, g); el("circle", { cx: 15, cy: -20, r: 8.5, fill: m }, H); el("circle", { cx: 17, cy: -19, r: 5, fill: c }, H); return { L, H, hp: [12, -18], T, tp: [-14, -16] }; },
    horse(g) { const c = "#8A5A3A", d = "#5C3A24"; const T = el("path", { d: "M-15 -24 Q-21 -18 -19 -9", stroke: d, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, g); const L = legs(g, [[-11, -18, 3, 18], [-6, -18, 3, 18], [5, -18, 3, 18], [10, -18, 3, 18]], c); el("ellipse", { cx: 0, cy: -22, rx: 15, ry: 7, fill: c }, g); const H = el("g", {}, g); el("path", { d: "M9 -26 L17 -38 L23 -36 L15 -22 Z", fill: c }, H); el("path", { d: "M17 -38 L27 -33 L25 -30 L19 -32 Z", fill: c }, H); el("path", { d: "M10 -27 L16 -37", stroke: d, "stroke-width": 2.5 }, H); return { L, H, hp: [11, -24], T, tp: [-15, -24] }; }
  };
  function animal(kind, g) {
    const a = el("g", {}, g);
    const o = ANIMALS[kind](a);
    o.g = a;
    o.draw = function (x, y, s, t, walking, k, dir) {
      const ph2 = t * 11 + (k || 0);
      a.setAttribute("transform", "translate(" + f1(x) + "," + f1(y - (walking ? Math.abs(Math.sin(ph2)) * 1.3 : 0)) + ") scale(" + f1(s * (dir || 1)) + "," + f1(s) + ")");
      o.L.forEach((l, i) => { const sg = (i === 0 || i === 3) ? 1 : -1; l.g.setAttribute("transform", "rotate(" + f1(walking ? sg * Math.sin(ph2) * 20 : 0) + "," + l.px + "," + l.py + ")"); });
      o.H.setAttribute("transform", "rotate(" + f1(walking ? Math.sin(ph2 * 0.5) * 4 : Math.sin(t * 0.8 + (k || 0)) * 2) + "," + o.hp[0] + "," + o.hp[1] + ")");
      if (o.T) o.T.setAttribute("transform", "rotate(" + f1(Math.sin(t * 4 + (k || 0)) * 12) + "," + o.tp[0] + "," + o.tp[1] + ")");
    };
    return o;
  }
  function bird(g, color) {
    const b = el("g", {}, g);
    el("path", { d: "M-7 0 Q-3.5 -5 0 0 Q3.5 -5 7 0", stroke: color || "#2E3440", "stroke-width": 1.6, fill: "none", "stroke-linecap": "round" }, b);
    return { g: b, draw(x, y, s, t, k) { b.setAttribute("transform", "translate(" + f1(x) + "," + f1(y) + ") scale(" + f1(s) + "," + f1(s * (0.45 + 0.55 * Math.abs(Math.sin(t * 9 + (k || 0))))) + ")"); } };
  }

  /* The Ark. set(progress 0..1) shows it being built in stages; complete at 1. Centre about (225, 214). */
  function ark(g) {
    const a = el("g", {}, g);
    const ribs = el("g", { stroke: "#7B4A22", "stroke-width": 2.2, "stroke-linecap": "round", fill: "none" }, a);
    el("path", { d: "M146 229 Q225 238 304 229", stroke: "#5E3818", "stroke-width": 3 }, ribs);
    for (let i = 0; i < 9; i++) { const x = 156 + i * 17; el("path", { d: "M" + x + " " + (230 + Math.sin(i / 8 * Math.PI) * 4) + " Q" + (x + (x < 225 ? -6 : 6)) + " 214 " + (x + (x < 225 ? -10 : 10)) + " 197" }, ribs); }
    const hull = el("g", {}, a);
    el("path", { d: "M138 197 Q225 205 312 197 L296 229 Q225 238 154 229 Z", fill: "#7B4A22" }, hull);
    el("path", { d: "M141 197 Q225 205 309 197 L305 206 Q225 214 145 206 Z", fill: "#9A6332" }, hull);
    const planks = el("g", { stroke: "#5E3818", "stroke-width": 0.8, fill: "none" }, hull);
    [[147, 211, 303], [151, 218, 299], [154, 224, 296]].forEach(([x1, y, x2]) => el("path", { d: "M" + x1 + " " + y + " Q225 " + (y + 8) + " " + x2 + " " + y }, planks));
    const pegs = el("g", { fill: "#2E1E10" }, hull);
    [165, 195, 225, 255, 285].forEach((x, i) => el("circle", { cx: x, cy: 214 + (i === 2 ? 3 : i === 1 || i === 3 ? 2 : 0), r: 1.1 }, pegs));
    const cabin = el("g", {}, a);
    el("rect", { x: 172, y: 167, width: 112, height: 31, fill: "#A8773F" }, cabin);
    const cl2 = el("g", { stroke: "#8A5E2C", "stroke-width": 0.8 }, cabin);
    [175, 183, 191].forEach(y => el("line", { x1: 172, y1: y, x2: 284, y2: y }, cl2));
    el("rect", { x: 185, y: 177, width: 18, height: 21, rx: 1, fill: "#2E1E10" }, cabin);
    const wins = el("g", { fill: "#F5D58A" }, cabin);
    [214, 236, 258].forEach(x => el("rect", { x, y: 177, width: 11, height: 8, rx: 1 }, wins));
    const roof = el("g", {}, a);
    el("path", { d: "M162 168 L228 144 L294 168 L288 171 L228 150 L168 171 Z", fill: "#5E3A1A" }, roof);
    el("path", { d: "M168 171 L228 150 L288 171 Z", fill: "#7A4E25" }, roof);
    const ramp = el("line", { x1: 194, y1: 199, x2: 140, y2: 228, stroke: "#5E3818", "stroke-width": 4, "stroke-linecap": "round" }, a);
    function set(p) {
      ribs.setAttribute("opacity", f1(cl(p * 4) * (1 - ph(p, 0.45, 0.6))));
      hull.setAttribute("opacity", f1(ph(p, 0.25, 0.55)));
      planks.setAttribute("opacity", f1(ph(p, 0.4, 0.6)));
      cabin.setAttribute("opacity", f1(ph(p, 0.6, 0.8)));
      roof.setAttribute("opacity", f1(ph(p, 0.8, 0.95)));
      ramp.setAttribute("opacity", f1(ph(p, 0.95, 1)));
    }
    set(1);
    return { g: a, set, ramp, wins, rampOpen(f) { ramp.setAttribute("x2", f1(lerp(194, 140, f))); ramp.setAttribute("y2", f1(lerp(178, 228, f))); }, place(dx, dy, rot) { a.setAttribute("transform", "translate(" + f1(dx) + "," + f1(dy) + ") rotate(" + f1(rot || 0) + ",225,214)"); } };
  }
  /* Tools that move by themselves while the Ark is built: no person is drawn. */
  function hammer(g, x, y) {
    const h = el("g", {}, g);
    el("rect", { x: -1.2, y: -2, width: 2.4, height: 16, rx: 1, fill: "#8A5E2C" }, h);
    el("rect", { x: -5, y: -5, width: 10, height: 5, rx: 1, fill: "#4C4F55" }, h);
    return { g: h, update(t, on) { const a = on ? -40 + 45 * Math.max(0, Math.sin(t * 7)) : -20; h.setAttribute("transform", "translate(" + x + "," + y + ") rotate(" + f1(a) + ",0,14)"); } };
  }
  function saw(g, x, y) {
    const s = el("g", {}, g);
    el("path", { d: "M0 0 L26 0 L24 5 L0 5 Z", fill: "#AEB4BA" }, s);
    el("path", { d: "M0 5 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2", stroke: "#8D9399", fill: "none", "stroke-width": 0.8 }, s);
    el("rect", { x: -8, y: -2, width: 9, height: 8, rx: 2, fill: "#8A5E2C" }, s);
    return { g: s, update(t, on) { s.setAttribute("transform", "translate(" + f1(x + (on ? Math.sin(t * 8) * 6 : 0)) + "," + y + ") rotate(-8)"); } };
  }
  function planks(g, x, y, n) { const s = el("g", {}, g); for (let i = 0; i < n; i++) el("rect", { x: x + (i % 2) * 3, y: y - i * 3.2, width: 38, height: 3, rx: 0.8, fill: i % 2 ? "#A8773F" : "#9A6332", stroke: "#6E4A24", "stroke-width": 0.4 }, s); return s; }
  function chips(g, x, y, n, seed) {
    const r = rng(seed || 5), s = el("g", { fill: "#D8B47A" }, g), list = [];
    for (let i = 0; i < n; i++) list.push({ e: el("rect", { width: 1.6, height: 1, x: 0, y: 0 }, s), vx: (r() - 0.5) * 30, vy: -10 - r() * 18, p: r() });
    return { g: s, update(t, on) { s.setAttribute("opacity", on ? 1 : 0); for (const c of list) { const k = (t * 0.9 + c.p) % 1; c.e.setAttribute("transform", "translate(" + f1(x + c.vx * k) + "," + f1(y + c.vy * k + 40 * k * k) + ")"); } } };
  }

  /* Water: three wave layers and foam. update(top, amp, t) */
  function wave(top, phase, amp, len) {
    let d = "M-260 460 L-260 " + f1(top), c = "";
    for (let x = -260; x <= 640; x += 8) { const y = top + amp * Math.sin((x + phase) / len) + amp * 0.35 * Math.sin((x * 1.7 + phase * 0.6) / len); d += " L" + x + " " + f1(y); c += (c ? " L" : "M") + x + " " + f1(y + 1); }
    return [d + " L640 460 Z", c];
  }
  function water(g, colors) {
    const k = colors || ["#3A7DAE", "#2C6795", "#1F4E73"];
    const back = el("path", { fill: k[0] }, g), mid = el("path", { fill: k[1] }, g), front = el("path", { fill: k[2] }, g);
    const foam = el("path", { fill: "none", stroke: "#CFE3F0", "stroke-width": 1.6, "stroke-linecap": "round", opacity: 0.85 }, g);
    return { back, mid, front, foam, update(top, amp, t, foamO) {
      back.setAttribute("d", wave(top, t * 30, amp, 22)[0]);
      mid.setAttribute("d", wave(top + 7, -t * 42, amp * 0.85, 16)[0]);
      const [d3, c3] = wave(top + 14, t * 58 + 30, amp * 1.1, 20);
      front.setAttribute("d", d3); foam.setAttribute("d", c3); foam.setAttribute("opacity", f1(foamO === undefined ? 0.85 : foamO));
    } };
  }
  function rain(g, n, seed) {
    const r = rng(seed || 9), s = el("g", { stroke: "#D6E2EE", "stroke-width": 1.3, "stroke-linecap": "round" }, g), drops = [];
    for (let i = 0; i < n; i++) drops.push({ x: r() * 560 - 90, y: r() * 380, l: el("line", {}, s) });
    return { g: s, update(t, o, wind) { s.setAttribute("opacity", f1(o)); if (o <= 0.01) return; const w = wind === undefined ? 120 : wind; for (const d of drops) { const y = (d.y + t * 360) % 400 - 50, x = ((d.x - t * w) % 560 + 560) % 560 - 90; d.l.setAttribute("x1", f1(x)); d.l.setAttribute("y1", f1(y)); d.l.setAttribute("x2", f1(x - w / 30)); d.l.setAttribute("y2", f1(y + 12)); } } };
  }
  function flash(svg) { const f = el("rect", { x: -400, y: -300, width: 1200, height: 900, fill: "#FFFFFF", opacity: 0, "pointer-events": "none" }, svg); return { update(t, times) { let o = 0; for (const [a, k] of times) if (t >= a && t < a + 0.3) o = Math.max(o, (1 - (t - a) / 0.3) * k); f.setAttribute("opacity", f1(o)); } }; }
  /* Light only: soft rays from the sky (used where the text speaks of Allah's message, never a figure). */
  function lightRays(g, x, y) {
    const gid = id("ray"), defs = g.ownerSVGElement.querySelector("defs");
    const lg = el("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: 0, "stop-color": "#FFF6D8", "stop-opacity": 0.9 }, lg); el("stop", { offset: 1, "stop-color": "#FFF6D8", "stop-opacity": 0 }, lg);
    const s = el("g", { fill: "url(#" + gid + ")" }, g), rs = [];
    for (let i = -3; i <= 3; i++) rs.push(el("path", { d: "M" + x + " " + y + " L" + (x + i * 30 - 9) + " " + (y + 230) + " L" + (x + i * 30 + 9) + " " + (y + 230) + " Z" }, s));
    return { g: s, update(t, o) { s.setAttribute("opacity", f1(o)); rs.forEach((r, i) => r.setAttribute("opacity", f1(0.35 + 0.35 * Math.sin(t * 0.9 + i)))); } };
  }
  /* Water bursting up from the ground (the text: water gushed up) */
  function springs(g, xs, y) {
    const s = el("g", { fill: "#9CC8E6" }, g), jets = xs.map(x => ({ x, e: el("path", {}, s) }));
    return { g: s, update(t, k) { s.setAttribute("opacity", f1(cl(k * 2))); for (const j of jets) { const h = 6 + k * (22 + 6 * Math.sin(t * 9 + j.x)); j.e.setAttribute("d", "M" + (j.x - 4) + " " + y + " Q" + (j.x - 2) + " " + f1(y - h) + " " + j.x + " " + f1(y - h - 3) + " Q" + (j.x + 2) + " " + f1(y - h) + " " + (j.x + 4) + " " + y + " Z"); } } };
  }
  /* Cracks in dry ground */
  function cracks(g, y, seed) { const r = rng(seed || 4), s = el("g", { stroke: "#8A6A44", "stroke-width": 0.9, fill: "none" }, g); for (let i = 0; i < 14; i++) { const x = -20 + i * 30 + r() * 10, yy = y + 8 + r() * 50; el("path", { d: "M" + f1(x) + " " + f1(yy) + " l" + f1(6 + r() * 6) + " " + f1(r() * 4 - 2) + " l" + f1(5 + r() * 5) + " " + f1(r() * 6 - 1) + " m-6 -2 l" + f1(r() * 4) + " 5" }, s); } return s; }

  window.SP = { NS, el, lerp, cl, ease, ph, rgb, mixc, rng, f1, SKY, skyMix, sky, sun, moon, stars, cloud, clouds, mountains, hills, ground, field, tree, house, pillar, person, crowd, animal, bird, ark, hammer, saw, planks, chips, water, rain, flash, lightRays, springs, cracks };
})();
