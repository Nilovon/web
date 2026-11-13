import * as THREE from 'three';
import { products, pad, type Product } from '../data/products';

const SLAB = { w: 3.2, h: 0.28, d: 2.2 };
const SANS = '"Schibsted Grotesk"';
const MONO = '"IBM Plex Mono"';

function slabTexture(product: Product, index: number) {
  const { bg, fg } = product.slab;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 704;
  const g = canvas.getContext('2d')!;

  g.fillStyle = bg;
  g.fillRect(0, 0, 1024, 704);

  g.strokeStyle = fg;
  g.globalAlpha = 0.22;
  g.lineWidth = 2;
  g.setLineDash([8, 8]);
  g.beginPath();
  g.moveTo(64, 150);
  g.lineTo(960, 150);
  g.stroke();
  g.setLineDash([]);

  g.globalAlpha = 0.75;
  g.fillStyle = fg;
  g.font = `500 30px ${MONO}`;
  g.fillText(`${pad(index + 1)}  ${product.kind}`, 64, 108);
  g.textAlign = 'right';
  g.fillText(product.license, 960, 108);
  g.textAlign = 'left';

  g.globalAlpha = 1;
  let size = 150;
  g.font = `700 ${size}px ${SANS}`;
  while (g.measureText(product.name).width > 880 && size > 60) {
    size -= 4;
    g.font = `700 ${size}px ${SANS}`;
  }
  g.fillText(product.name, 60, 610);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Exploded-view stack of product slabs in the hero. Opens once when it scrolls
 * into view, lifts the hovered slab, rotates on drag and scrolls to a product
 * on click. Legend links in the stage mirror the hover state.
 */
export async function initScene(stage: HTMLElement) {
  const mount = stage.querySelector<HTMLElement>('[data-mount]');
  if (!mount) return;
  const legend = [...stage.querySelectorAll<HTMLAnchorElement>('[data-legend]')];

  try {
    await Promise.all([
      document.fonts.load(`700 150px ${SANS}`),
      document.fonts.load(`500 30px ${MONO}`),
    ]);
  } catch {
    // Fall back to whatever font is available.
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d7cf, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 12, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 8;
  key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
  scene.add(key, key.target);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: 0.14 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const group = new THREE.Group();
  scene.add(group);
  const geometry = new THREE.BoxGeometry(SLAB.w, SLAB.h, SLAB.d);
  const edgeGeometry = new THREE.EdgesGeometry(geometry);

  const slabs = products.map((product, i) => {
    const side = new THREE.MeshStandardMaterial({ color: product.slab.side, roughness: 0.8 });
    const top = new THREE.MeshStandardMaterial({ map: slabTexture(product, i), roughness: 0.6 });
    const edges = new THREE.LineBasicMaterial({
      color: product.slab.edge,
      transparent: true,
      opacity: 0.35,
    });
    // BoxGeometry face order: +x, -x, +y (top), -y, +z, -z
    const mesh = new THREE.Mesh(geometry, [side, side, top, side, side, side]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.add(new THREE.LineSegments(edgeGeometry, edges));
    group.add(mesh);
    const tints = [side, top].map((m) => ({ material: m, base: m.color.clone() }));
    return { mesh, product, y: 0, lift: 0, dim: 1, tints };
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

  // Pointer: parallax, drag to rotate, hover to lift, click to jump.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pointerX = 0;
  let pointerY = 0;
  let drag = 0;
  let dragFrom: number | null = null;
  let dragDistance = 0;
  let hovered = -1;
  let legendHover = -1;

  const pick = (e: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(slabs.map((s) => s.mesh), false)[0];
    return hit ? slabs.findIndex((s) => s.mesh === hit.object) : -1;
  };

  const jumpTo = (i: number) => {
    document.getElementById(slabs[i].product.id)?.scrollIntoView({
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  };

  canvas.addEventListener('pointermove', (e) => {
    const box = canvas.getBoundingClientRect();
    pointerX = (e.clientX - box.left) / box.width - 0.5;
    pointerY = (e.clientY - box.top) / box.height - 0.5;
    if (dragFrom !== null) {
      const dx = e.clientX - dragFrom;
      drag += dx * 0.008;
      dragDistance += Math.abs(dx);
      dragFrom = e.clientX;
      return;
    }
    hovered = pick(e);
    canvas.style.cursor = hovered >= 0 ? 'pointer' : 'grab';
  });
  canvas.addEventListener('pointerleave', () => {
    hovered = -1;
    pointerX = 0;
    pointerY = 0;
  });
  canvas.addEventListener('pointerdown', (e) => {
    dragFrom = e.clientX;
    dragDistance = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointerup', (e) => {
    if (dragFrom !== null && dragDistance < 6) {
      const i = pick(e);
      if (i >= 0) jumpTo(i);
    }
    dragFrom = null;
    canvas.style.cursor = 'grab';
  });

  legend.forEach((link, i) => {
    link.addEventListener('pointerenter', () => (legendHover = i));
    link.addEventListener('pointerleave', () => (legendHover = -1));
    link.addEventListener('focus', () => (legendHover = i));
    link.addEventListener('blur', () => (legendHover = -1));
  });

  // Animation state
  const look = new THREE.Vector3(0, 0.6, 0);
  let explode = reducedMotion.matches ? 1 : 0;
  let opened = reducedMotion.matches;
  let rotY = -0.55;
  let last = performance.now();
  let raf = 0;
  let activeLegend = -2;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 6);

    explode += ((opened ? 1 : 0) - explode) * (reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 2.2));
    const gap = 0.32 + explode * 0.62;
    const focus = legendHover >= 0 ? legendHover : hovered;

    if (activeLegend !== focus) {
      activeLegend = focus;
      legend.forEach((link, i) => link.toggleAttribute('data-active', i === focus));
    }

    const targetRotY = rotY + drag + pointerX * 0.25;
    group.rotation.y += (targetRotY - group.rotation.y) * k;
    group.rotation.x += (pointerY * 0.06 - group.rotation.x) * k;

    slabs.forEach((slab, i) => {
      const order = slabs.length - 1 - i;
      const isFocus = focus === i;
      slab.lift += ((isFocus ? 0.22 : 0) - slab.lift) * k;
      slab.dim += ((focus < 0 || isFocus ? 1 : 0.82) - slab.dim) * k;
      slab.y = SLAB.h / 2 + order * gap + slab.lift;
      slab.mesh.position.set(0, slab.y, 0);
      slab.tints.forEach(({ material, base }) => material.color.copy(base).multiplyScalar(slab.dim));
    });

    const stackHeight = SLAB.h + (slabs.length - 1) * gap;
    look.y = stackHeight * 0.45;
    const dist = width / height < 0.9 ? 18 : 12.5;
    camera.position.set(dist * 0.62, look.y + dist * 0.55, dist * 0.6);
    camera.lookAt(look);
    key.target.position.copy(look);
    renderer.render(scene, camera);

    raf = requestAnimationFrame(frame);
  };

  // Render only while the stage is on screen; the stack opens the first time it is seen.
  new IntersectionObserver(
    ([entry]) => {
      cancelAnimationFrame(raf);
      if (entry.isIntersecting) {
        if (!opened) setTimeout(() => (opened = true), 250);
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    },
    { threshold: 0.2 },
  ).observe(stage);
}
