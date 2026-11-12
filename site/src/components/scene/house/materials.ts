/**
 * Materials for the outside of the houses. Patterns are drawn in the shaders from UVs in metres, so
 * boards, seams and slabs have their real sizes: board-on-board cladding (148 mm boards under 48 mm
 * battens), standing seams every 0.6 m, deck boards 145 mm wide, paving slabs 0.6 x 0.4 m.
 *
 * The windows: the house being visited has clear glass (its real rooms are drawn behind it); every
 * other house shows a room behind each pane (floor, walls, ceiling and a picture, seen in perspective
 * through the glass), lit warm at night, so the whole field reads as lived in.
 *
 * Each house can wear a look of its own (look.ts): other colours for the facade, the trim, the window
 * frames, the roof and the decking, another cladding (vertical tongue and groove, horizontal) or roof
 * (black concrete tiles, sedum on the north slope, an integrated solar roof), and any number of the 18
 * module places on its roof. A house whose own geometry is drawn apart (the configurator's house) is
 * collapsed away here, in the picture and in the shadow pass, so the merged meshes stay as they are.
 */
import * as THREE from "three";
import { twinUniforms } from "../twin/materials";
import { houseLookUniform, LOOK_GLSL, MAX_HOUSES } from "./look";

export { MAX_HOUSES };

export const houseUniforms = {
  uPV: { value: new Float32Array(MAX_HOUSES) },     // 0..1 production, lights the panels
  uLoad: { value: new Float32Array(MAX_HOUSES) },   // 0..1 use, lights the windows at dusk
  uOff: { value: new Float32Array(MAX_HOUSES) },    // 1 when the house is dark (outage, empty battery)
  uEnergy: { value: 0 },                            // 1 in the living field (energy shown)
  uVisit: { value: -1 },                            // the house being visited: clear glass, moving doors drawn apart
  uDaylight: { value: 1 },                          // 0 night .. 1 full day, for the rooms behind the glass
};

const HOUSE_GLSL = /* glsl */ `
#define MAX_HOUSES ${MAX_HOUSES}
uniform float uPV[MAX_HOUSES];
uniform float uLoad[MAX_HOUSES];
uniform float uOff[MAX_HOUSES];
uniform float uEnergy;
uniform float uVisit;
uniform float uDaylight;
uniform float uNight;
varying float vHouse;
varying float vMove;
float hHash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
// a horizontal direction along the surface, in view space (for the drawn relief)
vec3 hAlong(vec3 n) { vec3 up = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz); vec3 t = cross(n, up); return length(t) > 1e-3 ? normalize(t) : vec3(1.0, 0.0, 0.0); }
${LOOK_GLSL}
`;

/**
 * The vertex side of a house's look: a house that is drawn apart is collapsed to a point outside the
 * view (no fragment is drawn, nothing is discarded); on the roofs, the module places above the house's
 * count are collapsed the same way. Shared by the materials and their shadow-pass twins.
 */
const COLLAPSE_GLSL = /* glsl */ `
{
  int hId = int(aHouse + 0.5);
  if (texelFetch(uHouseLook, ivec2(hId, 6), 0).x > 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
#ifdef HOUSE_SLOTS
  // a module's place: shown while the house's count lies in [lo, hi] (aSlot = lo * 32 + hi; 0 is always shown)
  if (aSlot > 0.5) {
    vec4 slotStyle = texelFetch(uHouseLook, ivec2(hId, 5), 0);
    float slotCount = slotStyle.w > 0.5 ? 0.0 : slotStyle.z;
    float slotLo = floor(aSlot / 32.0), slotHi = aSlot - slotLo * 32.0;
    if (slotCount < slotLo - 0.5 || slotCount > slotHi + 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
#endif
}`;

type Aware = { overlay?: boolean; slots?: boolean };

/**
 * Adds the house index and the "moves" flag to a material; parts that move are hidden on the visited
 * house. `overlay` makes the variant for a house drawn apart (never collapsed), `slots` the variant
 * for the module places.
 */
