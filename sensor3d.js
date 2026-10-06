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

function build() {
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

  // racquet strings: two main strings sit in the side grooves, cross strings run underneath outside the body
  const strings = new THREE.Group();
  const nylon = new THREE.MeshPhysicalMaterial({ color: 0xf1f1ee, roughness: .38, clearcoat: .3 });
  [-9.8, 9.8].forEach((x) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 44, 16), nylon);
    m.rotation.x = Math.PI / 2; m.position.set(x, 1.95, 0); strings.add(m);
  });
  [-15, 15].forEach((z) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 34, 16), nylon);
    m.rotation.z = Math.PI / 2; m.position.set(0, .7, z); strings.add(m);
  });
  strings.name = 'strings'; g.add(strings);
  return g;
}

export function mount(el) {
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

  const obj = build(); scene.add(obj);
  obj.quaternion.setFromEuler(new THREE.Euler(0.62, -0.7, 0.05));
  const strings = obj.getObjectByName('strings');
  canvas.__obj = obj; canvas.__auto = () => { auto = false; };

  const size = () => {
    const w = el.clientWidth || 400, h = el.clientHeight || 400;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    cam.position.z = 74 * (w / h < 0.9 ? 1.3 : 1);
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
  if (tog) tog.onclick = () => { strings.visible = !strings.visible; tog.classList.toggle('on', strings.visible); };

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
    renderer.render(scene, cam);
  };
  loop();
}

window.mountSensor3D = mount;
if (window.__mount3d) { mount(window.__mount3d); window.__mount3d = null; }
