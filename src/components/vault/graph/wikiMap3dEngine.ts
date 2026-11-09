// 3D map of the Wiki. The rendering approach (bubbles with a rim, one draw call
// for every edge, HTML labels with collision, fog, camera flights)
// is adapted from Second Brain OS — MIT License, (c) 2026 undefined-ui/second-brain-os.
// Loaded on demand: three.js only downloads when someone opens Conexões.
import * as THREE from "three";
import ForceGraph3D from "3d-force-graph";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { MapData, MapNode } from "./wikiGraph";

type EngineNode = MapNode & {
  x?: number; y?: number; z?: number; vx?: number; vy?: number; vz?: number;
  _o: number; _ot: number; _s: number; _st: number; _r: number; _appear: number;
  _core?: THREE.Mesh; _shell?: THREE.Mesh | null;
};
interface EngineLink {
  source: string | EngineNode; target: string | EngineNode;
  s: string; t: string; kind: "contains" | "link";
  _S: EngineNode; _T: EngineNode; _a: number; _at: number;
}
export interface WikiMapCallbacks {
  onPick: (id: string | null) => void;
  onOpen: (id: string) => void;
  onReady: () => void;
}
export interface WikiMapController {
  setVisible: (visible: (node: MapNode) => boolean) => void;
  select: (id: string | null) => void;
  preview: (id: string | null) => void;
  setDetailed: (detailed: boolean) => void;
  setPanel: (width: number) => void;
  setSpin: (spin: boolean) => void;
  frameAll: () => void;
  recolor: () => void;
  reheat: () => void;
  dispose: () => void;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s);
const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const TYPE = (n: MapNode) =>
  n.type === "topic" ? "assunto" : n.shape === "gem" ? "tabela / dimensão" : n.shape === "oct" ? "skill" : "nota";

