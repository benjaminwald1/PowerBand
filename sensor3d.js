import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* Procedural PowerBand sensor: 24 mm puck, base plate with two string slits, green LED, charge pins,
   plus a racquet string woven through the slits. Drag to rotate a full 360 degrees on both axes. */

const H = 7, R = 12;

function logoTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  x.translate(256, 262); x.transform(1, 0, -0.2, 1, 0, 0);
  x.font = '800 330px -apple-system, "SF Pro Display", Helvetica, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(0,0,0,.65)'; x.fillText('P', -3, -3);
  x.fillStyle = 'rgba(255,255,255,.22)'; x.fillText('P', 3, 3);
  x.fillStyle = '#46464c'; x.fillText('P', 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function slotPath(cx, cy, w, h) {
  const p = new THREE.Path(), r = h / 2;
  p.moveTo(cx - w / 2 + r, cy - r); p.lineTo(cx + w / 2 - r, cy - r);
  p.absarc(cx + w / 2 - r, cy, r, -Math.PI / 2, Math.PI / 2, false);
  p.lineTo(cx - w / 2 + r, cy + r);
  p.absarc(cx - w / 2 + r, cy, r, Math.PI / 2, Math.PI * 1.5, false);
  return p;
}

function build(mode) {
  const g = new THREE.Group();
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x1f1f23, roughness: 0.34, metalness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.22 });
  const rim = new THREE.MeshPhysicalMaterial({ color: 0x4a4a50, roughness: 0.32, metalness: 0.55 });

  // cap (lathe)
  const prof = [[0, H], [4, H - .03], [8, H - .35], [10.4, H - 1.0], [11.5, H - 1.9], [11.95, H - 3.0], [12, 3.3], [11.8, 2.75], [11.2, 2.6], [0, 2.6]]
    .reverse().map(([r, y]) => new THREE.Vector2(r, y));
  const cap = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), dark); g.add(cap);

  // solid base plate
  const shape = new THREE.Shape(); shape.absarc(0, 0, 11.7, 0, Math.PI * 2, false);
  const plateGeo = new THREE.ExtrudeGeometry(shape, { depth: 1.1, bevelEnabled: true, bevelThickness: .25, bevelSize: .25, bevelSegments: 4, curveSegments: 96 });
  plateGeo.rotateX(-Math.PI / 2); // extrusion goes +Y
  const plate = new THREE.Mesh(plateGeo, rim); plate.position.y = .25; g.add(plate);

  // solid core: the body is NOT hollow, only a narrow groove (~2.7 mm deep) runs around the sides
  const core = new THREE.Mesh(new THREE.CylinderGeometry(9.1, 9.1, 1.5, 96), new THREE.MeshPhysicalMaterial({ color: 0x0c0c0e, roughness: .55, metalness: .3 }));
  core.position.y = 1.95; g.add(core);

  // logo decal on top
  const decal = new THREE.Mesh(new THREE.CircleGeometry(5.2, 64), new THREE.MeshBasicMaterial({ map: logoTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  decal.rotation.x = -Math.PI / 2; decal.position.set(0, H + .015, -1.2); g.add(decal);

  // LED
  const led = new THREE.Mesh(new THREE.CapsuleGeometry(.28, 3.0, 8, 16), new THREE.MeshBasicMaterial({ color: 0xa8ff4a }));
  led.rotation.z = Math.PI / 2; led.position.set(0, H - 1.05, 7.6); led.rotation.x = .0; g.add(led);
  const glow = new THREE.Mesh(new THREE.CapsuleGeometry(.7, 3.4, 8, 16), new THREE.MeshBasicMaterial({ color: 0x7dff2a, transparent: true, opacity: .16, depthWrite: false }));
  glow.rotation.z = Math.PI / 2; glow.position.copy(led.position); g.add(glow);
  led.lookAt; // keep horizontal, sits on the curved shoulder

  // gold charge pins underneath
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 1, roughness: .28 });
  [-2.1, 2.1].forEach((px) => { const pin = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .3, 24), gold); pin.position.set(px, -.02, 0); g.add(pin); });

  const strings = new THREE.Group();
  if (mode === 'paddle') {
    // ---- full pickleball paddle: face + throat + handle, lofted from superellipse cross-sections ----
    const N = 72;
    const prof = (w, t, n) => { const out = []; for (let i = 0; i < N; i++) { const q = i / N * Math.PI * 2, c = Math.cos(q), sn = Math.sin(q); out.push([Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * w / 2, Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n) * t / 2]); } return out; };
    const YC = -12; // cross-section centre: handle top sits at y = 0 under the sensor
    const secs = [
      { z: 62, w: 33, t: 24, n: 3.2 }, { z: 58, w: 36, t: 25, n: 3.2 }, { z: 40, w: 36, t: 25, n: 3.2 }, { z: -60, w: 36, t: 25, n: 3.2 },
      { z: -74, w: 42, t: 24, n: 3.4 }, { z: -88, w: 70, t: 19, n: 3.8 }, { z: -104, w: 112, t: 15, n: 4.2 }, { z: -125, w: 140, t: 14, n: 5 }, { z: -250, w: 140, t: 14, n: 5 },
    ];
    const pos = [], col = [], idx = [];
    const GRIP = [.035, .037, .042], SKIN = [.115, .13, .15], EDGE = [.78, .96, .2];
    secs.forEach((sc) => prof(sc.w, sc.t, sc.n).forEach(([x, y]) => {
      pos.push(x, y + YC, sc.z);
      let c; if (sc.z > -80) c = GRIP; else { const u = Math.abs(y) / (sc.t / 2); c = u > .72 ? SKIN : EDGE; }
      col.push(...c);
    }));
    for (let si = 0; si < secs.length - 1; si++) for (let i = 0; i < N; i++) {
      const a0 = si * N + i, a1 = si * N + (i + 1) % N, b0 = (si + 1) * N + i, b1 = (si + 1) * N + (i + 1) % N;
      idx.push(a0, b0, a1, a1, b0, b1);
    }
    [0, secs.length - 1].forEach((si) => { const base = pos.length / 3; pos.push(0, YC, secs[si].z); col.push(...GRIP); for (let i = 0; i < N; i++) { const j = (i + 1) % N; idx.push(base, si * N + j, si * N + i); } if (si === 0) { /* butt face winding */ } });
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); pg.setIndex(idx); pg.computeVertexNormals();
    const paddle = new THREE.Mesh(pg, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .55, metalness: .1, clearcoat: .35, side: THREE.DoubleSide }));
    g.add(paddle);
    // everything belonging to the paddle moves together so the band sits at the TOP of the grip, at the pivot point
    const ZOFF = 50;
    paddle.position.z = ZOFF;
    // overgrip wrap lines on the handle (skipped where the band sits)
    const wrapMat = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: .8 });
    for (let k = 0; k < 14; k++) {
      const z = -52 + k * 7.6; if (z > -66 && z < -30) continue;
      const pts = prof(36.6, 25.6, 3.2).map(([x, y]) => new THREE.Vector3(x, y + YC, z + ZOFF));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 90, .28, 6, true), wrapMat));
    }
    // ---- the actual band: a wide, flat leather-finish strap that wraps the grip, with a pocket for the sensor and a metal keeper ----
    const BW = 32, BT = 2.4, bandMat = new THREE.MeshPhysicalMaterial({ color: 0x5b4034, roughness: .62, clearcoat: .12, side: THREE.DoubleSide });
    const inner = prof(36.2, 25.2, 3.2), outer = prof(36.2 + 2 * BT, 25.2 + 2 * BT, 3.2);
    const bp = [], bi = [];
    for (let i = 0; i < N; i++) {
      const [ix, iy] = inner[i], [ox, oy] = outer[i];
      [-BW / 2, BW / 2].forEach((zz) => { bp.push(ix, iy + YC, zz); }); // 0,1 inner z0,z1
      [-BW / 2, BW / 2].forEach((zz) => { bp.push(ox, oy + YC, zz); }); // 2,3 outer z0,z1
    }
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, a0 = i * 4, b0 = j * 4;
      bi.push(a0 + 2, b0 + 2, a0 + 3, a0 + 3, b0 + 2, b0 + 3);      // outer face
      bi.push(a0, a0 + 1, b0, b0, a0 + 1, b0 + 1);                  // inner face
      bi.push(a0, b0, a0 + 2, a0 + 2, b0, b0 + 2);                  // edge z0
      bi.push(a0 + 1, a0 + 3, b0 + 1, b0 + 1, a0 + 3, b0 + 3);      // edge z1
    }
    const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bgeo.setIndex(bi); bgeo.computeVertexNormals();
    const band = new THREE.Mesh(bgeo, bandMat); g.add(band);
    // stitching along both edges
    const thread = new THREE.MeshStandardMaterial({ color: 0xd6b894, roughness: .7 });
    [-BW / 2 + 2.6, BW / 2 - 2.6].forEach((zz) => {
      const pts = prof(36.2 + 2 * BT + .25, 25.2 + 2 * BT + .25, 3.2).map(([x, y]) => new THREE.Vector3(x, y + YC, zz));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 160, .2, 6, true), thread));
    });
    // metal keeper on the side of the grip
    const metal = new THREE.MeshPhysicalMaterial({ color: 0x8a8a90, metalness: 1, roughness: .28 });
    const kIn = prof(36.2 + 2 * BT + .1, 25.2 + 2 * BT + .1, 3.2), kOut = prof(36.2 + 2 * BT + 2.6, 25.2 + 2 * BT + 2.6, 3.2);
    const kp = [], ki = [], KW = 9, ks = [];
    for (let i = 0; i < N; i++) { const q = i / N * 2 * Math.PI; if (Math.cos(q) > .93) ks.push(i); }
    ks.forEach((i) => { [-KW / 2, KW / 2].forEach((zz) => kp.push(kIn[i][0], kIn[i][1] + YC, zz)); [-KW / 2, KW / 2].forEach((zz) => kp.push(kOut[i][0], kOut[i][1] + YC, zz)); });
    for (let k = 0; k < ks.length - 1; k++) { const a0 = k * 4, b0 = (k + 1) * 4; ki.push(a0 + 2, b0 + 2, a0 + 3, a0 + 3, b0 + 2, b0 + 3, a0, a0 + 1, b0, b0, a0 + 1, b0 + 1, a0, b0, a0 + 2, a0 + 2, b0, b0 + 2, a0 + 1, a0 + 3, b0 + 1, b0 + 1, a0 + 3, b0 + 3); }
    ki.push(2, 3, 0, 0, 3, 1); const ke = (ks.length - 1) * 4; ki.push(ke + 2, ke, ke + 3, ke + 3, ke, ke + 1);
    const kgeo = new THREE.BufferGeometry(); kgeo.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3)); kgeo.setIndex(ki); kgeo.computeVertexNormals();
    g.add(new THREE.Mesh(kgeo, new THREE.MeshPhysicalMaterial({ color: 0x8a8a90, metalness: 1, roughness: .28, side: THREE.DoubleSide })));
    // sensor pocket in the band (visible when the sensor is detached)
    const pocket = new THREE.Mesh(new THREE.CylinderGeometry(12.6, 12.6, .5, 72), new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: .8 }));
    pocket.position.y = 25.2 / 2 + BT + YC - .1; g.add(pocket);
    const TOPY = 25.2 / 2 + BT + YC + .2;
    // sensor lifts out of / drops into the band
    const sensorParts = g.children.filter((c) => ![paddle, strings, band, pocket].includes(c) && c.geometry && c.geometry.type !== 'TubeGeometry' && c.geometry !== kgeo && c.material !== metal && c.material !== wrapMat && c.material !== bandMat);
    const holder = new THREE.Group(); sensorParts.forEach((c) => { g.remove(c); holder.add(c); }); holder.position.y = TOPY; g.add(holder);
    let target = 1, cur = 1, last = performance.now();
    g.userData.api = {
      toggle() { target = target ? 0 : 1; return !!target; },
      get attached() { return !!target; },
      tick() {
        const now = performance.now(), dt = Math.min((now - last) / 1000, .05); last = now;
        if (Math.abs(cur - target) < .0005) { cur = target; return; }
        cur += Math.sign(target - cur) * Math.min(Math.abs(target - cur), dt * 1.15);
        const e = cur * cur * (3 - 2 * cur);
        holder.position.y = TOPY + (1 - e) * 46;
      },
    };
    g.userData.strings = strings;
  } else {
    // woven racquet string bed: a square grid, 19.6 mm between strings both ways, alternating over/under at every crossing.
    // The sensor sits in the MIDDLE of one cell: its groove (radius ~9.8) grips all four surrounding strings,
    // two mains (x = +/-9.8) and two crosses (z = +/-9.8).
    const nylon = new THREE.MeshPhysicalMaterial({ color: 0xc6e830, roughness: .38, clearcoat: .5 });
    const SP = 19.6, A = .66, R = .6, G = [-49, -29.4, -9.8, 9.8, 29.4, 49];
    const sm = (e0, e1, v) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const tube = (pts) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .3), pts.length * 3, R, 10, false), nylon);
    const cosw = (v) => Math.cos(Math.PI * (v - 9.8) / SP);
    G.forEach((x, i) => { // main strings run along Z
      const si = i % 2 === 0 ? 1 : -1, pts = [];
      for (let z = -62; z <= 62.01; z += 2.45) {
        let y = A * si * cosw(z);
        if (Math.abs(x) === 9.8) { const w = 1 - sm(6.5, 11.5, Math.abs(z)); y += (1.95 - y) * w; } // lifted into the sensor groove
        pts.push(new THREE.Vector3(x, y, z));
      }
      strings.add(tube(pts));
    });
    G.forEach((z) => { // cross strings run along X; at every crossing they sit on the opposite side of the main
      const cj = cosw(z), pts = [];
      for (let x = -62; x <= 62.01; x += 2.45) {
        let y = A * cj * cosw(x);
        if (Math.abs(z) === 9.8) { const w = 1 - sm(6.5, 11.5, Math.abs(x)); y += (1.95 - y) * w; } // lifted into the sensor groove
        pts.push(new THREE.Vector3(x, y, z));
      }
      strings.add(tube(pts));
    });
  }
  strings.name = 'strings'; g.add(strings);
  return g;
}