function houseAware(m: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial, key: string, extra?: (s: THREE.WebGLProgramParametersWithUniforms) => void, aware: Aware = {}) {
  const prev = m.onBeforeCompile;
  // the patterns read the UVs (metres) in the fragment shader
  m.defines = { ...(m.defines ?? {}), USE_UV: "" };
  if (aware.slots) m.defines.HOUSE_SLOTS = "";
  if (aware.overlay) m.defines.HOUSE_OVERLAY = "";
  m.onBeforeCompile = (s, r) => {
    prev?.call(m, s, r);
    Object.assign(s.uniforms, houseUniforms, { uNight: twinUniforms.uNight, uHouseLook: houseLookUniform });
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>\nattribute float aHouse;\nattribute float aMove;\nvarying float vHouse;\nvarying float vMove;\n${aware.slots ? "attribute float aSlot;\n" : ""}${LOOK_GLSL}`)
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHouse = aHouse;\nvMove = aMove;")
      .replace("#include <project_vertex>", `#include <project_vertex>\n#ifndef HOUSE_OVERLAY${COLLAPSE_GLSL}\n#endif`);
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>\n${HOUSE_GLSL}`)
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
int hIndex = int(vHouse + 0.5);
bool hVisited = abs(vHouse - uVisit) < 0.5;
if (hVisited && vMove > 0.5) discard;`);
    extra?.(s);
  };
  m.customProgramCacheKey = () => key;
  return m;
}

/**
 * The shadow pass's depth material for the merged houses: the same collapse, so a house drawn apart
 * (and the module places not shown) throw no shadow of their old selves.
 */
export function houseDepthMaterial(slots = false) {
  const m = new THREE.MeshDepthMaterial();
  if (slots) m.defines = { HOUSE_SLOTS: "" };
  m.onBeforeCompile = (s) => {
    s.uniforms.uHouseLook = houseLookUniform;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>\nattribute float aHouse;\n${slots ? "attribute float aSlot;\n" : ""}${LOOK_GLSL}`)
      .replace("#include <project_vertex>", `#include <project_vertex>\n${COLLAPSE_GLSL}`);
  };
  m.customProgramCacheKey = () => (slots ? "house-depth-slots-v1" : "house-depth-v1");
  return m;
}

