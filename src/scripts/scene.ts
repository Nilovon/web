import * as THREE from 'three';
import { products, pad, type Product } from '../data/products';
import type { ShowcaseController } from './showcase';

const SLAB = { w: 3.2, h: 0.3, d: 2.2 };
const FOCUS_Z = 1.5;

function slabTexture(product: Product, index: number) {
  const { bg, fg } = product.slab;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 704;
  const g = canvas.getContext('2d')!;

  g.fillStyle = bg;
  g.fillRect(0, 0, 1024, 704);

  g.strokeStyle = fg;
  g.globalAlpha = 0.28;
  g.lineWidth = 2;
  g.strokeRect(40, 40, 944, 624);
  g.beginPath();
  g.moveTo(40, 150);
  g.lineTo(984, 150);
  g.stroke();

  g.globalAlpha = 1;
  g.fillStyle = fg;
  g.font = '500 28px "JetBrains Mono"';
  g.fillText(`${pad(index + 1)} / ${product.kind}`.toUpperCase(), 76, 108);
  g.textAlign = 'right';
  g.fillText(product.badge.label.toUpperCase(), 948, 108);
  g.textAlign = 'left';

  g.fontStretch = 'ultra-expanded';
  const name = product.name.toUpperCase();
  let size = 140;
  g.font = `800 ${size}px "Archivo"`;
  while (g.measureText(name).width > 880 && size > 60) {
    size -= 4;
    g.font = `800 ${size}px "Archivo"`;
  }
  g.fillText(name, 70, 600);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

interface SlabState {
  y: number;
  z: number;
  dim: number;
  materials: THREE.MeshStandardMaterial[];
  edges: THREE.LineBasicMaterial;
}

/**
 * Exploded-view stack of product slabs. Follows the controller's scroll
 * progress, supports drag-to-rotate and click-to-focus, and draws a leader
 * line from the focused slab to its panel marker.
 */
export async function initScene(section: HTMLElement, controller: ShowcaseController) {
  const mount = section.querySelector<HTMLElement>('[data-mount]');
  const stage = section.querySelector<HTMLElement>('[data-stage]');
  const line = section.querySelector<SVGPolylineElement>('[data-line]');
  const dot = section.querySelector<SVGCircleElement>('[data-dot]');
  const markers = [...section.querySelectorAll<HTMLElement>('[data-marker]')];
  if (!mount || !stage || !line || !dot) return;

  try {
    await Promise.all([
      document.fonts.load('800 140px "Archivo"'),
      document.fonts.load('500 28px "JetBrains Mono"'),
    ]);
  } catch {
    // Fall back to whatever font is available.
  }

  const narrow = window.matchMedia('(max-width: 859px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2926, 1.1));
  const key = new THREE.SpotLight(0xfff4dc, 90, 40, 0.5, 0.6, 1.4);
  key.position.set(4, 11, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(-6, 4, -5);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: 0.55 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(24, 48, 0x34332f, 0x24231f);
  grid.position.y = 0.001;
  scene.add(grid);

  const group = new THREE.Group();
  scene.add(group);
  const geometry = new THREE.BoxGeometry(SLAB.w, SLAB.h, SLAB.d);
  const edgeGeometry = new THREE.EdgesGeometry(geometry);

  const slabs = products.map((product, i) => {
    const side = new THREE.MeshStandardMaterial({ color: product.slab.side, roughness: 0.75 });
    const top = new THREE.MeshStandardMaterial({ map: slabTexture(product, i), roughness: 0.55 });
    const edges = new THREE.LineBasicMaterial({
      color: product.slab.edge,
      transparent: true,
      opacity: 0.3,
    });
    // BoxGeometry face order: +x, -x, +y (top), -y, +z, -z
    const mesh = new THREE.Mesh(geometry, [side, side, top, side, side, side]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.add(new THREE.LineSegments(edgeGeometry, edges));
    const state: SlabState = { y: 0, z: 0, dim: 1, materials: [side, top], edges };
    group.add(mesh);
    return { mesh, state };
  });

  let width = 1;
  let height = 1;
  const resize = () => {
    const box = mount.getBoundingClientRect();
    width = Math.round(box.width) || 1;
    height = Math.round(box.height) || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(mount);

  // Pointer: parallax, drag-to-rotate, click-to-focus.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let mouseX = 0;
  let mouseY = 0;
  let drag = 0;
  let dragFrom: number | null = null;
  let dragDistance = 0;

  const pick = (e: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(slabs.map((s) => s.mesh), false)[0];
    return hit ? slabs.findIndex((s) => s.mesh === hit.object) : -1;
  };

  window.addEventListener('pointermove', (e) => {
    mouseX = e.clientX / window.innerWidth - 0.5;
    mouseY = e.clientY / window.innerHeight - 0.5;
    if (dragFrom !== null) {
      const dx = e.clientX - dragFrom;
      drag += dx * 0.008;
      dragDistance += Math.abs(dx);
      dragFrom = e.clientX;
    }
  });
  window.addEventListener('pointerup', (e) => {
    if (dragFrom !== null && dragDistance < 6 && e.target === canvas) {
      const i = pick(e);
      if (i >= 0) controller.goPhase(i + 1);
    }
    dragFrom = null;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragFrom === null) canvas.style.cursor = pick(e) >= 0 ? 'pointer' : 'grab';
  });
  canvas.addEventListener('pointerdown', (e) => {
    dragFrom = e.clientX;
    dragDistance = 0;
    canvas.style.cursor = 'grabbing';
  });

  // Animation state
  const look = new THREE.Vector3(0, 0.6, 0);
  const v = new THREE.Vector3();
  let rotY = -0.62;
  let explode = 0;
  let lastPhase = -1;
  let fade = 0;
  let anchor: { x: number; y: number } | null = null;
  let last = performance.now();
  let raf = 0;

  const hideConnector = () => {
    fade = 0;
    line.setAttribute('opacity', '0');
    dot.setAttribute('opacity', '0');
  };

  const drawConnector = (focus: number) => {
    const marker = markers[focus];
    if (!marker || narrow.matches) return hideConnector();

    const sb = stage.getBoundingClientRect();
    const cb = canvas.getBoundingClientRect();
    const { mesh, state } = slabs[focus];

    // Leftmost projected corner of the focused slab, at its center height.
    let minX = Infinity;
    for (const cx of [-1, 1])
      for (const cy of [-1, 1])
        for (const cz of [-1, 1]) {
          v.set((cx * SLAB.w) / 2, (cy * SLAB.h) / 2, (cz * SLAB.d) / 2);
          mesh.localToWorld(v).project(camera);
          minX = Math.min(minX, ((v.x + 1) / 2) * cb.width + cb.left - sb.left);
        }
    v.set(0, 0, 0);
    mesh.localToWorld(v).project(camera);
    const targetY = ((1 - v.y) / 2) * cb.height + cb.top - sb.top;
    const targetX = minX - 10;

    anchor ??= { x: targetX, y: targetY };
    anchor.x += (targetX - anchor.x) * 0.2;
    anchor.y += (targetY - anchor.y) * 0.2;

    const mb = marker.getBoundingClientRect();
    const markerX = mb.left - sb.left + mb.width / 2;
    const markerTop = mb.top - sb.top;
    const elbowY = markerTop - 20;
    const elbowX = Math.max(mb.left - sb.left + 20, cb.left - sb.left - 24);
    const x1 = Math.max(anchor.x, elbowX + 20);
    const y1 = anchor.y;

    line.setAttribute(
      'points',
      `${markerX},${markerTop - 3} ${markerX},${elbowY} ${elbowX},${elbowY} ${x1},${y1}`,
    );
    dot.setAttribute('cx', String(x1));
    dot.setAttribute('cy', String(y1));

    const settled = Math.abs(state.z - FOCUS_Z) < 0.15 && explode > 0.9;
    fade += ((settled ? 1 : 0) - fade) * 0.12;
    const opacity = String(fade * 0.9);
    line.setAttribute('opacity', opacity);
    dot.setAttribute('opacity', opacity);
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    const p = controller.progress();
    const phase = controller.phase;
    const focus = phase - 1;
    const n = controller.phaseCount;

    // Assembled in the hero phase, exploded from the first product on.
    // The gap always exceeds the slab height, so slabs never intersect.
    const explodeTarget = Math.min(1, Math.max(0, (p * n - 0.55) / 0.6));
    explode += (explodeTarget - explode) * 0.08;
    const gap = 0.36 + explode * 0.9;

    if (!reducedMotion.matches && dragFrom === null) rotY += dt * (focus < 0 ? 0.14 : 0.03);
    const targetRotY = rotY + drag + mouseX * 0.3 + (focus >= 0 ? 0.35 : 0);
    group.rotation.y += (targetRotY - group.rotation.y) * 0.07;
    group.rotation.x += (mouseY * 0.08 - group.rotation.x) * 0.06;

    slabs.forEach(({ mesh, state }, k) => {
      const isFocused = focus === k;
      const order = slabs.length - 1 - k;
      const ty = SLAB.h / 2 + order * gap;
      const tz = isFocused ? FOCUS_Z : 0;
      const td = focus < 0 || isFocused ? 1 : 0.32;
      state.y += (ty - state.y) * 0.1;
      state.z += (tz - state.z) * 0.08;
      state.dim += (td - state.dim) * 0.08;
      mesh.position.set(0, state.y, state.z);
      state.materials.forEach((m) => m.color.setScalar(state.dim));
      state.edges.opacity = 0.3 * state.dim;
    });

    const stackHeight = SLAB.h + (slabs.length - 1) * gap;
    look.y += (stackHeight * 0.5 - look.y) * 0.08;
    const dist = (width / height < 0.9 ? 17 : 13) + explode * 1.5;
    camera.position.set(dist * 0.62, look.y + dist * 0.5, dist * 0.6);
    camera.lookAt(look);
    key.target.position.copy(look);
    renderer.render(scene, camera);

    if (phase !== lastPhase) {
      lastPhase = phase;
      fade = 0;
      anchor = null;
    }
    if (focus >= 0) drawConnector(focus);
    else hideConnector();

    raf = requestAnimationFrame(frame);
  };

  // Only animate while the showcase is on screen.
  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(raf);
    if (entry.isIntersecting) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }).observe(section);
}
