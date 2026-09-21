import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  getPrintPattern,
  samplePattern,
  type PrintPattern,
} from "./printPatterns";
import {
  getPrintInfo,
  printKindColors,
  type PrintKind,
} from "../data/printGallery";
import type { ViewerState } from "./types";

function makeGeometry(pattern: PrintPattern, kind: PrintKind) {
  const positions: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const bronze = new THREE.Color("#b8864d"),
    jade = new THREE.Color(getPrintInfo(pattern.id).accent),
    ivory = new THREE.Color("#ece1b6");
  for (const move of pattern.moves) {
    if (move.kind !== kind) continue;
    const [x1, z1] = move.from,
      [x2, z2] = move.to;
    const length = Math.hypot(x2 - x1, z2 - z1);
    const nx = (-(z2 - z1) / length) * 0.023,
      nz = ((x2 - x1) / length) * 0.023;
    const y = move.layer * pattern.layerHeight;
    const first = positions.length / 3;
    for (const height of [y + 0.0005, y + pattern.layerHeight]) {
      positions.push(
        x1 + nx,
        height,
        z1 + nz,
        x1 - nx,
        height,
        z1 - nz,
        x2 - nx,
        height,
        z2 - nz,
        x2 + nx,
        height,
        z2 + nz,
      );
    }
    const color =
      kind !== "walls"
        ? new THREE.Color(printKindColors[kind])
        : pattern.id === "lantern" && (move.layer < 8 || move.layer >= 118)
          ? bronze.clone().lerp(ivory, 0.25)
          : jade.clone().lerp(ivory, (move.layer / pattern.layers) * 0.5);
    for (let i = 0; i < 8; i++) colors.push(color.r, color.g, color.b);
    for (const i of [
      0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 5, 1, 0, 4, 5, 1, 6, 2, 1, 5, 6, 2,
      7, 3, 2, 6, 7, 3, 4, 0, 3, 7, 4,
    ])
      indices.push(first + i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.setDrawRange(0, 0);
  return geometry;
}

export function PrintDemo({
  time,
  state,
  clipping,
}: {
  time: React.RefObject<number>;
  state: ViewerState;
  clipping: THREE.Plane[];
}) {
  const group = useRef<THREE.Group>(null);
  const active = useRef<THREE.Mesh>(null);
  const marker = useRef<THREE.Mesh>(null);
  const pattern = useMemo(
    () => getPrintPattern(state.printModel),
    [state.printModel],
  );
  const geometries = useMemo(
    () => ({
      walls: makeGeometry(pattern, "walls"),
      infill: makeGeometry(pattern, "infill"),
      supports: makeGeometry(pattern, "supports"),
    }),
    [pattern],
  );
  const travel = useMemo(() => {
    const vertices: number[] = [];
    for (const move of pattern.moves)
      if (move.kind === "travel")
        vertices.push(
          move.from[0],
          (move.layer + 1) * pattern.layerHeight + 0.01,
          move.from[1],
          move.to[0],
          (move.layer + 1) * pattern.layerHeight + 0.01,
          move.to[1],
        );
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setDrawRange(0, 0);
    g.computeBoundingSphere();
    return g;
  }, [pattern]);
  useEffect(
    () => () => {
      Object.values(geometries).forEach((g) => g.dispose());
      travel.dispose();
    },
    [geometries, travel],
  );
  useFrame(() => {
    if (!group.current || !active.current || !marker.current) return;
    const frame = samplePattern(time.current, state.printModel);
    group.current.position.y =
      state.printCamera === "Inspect" ? 0 : frame.baseY;
    for (const kind of ["walls", "infill", "supports"] as const)
      geometries[kind].setDrawRange(0, frame.counts[kind] * 36);
    const range = pattern.travelRanges[frame.active.layer];
    travel.setDrawRange(
      range.start * 2,
      Math.max(0, Math.min(range.count, frame.counts.travel - range.start)) * 2,
    );
    const [x, z] = frame.active.from;
    const dx = frame.x - x,
      dz = frame.z - z;
    active.current.visible =
      state.printLayers.includes(frame.active.kind) &&
      !frame.complete &&
      frame.fraction > 0;
    active.current.position.set(
      (x + frame.x) / 2,
      (frame.active.layer + 0.5) * pattern.layerHeight,
      (z + frame.z) / 2,
    );
    active.current.rotation.y = -Math.atan2(dz, dx);
    active.current.scale.set(
      Math.hypot(dx, dz),
      frame.active.extrude ? pattern.layerHeight * 0.94 : 0.008,
      frame.active.extrude ? 0.046 : 0.008,
    );
    (active.current.material as THREE.MeshStandardMaterial).color.set(
      printKindColors[frame.active.kind],
    );
    marker.current.visible = active.current.visible;
    marker.current.position.set(
      frame.x,
      (frame.active.layer + 1) * pattern.layerHeight,
      frame.z,
    );
  });
  return (
    <group ref={group}>
      {(["walls", "infill", "supports"] as const).map((kind) => (
        <mesh
          key={kind}
          name={`print-${kind}`}
          geometry={geometries[kind]}
          visible={state.printLayers.includes(kind)}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            vertexColors
            clippingPlanes={clipping}
            roughness={0.38}
            metalness={0.22}
          />
        </mesh>
      ))}
      <lineSegments
        name="print-travel"
        geometry={travel}
        visible={state.printLayers.includes("travel")}
      >
        <lineBasicMaterial
          color={printKindColors.travel}
          clippingPlanes={clipping}
          depthTest={false}
          transparent
          opacity={0.85}
        />
      </lineSegments>
      <mesh ref={active}>
        <boxGeometry />
        <meshStandardMaterial
          clippingPlanes={clipping}
          color="#f3d99a"
          emissive="#dfb155"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh ref={marker}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshBasicMaterial color="#ffe1a0" />
      </mesh>
    </group>
  );
}