/** Board-on-board cladding: battens proud of the boards, a shadow line beside each, a little grain. */
export function claddingMaterial(aware: Aware = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.84, envMapIntensity: 0.55 });
  return houseAware(m, "house-clad-v2", (s) => {
    s.fragmentShader = s.fragmentShader
      .replace("#include <color_fragment>", `#include <color_fragment>
vec4 lkFacade = hLook(hIndex, 0);
if (lkFacade.a > 0.5) diffuseColor.rgb = lkFacade.rgb;
int cladStyle = int(hLook(hIndex, 5).x + 0.5);
float cb = fract(vUv.x / 0.196);
float cladTilt = 0.0;
if (cladStyle == 0) {
float batten = step(cb, 0.245);
float board = floor(vUv.x / 0.196);
// each board a shade of its own, fine vertical grain
diffuseColor.rgb *= 0.93 + 0.12 * hHash(board + vHouse * 7.0) + 0.05 * (hHash(floor(vUv.x * 160.0)) - 0.5);
// the board lies in the batten's shadow just beside it
diffuseColor.rgb *= mix(1.0, 0.74, (1.0 - smoothstep(0.245, 0.3, cb)) * (1.0 - batten));
diffuseColor.rgb *= mix(1.0, 1.04, batten);
} else if (cladStyle == 1) {
  // vertical tongue and groove (dobbeltfals): flush boards 120 mm on cover, a small V-groove at each joint
  float fx = fract(vUv.x / 0.12), boardV = floor(vUv.x / 0.12);
  float groove = 1.0 - smoothstep(0.0, 0.035, min(fx, 1.0 - fx));
  diffuseColor.rgb *= 0.94 + 0.1 * hHash(boardV + vHouse * 7.0) + 0.04 * (hHash(floor(vUv.x * 170.0)) - 0.5);
  diffuseColor.rgb *= 1.0 - 0.38 * groove;
  cladTilt = (fx < 0.5 ? 1.0 : -1.0) * groove;
} else {
  // horizontal boards (liggende): 145 mm courses, each lapping the one below with a shadow line under its edge
  float fy = fract(vUv.y / 0.145), course = floor(vUv.y / 0.145);
  float seg = floor(vUv.x / 4.2 + hHash(course) * 3.0);
  diffuseColor.rgb *= 0.94 + 0.1 * hHash(course * 3.1 + seg * 7.7 + vHouse * 5.0) + 0.04 * (hHash(floor(vUv.y * 140.0) + seg) - 0.5);
  diffuseColor.rgb *= mix(0.7, 1.0, smoothstep(0.0, 0.09, fy));
  diffuseColor.rgb *= mix(1.0, 1.05, smoothstep(0.85, 1.0, fy));
  cladTilt = -0.35 + 0.8 * (1.0 - smoothstep(0.0, 0.06, fy));
}`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
if (cladStyle == 0) {
// the batten's two edges turn towards the light
float tilt = (1.0 - smoothstep(0.0, 0.012, cb)) - (smoothstep(0.233, 0.245, cb) - smoothstep(0.245, 0.246, cb));
normal = normalize(normal + tilt * 0.6 * hAlong(normal));
} else if (cladStyle == 1) {
  normal = normalize(normal + cladTilt * 0.5 * hAlong(normal));
} else {
  // each course leans out at its foot: the normal turns down, the lap's edge catches the light
  vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  vec3 tUp = normalize(upV - normal * dot(upV, normal) + 1e-5);
  normal = normalize(normal + cladTilt * 0.18 * tUp);
}`);
  }, aware);
}

/**
 * Plain painted or coated surfaces: trim, frames, metal (one shader program for all three: only uniforms
 * differ). `key` says what the parts are: the trim of the painted parts follows the house's trim colour
 * (told from the other painted parts by colour: the trim is the house's own trim colour), the frames
 * follow its frame colour, the metal keeps its own.
 */
export function paintMaterial(roughness: number, metalness = 0, key = "paint", aware: Aware = {}) {
  const role = key === "paint" ? 0 : key === "frame" ? 1 : 2;
  return houseAware(new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness, envMapIntensity: 0.7 }), aware.slots ? "house-pvframe-v1" : "house-paint-v1", (s) => {
    s.uniforms.uRole = { value: role };
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uRole;")
      .replace("#include <color_fragment>", `#include <color_fragment>
if (uRole < 0.5) {
  vec4 lkTrim = hLook(hIndex, 1);
  if (lkTrim.a > 0.5) {
    vec3 dTrim = abs(diffuseColor.rgb - hLook(hIndex, 7).rgb);
    if (max(dTrim.r, max(dTrim.g, dTrim.b)) < 2e-4) diffuseColor.rgb = lkTrim.rgb;
  }
} else if (uRole < 1.5) {
  vec4 lkFrame = hLook(hIndex, 2);
  if (lkFrame.a > 0.5) diffuseColor.rgb = lkFrame.rgb;
}`);
  }, aware);
}

/**
 * The roof: standing-seam steel with a raised seam every 0.6 m down the slope; or black concrete tiles
 * in courses; or sedum on the north slope; or, on the south slope, the integrated solar roof (frameless
 * black glass modules edge to edge).
 */
export function roofMaterial(aware: Aware = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.48, metalness: 0.55, envMapIntensity: 0.85 });
  return houseAware(m, "house-roof-v1", (s) => {
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vRoofSouth;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRoofSouth = dot(normal.xz, texelFetch(uHouseLook, ivec2(int(aHouse + 0.5), 9), 0).xy) > 0.0 ? 1.0 : 0.0;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vRoofSouth;")
      .replace("#include <color_fragment>", `#include <color_fragment>
vec4 lkRoof = hLook(hIndex, 3);
if (lkRoof.a > 0.5) diffuseColor.rgb = lkRoof.rgb;
vec4 lkStyle = hLook(hIndex, 5);
// 0 standing seam, 1 tiles, 2 sedum, 3 the integrated solar roof
int roofMode = lkStyle.w > 0.5 && vRoofSouth > 0.5 ? 3 : (lkStyle.y > 1.5 && vRoofSouth < 0.5 ? 2 : (lkStyle.y > 0.5 && lkStyle.y < 1.5 ? 1 : 0));
float sx = fract(vUv.x / 0.6);
float roofTilt = 0.0;
float roofCells = 0.0;
if (roofMode == 0) {
float seam = 1.0 - smoothstep(0.0, 0.03, min(sx, 1.0 - sx));
diffuseColor.rgb *= mix(1.0, 1.25, seam);
} else if (roofMode == 1) {
  // concrete tiles: 345 mm courses, a wave every 300 mm across, each tile's shade a little its own
  float ty = fract(vUv.y / 0.345), tcourse = floor(vUv.y / 0.345);
  float tx = fract(vUv.x / 0.3 + 0.5 * mod(tcourse, 2.0)), tile = floor(vUv.x / 0.3 + 0.5 * mod(tcourse, 2.0));
  diffuseColor.rgb *= 0.9 + 0.16 * hHash(tile * 7.3 + tcourse * 13.1 + vHouse);
  diffuseColor.rgb *= mix(0.55, 1.0, smoothstep(0.0, 0.08, ty));
  diffuseColor.rgb *= 0.92 + 0.12 * sin(tx * 6.2831853);
  roofTilt = cos(tx * 6.2831853);
} else if (roofMode == 2) {
  // sedum: low succulents in green, rust and straw, a band of gravel along the eaves
  vec2 sp = vUv * 9.0;
  float n1 = hHash(floor(sp.x) + floor(sp.y) * 57.0), n2 = hHash(floor(sp.x * 0.33) * 3.7 + floor(sp.y * 0.33) * 11.0);
  vec3 green = vec3(0.07, 0.11, 0.035), rust = vec3(0.16, 0.075, 0.04), straw = vec3(0.2, 0.17, 0.09);
  vec3 sedum = mix(mix(green, rust, smoothstep(0.55, 0.9, n2)), straw, 0.35 * twinWinter());
  diffuseColor.rgb = sedum * (0.75 + 0.5 * n1);
  if (vUv.y < 0.32) diffuseColor.rgb = vec3(0.32, 0.31, 0.29) * (0.8 + 0.3 * hHash(floor(vUv.x * 30.0) + floor(vUv.y * 30.0) * 7.0));
} else {
  // frameless black glass modules (1134 x 1762 mm), each of 6 x 12 half-cut cells
  vec2 mp = vec2(vUv.x / 1.137, (vUv.y - 0.12) / 1.765);
  vec2 mf = fract(mp);
  float gap = 1.0 - smoothstep(0.0, 0.004, min(min(mf.x, 1.0 - mf.x) * 1.137, min(mf.y, 1.0 - mf.y) * 1.765));
  vec2 cf = fract(vec2(mf.x * 6.0, mf.y * 24.0));
  float cellLine = 1.0 - smoothstep(0.0, 0.03, min(min(cf.x, 1.0 - cf.x), min(cf.y, 1.0 - cf.y)));
  diffuseColor.rgb = mix(vec3(0.006, 0.008, 0.012), vec3(0.03, 0.035, 0.045), 0.5 * cellLine);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.015), gap);
  roofCells = 1.0 - gap;
}`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
if (roofMode == 1) roughnessFactor = 0.72;
else if (roofMode == 2) roughnessFactor = 0.95;
else if (roofMode == 3) roughnessFactor = 0.1;`)
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>
if (roofMode != 0) metalnessFactor = 0.0;`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
if (roofMode == 0) {
float sd = (sx < 0.5 ? 1.0 : -1.0) * (1.0 - smoothstep(0.0, 0.03, min(sx, 1.0 - sx)));
normal = normalize(normal + sd * 0.5 * hAlong(normal));
} else if (roofMode == 1) {
  normal = normalize(normal + roofTilt * 0.35 * hAlong(normal));
}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
if (roofMode == 3) totalEmissiveRadiance += vec3(1.0, 0.62, 0.18) * uEnergy * uPV[hIndex] * 0.9 * roofCells;`);
    // the sedum turns towards straw in winter, as the fields do
    s.uniforms.uWinter = twinUniforms.uWinter;
    s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uWinter;\nfloat twinWinter() { return uWinter; }");
  }, aware);
}