export function createWikiMap(
  host: HTMLElement,
  stage: HTMLElement,
  labelBox: HTMLElement,
  ring: HTMLElement,
  data: MapData,
  callbacks: WikiMapCallbacks,
): WikiMapController {
  let disposed = false;
  let visibleFn: (n: MapNode) => boolean = () => true;
  let detailed = true;
  let panelW = 0;
  let spin = false;
  const S = { sel: null as EngineNode | null, preview: null as EngineNode | null, focus: null as Set<string> | null, t0: performance.now() };
  const visible = (n: EngineNode) => visibleFn(n);

  // ---------------------------------------------------------------- palette (CSS tokens on the host)
  const COLOR: Record<string, string> = {};
  const PAPER = new THREE.Color();
  const readColors = () => {
    const css = getComputedStyle(host);
    for (const group of new Set(data.nodes.map((n) => n.group))) COLOR[group] = css.getPropertyValue("--m-c-" + group).trim() || "#7a8b8c";
    PAPER.set(css.getPropertyValue("--m-paper").trim() || "#f3f6f6");
  };
  readColors();
  const dotOf = (n: MapNode) => COLOR[n.group];
  const cssDot = (n: MapNode) => `var(--m-c-${n.group})`;

  // ---------------------------------------------------------------- data
  const nodes: EngineNode[] = data.nodes.map((n) => ({ ...n, _o: 0, _ot: 0, _s: 1, _st: 1, _r: Math.cbrt(n.val) * 3.1, _appear: 0 }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links: EngineLink[] = data.links
    .filter((l) => byId.has(l.source) && byId.has(l.target))
    .map((l) => ({ source: l.source, target: l.target, s: l.source, t: l.target, kind: l.kind, _S: byId.get(l.source)!, _T: byId.get(l.target)!, _a: 0, _at: 0 }));
  const nbr = new Map(nodes.map((n) => [n.id, new Set<string>()]));
  for (const l of links) { nbr.get(l.s)!.add(l.t); nbr.get(l.t)!.add(l.s); }

  // each subject settles on its own continent
  const R = 230;
  const ANCHOR: Record<string, [number, number, number]> = {
    serv: [-1, 0.05, 0.25], prod: [0.8, 0.32, -0.42], res: [0.78, -0.36, 0.5], dados: [-0.08, 0.62, -0.55],
    strat: [0.75, 0.65, -0.25], eng: [-0.28, -0.92, -0.28], crm: [-0.62, -0.5, 0.6], start: [-0.35, 0.55, 0.62], leg: [0.25, 0.95, 0.55],
  };
  for (const n of nodes) {
    const a = ANCHOR[n.group] || [0, 0, 0], j = () => (Math.random() - 0.5) * 30;
    n.x = a[0] * R * 0.25 + j(); n.y = a[1] * R * 0.25 + j(); n.z = a[2] * R * 0.25 + j();
    n._appear = n.type === "topic" ? 150 : n.featured ? 450 + Math.random() * 200 : 700 + Math.random() * 700;
  }

  // ---------------------------------------------------------------- graph
  let W = Math.max(1, host.clientWidth), H = Math.max(1, host.clientHeight);
  const graph = new ForceGraph3D(stage, { controlType: "orbit", rendererConfig: { antialias: true, alpha: true, powerPreference: "high-performance" } });
  const scene = graph.scene();
  const camera = graph.camera() as THREE.PerspectiveCamera;
  const controls = graph.controls() as OrbitControls;
  graph.renderer().setPixelRatio(Math.min(devicePixelRatio, 1.5));
  graph.width(W).height(H);

  const GEO = { sphere: new THREE.SphereGeometry(1, 20, 14), gem: new THREE.IcosahedronGeometry(1, 0), oct: new THREE.OctahedronGeometry(1, 0), shell: new THREE.SphereGeometry(1, 24, 16) };
  const shelled = (n: MapNode) => n.type === "topic" || n.featured;
  const rimMaterial = (color: string) => new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: 0 } },
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
    fragmentShader: "uniform vec3 color; uniform float opacity; varying vec3 vN; varying vec3 vV; void main(){ float f = 1. - abs(dot(normalize(vN), normalize(vV))); float a = pow(f, 2.4) * .9 + .04; gl_FragColor = vec4(color, a * opacity); }",
    transparent: true, depthWrite: false,
  });
  const coreScale = (n: EngineNode) => (n._core?.geometry === GEO.sphere ? n._r : n._r * 1.25);
  const shellScale = (n: EngineNode) => n._r * 1.7;
  const makeNode = (n: EngineNode) => {
    const g = new THREE.Group();
    const geo = GEO[n.shape] || GEO.sphere;
    const core = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: new THREE.Color(dotOf(n)), roughness: 0.55, metalness: 0, transparent: true, opacity: n._o, flatShading: geo !== GEO.sphere }));
    n._core = core;
    core.scale.setScalar(coreScale(n));
    g.add(core);
    n._shell = null;
    if (shelled(n)) {
      const shell = new THREE.Mesh(GEO.shell, rimMaterial(dotOf(n)));
      shell.scale.setScalar(shellScale(n)); shell.renderOrder = 2;
      g.add(shell); n._shell = shell;
    }
    return g;
  };
  const tooltip = (n: EngineNode) =>
    `<span class="wm-tt-k" style="--dot:${cssDot(n)}">${TYPE(n)}${n.type === "note" ? " · " + esc(n.topic) : ""}</span><span class="wm-tt-t">${esc(n.label)}</span>` +
    (n.type === "note" ? `<span class="wm-tt-d">${n.incoming} citações recebidas · ${n.outgoing} enviadas</span>` : `<span class="wm-tt-d">${n.count} notas</span>`);

  let lastClick = { id: "", at: 0 };
  graph
    .backgroundColor("rgba(0,0,0,0)")
    .showNavInfo(false)
    .nodeId("id")
    .nodeVal("val")
    .nodeThreeObject((n) => makeNode(n as EngineNode))
    .nodeLabel((n) => (W <= 760 ? "" : tooltip(n as EngineNode)))
    .linkVisibility(false)
    .enableNodeDrag(false)
    .warmupTicks(110)
    .cooldownTicks(320)
    .d3AlphaDecay(0.016)
    .d3VelocityDecay(0.34)
    .onNodeHover((n) => setPreview(n && (n as EngineNode)._o > 0.05 ? (n as EngineNode) : null))
    .onNodeClick((n) => {
      const node = n as EngineNode, now = performance.now();
      if (lastClick.id === node.id && now - lastClick.at < 400 && node.type === "note") callbacks.onOpen(node.id);
      lastClick = { id: node.id, at: now };
      callbacks.onPick(node.id);
    })
    .onBackgroundClick(() => callbacks.onPick(null))
    .onEngineTick(() => updateLinkPositions())
    .graphData({ nodes, links } as never);

  const sameGroup = (l: EngineLink) => l._S.group === l._T.group;
  const linkForce = graph.d3Force("link");
  linkForce?.distance((l: EngineLink) => (l.kind === "contains" ? (l._T.featured ? 30 : 46) : sameGroup(l) ? 60 : 88));
  linkForce?.strength((l: EngineLink) => (l.kind === "contains" ? 0.5 : sameGroup(l) ? 0.12 : 0.03));
  graph.d3Force("charge")?.strength((n: EngineNode) => (n.type === "topic" ? -280 : n.featured ? -120 : n.group === "leg" ? -11 : n.shape === "oct" ? -24 : -38)).distanceMax(360);
  graph.d3Force("anchor", (() => {
    let ns: EngineNode[] = [];
    const f = ((alpha: number) => {
      for (const n of ns) {
        const a = ANCHOR[n.group]; if (!a) continue;
        const k = (n.type === "topic" ? 0.14 : n.featured ? 0.03 : 0.011) * alpha;
        n.vx! += (a[0] * R - n.x!) * k; n.vy! += (a[1] * R - n.y!) * k; n.vz! += (a[2] * R - n.z!) * k;
      }
    }) as ((alpha: number) => void) & { initialize?: (x: EngineNode[]) => void };
    f.initialize = (x) => { ns = x; };
    return f;
  })());

  graph.lights([new THREE.AmbientLight(0xffffff, 0.75), new THREE.HemisphereLight(0xffffff, 0x9aa7a6, 0.55)]);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-0.6, 1, 0.8);
  camera.add(key); scene.add(camera);
  scene.fog = new THREE.Fog(PAPER, 400, 1600);
  controls.enableDamping = true; controls.dampingFactor = 0.085; controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.9;
  controls.minDistance = 18; controls.maxDistance = 2600; controls.autoRotateSpeed = 0.45;

  // ---------------------------------------------------------------- edges: one draw call, per-vertex alpha
  const KIND_A = { contains: 0.3, link: 0.2 };
  const lpos = new Float32Array(links.length * 6), lcol = new Float32Array(links.length * 8);
  const paintLineColors = () => links.forEach((l, i) => {
    const a = new THREE.Color(dotOf(l._S)), b = new THREE.Color(dotOf(l._T));
    lcol.set([a.r, a.g, a.b, l._a, b.r, b.g, b.b, l._a], i * 8);
  });
  paintLineColors();
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute("position", new THREE.BufferAttribute(lpos, 3).setUsage(THREE.DynamicDrawUsage));
  lgeo.setAttribute("color", new THREE.BufferAttribute(lcol, 4).setUsage(THREE.DynamicDrawUsage));
  const lineMesh = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: true }));
  lineMesh.frustumCulled = false; lineMesh.renderOrder = -1;
  scene.add(lineMesh);
  const hl = { list: [] as EngineLink[], o: 0, ot: 0, mat: new LineMaterial({ linewidth: 2.4, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, worldUnits: false }), mesh: null as unknown as LineSegments2 };
  hl.mesh = new LineSegments2(new LineSegmentsGeometry(), hl.mat);
  hl.mesh.frustumCulled = false; hl.mesh.renderOrder = 1;
  scene.add(hl.mesh);
  function updateLinkPositions() {
    for (let i = 0; i < links.length; i++) {
      const a = links[i]._S, b = links[i]._T, o = i * 6;
      lpos[o] = a.x!; lpos[o + 1] = a.y!; lpos[o + 2] = a.z!; lpos[o + 3] = b.x!; lpos[o + 4] = b.y!; lpos[o + 5] = b.z!;
    }
    lgeo.attributes.position.needsUpdate = true;
    if (hl.list.length) updateHL();
  }
  function buildHL(list: EngineLink[]) {
    hl.list = list;
    const geo = new LineSegmentsGeometry();
    const pos = new Float32Array(Math.max(list.length, 1) * 6), col = new Float32Array(Math.max(list.length, 1) * 6);
    list.forEach((l, i) => { const a = new THREE.Color(dotOf(l._S)), b = new THREE.Color(dotOf(l._T)); col.set([a.r, a.g, a.b, b.r, b.g, b.b], i * 6); });
    geo.setPositions(pos); geo.setColors(col);
    hl.mesh.geometry.dispose(); hl.mesh.geometry = geo; hl.mesh.visible = list.length > 0;
    if (list.length) updateHL();
  }
  function updateHL() {
    const buf = (hl.mesh.geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute).data, arr = buf.array as Float32Array;
    hl.list.forEach((l, i) => { const o = i * 6; arr[o] = l._S.x!; arr[o + 1] = l._S.y!; arr[o + 2] = l._S.z!; arr[o + 3] = l._T.x!; arr[o + 4] = l._T.y!; arr[o + 5] = l._T.z!; });
    buf.needsUpdate = true;
  }


  // ---------------------------------------------------------------- highlight
  const focusSetOf = (n: EngineNode) => { const s = new Set([n.id]); for (const id of nbr.get(n.id)!) if (visible(byId.get(id)!)) s.add(id); return s; };
  function retarget() {
    const now = performance.now() - S.t0;
    const F = S.focus, P = S.preview && S.preview !== S.sel ? S.preview : null, PN = P ? nbr.get(P.id)! : null;
    for (const n of nodes) {
      let o = visible(n) && now >= n._appear ? 1 : 0;
      if (o && F && !F.has(n.id)) o = P && (n === P || PN!.has(n.id)) ? 0.55 : 0.12;
      n._ot = o; n._st = n === S.sel ? 1.45 : n === P ? 1.3 : 1;
    }
    for (const l of links) {
      const on = l._S._ot > 0 && l._T._ot > 0;
      let a = on ? KIND_A[l.kind] : 0;
      if (on && F) a = l._S === S.sel || l._T === S.sel ? 0.55 : F.has(l.s) && F.has(l.t) ? 0.16 : 0.025;
      if (on && P && (l._S === P || l._T === P)) a = Math.max(a, 0.7);
      l._at = a;
    }
  }

  // ---------------------------------------------------------------- labels
  // Names are budgeted so the map stays fluid. Always named: subjects, featured
  // notes, the selection and the hovered note. On top of that, up to NAME_BUDGET
  // notes that are on screen right now, most cited first; the pick is redone when
  // the camera stops, so zooming in reveals the names of what is close. While the
  // camera moves, only the fixed names follow it. Overlapping tags stay hidden.
  const NAME_BUDGET = 40, FOCUS_BUDGET = 40, SETTLE_MS = 220;
  type LabelEl = HTMLDivElement & { _n: EngineNode; _w: number; _h: number; _p: number; _o: string; _t: string; _v: string; _z: string; _html: string; _on: boolean };
  const labels = new Map<string, LabelEl>();
  const dirty: LabelEl[] = [];
  let ordered: LabelEl[] = [];
  let moving = false, settleTimer = 0;
  const prio = (n: EngineNode) =>
    n === S.sel ? 9 : n === S.preview ? 8
      : (n.type === "topic" ? 5 : n.featured ? 4 : 2 + Math.min(0.9, Math.log1p(n.incoming) / 6)) + (S.focus && S.focus.has(n.id) ? 2 : 0);
  function onScreenNotes() {
    const out: EngineNode[] = [];
    for (const n of nodes) {
      if (n.type !== "note" || n.featured || !visible(n) || n.x === undefined || n._ot <= 0.05) continue;
      const p = project(n);
      if (p.front && p.x > 0 && p.x < W && p.y > 0 && p.y < H) out.push(n);
    }
    return out.sort((a, b) => b.incoming - a.incoming).slice(0, NAME_BUDGET);
  }
  function labelSet() {
    const want = new Set<EngineNode>();
    for (const n of nodes) if (visible(n) && (n.type === "topic" || (detailed && n.featured))) want.add(n);
    // with a note selected, only its neighbourhood is in full colour, so only it gets names
    if (S.focus) [...S.focus].map((id) => byId.get(id)!).sort((a, b) => b.val - a.val).slice(0, detailed ? FOCUS_BUDGET : 24).forEach((n) => want.add(n));
    else if (detailed && !moving) onScreenNotes().forEach((n) => want.add(n));
    if (S.sel) want.add(S.sel);
    if (S.preview && visible(S.preview)) want.add(S.preview);
    return want;
  }
  // camera moving: drop the extra names now, pick them again once it settles
  function markMoving() {
    if (!moving) { moving = true; if (!S.focus) refreshLabels(); }
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => { moving = false; if (!disposed) refreshLabels(); }, SETTLE_MS);
  }
  const labelClass = (n: EngineNode) => (n.type === "topic" ? "topic" : n.featured ? "section" : n.shape === "oct" ? "tool" : n.shape === "gem" ? "term" : "page");
  function refreshLabels() {
    const want = labelSet();
    // tags leave the layout (display: none) but are kept, so coming back costs no re-measure
    for (const el of labels.values()) {
      const on = want.has(el._n);
      if (el._on === on) continue;
      el._on = on; el.style.display = on ? "" : "none";
      if (!on) { el.style.visibility = el._v = "hidden"; el.style.opacity = el._o = "0"; }
    }
    for (const n of want) {
      let el = labels.get(n.id);
      if (!el) {
        el = document.createElement("div") as LabelEl;
        el.className = `wm-lb wm-lb--${labelClass(n)}`;
        el.style.setProperty("--dot", cssDot(n));
        el.dataset.id = n.id; el.style.opacity = "0"; el.style.visibility = "hidden";
        el._o = "0"; el._t = el._v = el._z = el._html = ""; el._on = true;
        labelBox.appendChild(el); labels.set(n.id, el); el._n = n;
      }
      const html = (n === S.sel ? "1" : "0") + (n.type === "topic" ? `<b>${esc(n.code)}</b>${esc(n.label)}` : esc(clip(n.label, n === S.sel ? 64 : 40)));
      if (el._html !== html) {
        el.innerHTML = html.slice(1);
        el.classList.toggle("is-sel", n === S.sel);
        el._html = html; dirty.push(el);
      } else if (!el._w) dirty.push(el); // measured while hidden: try again
      el._p = prio(n);
    }
    // measure only the tags whose text or style changed (one layout pass, not hundreds)
    for (const el of dirty.splice(0)) { el._w = el.offsetWidth; el._h = el.offsetHeight; }
    ordered = [...labels.values()].filter((el) => el._on).sort((a, b) => b._p - a._p);
  }
  const onLabelClick = (e: MouseEvent) => { const el = (e.target as HTMLElement).closest<HTMLElement>(".wm-lb"); if (el) callbacks.onPick(el.dataset.id!); };
  const onLabelOver = (e: MouseEvent) => { const el = (e.target as HTMLElement).closest<HTMLElement>(".wm-lb"); if (el) setPreview(byId.get(el.dataset.id!) || null); };
  const onLabelOut = (e: MouseEvent) => { if ((e.target as HTMLElement).closest(".wm-lb")) setPreview(null); };
  labelBox.addEventListener("click", onLabelClick);
  labelBox.addEventListener("mouseover", onLabelOver);
  labelBox.addEventListener("mouseout", onLabelOut);

  const V = new THREE.Vector3();
  const project = (n: EngineNode) => { V.set(n.x!, n.y!, n.z!).project(camera); return { x: ((V.x + 1) / 2) * W, y: ((1 - V.y) / 2) * H, front: V.z < 1 && V.z > -1 }; };
  const pxRadius = (n: EngineNode, dist: number) => (n._r * n._s * (H / 2)) / (dist * Math.tan((camera.fov * Math.PI) / 360));
  // placed boxes, bucketed in a coarse screen grid so the overlap test stays cheap with hundreds of tags
  const CELL = 120;
  const grid = new Map<number, number[][]>();
  const cellKey = (cx: number, cy: number) => cx * 4096 + cy;
  const overlaps = (x0: number, y0: number, x1: number, y1: number) => {
    for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++)
      for (let cy = Math.floor(y0 / CELL); cy <= Math.floor(y1 / CELL); cy++)
        for (const r of grid.get(cellKey(cx, cy)) || []) if (x0 < r[2] && x1 > r[0] && y0 < r[3] && y1 > r[1]) return true;
    return false;
  };
  const place = (r: number[]) => {
    for (let cx = Math.floor(r[0] / CELL); cx <= Math.floor(r[2] / CELL); cx++)
      for (let cy = Math.floor(r[1] / CELL); cy <= Math.floor(r[3] / CELL); cy++) {
        const k = cellKey(cx, cy), list = grid.get(k);
        if (list) list.push(r); else grid.set(k, [r]);
      }
  };
  // style writes only when a value really changes: a still map costs no DOM work
  const put = (el: LabelEl, o: string, v: string, t: string, z: string) => {
    if (el._o !== o) { el.style.opacity = o; el._o = o; }
    if (el._v !== v) { el.style.visibility = v; el._v = v; }
    if (v === "visible" && el._t !== t) { el.style.transform = t; el._t = t; }
    if (el._z !== z) { el.style.zIndex = z; el._z = z; }
  };
  scene.onBeforeRender = () => {
    const cam = camera.position, fog = scene.fog as THREE.Fog;
    grid.clear();
    for (const el of ordered) {
      const n = el._n;
      if (n._o <= 0.05) { put(el, "0", "hidden", el._t, el._z); continue; }
      const p = project(n), d = cam.distanceTo(V.set(n.x!, n.y!, n.z!));
      const depth = clamp(1 - (d - fog.near) / (fog.far - fog.near), 0.12, 1);
      let o = n._o * (p.front ? 1 : 0) * (n === S.sel ? 1 : depth);
      const off = pxRadius(n, d) + 4, x0 = p.x - el._w / 2, y0 = p.y + off;
      const offscreen = x0 + el._w < 0 || x0 > W || y0 + el._h < 0 || y0 > H;
      if (offscreen) o = 0;
      else if (o > 0.05) {
        if (overlaps(x0, y0, x0 + el._w, y0 + el._h)) { if (el._p < 8) o = 0; }
        else place([x0 - 4, y0 - 1, x0 + el._w + 4, y0 + el._h + 1]);
      }
      put(
        el,
        o.toFixed(2),
        o < 0.03 ? "hidden" : "visible",
        `translate3d(${p.x.toFixed(1)}px,${(p.y + off).toFixed(1)}px,0) translateX(-50%)`,
        n === S.sel ? "5" : n.type === "topic" ? "3" : "1",
      );
    }
    if (S.sel) {
      const p = project(S.sel), d = cam.distanceTo(V.set(S.sel.x!, S.sel.y!, S.sel.z!)), size = pxRadius(S.sel, d) * 2 + 14;
      ring.style.transform = `translate3d(${p.x}px,${p.y}px,0)`;
      ring.style.width = ring.style.height = size + "px";
      ring.classList.toggle("is-on", p.front);
    } else ring.classList.remove("is-on");
  };

  // ---------------------------------------------------------------- camera
  // The panels float on the right, so the map is drawn shifted to their left.
  const view = { x: 0, tx: 0, w: 0, h: 0 };
  function applyView(force = false) {
    view.tx = W > 760 && panelW ? (panelW + 16) / 2 : 0;
    if (!force && Math.abs(view.x - view.tx) < 0.3 && view.w === W && view.h === H) return;
    view.x = Math.abs(view.x - view.tx) < 0.3 ? view.tx : lerp(view.x, view.tx, 0.08);
    view.w = W; view.h = H;
    camera.setViewOffset(W, H, view.x, 0, W, H);
  }
  type Flight = { t0: number; ms: number; from: THREE.Spherical; to: THREE.Spherical; target: EngineNode | (() => THREE.Vector3); start: THREE.Vector3; bump: number; live: (() => number) | null };
  let flight: Flight | null = null;
  const SPH = new THREE.Spherical();
  function fly(target: Flight["target"], dist: number | (() => number), { ms = 1800, turn = 1.05 } = {}) {
    if (REDUCED) { ms = 350; turn = 0; }
    const live = typeof dist === "function" ? dist : null;
    let d = live ? live() : (dist as number);
    if (!isFinite(d)) d = 600;
    const from = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    const to = new THREE.Spherical(d, clamp(lerp(from.phi, 1.18, 0.55), 0.45, 2.4), from.theta + turn);
    flight = { t0: performance.now(), ms, from, to, target, start: controls.target.clone(), bump: Math.min(from.radius, d) * 0.32 + Math.abs(from.radius - d) * 0.1, live };
    controls.autoRotate = false;
  }
  function stepFlight(now: number) {
    if (flight) markMoving();
    if (!flight) return;
    const f = flight, k = clamp((now - f.t0) / f.ms, 0, 1), e = ease(k);
    if (f.live) { const d = f.live(); if (isFinite(d)) f.to.radius = d; }
    const tgt = typeof f.target === "function" ? f.target() : new THREE.Vector3(f.target.x || 0, f.target.y || 0, f.target.z || 0);
    const look = f.start.clone().lerp(tgt, e);
    SPH.set(lerp(f.from.radius, f.to.radius, e) + Math.sin(Math.PI * e) * f.bump, lerp(f.from.phi, f.to.phi, e), lerp(f.from.theta, f.to.theta, e));
    camera.position.setFromSpherical(SPH).add(look);
    camera.lookAt(look); controls.target.copy(look);
    if (k >= 1) { flight = null; resumeSpin(); }
  }
  const fitDistance = (r: number) => {
    const w = W - (W > 760 && panelW ? panelW + 32 : 0);
    return (r * H) / (Math.tan((camera.fov * Math.PI) / 360) * Math.max(160, Math.min(w, H)));
  };
  const shown = () => nodes.filter((n) => visible(n) && n.x !== undefined);
  function homeCenter() { const vis = shown(), c = new THREE.Vector3(); for (const n of vis) c.add(V.set(n.x!, n.y!, n.z!)); return c.divideScalar(vis.length || 1); }
  function homeDistance() {
    const c = homeCenter();
    const d = shown().map((n) => Math.hypot(n.x! - c.x, n.y! - c.y, n.z! - c.z)).sort((a, b) => a - b);
    return clamp(fitDistance(d[Math.floor(d.length * 0.92)] || 120) * 0.98, 120, 2400);
  }
  function focusDistance(n: EngineNode) {
    const d = [...(S.focus || [])].filter((id) => id !== n.id).map((id) => { const m = byId.get(id)!; return Math.hypot(m.x! - n.x!, m.y! - n.y!, m.z! - n.z!); }).sort((a, b) => a - b);
    const r = d.length ? Math.min(d[Math.floor((d.length - 1) * 0.85)], d[Math.floor((d.length - 1) / 2)] * 2.2) : n._r * 6;
    return clamp(fitDistance(r) * 1.1, n._r * 9, 1600);
  }
  let spinTimer = 0;
  function resumeSpin() { window.clearTimeout(spinTimer); controls.autoRotate = spin && !flight; controls.autoRotateSpeed = S.sel ? 0.22 : 0.45; }
  const onStart = () => { flight = null; controls.autoRotate = false; window.clearTimeout(spinTimer); };
  const onEnd = () => { window.clearTimeout(spinTimer); spinTimer = window.setTimeout(resumeSpin, 5000); };
  controls.addEventListener("start", onStart);
  controls.addEventListener("end", onEnd);
  controls.addEventListener("change", markMoving);

  // GaaS applies CSS zoom to the page. The renderer reads the pointer as
  // pageX - container offset (viewport pixels) but lays out in CSS pixels, so
  // hover and click would drift by the zoom factor. Rewrite the coordinates
  // into the container's own pixels before the renderer sees them.
  const adjust = (event: Event) => {
    const e = event as PointerEvent;
    if (!(e.target instanceof Node) || !stage.contains(e.target)) return;
    const rect = stage.getBoundingClientRect(), scale = rect.width / Math.max(1, stage.offsetWidth) || 1;
    if (Math.abs(scale - 1) < 0.001) return;
    const sl = window.pageXOffset || document.documentElement.scrollLeft, st = window.pageYOffset || document.documentElement.scrollTop;
    Object.defineProperty(e, "pageX", { value: rect.left + sl + (e.clientX - rect.left) / scale });
    Object.defineProperty(e, "pageY", { value: rect.top + st + (e.clientY - rect.top) / scale });
  };
  const POINTER = ["pointermove", "pointerdown", "pointerup"];
  POINTER.forEach((t) => window.addEventListener(t, adjust, { capture: true }));

  const resizer = new ResizeObserver(() => {
    W = Math.max(1, host.clientWidth); H = Math.max(1, host.clientHeight);
    graph.width(W).height(H);
    refreshLabels(); applyView(true);
  });
  resizer.observe(host);

  // ---------------------------------------------------------------- frame loop
  let raf = 0, lastLinks = 0, lastIntro = 0, booted = false;
  function frame(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (!booted) {
      if (!nodes.some((n) => n._core)) return;
      booted = true; S.t0 = now;
      camera.position.set(0, 120, 2300); controls.target.set(0, 0, 0);
      retarget(); refreshLabels();
      if (S.sel) fly(S.sel, () => focusDistance(S.sel!), { ms: 2400, turn: 0.9 });
      else fly(homeCenter, homeDistance, { ms: 2600, turn: 0.9 });
      callbacks.onReady();
    }
    stepFlight(now);
    if (now - S.t0 < 2600 && now - lastIntro > 80) { retarget(); lastIntro = now; }
    for (const n of nodes) {
      if (!n._core) continue;
      if (Math.abs(n._o - n._ot) > 0.004 || Math.abs(n._s - n._st) > 0.004) {
        n._o = lerp(n._o, n._ot, 0.11); n._s = lerp(n._s, n._st, 0.16);
        if (Math.abs(n._o - n._ot) <= 0.004) n._o = n._ot;
      }
      const show = n._o > 0.01;
      (n._core.material as THREE.MeshStandardMaterial).opacity = n._o;
      n._core.layers.set(show ? 0 : 1);
      n._core.scale.setScalar(coreScale(n) * n._s);
      if (n._shell) {
        (n._shell.material as THREE.ShaderMaterial).uniforms.opacity.value = n._o * (n === S.sel ? 1 : 0.75);
        n._shell.layers.set(show ? 0 : 1);
        n._shell.scale.setScalar(shellScale(n) * n._s);
      }
    }
    let lchg = false;
    for (let i = 0; i < links.length; i++) {
      const l = links[i];
      if (Math.abs(l._a - l._at) > 0.002) { l._a = lerp(l._a, l._at, 0.09); lcol[i * 8 + 3] = lcol[i * 8 + 7] = l._a; lchg = true; }
    }
    if (lchg) lgeo.attributes.color.needsUpdate = true;
    hl.o = lerp(hl.o, hl.ot, 0.07); hl.mat.opacity = hl.o;
    if (now - lastLinks > 32 || flight) { updateLinkPositions(); lastLinks = now; }
    const dist = camera.position.distanceTo(controls.target), fog = scene.fog as THREE.Fog;
    fog.near = dist * 0.95; fog.far = dist * 3.4;
    applyView();
  }
  raf = requestAnimationFrame(frame);

  // ---------------------------------------------------------------- selection
  function setPreview(n: EngineNode | null) {
    if (S.preview === n) return;
    S.preview = n; retarget(); refreshLabels();
  }
  function applySelection(n: EngineNode | null, flyTo: boolean) {
    S.sel = n && visible(n) ? n : null;
    S.focus = S.sel ? focusSetOf(S.sel) : null;
    buildHL(S.sel ? links.filter((l) => (l._S === S.sel || l._T === S.sel) && visible(l._S) && visible(l._T)) : []);
    hl.ot = S.sel ? 1 : 0;
    if (S.sel) ring.style.setProperty("--dot", cssDot(S.sel));
    retarget(); refreshLabels();
    if (!booted || !flyTo) return;
    if (S.sel) { const sel = S.sel; fly(sel, () => focusDistance(sel), { ms: 1600, turn: 0.55 }); }
    else resumeSpin();
  }

  return {
    setVisible(fn) {
      visibleFn = fn;
      if (S.sel && !visible(S.sel)) applySelection(null, false);
      else if (S.sel) applySelection(S.sel, false);
      else { retarget(); refreshLabels(); }
      if (booted) fly(homeCenter, homeDistance, { ms: 1300, turn: 0.35 });
    },
    select(id) {
      const n = id ? byId.get(id) || null : null;
      if (n === S.sel) return;
      applySelection(n, true);
    },
    preview(id) { setPreview(id ? byId.get(id) || null : null); },
    setDetailed(value) { detailed = value; refreshLabels(); },
    setPanel(width) { panelW = width; },
    setSpin(value) { spin = value; resumeSpin(); },
    frameAll() { fly(homeCenter, homeDistance, { ms: 1400, turn: 0.45 }); },
    recolor() {
      readColors();
      (scene.fog as THREE.Fog).color.copy(PAPER);
      for (const n of nodes) {
        (n._core?.material as THREE.MeshStandardMaterial | undefined)?.color.set(dotOf(n));
        (n._shell?.material as THREE.ShaderMaterial | undefined)?.uniforms.color.value.set(dotOf(n));
      }
      paintLineColors(); lgeo.attributes.color.needsUpdate = true;
      if (hl.list.length) buildHL(hl.list);
    },
    reheat() { graph.d3ReheatSimulation(); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(spinTimer);
      POINTER.forEach((t) => window.removeEventListener(t, adjust, { capture: true }));
      resizer.disconnect();
      labelBox.removeEventListener("click", onLabelClick);
      labelBox.removeEventListener("mouseover", onLabelOver);
      labelBox.removeEventListener("mouseout", onLabelOut);
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      controls.removeEventListener("change", markMoving);
      window.clearTimeout(settleTimer);
      labels.forEach((el) => el.remove());
      graph._destructor();
      stage.innerHTML = "";
    },
  };
}
