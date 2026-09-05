import * as THREE from 'three';
import { careerEntries, normalizeCareerIndex } from './career';

/** Small authored archive objects; all information comes from the public career data. */
export function makeCareerExhibit(scene: THREE.Scene, anisotropy: number) {
  const root = new THREE.Group(); scene.add(root);
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [], textures: THREE.Texture[] = [];
  const palette = { ink: '#284958', paper: '#f5e5bd', wood: '#b18b60', metal: '#ddc494' };
  const materialCache = new Map<string, THREE.MeshStandardMaterial>();
  const material = (color: string) => {
    if (!materialCache.has(color)) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: .8 });
      materialCache.set(color, m); materials.push(m);
    }
    return materialCache.get(color)!;
  };
  const add = (geometry: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D) => {
    geometries.push(geometry); const mesh = new THREE.Mesh(geometry, m);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const box = (parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: string) => {
    const mesh = add(new THREE.BoxGeometry(w, h, d), material(color), parent); mesh.position.set(x, y, z); return mesh;
  };
  function label(lines: string[], width: number, height: number, bg = palette.ink, fg = palette.paper) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
    const c = canvas.getContext('2d')!; c.fillStyle = bg; c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach((line, i) => {
      c.font = `700 ${canvas.height / (lines.length + .6)}px "PingFang SC",Arial,sans-serif`;
      c.fillText(line, 512, canvas.height * (i + .65) / (lines.length + .3), 940);
    });
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = anisotropy; textures.push(texture);
    const m = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }); materials.push(m);
    return { geometry: new THREE.PlaneGeometry(width, height), material: m };
  }
  function sign(parent: THREE.Object3D, lines: string[], width: number, height: number, bg?: string, fg?: string) {
    const spec = label(lines, width, height, bg, fg); const mesh = add(spec.geometry, spec.material, parent); mesh.castShadow = false; return mesh;
  }
  box(root, 15.6, .02, -17.2, 29, .035, 5.8, '#c6ac82').castShadow = false;
  box(root, 15.6, .05, -16.05, 28.8, .025, .12, palette.metal).castShadow = false;
  const aisleTitle = sign(root, ['走过的路，都留下了故事。'], 9.5, .7, '#c6ac82', palette.ink);
  aisleTitle.position.set(15.6, .052, -14.1); aisleTitle.rotation.x = -Math.PI / 2;
  const targets: THREE.Object3D[] = [];
  const cases = careerEntries.map(entry => {
    const group = new THREE.Group(); group.position.set(entry.x, 0, entry.z); root.add(group);
    const color = entry.kind === 'broadcast' ? '#648d95' : entry.kind === 'cards' ? '#b97659' : entry.index % 2 ? '#809799' : '#a9906d';
    const body = box(group, 0, .72, 0, 2.12, 1.18, 1.45, color);
    box(group, 0, 1.32, 0, 1.94, .055, 1.28, palette.ink);
    for (const x of [-.83, .83]) {
      box(group, x, .72, .741, .08, 1.12, .06, palette.metal);
      box(group, x, .12, 0, .25, .18, 1.55, palette.ink);
    }
    const period = sign(group, [entry.year.replace(/\s/g, '')], 1.82, .42);
    period.position.set(0, .83, .752);
    box(group, 0, 1.16, .78, .25, .3, .08, palette.metal);
    const lid = new THREE.Group(); lid.position.set(0, 1.35, -.73); group.add(lid);
    box(lid, 0, .09, .73, 2.18, .18, 1.52, color);
    for (const x of [-.83, .83]) box(lid, x, .191, .73, .08, .035, 1.45, palette.metal);
    const number = sign(lid, [`${String(entry.index + 1).padStart(2, '0')} / π`], 1.25, .5, color);
    number.position.set(0, .19, .73); number.rotation.x = -Math.PI / 2;
    const artifacts = new THREE.Group(); artifacts.position.y = .55; artifacts.scale.setScalar(.01); group.add(artifacts);
    if (entry.kind === 'broadcast') {
      box(artifacts, 0, .6, 0, .1, 1.1, .1, palette.metal);
      for (const direction of [-1, 1]) { const leg = box(artifacts, direction * .28, .1, .05, .07, .65, .07, palette.ink); leg.rotation.z = direction * -.6; }
      box(artifacts, 0, 1.46, 0, .93, 1.45, .15, palette.ink);
      const screen = sign(artifacts, ['LIVE', '影院直播'], .76, 1.18, '#9ac6be', palette.ink); screen.position.set(0, 1.47, .083);
      const lamp = add(new THREE.TorusGeometry(.76, .055, 8, 48), material(palette.metal), artifacts); lamp.position.set(0, 1.62, -.2);
    } else if (entry.kind === 'cards') {
      ['版权', '设计', '量产', '上架'].forEach((title, i) => {
        const card = new THREE.Group(); card.position.set((i - 1.5) * .45, 1.05 + (.3 - Math.abs(i - 1.5) * .1), .22 - i * .085); card.rotation.z = (i - 1.5) * -.16; artifacts.add(card);
        box(card, 0, 0, 0, .78, 1.23, .045, palette.paper);
        const face = sign(card, ['π', title], .67, 1.07, i % 2 ? '#527e87' : '#b77b57'); face.position.z = .029;
      });
    } else {
      for (let i = 0; i < 3; i++) {
        const folder = box(artifacts, (i - 1) * .35, .67 + i * .1, i * -.13, .92, 1.12, .085, i % 2 ? '#d9ba86' : palette.paper);
        folder.rotation.z = (i - 1) * -.13;
      }
      const face = sign(artifacts, ['经历', String(entry.index + 1).padStart(2, '0')], .66, .66, palette.paper, palette.ink); face.position.set(0, .9, .16);
    }
    const summary = new THREE.Group(); summary.position.set(0, 1.1, -.5); summary.rotation.y = .45; summary.scale.setScalar(.001); group.add(summary);
    const board = sign(summary, [entry.year.replace(/\s/g, ''), entry.headline], 4.3, 1.3); board.position.y = .25;
    const glow = add(new THREE.RingGeometry(1.45, 1.52, 48), new THREE.MeshBasicMaterial({ color: '#f3d69e', side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false }), group);
    materials.push(glow.material); glow.rotation.x = -Math.PI / 2; glow.position.y = .053; glow.castShadow = false;
    group.traverse(object => { if (object instanceof THREE.Mesh && object !== glow) { object.userData.careerIndex = entry.index; targets.push(object); } });
    return { group, body, lid, artifacts, summary, glow, reveal: 0, open: 0 };
  });
  let reading: number | null = null, active: number | null = null, lastTime = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    targets,
    obstacles: careerEntries.map(entry => ({ x: entry.x, z: entry.z, w: 2.15, d: 1.5 })),
    anchors: careerEntries.map(entry => ({ index: entry.index, position: new THREE.Vector3(entry.x, 1.7, entry.z + .65) })),
    setReading(index: number | null) { reading = index === null ? null : normalizeCareerIndex(index); },
    focus(index: number) {
      const entry = careerEntries[normalizeCareerIndex(index)];
      return { focus: new THREE.Vector3(entry.x, 1.65, entry.z), camera: new THREE.Vector3(entry.x + 6.2, 6.0, entry.z + 12.1) };
    },
    update(time: number, nearby: number | null) {
      const dt = Math.min(.1, Math.max(0, time - lastTime)); lastTime = time; active = nearby;
      cases.forEach((item, index) => {
        const revealTarget = reading === null && index === active ? 1 : 0, openTarget = index === reading ? 1 : 0;
        const alpha = reduced ? 1 : 1 - Math.exp(-8 * dt);
        item.reveal += (revealTarget - item.reveal) * alpha; item.open += (openTarget - item.open) * alpha;
        item.summary.visible = item.reveal > .015; item.summary.position.y = 1.15 + item.reveal * 2.4; item.summary.scale.setScalar(Math.max(.001, item.reveal));
        item.lid.rotation.x = -1.22 * item.open;
        item.artifacts.visible = item.open > .02; item.artifacts.position.y = .5 + item.open * 1.5; item.artifacts.scale.setScalar(Math.max(.001, item.open));
        (item.glow.material as THREE.MeshBasicMaterial).opacity = Math.max(item.reveal, item.open) * .8;
      });
    },
    state: () => ({ active, reading, open: cases.map(item => +item.open.toFixed(3)) }),
    dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); scene.remove(root); },
  };
}