/** Terrace decking: 145 mm boards along the terrace with 6 mm gaps, each board its own shade. */
export function deckMaterial(aware: Aware = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, envMapIntensity: 0.5 });
  return houseAware(m, "house-deck-v1", (s) => {
    s.fragmentShader = s.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
vec4 lkDeck = hLook(hIndex, 4);
if (lkDeck.a > 0.5) {
  // the chosen boards; the fascia, joists and treads keep their shade relative to the boards
  const vec3 lumW = vec3(0.2126, 0.7152, 0.0722);
  diffuseColor.rgb = lkDeck.rgb * (dot(diffuseColor.rgb, lumW) / max(1e-4, dot(hLook(hIndex, 8).rgb, lumW)));
}
float db = vUv.y / 0.151;
float gap = smoothstep(0.955, 0.97, fract(db));
float boardId = floor(db);
float seg = floor(vUv.x / 3.6 + hHash(boardId) * 3.0);
diffuseColor.rgb *= (0.86 + 0.22 * hHash(boardId * 3.1 + seg * 7.7)) * (0.97 + 0.06 * hHash(floor(vUv.x * 40.0) + boardId));
diffuseColor.rgb *= 1.0 - 0.75 * gap;`);
  }, aware);
}

/** Concrete paving slabs 0.6 x 0.4 m with joints. */
export function pavingMaterial(aware: Aware = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, envMapIntensity: 0.5 });
  return houseAware(m, "house-paving-v1", (s) => {
    s.fragmentShader = s.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
vec2 pc = vUv / vec2(0.6, 0.4);
pc.x += 0.5 * step(0.5, fract(floor(pc.y) * 0.5));
vec2 pf = fract(pc);
float joint = 1.0 - smoothstep(0.0, 0.012, min(min(pf.x, 1.0 - pf.x) * 0.6, min(pf.y, 1.0 - pf.y) * 0.4));
diffuseColor.rgb *= (0.9 + 0.14 * hHash(dot(floor(pc), vec2(17.0, 31.0)))) * (1.0 - 0.45 * joint);`);
  }, aware);
}

