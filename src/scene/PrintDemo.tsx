import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  LAYER_HEIGHT,
  PRINT_LAYERS,
  printMoves,
  samplePrint,
} from "./printPaths";

function makeGeometry() {
  const positions: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const bronze = new THREE.Color("#b8864d"),
    jade = new THREE.Color("#8fcbb4"),
    ivory = new THREE.Color("#ece1b6");
  for (const move of printMoves) {
    if (!move.extrude) continue;
    const [x1, z1] = move.from,
      [x2, z2] = move.to;
    const length = Math.hypot(x2 - x1, z2 - z1);
    const nx = (-(z2 - z1) / length) * 0.023,
      nz = ((x2 - x1) / length) * 0.023;
    const y = move.layer * LAYER_HEIGHT;
    const first = positions.length / 3;
    for (const height of [y + 0.001, y + LAYER_HEIGHT]) {
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
      move.layer < 8 || move.layer >= 118
        ? bronze.clone().lerp(ivory, 0.25)
        : jade.clone().lerp(ivory, (move.layer / PRINT_LAYERS) * 0.8);
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

export function PrintDemo({ time }: { time: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const active = useRef<THREE.Mesh>(null);
  const marker = useRef<THREE.Mesh>(null);
  const geometry = useMemo(makeGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (!group.current || !active.current || !marker.current) return;
    const frame = samplePrint(time.current);
    group.current.position.y = frame.baseY;
    geometry.setDrawRange(0, frame.deposited * 36);
    const [x, z] = frame.active.from;
    const dx = frame.x - x,
      dz = frame.z - z;
    active.current.visible =
      frame.active.extrude && !frame.complete && frame.fraction > 0;
    active.current.position.set(
      (x + frame.x) / 2,
      (frame.active.layer + 0.5) * LAYER_HEIGHT,
      (z + frame.z) / 2,
    );
    active.current.rotation.y = -Math.atan2(dz, dx);
    active.current.scale.set(Math.hypot(dx, dz), LAYER_HEIGHT * 0.94, 0.046);
    marker.current.visible = active.current.visible;
    marker.current.position.set(
      frame.x,
      (frame.active.layer + 1) * LAYER_HEIGHT,
      frame.z,
    );
  });
  return (
    <group ref={group}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.38} metalness={0.22} />
      </mesh>
      <mesh ref={active}>
        <boxGeometry />
        <meshStandardMaterial
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
