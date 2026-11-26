/* Pictures for the story of Nuh: one scene per screen, in screen order (29 screens).
   Rules: Nuh (and any prophet), angels and Satan are never drawn. Effects only: light, tools that
   move, the Ark. People and animals are simple shapes with no face. Captions give the reference
   from the screen's text (or the book page when the text gives none), then "Picture is illustrative." */
(function () {
  "use strict";
  /* A layered landscape shared by most scenes. */
  function land(svg, SP, o) {
    const { el } = SP;
    const defs = svg.querySelector("defs");
    const L = {};
    L.sky = SP.sky(svg, defs);
    if (o.stars) L.stars = SP.stars(el("g", {}, svg), 60, o.seed || 3);
    if (o.moon) L.moon = SP.moon(el("g", {}, svg), o.moon[0], o.moon[1], o.moon[2] || 11);
    if (o.sun) L.sun = SP.sun(el("g", {}, svg), o.sun[0], o.sun[1], o.sun[2] || 20, o.sunColor);
    L.far = el("g", {}, svg);
    L.cloudsFar = SP.clouds(L.far, [[20, 38, 1.6, 3], [190, 26, 2.2, 3], [350, 40, 1.8, 3]], 600);
    L.mFar = el("g", {}, svg); SP.mountains(L.mFar, o.horizon || 232, o.farPeaks || [[0, 82, 80], [170, 100, 100], [320, 78, 90], [470, 92, 90], [600, 70, 80]], o.farColor || "#A7B6C6");
    L.mNear = el("g", {}, svg); SP.mountains(L.mNear, o.horizon || 232, o.nearPeaks || [[30, 47, 60], [190, 57, 80], [360, 42, 70], [520, 52, 70], [660, 37, 60]], o.nearColor || "#7F93A6");
    L.cloudsNear = SP.clouds(el("g", {}, svg), [[110, 64, 1.7, 7], [280, 70, 2, 7]], 600);
    L.extraBack = el("g", {}, svg);
    if (o.hills !== false) L.hills = SP.hills(el("g", {}, svg), (o.horizon || 232) - 4, o.seed || 5, o.hillColor || "#9CC07A", 14);
    L.ground = SP.ground(svg, o.horizon || 232, o.groundColor || "#8DB86B");
    L.groundG = el("g", {}, svg);
    if (o.field) L.field = SP.field(L.groundG, o.field[0], o.field[1], o.field[2], o.field[3] || 4, o.seed || 11);
    L.trees = (o.trees || []).map(([x, y, s, palm]) => SP.tree(L.groundG, x, y, s, palm));
    L.houses = (o.houses || []).map(([x, y, w, h, c]) => SP.house(L.groundG, x, y, w, h, c));
    L.content = el("g", {}, svg);
    L.front = el("g", {}, svg);
    L.update = function (t, s) {
      L.sky.set(SP.skyMix(s.sky));
      const night = s.night || 0;
      if (L.stars) L.stars.update(t, night);
      if (L.moon) L.moon.update(t, s.moonO === undefined ? night : s.moonO);
      if (L.sun) L.sun.update(t, s.sunO === undefined ? 1 - night : s.sunO);
      const cc = SP.rgb(SP.mixc(SP.mixc([244, 246, 250], [58, 68, 82], s.storm || 0), [70, 76, 100], night * 0.7));
      L.cloudsFar.update(t * (1 + (s.storm || 0) * 2), cc, s.cloudO === undefined ? 1 : s.cloudO);
      L.cloudsNear.update(t * (1 + (s.storm || 0) * 2), SP.rgb(SP.mixc(SP.mixc([250, 251, 253], [44, 52, 64], s.storm || 0), [60, 66, 90], night * 0.7)), s.cloudO === undefined ? 1 : s.cloudO);
      const pan = s.pan || 0;
      L.mFar.setAttribute("transform", "translate(" + SP.f1(-pan * 0.5) + ",0)");
      L.mNear.setAttribute("transform", "translate(" + SP.f1(-pan) + ",0)");
      const dim = night * 0.55 + (s.storm || 0) * 0.3;
      L.mFar.setAttribute("opacity", SP.f1(1 - dim * 0.4)); L.mNear.setAttribute("opacity", SP.f1(1 - dim * 0.3));
      L.ground.setAttribute("fill", SP.rgb(SP.mixc(SP.mixc([141, 184, 107], [196, 170, 112], s.dry || 0), [40, 56, 50], dim)));
      if (L.hills) L.hills.setAttribute("fill", SP.rgb(SP.mixc(SP.mixc([156, 192, 122], [204, 182, 128], s.dry || 0), [46, 62, 58], dim)));
      L.groundG.setAttribute("opacity", SP.f1(1 - dim * 0.35));
      if (L.field) L.field.update(t, s.wind || 0, s.dry || 0);
      L.trees.forEach(tr => tr.update(t, s.wind || 0, s.dry));
      L.houses.forEach((h, i) => h.light(s.lamps === undefined ? night : s.lamps * (0.85 + 0.15 * Math.sin(t * 5 + i))));
    };
    return L;
  }
  const VILLAGE = [[40, 232, 26, 18], [74, 236, 22, 15], [250, 233, 28, 19], [286, 237, 22, 16], [318, 232, 26, 18]];
  const TREES = [[18, 236, 0.9], [118, 238, 0.75], [214, 236, 0.8, true], [356, 240, 0.9]];

  const scenes = [
    /* 0 After Adam: the descendants spread, built villages and grew crops */
    { kind: "loop", cap: "Book page 9.", alt: "A peaceful valley at sunrise with houses and green fields",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [300, 78], houses: VILLAGE, trees: TREES, field: [110, 244, 130, 5] }); const bs = [0, 1, 2].map(i => SP.bird(L.front));
        return { update(t) { L.update(t, { sky: [["dawn", 1 - SP.cl(t / 14)], ["day", SP.cl(t / 14)]], wind: 0.1, lamps: 0, cloudO: 0.45 }); L.sun.move(300, 150 - Math.min(t, 14) * 5); bs.forEach((b, i) => b.draw(((t * 18 + i * 40) % 460) - 40, 70 + i * 9 + Math.sin(t + i) * 4, 0.9, t, i)); } }; } },
    /* 1 Satan's envy: the text asks how he could be content. Shown only as the light dimming over the land. */
    { kind: "loop", cap: "Book page 9.", alt: "Evening over the village as dark clouds gather",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [80, 150, 18, "#F3B266"], houses: VILLAGE, trees: TREES });
        return { update(t) { const k = 0.5 + 0.5 * Math.sin(t * 0.25); L.update(t, { sky: [["dusk", 1], ["storm", 0.4 + 0.4 * k]], storm: 0.3 + 0.3 * k, wind: 0.3, lamps: 0.6, sunO: 0.85 }); }, camera(t) { return [190 + Math.sin(t * 0.1) * 8, 160, 360]; } }; } },
    /* 2 Satan's idea */
    { kind: "loop", cap: "Book page 10.", alt: "The village at night with wind moving the trees",
      build(svg, d, SP) { const L = land(svg, SP, { stars: true, moon: [90, 60], houses: VILLAGE, trees: TREES });
        return { update(t) { L.update(t, { sky: [["night", 1]], night: 1, wind: 0.45 + 0.25 * Math.sin(t * 0.7), cloudO: 0.7 }); } }; } },
    /* 3 a cleverer way */
    { kind: "loop", cap: "Book page 10.", alt: "Clouds drifting across the moon above the sleeping village",
      build(svg, d, SP) { const L = land(svg, SP, { stars: true, moon: [250, 56, 13], houses: VILLAGE.slice(2), trees: TREES });
        return { update(t) { L.update(t, { sky: [["night", 1]], night: 1, wind: 0.2, cloudO: 0.95, lamps: 0.2 }); }, camera(t) { return [230, 150 - Math.sin(t * 0.15) * 10, 300]; } }; } },
    /* 4 Satan's trick: righteous men who worshipped night and day. Shown as lit homes under the stars. */
    { kind: "loop", cap: "Book page 10.", alt: "Lamps glowing in a few homes under a starry sky",
      build(svg, d, SP) { const L = land(svg, SP, { stars: true, houses: VILLAGE, trees: TREES, seed: 8 });
        return { update(t) { L.update(t, { sky: [["night", 1]], night: 1, wind: 0.05, lamps: 0.95, cloudO: 0.35 }); } }; } },
    /* 5 Pictures of the righteous men: plain frames on a wall, no figures */
    { kind: "loop", cap: "Book page 11.", alt: "A sunlit courtyard wall with plain painted panels",
      build(svg, d, SP) { const { el } = SP; const L = land(svg, SP, { sun: [60, 60], trees: [[20, 236, 0.9], [360, 238, 0.8]], hills: false });
        const wall = el("g", {}, L.content); el("rect", { x: 70, y: 150, width: 240, height: 86, fill: "#D9BF97" }, wall); el("rect", { x: 66, y: 146, width: 248, height: 6, fill: "#A9875E" }, wall);
        const cols = ["#7FA6B8", "#B88F6A", "#8FAF7A"]; [100, 165, 230].forEach((x, i) => { el("rect", { x: x - 2, y: 166, width: 54, height: 44, fill: "#6E5236" }, wall); el("rect", { x, y: 168, width: 50, height: 40, fill: cols[i] }, wall); el("path", { d: "M" + x + " 200 Q" + (x + 25) + " " + (185 - i * 4) + " " + (x + 50) + " 196 L" + (x + 50) + " 208 L" + x + " 208 Z", fill: "#00000022" }, wall); });
        const light = el("rect", { x: 70, y: 150, width: 240, height: 86, fill: "#FFF4D0", opacity: 0 }, wall);
        return { update(t) { L.update(t, { sky: [["day", 1]], wind: 0.1 }); light.setAttribute("opacity", SP.f1(0.06 + 0.05 * Math.sin(t * 0.6))); }, camera(t) { return [190 + Math.sin(t * 0.12) * 12, 180, 300]; } }; } },
    /* 6 From pictures to statues (full): stone statues rise one by one, faceless pillars */
    { kind: "full", dur: 12, cap: "Book page 11.", alt: "Plain stone statues appear one after another in a courtyard",
      build(svg, d, SP) { const { el } = SP; const L = land(svg, SP, { sun: [320, 70], houses: [[20, 232, 30, 20], [330, 234, 30, 20]], trees: [[70, 238, 0.7]] });
        const floor = el("rect", { x: 80, y: 228, width: 230, height: 16, fill: "#CDB892" }, L.content);
        const ps = [110, 150, 190, 230, 270].map((x, i) => { const g = el("g", {}, L.content); SP.pillar(g, x, 236, 34 + (i % 2) * 6); return g; });
        const dust = SP.chips(L.content, 190, 236, 24, 2);
        return { update(t) { L.update(t, { sky: [["day", 1]], wind: 0.1 }); ps.forEach((g, i) => { const k = SP.ph(t, 1 + i * 1.8, 2.6 + i * 1.8); g.setAttribute("opacity", SP.f1(k)); g.setAttribute("transform", "translate(0," + SP.f1((1 - k) * 18) + ")"); }); dust.update(t, t < 10); }, camera(t) { const z = SP.ph(t, 0, 10); return [190, SP.lerp(160, 190, z), SP.lerp(380, 280, z)]; } }; } },
    /* 7 From statues to idols: five idols named in 71:23, people bowing (faceless) */
    { kind: "loop", cap: "Quran 71:23. Picture is illustrative.", alt: "Five stone idols in a row with people bowing before them at dusk",
      build(svg, d, SP) { const { el } = SP; const L = land(svg, SP, { sun: [60, 140, 18, "#F3B266"], trees: [[20, 236, 0.8], [362, 236, 0.9]], houses: [[300, 230, 30, 20]] });
        [110, 145, 180, 215, 250].forEach((x, i) => SP.pillar(L.content, x, 226, 30 + (i === 2 ? 10 : 0), "#8E8981"));
        const smoke = el("path", { fill: "none", stroke: "#C9C2B8", "stroke-width": 2, opacity: 0.6, "stroke-linecap": "round" }, L.content);
        const ppl = SP.crowd(L.content, [[120, 262, 1], [150, 266, 1.05], [184, 263, 1], [218, 266, 1.05], [248, 262, 0.95]], { color: "#7C6A5A" });
        return { update(t) { L.update(t, { sky: [["dusk", 1]], wind: 0.15, lamps: 0.5, sunO: 0.9 }); ppl.forEach((p, i) => p.draw(t, false, 0, 0, 20 + 55 * Math.max(0, Math.sin(t * 0.8 + i * 0.5)))); let dd = "M 300 222"; for (let k = 1; k < 8; k++) dd += " Q" + SP.f1(300 + Math.sin(t + k) * 6) + " " + (222 - k * 8) + " " + SP.f1(300 + Math.sin(t * 1.2 + k) * 4) + " " + (222 - k * 10); smoke.setAttribute("d", dd); } }; } },
    /* 8 Allah's anger: the rain held back, small harvests (as the book says) */
    { kind: "loop", cap: "Book page 12. Picture is illustrative.", alt: "Dry cracked land under a hot pale sky with withered crops",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [190, 60, 24, "#F7E2A0"], houses: VILLAGE, trees: [[118, 238, 0.75], [356, 240, 0.9]], field: [110, 244, 130, 5], groundColor: "#C4AA70" }); SP.cracks(L.groundG, 240, 6);
        return { update(t) { L.update(t, { sky: [["drought", 1]], dry: 1, wind: 0.05, cloudO: 0 }); }, camera(t) { return [190, 170 + Math.sin(t * 0.2) * 6, 340]; } }; } },
    /* 9 The messenger: Allah chooses whom He wills. Light only. */
    { kind: "loop", cap: "Book page 13. Picture is illustrative.", alt: "Soft light falling from the sky onto the land",
      build(svg, d, SP) { const L = land(svg, SP, { houses: VILLAGE, trees: TREES }); const rays = SP.lightRays(L.extraBack, 190, -20);
        return { update(t) { L.update(t, { sky: [["clear", 1]], wind: 0.1, cloudO: 0.6 }); rays.update(t, 0.75); } }; } },
    /* 10 Man or angel: ordinary people living ordinary lives */
    { kind: "loop", cap: "Book page 13.", alt: "Village people walking between houses on a bright day",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [320, 60], houses: VILLAGE, trees: TREES, field: [120, 246, 110, 3] }); const w = SP.crowd(L.content, [[0, 252, 1], [0, 258, 0.9], [0, 255, 1.05]], { color: "#7D8C6A" });
        return { update(t) { L.update(t, { sky: [["day", 1]], wind: 0.15 }); w.forEach((p, i) => { p.st.x = ((t * (10 + i * 3) + i * 140) % 480) - 50; p.st.dir = 1; p.draw(t, true); }); } }; } },
    /* 11 Nuh the Messenger: his call is shown as light on the land, never as a figure */
    { kind: "loop", cap: "Quran 71:1 and 26:107. Picture is illustrative.", alt: "Morning light spreading over the village",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [190, 120, 22], houses: VILLAGE, trees: TREES }); const rays = SP.lightRays(L.extraBack, 190, 100);
        return { update(t) { const k = SP.ph(t, 0, 8); L.update(t, { sky: [["dawn", 1 - k], ["clear", k]], wind: 0.1, lamps: 1 - k }); L.sun.move(190, 120 - k * 40); rays.update(t, 0.5 * k); }, camera(t) { return [190, 170 - SP.ph(t, 0, 8) * 15, 340]; } }; } },
    /* 12 What answer did his people give (full): the people turn away */
    { kind: "full", dur: 11, cap: "Quran 26:107 and 23:24. Picture is illustrative.", alt: "A crowd gathers, then people shake their heads and walk away",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [330, 70], houses: VILLAGE, trees: TREES }); const rays = SP.lightRays(L.extraBack, 190, 60);
        const spots = [[120, 262], [140, 270], [165, 264], [205, 266], [228, 271], [250, 263], [180, 276], [105, 274], [270, 275]];
        const ppl = SP.crowd(L.content, spots.map(([x, y], i) => [x, y, 1 + (i % 3) * 0.05, ["#7C6A5A", "#6F7F8C", "#8A6E52"][i % 3]]));
        return { update(t) { L.update(t, { sky: [["day", 1]], wind: 0.12 }); rays.update(t, 0.35);
          ppl.forEach((p, i) => { const [x0, y0] = spots[i]; const turn = SP.ph(t, 3 + i * 0.25, 3.6 + i * 0.25); const go = SP.cl((t - 5 - i * 0.3) / 6); const side = x0 < 190 ? -1 : 1; p.st.x = x0 + side * go * 210; p.st.y = y0; p.st.dir = turn > 0.5 ? side : -side; const shake = t > 2 && t < 4.5 ? Math.sin(t * 10 + i) * 6 : 0; p.draw(t, go > 0.01 && go < 1, 0, shake); }); },
          camera(t) { const z = SP.ph(t, 0, 3) * (1 - SP.ph(t, 6, 10)); return [190, SP.lerp(160, 200, z), SP.lerp(380, 280, z)]; } }; } },
    /* 13 some said he only wanted to be a leader */
    { kind: "loop", cap: "Book page 15.", alt: "People talking in small groups in the market",
      build(svg, d, SP) { const { el } = SP; const L = land(svg, SP, { sun: [60, 70], houses: VILLAGE, trees: TREES });
        [[150, 232], [205, 232]].forEach(([x, y]) => { el("rect", { x, y: y - 16, width: 36, height: 16, fill: "#B98C5A" }, L.content); el("path", { d: "M" + (x - 3) + " " + (y - 16) + " L" + (x + 18) + " " + (y - 26) + " L" + (x + 39) + " " + (y - 16) + " Z", fill: "#C65D3B" }, L.content); });
        const ppl = SP.crowd(L.content, [[110, 262, 1], [124, 264, 1], [250, 262, 1], [264, 265, 1.05], [278, 262, 0.95]], { color: "#8A6E52" });
        return { update(t) { L.update(t, { sky: [["day", 1]], wind: 0.1 }); ppl.forEach((p, i) => { p.st.dir = i % 2 ? -1 : 1; p.draw(t, false, 0, Math.sin(t * 2 + i) * 5); }); } }; } },
    /* 14 Nuh and his people: worshipping stones */
    { kind: "loop", cap: "Quran 7:59. Picture is illustrative.", alt: "People gathered around stone idols in the late afternoon",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [300, 110, 18, "#F3C27A"], trees: TREES, houses: [[20, 232, 28, 18]] });
        [150, 190, 230].forEach((x, i) => SP.pillar(L.content, x, 228, 34 + (i === 1 ? 8 : 0), "#8E8981"));
        const ppl = SP.crowd(L.content, [[130, 264, 1], [170, 268, 1.05], [210, 266, 1], [250, 263, 0.95]], { color: "#7C6A5A" });
        return { update(t) { L.update(t, { sky: [["dusk", 0.5], ["day", 0.5]], wind: 0.12 }); ppl.forEach((p, i) => p.draw(t, false, 0, 0, 10 + 45 * Math.max(0, Math.sin(t * 0.7 + i)))); } }; } },
    /* 15 The council: we see that you are in clear error */
    { kind: "loop", cap: "Quran 7:59 to 62. Picture is illustrative.", alt: "The rich men of the council seated together under an awning",
      build(svg, d, SP) { const { el } = SP; const L = land(svg, SP, { sun: [320, 60], trees: [[30, 236, 0.9], [350, 238, 0.85, true]], hills: true });
        el("rect", { x: 110, y: 186, width: 160, height: 6, fill: "#7A2E2E" }, L.content); [114, 262].forEach(x => el("rect", { x, y: 190, width: 4, height: 46, fill: "#6B4A2B" }, L.content));
        el("rect", { x: 120, y: 228, width: 140, height: 10, rx: 3, fill: "#B9524A" }, L.content);
        const ppl = SP.crowd(L.content, [[140, 232, 1.05], [168, 232, 1.1], [196, 232, 1.1], [224, 232, 1.05], [250, 232, 1]], { color: "#5C4A7A", headcloth: "#E8DCC0" });
        return { update(t) { L.update(t, { sky: [["day", 1]], wind: 0.1 }); ppl.forEach((p, i) => { p.st.dir = i < 2 ? 1 : -1; p.draw(t, false, 0, Math.sin(t * 1.5 + i) * 4); }); } }; } },
    /* 16 The lowliest follow you: a few working people, the rich apart */
    { kind: "loop", cap: "Quran 26:111 and 26:114 to 115. Picture is illustrative.", alt: "A few working people with tools on one side, richly dressed people apart on the other",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [70, 60], houses: VILLAGE.slice(0, 2), trees: TREES, field: [40, 248, 110, 3] });
        const poor = SP.crowd(L.content, [[70, 264, 1], [92, 268, 0.95], [114, 264, 1]], { color: "#8A7A62" });
        const rich = SP.crowd(L.content, [[262, 262, 1.1], [286, 266, 1.1], [310, 262, 1.05]], { color: "#5C4A7A", headcloth: "#E8DCC0" });
        const h = SP.hammer(L.content, 128, 246);
        return { update(t) { L.update(t, { sky: [["day", 1]], wind: 0.15 }); poor.forEach((p, i) => p.draw(t, false, 0, 0, 25 * Math.max(0, Math.sin(t * 3 + i)))); rich.forEach((p, i) => { p.st.dir = -1; p.draw(t, false, 0, -4); }); h.update(t, true); } }; } },
    /* 17 who could deliver me from Allah if I drive them away: the believers' small house at evening */
    { kind: "loop", cap: "Quran 11:30. Picture is illustrative.", alt: "A small group of believers outside a lit house at evening",
      build(svg, d, SP) { const L = land(svg, SP, { stars: true, moon: [310, 60, 10], houses: [[160, 236, 46, 28]], trees: [[100, 238, 0.85], [280, 238, 0.9, true]] });
        const ppl = SP.crowd(L.content, [[140, 262, 1], [228, 262, 1], [246, 266, 0.95]], { color: "#8A7A62" });
        return { update(t) { L.update(t, { sky: [["dusk", 0.4], ["night", 0.6]], night: 0.7, wind: 0.05, lamps: 1 }); ppl.forEach((p, i) => { p.st.dir = i ? -1 : 1; p.draw(t, false); }); } }; } },
    /* 18 The argument of the rich: fine clothes and plenty */
    { kind: "loop", cap: "Book page 16.", alt: "Rich people in fine clothes walking past market stalls full of goods",
      build(svg, d, SP) { const { el } = SP; const L = land(svg, SP, { sun: [60, 60], houses: VILLAGE, trees: TREES });
        [[120, 236], [200, 236]].forEach(([x, y], i) => { el("rect", { x, y: y - 18, width: 46, height: 18, fill: "#A87A4A" }, L.content); el("path", { d: "M" + (x - 4) + " " + (y - 18) + " L" + (x + 23) + " " + (y - 30) + " L" + (x + 50) + " " + (y - 18) + " Z", fill: i ? "#3E7D8C" : "#B9524A" }, L.content); for (let k = 0; k < 5; k++) el("circle", { cx: x + 6 + k * 8, cy: y - 21, r: 3, fill: ["#E3A33A", "#C8482E", "#7DAA3E", "#E3C43A", "#A8473A"][k] }, L.content); });
        const r = SP.crowd(L.content, [[0, 264, 1.1], [0, 268, 1.1]], { color: "#5C4A7A", headcloth: "#E8DCC0" });
        return { update(t) { L.update(t, { sky: [["day", 1]], wind: 0.1 }); r.forEach((p, i) => { p.st.x = ((t * 9 + i * 22) % 460) - 40; p.draw(t, true); }); } }; } },
    /* 19 Nuh's call: rain sent, crops blessed, the heavens, the sun and the moon */
    { kind: "loop", cap: "Quran 71:2 to 4. Picture is illustrative.", alt: "Gentle rain over green fields, then the sun and moon crossing the sky",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [80, 80], moon: [300, 70, 10], stars: true, houses: VILLAGE, trees: TREES, field: [110, 244, 130, 5] }); const rn = SP.rain(L.front, 40, 3);
        return { update(t) { const c = (t % 24) / 24; const night = SP.cl(Math.sin(c * Math.PI * 2 - 1.2) * 1.4); L.update(t, { sky: [["clear", 1 - night], ["night", night]], night, wind: 0.2, sunO: 1 - night, moonO: night }); L.sun.move(SP.lerp(20, 360, c), 80 + Math.abs(c - 0.5) * 60); rn.update(t, c < 0.25 ? 0.5 : 0, 40); } }; } },
    /* 20 they put their fingers in their ears */
    { kind: "loop", cap: "Book page 17.", alt: "People walking away with their hands over their ears",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [330, 70], houses: VILLAGE, trees: TREES }); const ppl = SP.crowd(L.content, [[0, 262, 1], [0, 268, 1.05], [0, 264, 0.95], [0, 270, 1]], { color: "#7C6A5A" });
        return { update(t) { L.update(t, { sky: [["day", 1]], wind: 0.1 }); ppl.forEach((p, i) => { p.st.x = 380 - (((t * 11 + i * 50) % 460)); p.st.dir = -1; p.draw(t, true, 0.95); }); } }; } },
    /* 21 Nuh's prayer (full): nine hundred and fifty years pass, day after night */
    { kind: "full", dur: 14, cap: "Quran 29:14, 11:36 and 11:32. Picture is illustrative.", alt: "Days and nights pass quickly over the village, season after season",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [80, 80], moon: [300, 70, 10], stars: true, houses: VILLAGE, trees: TREES, field: [110, 244, 130, 5] });
        return { update(t) { const speed = SP.lerp(0.25, 2.2, SP.ph(t, 0, 7)) * (1 - 0.8 * SP.ph(t, 11, 14)); const c = ((t * speed) % 1 + 1) % 1; const night = SP.cl(Math.sin(c * Math.PI * 2 - 1.2) * 1.4); L.update(t * (1 + speed), { sky: [["clear", 1 - night], ["night", night]], night, wind: 0.2, sunO: 1 - night, moonO: night, dry: 0.5 + 0.5 * Math.sin(t * speed * 0.3) }); L.sun.move(SP.lerp(20, 360, c), 80 + Math.abs(c - 0.5) * 60); },
          camera(t) { return [190, 160, SP.lerp(330, 380, SP.ph(t, 0, 14))]; } }; } },
    /* 22 O Allah, do not leave even one of the unbelievers: a still, starry night */
    { kind: "loop", cap: "Book page 18.", alt: "A still night with many stars over the quiet land",
      build(svg, d, SP) { const L = land(svg, SP, { stars: true, moon: [90, 50, 12], houses: VILLAGE, trees: TREES, seed: 12 }); const rays = SP.lightRays(L.extraBack, 190, -60);
        return { update(t) { L.update(t, { sky: [["night", 1]], night: 1, wind: 0.02, cloudO: 0.2, lamps: 0.15 }); rays.update(t, 0.18); } }; } },
    /* 23 The ark (full): the Ark is built; the tools move by themselves; mockers point */
    { kind: "full", dur: 16, cap: "Quran 11:38. Picture is illustrative.", alt: "The Ark is built plank by plank while people point and mock",
      build(svg, d, SP) { const L = land(svg, SP, { sun: [330, 64], trees: [[30, 236, 0.9], [360, 240, 0.85, true]], hills: true });
        const a = SP.ark(L.content); a.set(0); a.ramp.setAttribute("opacity", 0);
        SP.planks(L.content, 100, 240, 6);
        const ham = SP.hammer(L.content, 214, 186), sw = SP.saw(L.content, 268, 222), ch = SP.chips(L.content, 250, 222, 20, 4);
        const mock = SP.crowd(L.content, [[40, 262, 1], [62, 266, 1.05], [84, 262, 0.95]], { color: "#5C4A7A", headcloth: "#E8DCC0" });
        return { update(t) { L.update(t, { sky: [["day", 1]], wind: 0.12 }); const p = SP.cl((t - 0.5) / 13); a.set(p); const on = t < 14; ham.update(t, on); sw.update(t, on); ch.update(t, on);
            mock.forEach((m, i) => { m.st.dir = 1; m.draw(t, false, 0.45 + 0.1 * Math.sin(t * 3 + i), Math.sin(t * 6 + i) * (t > 5 ? 5 : 0)); }); },
          camera(t) { const z = SP.ph(t, 0, 6); return [SP.lerp(190, 205, z), SP.lerp(150, 195, z), SP.lerp(380, 300, z)]; } }; } },
    /* 24 The flood (full): pairs of every kind board, the rain falls, water gushes up and rises, the Ark rides waves like mountains */
    { kind: "full", dur: 27, cap: "Quran 11:40 and 11:42. Picture is illustrative.", alt: "Animals board the Ark in pairs, the rain pours and the water rises, and the Ark sails on huge waves",
      build(svg, d, SP) { return flood(svg, SP); } },
    /* 25 there is no refuge from Allah except in Him: the Ark on huge waves in the storm */
    { kind: "loop", cap: "Quran 11:43. Picture is illustrative.", alt: "The Ark rides huge dark waves under lightning",
      build(svg, d, SP) { const { el } = SP; const L = land(svg, SP, { hills: false, groundColor: "#1F4E73" }); L.ground.setAttribute("opacity", 0); L.groundG.setAttribute("opacity", 0);
        const a = SP.ark(L.content); a.ramp.setAttribute("opacity", 0); const w = SP.water(L.front), rn = SP.rain(L.front, 70, 5), fl = SP.flash(svg);
        return { update(t) { L.update(t, { sky: [["storm", 1]], storm: 1, pan: (t * 9) % 120 }); const top = 205 + Math.sin(t * 0.7) * 6; w.update(top, 9, t); a.place(Math.sin(t * 0.5) * 6, top - 224 + Math.sin(t * 2.1) * 3, Math.sin(t * 1.6) * 5); rn.update(t, 0.9); fl.update(t, [[((t / 6) | 0) * 6 + 2.2, 0.6]]); } }; } },
    /* 26 Nuh's son (full): a faceless figure on a mountain top; a wave comes between; the figure is gone */
    { kind: "full", dur: 14, cap: "Quran 11:42 to 43. Picture is illustrative.", alt: "The Ark on the water, a lone figure on a mountain top, and a great wave rising between them",
      build(svg, d, SP) { const { el } = SP; const L = land(svg, SP, { hills: false, farPeaks: [[330, 120, 70]], nearPeaks: [[330, 70, 60]], farColor: "#7D7266", nearColor: "#665B50" });
        L.ground.setAttribute("opacity", 0); L.groundG.setAttribute("opacity", 0);
        const a = SP.ark(L.content); a.ramp.setAttribute("opacity", 0);
        const son = SP.person(L.content, 330, 116, { s: 0.9, color: "#6F5A4A" });
        const w = SP.water(L.front), rn = SP.rain(L.front, 60, 7), fl = SP.flash(svg);
        const big = el("path", { fill: "#2A6A9A" }, L.front), crest = el("path", { fill: "none", stroke: "#E4F0F8", "stroke-width": 3.2, "stroke-linecap": "round" }, L.front);
        return { update(t) { L.update(t, { sky: [["storm", 1]], storm: 1 }); const top = SP.lerp(214, 196, SP.ph(t, 0, 12)); w.update(top, 8, t); a.place(-70 + Math.sin(t * 0.5) * 4, top - 224 + Math.sin(t * 2) * 3, Math.sin(t * 1.5) * 4);
            son.draw(t, false, 0, 0); son.g.setAttribute("opacity", SP.f1(1 - SP.ph(t, 9.5, 10.5)));
            const k = SP.ph(t, 5, 9) * (1 - SP.ph(t, 11, 13.5)); const x = SP.lerp(420, 260, SP.ph(t, 5, 10)), h = 110 * k;
            big.setAttribute("d", "M" + SP.f1(x - 90) + " 320 Q" + SP.f1(x - 40) + " " + SP.f1(220 - h * 0.6) + " " + SP.f1(x) + " " + SP.f1(220 - h) + " Q" + SP.f1(x + 30) + " " + SP.f1(220 - h * 0.7) + " " + SP.f1(x + 90) + " 320 Z"); crest.setAttribute("d", "M" + SP.f1(x - 20) + " " + SP.f1(222 - h * 0.92) + " Q" + SP.f1(x) + " " + SP.f1(218 - h) + " " + SP.f1(x + 18) + " " + SP.f1(222 - h * 0.85)); crest.setAttribute("opacity", SP.f1(k));
            rn.update(t, 0.85); fl.update(t, [[2.4, 0.6], [7.8, 0.7]]); },
          camera(t) { const z = SP.ph(t, 0, 5) * (1 - SP.ph(t, 9, 13)); return [SP.lerp(190, 290, z), SP.lerp(150, 140, z), SP.lerp(380, 260, z)]; } }; } },
    /* 27 He is not one of your family: the Ark at night, rain easing, a few stars */
    { kind: "loop", cap: "Quran 11:45 to 47. Picture is illustrative.", alt: "The Ark on a calmer sea at night with the rain easing",
      build(svg, d, SP) { const L = land(svg, SP, { hills: false, stars: true, seed: 21 }); L.ground.setAttribute("opacity", 0); L.groundG.setAttribute("opacity", 0); L.mFar.setAttribute("opacity", 0); L.mNear.setAttribute("opacity", 0);
        const a = SP.ark(L.content); a.ramp.setAttribute("opacity", 0); const w = SP.water(L.front, ["#2A5578", "#22496A", "#1A3A56"]), rn = SP.rain(L.front, 25, 9);
        return { update(t) { L.update(t, { sky: [["night", 0.8], ["storm", 0.2]], night: 0.8, storm: 0.3, cloudO: 0.6 }); L.mFar.setAttribute("opacity", 0); L.mNear.setAttribute("opacity", 0); const top = 206; w.update(top, 3, t, 0.4); a.place(0, top - 224 + Math.sin(t * 1.2) * 2, Math.sin(t) * 1.5); rn.update(t, 0.35, 30); } }; } },
    /* 28 After the flood (full): the rain stops, the water goes down, the Ark comes to rest on Mount Judi, peace */
    { kind: "full", dur: 16, cap: "Quran 11:44, 11:48 and 37:79. Picture is illustrative.", alt: "The rain stops, the water goes down and the Ark rests on Mount Judi in the sunshine; animals walk out",
      build(svg, d, SP) { const { el } = SP; const L = land(svg, SP, { hills: false, sun: [300, 70] });
        const judi = el("path", { d: "M120 320 L200 240 L212 236 L238 236 L250 240 L330 320 Z", fill: "#6F8066" }, L.extraBack);
        L.ground.setAttribute("opacity", 0);
        const a = SP.ark(L.content); a.rampOpen(0);
        const an = [["elephant", 0], ["giraffe", 1], ["camel", 2], ["sheep", 3], ["lion", 4], ["horse", 5]].map(([k, i]) => ({ o: SP.animal(k, L.content), i }));
        const bs = [0, 1, 2].map(() => SP.bird(L.front)); const w = SP.water(L.front), rn = SP.rain(L.front, 50, 2), rays = SP.lightRays(L.extraBack, 300, 70);
        return { update(t) { const dry = SP.ph(t, 2, 10); L.update(t, { sky: [["storm", 1 - dry], ["clear", dry]], storm: 1 - dry, sunO: SP.ph(t, 4, 8), cloudO: 1 - dry * 0.6 });
            const top = SP.lerp(196, 290, SP.ph(t, 1.5, 11)); w.update(top, SP.lerp(7, 1.5, dry), t, 0.85 * (1 - dry * 0.5)); rn.update(t, 0.9 * (1 - SP.ph(t, 0.5, 3)));
            const rest = SP.ph(t, 1, 9); a.place(0, Math.min(top - 224, SP.lerp(-28, 10, rest)) + Math.sin(t * 2) * 3 * (1 - rest), Math.sin(t * 1.4) * 3 * (1 - rest));
            a.rampOpen(SP.ph(t, 10, 11.5)); rays.update(t, 0.4 * SP.ph(t, 5, 9));
            an.forEach(({ o, i }) => { const s = SP.cl((t - 11.5 - i * 0.7) / 4); o.draw(SP.lerp(194, 194 - 120 - i * 10, s), SP.lerp(209, 246, Math.min(1, s * 1.5)), 0.42, t, s > 0 && s < 1, i, -1); o.g.setAttribute("opacity", s > 0 ? 1 : 0); });
            bs.forEach((b, i) => { const f = SP.cl((t - 8 - i) / 6); b.draw(SP.lerp(200, 40 + i * 60, f), SP.lerp(170, 60 + i * 12, f) + Math.sin(t * 3 + i) * 3, 0.8, t, i); b.g.setAttribute("opacity", f > 0 && f < 1 ? 1 : 0); }); },
          camera(t) { const z = SP.ph(t, 6, 12); return [SP.lerp(190, 215, z), SP.lerp(150, 195, z), SP.lerp(380, 300, z)]; } }; } }
  ];

  /* Screen 24: the sequence from the quality reference, rebuilt from the parts library. */
  function flood(svg, SP) {
    const { el } = SP;
    const L = land(svg, SP, { sun: [300, 70], trees: [[30, 228, 1], [78, 228, 0.8], [118, 229, 0.65]], hills: false, horizon: 232 });
    const judi = el("path", { d: "M140 300 L208 238 L216 234 L234 234 L242 238 L310 300 Z", fill: "#6F8066", opacity: 0 }, L.extraBack);
    const a = SP.ark(L.content); a.rampOpen(1);
    const kinds = ["elephant", "elephant", "giraffe", "giraffe", "camel", "camel", "sheep", "sheep", "lion", "lion"];
    const an = kinds.map((k, i) => ({ o: SP.animal(k, L.content), sx: -40 - i * 36 }));
    const bs = [0, 1].map(i => ({ b: SP.bird(L.content), i }));
    const sp = SP.springs(L.content, [40, 100, 330, 360], 232);
    const w = SP.water(L.front), rn = SP.rain(L.front, 60, 1), fl = SP.flash(svg);
    return {
      update(t) {
        const storm = SP.ph(t, 6.8, 9) * (1 - SP.ph(t, 19, 21.5)), calm = SP.ph(t, 20, 23.5);
        const sail = Math.max(0, t - 11.5), pan = Math.min(sail, 8.5) * 18;
        L.update(t, { sky: [["day", (1 - storm) * (1 - calm)], ["storm", storm], ["clear", calm]], storm, wind: storm, pan, sunO: SP.ph(t, 21.5, 24) });
        const speed = 75, rampLen = 61;
        an.forEach(({ o, sx }, k) => { const L1 = 140 - sx, s = speed * t; let x, y, sc = 0.6, vis = 1;
          if (s < L1) { x = sx + s; y = 228; } else if (s < L1 + rampLen) { const f = (s - L1) / rampLen; x = 140 + 54 * f; y = 228 - 29 * f; sc = SP.lerp(0.6, 0.4, f); } else { vis = 0; x = 194; y = 199; }
          o.draw(x, y, sc, t, vis && t < 8, k); o.g.setAttribute("opacity", vis); });
        bs.forEach(({ b, i }) => { const f = SP.cl((t - 2 - i * 0.6) / 3.4); b.draw(SP.lerp(10 + i * 26, 194, f), SP.lerp(50 + i * 14, 186, f) + Math.sin(t * 3 + i) * 4, SP.lerp(1, 0.6, f), t, i); b.g.setAttribute("opacity", f >= 1 ? 0 : 1); });
        a.rampOpen(1 - SP.ph(t, 7.6, 8.4));
        sp.update(t, SP.ph(t, 8.5, 9.5) * (1 - SP.ph(t, 11, 12)));
        rn.update(t, storm * 0.9);
        fl.update(t, [[9.2, 0.75], [9.6, 0.45], [14, 0.75], [16.8, 0.6]]);
        const rise = SP.ph(t, 8.2, 11.8), fall = SP.ph(t, 20, 25);
        const top = t < 20 ? SP.lerp(312, 205, rise) : SP.lerp(205, 264, fall);
        w.update(top, 1.5 + 7 * storm * rise + 1.5 * rise * (1 - fall), t, 0.85 * SP.cl(rise * 1.2));
        L.ground.setAttribute("opacity", SP.f1(1 - SP.ph(t, 11.3, 12))); L.groundG.setAttribute("opacity", SP.f1(1 - SP.ph(t, 11.3, 12)));
        judi.setAttribute("opacity", SP.f1(SP.ph(t, 21, 23)));
        let arkY = t < 15 ? Math.min(0, top - 224) : Math.min(top - 224, 5);
        const fl2 = SP.cl((t - 10.5) / 1.5) * (1 - SP.ph(t, 23, 25.5));
        arkY += Math.sin(t * 2.1) * 3 * fl2;
        a.place(Math.sin(sail * 0.5) * 6 * fl2, arkY, Math.sin(t * 1.6) * 4 * fl2 * (0.4 + 0.8 * storm));
      },
      camera(t) {
        const z = SP.ph(t, 3, 6.2) * (1 - SP.ph(t, 6.6, 8.4)), f3 = SP.ph(t, 21, 25);
        if (t < 20) return [SP.lerp(190, 205, z), SP.lerp(150, 200, z), SP.lerp(380, 260, z)];
        return [SP.lerp(190, 225, f3), SP.lerp(150, 190, f3), SP.lerp(380, 300, f3)];
      }
    };
  }
  window.STORY_SCENES = window.STORY_SCENES || {};
  window.STORY_SCENES.nuh = scenes;
})();
