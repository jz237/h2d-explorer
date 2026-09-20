import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { parts, type Vec3 } from "../data/components";

// Original parametric reconstruction. Coordinates use 100 mm per scene unit.
// Only the outer envelope and explicitly sourced dimensions are dimensional references.
const palette = {
  frame: "#383e3d",
  shell: "#a5aeab",
  black: "#19201f",
  metal: "#adb9b7",
  green: "#86b866",
  pcb: "#164e40",
  copper: "#b99666",
};
function material(
  color: string,
  metalness = 0.4,
  roughness = 0.4,
  opacity = 1,
) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  });
}
function box(
  g: THREE.Group,
  size: Vec3,
  pos: Vec3,
  color = palette.frame,
  metal = 0.4,
  opacity = 1,
) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    material(color, metal, 0.36, opacity),
  );
  m.position.set(...pos);
  m.castShadow = opacity === 1;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
function cyl(
  g: THREE.Group,
  r: number,
  len: number,
  pos: Vec3,
  color = palette.metal,
  axis: "x" | "y" | "z" = "y",
  r2 = r,
) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r2, len, 20),
    material(color, 0.72, 0.3),
  );
  m.position.set(...pos);
  if (axis === "x") m.rotation.z = Math.PI / 2;
  if (axis === "z") m.rotation.x = Math.PI / 2;
  m.castShadow = true;
  g.add(m);
  return m;
}
function rounded(
  g: THREE.Group,
  size: Vec3,
  pos: Vec3,
  color: string,
  radius = 0.04,
  opacity = 1,
) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(...size, 2, radius),
    material(color, 0.45, 0.38, opacity),
  );
  mesh.position.set(...pos);
  mesh.castShadow = opacity === 1;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