/** Plinths and steps: cast concrete with a little mottling. */
export function concreteMaterial(aware: Aware = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, envMapIntensity: 0.45 });
  return houseAware(m, "house-concrete-v1", (s) => {
    s.fragmentShader = s.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
diffuseColor.rgb *= 0.94 + 0.08 * hHash(floor(vUv.x * 9.0) + floor(vUv.y * 9.0) * 13.0);`);
  }, aware);
}

/**
 * Natural-stone retaining walls (the usual answer to a drop in a Norwegian garden): granite blocks
 * in uneven courses, dark joints, each block bulging a little.
 */
export function stoneMaterial(aware: Aware = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, envMapIntensity: 0.45 });
  return houseAware(m, "house-stone-v1", (s) => {
    s.fragmentShader = s.fragmentShader
      .replace("#include <color_fragment>", `#include <color_fragment>
float course = floor(vUv.y / 0.32);
float cy = fract(vUv.y / 0.32);
float off = hHash(course * 1.7) * 0.6;
float bw = 0.45 + 0.35 * hHash(course * 3.3);
float sxs = (vUv.x + off) / bw;
float block = floor(sxs);
float cx = fract(sxs);
float joint = 1.0 - smoothstep(0.0, 0.05, min(min(cx, 1.0 - cx) * bw, min(cy, 1.0 - cy) * 0.32) / 0.025);
float tone = hHash(block * 7.1 + course * 13.3);
diffuseColor.rgb *= mix(vec3(0.82, 0.8, 0.77), vec3(1.08, 1.04, 0.98), tone) * (1.0 - 0.6 * joint);
vec2 stoneUV = vec2(cx - 0.5, cy - 0.5);`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
// each block bulges: its normal turns outwards towards its edges
normal = normalize(normal + 0.45 * (stoneUV.x * hAlong(normal) + stoneUV.y * normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));`);
  }, aware);
}

/** Railing glass: clear, a faint green edge tint, reflecting the sky. */
export function railGlassMaterial(aware: Aware = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color: "#d7e6e2", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18, envMapIntensity: 1.2, side: THREE.DoubleSide, depthWrite: false });
  if (aware.overlay) return m;
  // the merged railings: a house drawn apart is collapsed here too (nothing else changes)
  m.onBeforeCompile = (s) => {
    s.uniforms.uHouseLook = houseLookUniform;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>\nattribute float aHouse;\n${LOOK_GLSL}`)
      .replace("#include <project_vertex>", `#include <project_vertex>\n${COLLAPSE_GLSL}`);
  };
  m.customProgramCacheKey = () => "house-railglass-v1";
  return m;
}

