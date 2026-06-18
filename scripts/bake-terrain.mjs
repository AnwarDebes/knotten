// Render the real Kartverket terrain to a static image using three.js in a
// headless browser. The output is the high-quality static fallback for the 3D
// showpiece (mobile and low-end devices, and the prefers-reduced-motion path).
//
// Run with: node scripts/bake-terrain.mjs

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const ROOT = process.cwd();
const THREE_BUILD = `${ROOT}/node_modules/three/build`;
const heightmap = JSON.parse(fs.readFileSync("public/terrain/heightmap.json", "utf8"));
const OUT = path.join("public", "terrain", "fallback.png");
const W = 1600;
const H = 1000;

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<script type="importmap">{"imports":{"three":"/three.module.js"}}</script>
</head>
<body style="margin:0">
<script type="module">
import * as THREE from "three";
console.log("three loaded", THREE.REVISION, "heightmap?", !!window.__HEIGHTMAP);
try {
const H = window.__HEIGHTMAP;
const W = ${W}, HH = ${H};

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, HH);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#cfe0ee");

const cols = H.width, rows = H.height;
const SCALE = 1 / 30;
const wM = H.widthMeters * SCALE;
const hM = H.heightMeters * SCALE;

const geo = new THREE.PlaneGeometry(wM, hM, cols - 1, rows - 1);
geo.rotateX(-Math.PI / 2);
const pos = geo.attributes.position;
const colors = [];
const lowC = new THREE.Color("#3f6b3a");
const midC = new THREE.Color("#8a9a5b");
const highC = new THREE.Color("#b9b3a4");
const sandC = new THREE.Color("#cdbf9a");
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    const z = H.z[i];
    pos.setY(i, z * SCALE);
    const col = new THREE.Color();
    if (z < 1) col.copy(sandC);
    else if (z < 40) col.copy(lowC).lerp(midC, z / 40);
    else col.copy(midC).lerp(highC, Math.min(1, (z - 40) / 130));
    colors.push(col.r, col.g, col.b);
  }
}
geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
geo.computeVertexNormals();

const land = new THREE.Mesh(
  geo,
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }),
);
land.receiveShadow = true;
land.castShadow = true;
scene.add(land);

const sea = new THREE.Mesh(
  new THREE.PlaneGeometry(wM * 1.6, hM * 1.6),
  new THREE.MeshStandardMaterial({ color: "#27607a", roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.92 }),
);
sea.rotation.x = -Math.PI / 2;
sea.position.y = 0.02;
scene.add(sea);

const sun = new THREE.DirectionalLight("#fff4e0", 2.0);
sun.position.set(-wM * 0.4, hM * 0.7, hM * 0.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const d = wM;
sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
sun.shadow.camera.near = 1; sun.shadow.camera.far = d * 4;
scene.add(sun);
scene.add(new THREE.HemisphereLight("#dbe9f5", "#5b6b4a", 0.7));

const camera = new THREE.PerspectiveCamera(45, W / HH, 0.1, 2000);
camera.position.set(wM * 0.55, hM * 0.6, hM * 0.85);
camera.lookAt(0, 6, 0);

renderer.render(scene, camera);
console.log("rendered");
window.__done = true;
} catch (e) {
  console.log("MODULE ERROR", e.message);
}
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (url.endsWith(".js")) {
    const fp = path.join(THREE_BUILD, path.basename(url));
    if (fs.existsSync(fp)) {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(fs.readFileSync(fp));
      return;
    }
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await chromium.launch({
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on("console", (m) => console.log("[page]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.addInitScript((hm) => {
  window.__HEIGHTMAP = hm;
}, heightmap);
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => window.__done === true, { timeout: 60000 });
await page.waitForTimeout(400);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
await page.locator("canvas").screenshot({ path: OUT });
await browser.close();
server.close();
console.log(`Baked ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