// Holes are real geometry, not decals; dimensions remain illustrative.
function extruderFace(g: THREE.Group) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.57, -0.35);
  shape.lineTo(0.57, -0.35);
  shape.lineTo(0.64, 0.28);
  shape.quadraticCurveTo(0.62, 0.4, 0.5, 0.34);
  shape.lineTo(0.33, 0.25);
  shape.quadraticCurveTo(0, 0.44, -0.33, 0.25);
  shape.lineTo(-0.5, 0.34);
  shape.quadraticCurveTo(-0.62, 0.4, -0.64, 0.28);
  shape.closePath();
  for (const x of [-0.29, 0.29]) {
    const hole = new THREE.Path();
    hole.absellipse(x, 0.04, 0.13, 0.18, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
  }
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 1,
      steps: 1,
      curveSegments: 10,
    }),
    material("#555d5a", 0.8),
  );
  mesh.position.z = 0.34;
  g.add(mesh);
}
function tube(g: THREE.Group, points: Vec3[], radius: number, color: string) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  const m = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 40, radius, 7, false),
    material(color, 0.15, 0.5),
  );
  g.add(m);
  return m;
}
function screw(g: THREE.Group, pos: Vec3, axis: "x" | "y" | "z" = "z") {
  cyl(g, 0.034, 0.025, pos, "#798582", axis);
}
function fan(g: THREE.Group, pos: Vec3, r = 0.28, axis: "x" | "y" | "z" = "z") {
  const a = new THREE.Group();
  a.position.set(...pos);
  if (axis === "x") a.rotation.y = Math.PI / 2;
  if (axis === "y") a.rotation.x = Math.PI / 2;
  box(a, [r * 2.4, r * 2.4, 0.12], [0, 0, 0], palette.black);
  cyl(a, r, 0.14, [0, 0, 0.04], "#080d0c", "z");
  const rotor = new THREE.Group();
  rotor.name = "fan-rotor";
  rotor.position.z = 0.13;
  for (let i = 0; i < 7; i++) {
    const blade = box(
      rotor,
      [r * 0.33, r * 0.78, 0.025],
      [
        Math.sin((i / 7) * Math.PI * 2) * r * 0.52,
        Math.cos((i / 7) * Math.PI * 2) * r * 0.52,
        0,
      ],
      "#5b6863",
    );
    blade.rotation.z = (-i / 7) * Math.PI * 2 + 0.55;
  }
  cyl(rotor, r * 0.22, 0.04, [0, 0, 0.02], palette.metal, "z");
  a.add(rotor);
  for (const x of [-1, 1])
    for (const y of [-1, 1]) screw(a, [x * r, y * r, 0.09]);
  g.add(a);
}
function pcb(g: THREE.Group, w: number, h: number) {
  box(g, [w, h, 0.04], [0, 0, 0], palette.pcb, 0.2);
  for (let i = 0; i < 8; i++) {
    const x = ((i % 3) - 1) * w * 0.25,
      y = (Math.floor(i / 3) - 1) * h * 0.23;
    box(g, [w * 0.14, h * 0.13, 0.07], [x, y, 0.07], palette.black);
    box(
      g,
      [w * 0.025, h * 0.12, 0.03],
      [x + w * 0.1, y, 0.065],
      palette.copper,
    );
  }
  for (let i = 0; i < 6; i++) {
    box(
      g,
      [w * 0.025, 0.07, 0.08],
      [-w * 0.4 + i * w * 0.16, h * 0.42, 0.05],
      "#d5d1b2",
    );
  }
  for (const x of [-1, 1])
    for (const y of [-1, 1]) screw(g, [x * w * 0.44, y * h * 0.44, 0.04]);
}
function labelTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const c = canvas.getContext("2d")!;
  c.clearRect(0, 0, 512, 128);
  c.fillStyle = "#d6dedb";
  c.font = "500 66px Arial";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, 256, 64);
  return new THREE.CanvasTexture(canvas);
}
function decal(g: THREE.Group, text: string, pos: Vec3, w: number) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, w / 4),
    new THREE.MeshBasicMaterial({
      map: labelTexture(text),
      transparent: true,
      depthWrite: false,
    }),
  );
  m.position.set(...pos);
  g.add(m);
}
export function buildPart(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = id;
  switch (id) {
    case "frame": {
      box(g, [4.92, 0.46, 5.14], [0, -2.9, 0]);
      for (const z of [-2.38, 2.38]) box(g, [4.92, 0.54, 0.38], [0, 2.83, z]);
      for (const x of [-2.27, 2.27]) box(g, [0.38, 0.54, 4.4], [x, 2.83, 0]);
      for (const x of [-2.29, 2.29])
        for (const z of [-2.4, 2.4]) {
          box(g, [0.29, 5.7, 0.28], [x, 0, z]);
          box(g, [0.035, 5.4, 0.025], [x + 0.08, 0, z + 0.15], "#626d68");
          for (const y of [-2.5, 2.5]) screw(g, [x, y, z + 0.155]);
        }
      for (const x of [-1.9, 1.9])
        for (const z of [-2, 2])
          cyl(g, 0.22, 0.18, [x, -3.02, z], palette.black);
      box(g, [4.4, 0.08, 0.12], [0, 2.47, 2.2], "#d9eee0");
      decal(g, "Bambu Lab  H2D", [0.85, 2.77, 2.582], 2.15);
      break;
    }
    case "door": {
      box(g, [4.27, 4.65, 0.045], [0, -0.03, 0], "#78958c", 0.1, 0.18);
      for (const x of [-2.17, 2.17])
        box(g, [0.12, 4.89, 0.12], [x, -0.02, 0], palette.black);
      for (const y of [-2.46, 2.42])
        box(g, [4.45, 0.14, 0.12], [0, y, 0], palette.black);
      rounded(g, [0.14, 1.18, 0.19], [1.93, 0.1, 0.16], "#8c9591");
      for (const y of [-0.43, 0.63])
        box(g, [0.1, 0.08, 0.19], [1.93, y, 0.08], palette.black);
      for (const y of [-1.7, 1.7])
        box(g, [0.15, 0.36, 0.13], [-2.24, y, -0.04]);
      break;
    }
    case "left-panel":
    case "right-panel": {
      box(g, [0.09, 3.25, 4.79], [0, -1.03, 0], palette.shell, 0.65);
      box(g, [0.055, 1.7, 4.69], [0, 1.46, 0], "#56756b", 0.1, 0.25);
      for (const z of [-2.36, 2.36])
        box(g, [0.12, 5, 0.12], [0, -0.03, z], palette.frame);
      box(g, [0.12, 0.13, 4.8], [0, 0.62, 0]);
      for (let i = 0; i < 13; i++)
        box(
          g,
          [0.013, 0.025, 0.62],
          [id === "left-panel" ? -0.052 : 0.052, -2.13 + i * 0.075, -1.3],
          palette.black,
        );
      break;
    }
    case "rear-panel":
      box(g, [4.58, 5.14, 0.1], [0, 0, 0], palette.frame);
      for (let i = 0; i < 13; i++)
        box(
          g,
          [1.3, 0.035, 0.02],
          [1.1, -1.3 + i * 0.12, -0.06],
          palette.black,
        );
      break;
    case "top":
      box(g, [4.5, 0.065, 4.65], [0, 0, 0], "#72877d", 0.2, 0.23);
      for (const x of [-2.24, 2.24]) box(g, [0.07, 0.1, 4.7], [x, 0, 0]);
      break;
    case "display":
      box(g, [1.08, 0.69, 0.16], [0, 0, 0], palette.black);
      box(g, [0.93, 0.54, 0.018], [0, 0, 0.09], "#091611", 0.1);
      decal(g, "H2D", [0, 0.12, 0.102], 0.63);
      for (let i = 0; i < 3; i++)
        box(
          g,
          [0.2, 0.1, 0.02],
          [-0.29 + i * 0.29, -0.15, 0.107],
          i === 0 ? "#9dd27a" : "#34443b",
        );
      break;
    case "x-rail":
      box(g, [4.15, 0.21, 0.24], [0, 0, 0], palette.black);
      box(g, [4.03, 0.13, 0.07], [0, 0, 0.157], palette.metal, 0.9);
      for (let i = 0; i < 14; i++) screw(g, [-1.93 + i * 0.295, 0, 0.2]);
      for (const y of [-0.19, 0.19]) {
        box(g, [4.03, 0.08, 0.025], [0, y, 0.13], palette.black);
        const teeth = new THREE.InstancedMesh(
          new THREE.BoxGeometry(0.016, 0.08, 0.014),
          material("#49504c"),
          100,
        );
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < 100; i++) {
          matrix.makeTranslation(-1.98 + i * 0.04, y, 0.15);
          teeth.setMatrixAt(i, matrix);
        }
        g.add(teeth);
      }
      break;
    case "y-rods":
      for (const x of [-2.02, 2.02]) {
        cyl(g, 0.069, 4.31, [x, 0, 0], palette.metal, "z");
        for (const z of [-2.13, 2.13]) box(g, [0.24, 0.22, 0.18], [x, 0, z]);
      }
      break;
    case "belts":
      for (const x of [-1.94, 1.94]) {
        box(g, [0.035, 0.105, 4.2], [x, 0, 0], palette.black);
        for (const z of [-2.05, 2.05]) {
          cyl(g, 0.14, 0.14, [x, 0, z]);
          cyl(g, 0.17, 0.025, [x, 0.08, z]);
        }
      }
      for (const z of [-2.07, 2.07])
        box(g, [3.88, 0.11, 0.03], [0, 0, z], palette.black);
      break;
    case "motors":
      for (const x of [-1.76, 1.76]) {
        box(g, [0.48, 0.47, 0.48], [x, 0, 0], palette.black);
        box(g, [0.5, 0.06, 0.5], [x, 0.245, 0], palette.metal);
        cyl(g, 0.08, 0.22, [x, 0.38, 0]);
      }
      break;
    case "carriage":
      rounded(g, [1.36, 0.46, 0.31], [0, 0, 0], palette.metal);
      box(g, [0.63, 0.3, 0.11], [0, 0, -0.2], palette.black);
      for (const x of [-0.55, 0.55]) screw(g, [x, 0.12, 0.17]);
      break;
    case "tool-cover": {
      rounded(g, [1.34, 0.9, 0.055], [0, -0.04, 0.27], "#28342e", 0.05, 0.72);
      for (const x of [-0.7, 0.7]) {
        rounded(g, [0.11, 1.05, 0.66], [x, 0.01, -0.12], palette.shell, 0.04);
        const brace = rounded(
          g,
          [0.1, 0.66, 0.11],
          [x * 0.87, 0.04, 0.24],
          palette.metal,
          0.03,
        );
        brace.rotation.z = x < 0 ? -0.25 : 0.25;
      }
      rounded(g, [1.48, 0.1, 0.73], [0, 0.5, -0.17], palette.shell);
      for (const x of [-0.47, 0, 0.47])
        box(g, [0.035, 0.012, 0.44], [x, 0.554, -0.19], palette.black);
      rounded(g, [1.35, 0.14, 0.25], [0, -0.52, 0.16], palette.black);
      decal(g, "Bambu Lab", [0, -0.33, 0.308], 0.83);
      for (const x of [-0.24, 0.24])
        decal(g, x < 0 ? "L" : "R", [x, -0.52, 0.294], 0.11);
      break;
    }
    case "extruders":
      rounded(g, [1.25, 0.67, 0.48], [0, 0, 0], palette.black);
      for (const x of [-0.29, 0.29]) {
        cyl(g, 0.19, 0.1, [x, 0.03, 0.28], palette.metal, "z");
        cyl(g, 0.12, 0.13, [x, 0.03, 0.33], palette.copper, "z");
        cyl(g, 0.094, 0.09, [x, 0.37, 0], "#dfdec3");
        cyl(g, 0.068, 0.17, [x, 0.46, 0], palette.black);
        for (const y of [-0.29, 0.28]) screw(g, [x * 1.85, y, 0.39]);
      }
      extruderFace(g);
      cyl(g, 0.08, 0.04, [0, -0.11, 0.39], palette.metal, "z");
      break;
    case "hotend-left":
    case "hotend-right": {
      cyl(g, 0.102, 0.25, [0, 0.12, 0]);
      for (let i = 0; i < 7; i++)
        box(
          g,
          [0.25, 0.026, 0.24],
          [0, 0.04 + i * 0.047, 0],
          palette.metal,
          0.85,
        );
      cyl(g, 0.045, 0.17, [0, -0.09, 0]);
      rounded(g, [0.25, 0.15, 0.23], [0, -0.2, 0], palette.black, 0.025);
      cyl(g, 0.08, 0.092, [0, -0.319, 0], palette.metal, "y", 0.026);
      break;
    }
    case "lift":
      box(g, [0.09, 0.54, 0.1], [0, 0, 0], palette.metal);
      box(g, [0.26, 0.17, 0.08], [0.12, -0.12, 0.15]);
      box(g, [0.12, 0.06, 0.34], [0.07, -0.31, 0.12]);
      break;
    case "heater":
      for (const x of [-0.24, 0.24]) {
        box(g, [0.24, 0.17, 0.15], [x, 0, 0], palette.copper);
        tube(
          g,
          [
            [x, 0.08, 0],
            [x, 0.25, -0.08],
            [x, 0.45, -0.07],
          ],
          0.014,
          "#c96950",
        );
      }
      break;
    case "tool-fans":
      for (const x of [-0.32, 0.32]) fan(g, [x, 0, 0], 0.23);
      break;
    case "ducts":
      for (const x of [-0.48, 0.48]) {
        rounded(g, [0.19, 0.45, 0.3], [x, 0.1, 0], palette.black);
        const outlet = rounded(
          g,
          [0.42, 0.13, 0.23],
          [x * 0.7, -0.13, 0.02],
          palette.black,
          0.035,
        );
        outlet.rotation.z = x < 0 ? 0.2 : -0.2;
        box(g, [0.29, 0.045, 0.014], [x * 0.7, -0.13, 0.144], "#060b09");
      }
      break;
    case "bed":
      box(g, [3.79, 0.17, 3.63], [0, 0, 0], palette.black);
      box(g, [3.75, 0.07, 3.58], [0, 0.08, 0], palette.metal);
      for (const x of [-1.78, 1.78])
        for (const z of [-1.68, 1.68]) screw(g, [x, 0.125, z], "y");
      break;
    case "plate":
      box(g, [3.7, 0.025, 3.5], [0, 0, 0], "#a69461", 0.55);
      box(g, [0.65, 0.025, 0.22], [0, 0, 1.84], "#a69461");
      for (let i = 0; i < 19; i++) {
        box(g, [0.007, 0.002, 3.2], [-1.6 + i * 0.178, 0.015, 0], "#897c58");
        box(g, [3.2, 0.002, 0.007], [0, 0.016, -1.6 + i * 0.178], "#897c58");
      }
      break;
    case "bed-frame":
      box(g, [3.9, 0.12, 0.28], [0, 0, -1.35]);
      for (const x of [-1.65, 1.65]) box(g, [0.3, 0.12, 3.4], [x, 0, 0]);
      break;
    case "z-rods":
      for (const [x, z] of [
        [-1.97, 1.75],
        [1.97, 1.75],
        [0, -2.01],
      ]) {
        cyl(g, 0.059, 4.75, [x, 0, z]);
        cyl(g, 0.052, 4.7, [x + 0.17, 0, z], "#6f7771");
        const threads = new THREE.InstancedMesh(
          new THREE.CylinderGeometry(0.063, 0.063, 0.018, 12),
          material("#949c98", 0.72, 0.3),
          50,
        );
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < 50; i++) {
          matrix.makeTranslation(x + 0.17, -2.3 + i * 0.093, z);
          threads.setMatrixAt(i, matrix);
        }
        threads.castShadow = true;
        g.add(threads);
        box(g, [0.38, 0.2, 0.3], [x, -2.35, z]);
      }
      break;
    case "bed-sensors":
      for (const [x, z] of [
        [-1.55, 1.3],
        [1.55, 1.3],
        [0, -1.3],
      ]) {
        cyl(g, 0.13, 0.15, [x, 0, z], palette.copper);
        box(g, [0.33, 0.05, 0.29], [x, 0.1, z], palette.metal);
      }
      break;
    case "ptfe":
      for (const x of [-0.29, 0.29]) {
        const mesh = tube(
          g,
          [
            [1.2 + x * 0.5, -0.4, -2.65],
            [1.2 + x, 0.5, -1.7],
            [x + 0.4, 0.7, -0.3],
            [x, 0.12, 0.52],
            [x, -0.22, 0.52],
          ],
          0.038,
          "#c6d4cf",
        );
        mesh.name = "flexible-feed-tube";
        mesh.userData.restPositions = Float32Array.from(
          mesh.geometry.attributes.position.array,
        );
        (mesh.geometry.attributes.position as THREE.BufferAttribute).setUsage(
          THREE.DynamicDrawUsage,
        );
        mesh.frustumCulled = false;
      }
      break;
    case "ams": {
      box(g, [4.55, 0.35, 2.7], [0, -0.65, 0], palette.frame);
      box(g, [4.52, 1.45, 2.64], [0, 0.15, 0], "#5e7d70", 0.1, 0.19);
      for (let i = 0; i < 4; i++) {
        const x = -1.57 + i * 1.05;
        cyl(
          g,
          0.67,
          0.65,
          [x, 0.15, 0],
          ["#b1d993", "#dddcc8", "#7ca2c7", "#c78664"][i],
          "x",
        );
        for (const dx of [-0.37, 0.37])
          cyl(g, 0.73, 0.06, [x + dx, 0.15, 0], "#c1c8c3", "x");
        cyl(g, 0.19, 0.77, [x, 0.15, 0], palette.black, "x");
      }
      decal(g, "AMS 2 Pro", [0, -0.65, 1.37], 1.35);
      break;
    }
    case "buffer":
      box(g, [0.8, 0.49, 0.19], [0, 0, 0], palette.black);
      for (const x of [-0.25, 0.25])
        cyl(g, 0.08, 0.25, [x, 0, -0.14], palette.metal, "z");
      break;
    case "filament-sensor":
      for (const x of [-0.29, 0.29]) {
        box(g, [0.22, 0.17, 0.18], [x, 0, 0], palette.pcb);
        cyl(g, 0.045, 0.12, [x, 0.12, 0], palette.metal);
      }
      break;
    case "controller":
      pcb(g, 1.35, 1.8);
      break;
    case "tool-pcb":
      pcb(g, 1.07, 0.65);
      break;
    case "psu":
      box(g, [1.45, 0.75, 0.47], [0, 0, 0], palette.metal, 0.8);
      for (let i = 0; i < 12; i++)
        box(g, [0.035, 0.47, 0.01], [-0.6 + i * 0.108, 0, 0.24], palette.black);
      break;
    case "harness":
      for (let i = 0; i < 5; i++)
        tube(
          g,
          [
            [i * 0.035, -1.9, 0],
            [i * 0.035, -0.5, 0.08],
            [0.04, 1.4, 0.02],
            [0.45 + i * 0.035, 1.65, 0.7],
          ],
          0.018,
          ["#b89469", "#c78d72", "#61977e", "#788c99", "#303533"][i],
        );
      for (let i = 0; i < 13; i++)
        box(g, [0.16, 0.12, 0.16], [0.12, i * 0.22 - 1, 0.06], palette.black);
      break;
    case "chamber-heater":
      box(g, [0.4, 1.2, 0.8], [0, 0, 0], palette.black);
      for (let i = 0; i < 11; i++)
        box(g, [0.045, 1.1, 0.79], [-0.2 + i * 0.037, 0, 0.04], palette.metal);
      break;
    case "aux-fan":
      fan(g, [0, 0, 0], 0.46, "x");
      box(g, [0.23, 1.1, 1.2], [0.12, 0, 0], palette.black);
      for (let i = 0; i < 7; i++)
        box(g, [0.04, 0.035, 1], [0.26, -0.4 + i * 0.12, 0], "#4d5b53");
      break;
    case "filter":
      box(g, [0.17, 1.7, 1.45], [0, 0, 0], palette.black);
      for (let i = 0; i < 16; i++)
        box(g, [0.12, 1.5, 0.041], [-0.12, 0, -0.64 + i * 0.086], "#c7c5a8");
      box(g, [0.035, 1.65, 1.4], [-0.23, 0, 0], "#445145", 0.1, 0.35);
      break;
    case "exhaust":
      fan(g, [0, 0, 0], 0.5, "x");
      for (let i = 0; i < 7; i++)
        box(g, [0.16, 0.07, 1.14], [0.25, -0.55 + i * 0.18, 0], palette.shell);
      break;
    case "camera":
    case "nozzle-camera":
    case "toolhead-camera":
      box(g, [0.25, 0.21, 0.17], [0, 0, 0], palette.black);
      cyl(g, 0.083, 0.09, [0, 0, 0.12], "#485d54", "z");
      cyl(g, 0.055, 0.014, [0, 0, 0.174], "#102f35", "z");
      break;
    case "temperature-sensors":
      for (const x of [-0.25, 0.25]) {
        cyl(g, 0.027, 0.1, [x, 0, 0], palette.copper);
        tube(
          g,
          [
            [x, 0, 0],
            [x + 0.05, 0.2, 0],
            [x + 0.07, 0.35, -0.08],
          ],
          0.009,
          "#b37862",
        );
      }
      break;
    case "wiper":
      box(g, [0.54, 0.13, 0.4], [0, 0, 0], palette.black);
      for (let i = 0; i < 7; i++)
        cyl(g, 0.026, 0.14, [-0.21 + i * 0.07, 0.1, 0], "#ccbea5");
      break;
    case "chute":
      box(g, [0.73, 0.65, 0.09], [0, 0, -0.3]);
      for (const x of [-0.36, 0.36]) box(g, [0.09, 0.62, 0.65], [x, 0, 0]);
      box(g, [0.73, 0.07, 0.7], [0, -0.3, 0]);
      break;
    case "cutter":
      for (const x of [-0.55, 0.55]) {
        box(g, [0.12, 0.45, 0.07], [x, 0, 0], palette.black);
        box(g, [0.08, 0.14, 0.04], [x, -0.2, 0.04], palette.metal);
      }
      break;
  }
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.userData.baseColor =
        o.material instanceof THREE.MeshStandardMaterial
          ? o.material.color.clone()
          : null;
      const m = o.material as THREE.MeshStandardMaterial;
      o.userData.baseOpacity = m.opacity;
      o.userData.baseMetalness = m.metalness;
    }
  });
  return g;
}
export function createPrinter() {
  const root = new THREE.Group();
  root.name = "H2D educational reconstruction";
  root.scale.setScalar(0.1);
  root.userData = {
    units: "meters",
    notice: "Independent approximate reconstruction; not factory CAD.",
  };
  parts.forEach((part) => {
    const g = buildPart(part.id);
    g.position.set(...part.position);
    g.userData = {
      componentId: part.id,
      accuracy: part.accuracy,
      sourceIds: part.sources,
    };
    root.add(g);
  });
  return root;
}
