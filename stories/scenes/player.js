/* Scene player: plays a scene when its screen opens. A "full" scene plays its sequence once and then
   keeps its gentle motion; a "loop" scene moves gently all the time. Play again restarts it.
   No sound anywhere. Respects the phone's Reduce Motion setting (shows a still picture). */
(function () {
  "use strict";
  const reduce = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  function mount(host, def) {
    const SP = window.SP;
    host.innerHTML = "";
    const svg = SP.el("svg", { viewBox: "0 0 380 300", width: "100%", role: "img", "aria-label": def.alt || "Illustration", preserveAspectRatio: "xMidYMid slice" }, host);
    svg.style.display = "block";
    const defs = SP.el("defs", {}, svg);
    const scene = def.build(svg, defs, SP);
    let raf = 0, start = null, alive = true;
    function setCam(t) {
      if (!scene.camera) return;
      const [cx, cy, w] = scene.camera(t);
      const h = w * 300 / 380;
      svg.setAttribute("viewBox", [cx - w / 2, cy - h / 2, w, h].map(v => v.toFixed(1)).join(" "));
    }
    function frame(ts) {
      if (!alive) return;
      if (start === null) start = ts;
      const t = (ts - start) / 1000;
      scene.update(t); setCam(t);
      raf = requestAnimationFrame(frame);
    }
    function play() {
      cancelAnimationFrame(raf); start = null;
      if (reduce()) { const t = def.kind === "full" ? (def.dur || 20) : 4; scene.update(t); setCam(t); return; }
      raf = requestAnimationFrame(frame);
    }
    function stop() { alive = false; cancelAnimationFrame(raf); }
    scene.update(0); setCam(0);
    play();
    return { play: () => { alive = true; play(); }, stop, svg };
  }
  window.ScenePlayer = { mount };
})();