export function mount(el) {
  const mode = el.dataset.mode || 'racquet';
  const canvas = el.querySelector('canvas'); if (!canvas || canvas.__mounted) return; canvas.__mounted = true;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(30, 50, 40); scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 1.2); fill.position.set(-40, -20, 30); scene.add(fill);
  const back = new THREE.DirectionalLight(0xffffff, 1.4); back.position.set(-10, 30, -50); scene.add(back);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a95, 0.9));
  const cam = new THREE.PerspectiveCamera(26, 1, 1, 400); cam.position.set(0, 0, 74);

  const obj = build(mode); scene.add(obj);
  const camZ = mode === 'paddle' ? 360 : 98;
  scene.fog = mode === 'paddle' ? new THREE.Fog(0xf0f0f3, 400, 640) : new THREE.Fog(0xf0f0f3, 105, 175);
  obj.quaternion.setFromEuler(mode === 'paddle' ? new THREE.Euler(0.62, -0.85, 0.0) : new THREE.Euler(0.62, -0.7, 0.05));
  const strings = obj.getObjectByName('strings');
  canvas.__obj = obj; canvas.__auto = () => { auto = false; };

  const size = () => {
    const w = el.clientWidth || 400, h = el.clientHeight || 400;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    cam.position.z = camZ * (w / h < 0.9 ? 1.3 : 1);
  };
  size(); new ResizeObserver(size).observe(el);

  // 360 degree drag on both axes (no polar clamp), with inertia
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  let drag = false, lx = 0, ly = 0, vx = 0, vy = 0, auto = true, idle = 0;
  const spin = (dx, dy) => { qa.setFromAxisAngle(Y, dx); qb.setFromAxisAngle(X, dy); obj.quaternion.premultiply(qa).premultiply(qb); };
  canvas.addEventListener('pointerdown', (e) => { drag = true; auto = false; lx = e.clientX; ly = e.clientY; vx = vy = 0; canvas.setPointerCapture(e.pointerId); el.classList.add('grabbing'); el.classList.add('touched'); });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; const dx = (e.clientX - lx) * .011, dy = (e.clientY - ly) * .011; lx = e.clientX; ly = e.clientY; vx = dx; vy = dy; spin(dx, dy); });
  const up = () => { drag = false; idle = 0; el.classList.remove('grabbing'); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  const tog = el.querySelector('.vtog');
  const api = obj.userData.api;
  if (tog && api) { tog.textContent = 'Detach sensor'; tog.onclick = () => { const on = api.toggle(); tog.textContent = on ? 'Detach sensor' : 'Attach sensor'; tog.classList.toggle('on', on); }; }
  else if (tog) tog.onclick = () => { strings.visible = !strings.visible; tog.classList.toggle('on', strings.visible); };

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(el);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loop = () => {
    if (!el.isConnected) { renderer.dispose(); return; }
    requestAnimationFrame(loop);
    if (!visible) return;
    if (!drag) {
      if (Math.abs(vx) + Math.abs(vy) > 0.0004) { spin(vx, vy); vx *= .94; vy *= .94; }
      else if (auto && !reduce) spin(.0045, .0006);
      else if (!auto && ++idle > 420 && !reduce) auto = true;
    }
    if (api) api.tick();
    renderer.render(scene, cam);
  };
  loop();
}

window.mountSensor3D = mount;
if (window.__mount3d) { mount(window.__mount3d); window.__mount3d = null; }