/** Outdoor lamps: glow at night. */
export function lampMaterial(aware: Aware = {}) {
  const m = new THREE.MeshStandardMaterial({ color: "#f3ead8", roughness: 0.4 });
  return houseAware(m, "house-lamp-v1", (s) => {
    s.fragmentShader = s.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
totalEmissiveRadiance += vec3(1.0, 0.78, 0.5) * uNight * (1.0 - uOff[hIndex]) * 4.0;`);
  }, aware);
}

/** The solar module texture: dark cells with thin silver lines, painted once in the browser. */
function moduleTexture() {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0d1420"; g.fillRect(0, 0, 64, 128);
  g.strokeStyle = "#2e3a4a"; g.lineWidth = 1;
  // 6 x 12 cells, each cut in half (half-cut cells), busbars faintly
  for (let x = 0; x <= 64; x += 64 / 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
  for (let y = 0; y <= 128; y += 128 / 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); }
  g.strokeStyle = "#1c2633";
  g.beginPath(); g.moveTo(0, 64); g.lineTo(64, 64); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** The modules: glass over dark cells, lit amber in the energy view by what the roof makes. */
export function pvMaterial(aware: Aware = {}) {
  const m = new THREE.MeshPhysicalMaterial({ map: moduleTexture(), roughness: 0.16, metalness: 0.1, clearcoat: 0.7, clearcoatRoughness: 0.06, envMapIntensity: 1.2, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  return houseAware(m, "house-pv-v2", (s) => {
    s.fragmentShader = s.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
float shine = uEnergy * uPV[hIndex];
totalEmissiveRadiance += vec3(1.0, 0.62, 0.18) * shine * 0.9;`);
  }, aware);
}

/**
 * The windows. Glass reflects the sky (physically, through the environment map); behind it, for every
 * house but the one being visited, a room drawn in the shader: a ray from the eye through the pane
 * meets the room's floor, ceiling, back wall or side walls. By day the room is a fraction as bright
 * as outside, at night some rooms are lit warm (more when the energy layer says the house uses power).
 */
export function glassMaterial(aware: Aware = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color: "#0b1216", roughness: 0.035, metalness: 0, envMapIntensity: 1.25, transparent: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  return houseAware(m, "house-glass-v2", (s) => {
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 aWin;\nvarying vec4 vWin;\nvarying vec3 vGlassWorld;\nvarying vec3 vGlassNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWin = aWin;\nvGlassWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvGlassNormal = normalize(mat3(modelMatrix) * objectNormal);");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec4 vWin;
varying vec3 vGlassWorld;
varying vec3 vGlassNormal;
vec3 roomColour;
float roomLit;`)
      .replace("#include <color_fragment>", `#include <color_fragment>
roomColour = vec3(0.0);
roomLit = 0.0;
{
  vec3 N = normalize(vGlassNormal);
  vec3 r = normalize(vGlassWorld - cameraPosition);
  // the camera may be on either side of the pane: the room is always behind it, seen from outside
  if (dot(r, N) > 0.0) N = -N;
  float floorY = vWin.x;
  float seed = vWin.z;
  float depth = 4.0;
  float tBack = depth / max(1e-3, dot(r, -N));
  float tFloor = r.y < 0.0 ? (floorY - vGlassWorld.y) / r.y : 1e9;
  float tCeil = r.y > 0.0 ? (floorY + 2.6 - vGlassWorld.y) / r.y : 1e9;
  vec3 T = normalize(cross(vec3(0.0, 1.0, 0.0), N));
  float s0 = dot(vGlassWorld, T);
  float cell = 3.2;
  float rT = dot(r, T);
  float wallS = rT > 0.0 ? (floor(s0 / cell) + 1.0) * cell : floor(s0 / cell) * cell;
  float tSide = abs(rT) > 1e-4 ? (wallS - s0) / rT : 1e9;
  float t = min(min(tBack, tSide), min(tFloor, tCeil));
  vec3 h = vGlassWorld + r * t;
  float hy = h.y - floorY;
  float k = hHash(seed * 31.0 + floor(s0 / cell) * 7.0 + vHouse * 3.0);
  vec3 wallC = mix(vec3(0.82, 0.8, 0.76), mix(vec3(0.72, 0.76, 0.72), vec3(0.8, 0.74, 0.68), step(0.5, k)), step(0.6, k));
  if (t == tFloor) {
    float plank = hHash(floor(dot(h.xz, vec2(T.x, T.z)) * 5.0));
    roomColour = vec3(0.45, 0.33, 0.22) * (0.85 + 0.25 * plank);
  } else if (t == tCeil) {
    roomColour = vec3(0.86);
  } else if (t == tSide) {
    roomColour = wallC * 0.82;
  } else {
    roomColour = wallC;
    // a picture or a doorway on the back wall, a sofa or a sideboard along it
    float bs = dot(h, T);
    float bx = fract(bs / cell);
    if (hy > 1.1 && hy < 1.75 && bx > 0.3 && bx < 0.62) roomColour = mix(vec3(0.3, 0.38, 0.45), vec3(0.62, 0.45, 0.3), k);
    if (hy < 0.75 && bx > 0.12 && bx < 0.78) roomColour = mix(vec3(0.33, 0.35, 0.36), vec3(0.5, 0.45, 0.38), hHash(k * 9.0)) * (hy < 0.42 ? 0.9 : 1.0);
  }
  // light falls off into the room; curtains at the sides of some panes
  roomColour *= exp(-0.12 * max(0.0, t - 0.5));
  float curtain = step(0.55, hHash(seed * 17.0 + vHouse)) * (1.0 - smoothstep(0.06, 0.13, min(vUv.x, 1.0 - vUv.x)));
  roomColour = mix(roomColour, vec3(0.86, 0.84, 0.8), curtain * 0.85);
  // lit at night in some rooms; with the energy layer, more where the house uses power
  float lit = (1.0 - uOff[int(vHouse + 0.5)]) * max(step(0.45, hHash(seed * 5.0 + vHouse * 1.7)), uEnergy * uLoad[int(vHouse + 0.5)]);
  roomLit = lit;
  if (vWin.y > 0.5) roomColour = vec3(0.78, 0.8, 0.8);   // frosted bathroom glass
}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
{
  bool visited = abs(vHouse - uVisit) < 0.5;
  vec3 V = normalize(cameraPosition - vGlassWorld);
  float F = 0.04 + 0.96 * pow(1.0 - abs(dot(normalize(vGlassNormal), V)), 5.0);
  if (!visited) {
    float day = 0.03 + 0.2 * uDaylight;
    vec3 warm = vec3(1.0, 0.72, 0.42) * 0.9;
    totalEmissiveRadiance += roomColour * (1.0 - F) * (day + uNight * roomLit * 1.5 * warm);
  }
}`)
      .replace("#include <opaque_fragment>", `#include <opaque_fragment>
{
  bool visited = abs(vHouse - uVisit) < 0.5;
  vec3 V = normalize(cameraPosition - vGlassWorld);
  float F = 0.04 + 0.96 * pow(1.0 - abs(dot(normalize(vGlassNormal), V)), 5.0);
  // the visited house: clear glass, only its reflection (a hint of green at a grazing angle)
  gl_FragColor.a = visited ? mix(0.1, 0.85, F) : 1.0;
  if (vWin.y > 0.5 && visited) gl_FragColor = vec4(mix(gl_FragColor.rgb, vec3(0.8, 0.82, 0.82), 0.7), 0.92);
}`);
  }, aware);
}

/**
 * The house materials. `overlay`: the set for a house drawn apart (the configurator's house), never
 * collapsed and without module places (its modules are built to its count).
 */
export function houseMaterials(overlay = false) {
  const a: Aware = { overlay };
  return {
    clad: claddingMaterial(a),
    paint: paintMaterial(0.62, 0, "paint", a),
    frame: paintMaterial(0.42, 0.25, "frame", a),
    metal: paintMaterial(0.38, 0.6, "metal", a),
    // the modules' frames and rails: metal, collapsed per module place on the merged roofs
    pvframe: paintMaterial(0.38, 0.6, "metal", { overlay, slots: !overlay }),
    roof: roofMaterial(a),
    deck: deckMaterial(a),
    paving: pavingMaterial(a),
    concrete: concreteMaterial(a),
    stone: stoneMaterial(a),
    pv: pvMaterial({ overlay, slots: !overlay }),
    glass: glassMaterial(a),
    railglass: railGlassMaterial(a),
    lamp: lampMaterial(a),
  };
}
export type HouseMaterials = ReturnType<typeof houseMaterials>;

let shared: HouseMaterials | null = null;
let sharedOverlay: HouseMaterials | null = null;
/** One set for the whole page: the houses outside and the moving parts of the visited house share it. */
export function sharedHouseMaterials() {
  if (!shared) shared = houseMaterials();
  return shared;
}
/** The set for a house drawn apart (the configurator's house). */
export function overlayHouseMaterials() {
  if (!sharedOverlay) sharedOverlay = houseMaterials(true);
  return sharedOverlay;
}

let depth: { plain: THREE.MeshDepthMaterial; slots: THREE.MeshDepthMaterial } | null = null;
/** The shadow pass's materials for the merged houses (one for the module places, one for the rest). */
export function sharedHouseDepth() {
  if (!depth) depth = { plain: houseDepthMaterial(false), slots: houseDepthMaterial(true) };
  return depth;
}
