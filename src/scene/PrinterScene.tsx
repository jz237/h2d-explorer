import { useEffect, useMemo, useRef, useState } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { Grid, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { parts, type Part } from "../data/components";
import { buildPart } from "./models";
import { explodedPosition } from "./explosionTransforms";
import { CameraRig } from "./CameraRig";
import { LabelLayout } from "./LabelLayout";
import type { ViewerState } from "./types";
import { PrintDemo } from "./PrintDemo";
import { PRINT_DURATION, samplePrint } from "./printPaths";

const toolIds = new Set([
  "carriage",
  "tool-cover",
  "extruders",
  "hotend-left",
  "hotend-right",
  "lift",
  "heater",
  "tool-fans",
  "ducts",
  "tool-pcb",
  "filament-sensor",
  "nozzle-camera",
  "toolhead-camera",
  "temperature-sensors",
  "cutter",
]);
export function highlighted(p: Part, s: ViewerState) {
  if (s.tourFocus.length) return s.tourFocus.includes(p.id);
  switch (s.mode) {
    case "Motion":
      return ["Motion system", "Build platform"].includes(p.category);
    case "Filament":
      return ["Filament system", "Dual toolhead"].includes(p.category);
    case "Heat map":
      return ["hotend-left", "hotend-right", "bed", "chamber-heater"].includes(
        p.id,
      );
    case "Airflow":
      return (
        p.category === "Climate & air" || ["tool-fans", "ducts"].includes(p.id)
      );
    case "Electronics":
      return (
        p.category === "Electronics" ||
        p.category === "Sensors" ||
        p.id === "motors" ||
        p.id === "filament-sensor"
      );
    case "Maintenance":
      return Boolean(p.maintenance);
    case "Print demo":
      return ["Build platform", "Dual toolhead", "Motion system"].includes(
        p.category,
      );
    case "Dual nozzle":
      return !["Enclosure"].includes(p.category) || p.id === "frame";
    default:
      return true;
  }
}
function motion(t: number, mode?: string, nozzle = "Left") {
  if (mode === "Print demo") {
    const frame = samplePrint(t);
    return {
      x: frame.x + (nozzle === "Left" ? 0.24 : -0.24),
      z: frame.z - 0.65,
    };
  }
  return { x: Math.sin(t * 0.53) * 1.15, z: Math.cos(t * 0.37) * 1.1 };
}
function Flow({
  state,
  time,
}: {
  state: ViewerState;
  time: React.RefObject<number>;
}) {
  const particles = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const paths = useMemo(
    () =>
      (state.mode === "Airflow"
        ? [
            [
              [-1.9, 2.9, 0.2],
              [-0.8, 2.9, 0.2],
              [0.4, 2.7, 0.2],
              [1.9, 3.3, -0.9],
              [2.8, 3.5, -1.9],
            ],
            [
              [-1.9, 2.7, -1.5],
              [-1.2, 3.6, -1],
              [0, 4.4, 0],
              [0.1, 3.85, 1.1],
              [0.6, 2.4, 0.4],
            ],
          ]
        : [
            [
              [state.nozzle === "Left" ? -1.5 : 1.5, 7.5, -0.1],
              [1.2, 6.5, -2.3],
              [0.9, 6.3, -1.4],
              [state.nozzle === "Left" ? -0.24 : 0.24, 5.1, 0.52],
              [state.nozzle === "Left" ? -0.24 : 0.24, 3.7, 0.65],
            ],
          ]
      ).map(
        (ps) =>
          new THREE.CatmullRomCurve3(ps.map((p) => new THREE.Vector3(...p))),
      ),
    [state.mode, state.nozzle],
  );
  useFrame(() => {
    if (!particles.current) return;
    for (let i = 0; i < 40; i++) {
      const curve = paths[i % paths.length];
      const t = (i / 40 + time.current * 0.14) % 1;
      dummy.position.copy(curve.getPoint(t));
      dummy.scale.setScalar(state.mode === "Airflow" ? 0.055 : 0.035);
      dummy.updateMatrix();
      particles.current.setMatrixAt(i, dummy.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      {paths.map((p, i) => (
        <Line
          key={i}
          points={p.getPoints(50)}
          color={
            state.mode === "Airflow"
              ? "#73bddd"
              : state.nozzle === "Left"
                ? "#b5ed87"
                : "#acbff0"
          }
          lineWidth={1}
          transparent
          opacity={0.24}
        />
      ))}
      <instancedMesh
        ref={particles}
        args={[undefined, undefined, 40]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial
          color={
            state.mode === "Airflow"
              ? "#8ce1fa"
              : state.nozzle === "Left"
                ? "#b5ed87"
                : "#acbff0"
          }
        />
      </instancedMesh>
    </group>
  );
}
function AssemblyPart({
  part,
  state,
  onSelect,
  time,
  clipping,
  showLabel,
}: {
  part: Part;
  state: ViewerState;
  onSelect: (id: string) => void;
  time: React.RefObject<number>;
  clipping: THREE.Plane[];
  showLabel: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const model = useMemo(() => buildPart(part.id), [part.id]);
  const tubeTravel = useRef(new THREE.Vector2());
  const [hovered, setHovered] = useState(false);
  const { invalidate } = useThree();
  const hidden =
    state.hidden.includes(part.id) ||
    (!state.showAMS && part.id === "ams") ||
    (state.isolate.length > 0 && !state.isolate.includes(part.id));
  useEffect(() => {
    setHovered(false);
    document.body.style.cursor = "auto";
  }, [state.cameraKey]);
  const emphasis = highlighted(part, state);
  const isSelected = state.selected === part.id;
  const active = state.mode !== "Standard" && state.mode !== "Exploded";
  useEffect(() => {
    model.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const mat = o.material as
        THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
      mat.clippingPlanes = clipping;
      const ghost =
        state.ghost.includes(part.id) ||
        (!emphasis && active) ||
        (part.id === "tool-cover" &&
          (active ||
            Boolean(state.selected && state.selected !== "tool-cover")));
      mat.opacity = ghost ? 0.09 : o.userData.baseOpacity;
      mat.transparent = mat.opacity < 1;
      mat.depthWrite = mat.opacity >= 1;
      mat.needsUpdate = true;
      if (!(mat instanceof THREE.MeshStandardMaterial)) {
        mat.transparent = true;
        mat.depthWrite = false;
        return;
      }
      mat.color.copy(o.userData.baseColor);
      mat.emissive.set("#000000");
      mat.emissiveIntensity = 0;
      if (isSelected || hovered) {
        mat.emissive.set("#91c66e");
        mat.emissiveIntensity = isSelected ? 0.22 : 0.12;
      } else if (state.selected && !ghost) mat.color.multiplyScalar(0.6);
      if (state.mode === "Heat map" && emphasis) {
        const c = part.id.includes("hotend")
          ? "#ff7448"
          : part.id === "bed"
            ? "#e9a446"
            : "#d2c873";
        mat.color.set(c);
        mat.emissive.set(c);
        mat.emissiveIntensity = 0.25;
      } else if (active && emphasis && !isSelected) {
        mat.emissive.set(state.mode === "Electronics" ? "#73b8bd" : "#86aa66");
        mat.emissiveIntensity = 0.13;
      }
      mat.needsUpdate = true;
    });
    invalidate();
  }, [
    model,
    clipping,
    state.mode,
    state.ghost,
    state.selected,
    emphasis,
    active,
    hovered,
    isSelected,
    part.id,
    invalidate,
  ]);
  useEffect(
    () => () => {
      model.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const mat = o.material as THREE.MeshStandardMaterial;
          mat.map?.dispose();
          mat.dispose();
        }
      });
    },
    [model],
  );
  useFrame((_, dt) => {
    if (!group.current || hidden) return;
    const pos = explodedPosition(part, state.explosion);
    const demo = ["Motion", "Print demo", "Dual nozzle"].includes(state.mode);
    const m = motion(time.current, state.mode, state.nozzle);
    if (demo && state.explosion < 0.02) {
      if (toolIds.has(part.id)) {
        pos[0] += m.x;
        pos[2] += m.z;
      }
      if (part.id === "x-rail") pos[2] += m.z;
      if (["bed", "plate", "bed-frame", "bed-sensors"].includes(part.id))
        pos[1] +=
          state.mode === "Print demo"
            ? samplePrint(time.current).bedOffset
            : state.mode === "Motion"
              ? -(1 + Math.sin(time.current * 0.2)) * 0.45
              : 0;
      if (
        state.mode === "Dual nozzle" &&
        ["hotend-left", "lift"].includes(part.id)
      )
        pos[1] += state.nozzle === "Right" ? 0.16 : 0;
    }
    const dest = new THREE.Vector3(...pos);
    group.current.position.lerp(
      dest,
      state.reducedMotion || state.mode === "Print demo"
        ? 1
        : 1 - Math.exp(-dt * 9),
    );
    if (group.current.position.distanceTo(dest) > 0.001) invalidate();
    if (part.id === "ptfe") {
      const following = demo && state.explosion < 0.02;
      const x = following ? m.x : 0,
        z = following ? m.z : 0;
      const travel = tubeTravel.current;
      const alpha =
        state.reducedMotion || state.mode === "Print demo"
          ? 1
          : 1 - Math.exp(-dt * 9);
      travel.x += (x - travel.x) * alpha;
      travel.y += (z - travel.y) * alpha;
      model.traverse((o) => {
        if (!(o instanceof THREE.Mesh) || o.name !== "flexible-feed-tube")
          return;
        const rest = o.userData.restPositions as Float32Array;
        const attribute = o.geometry.attributes
          .position as THREE.BufferAttribute;
        // TubeGeometry emits 41 rings of 8 vertices. Keep the rear end fixed;
        // smoothly distribute the carriage displacement toward the free end.
        for (let i = 0; i < attribute.count; i++) {
          const t = Math.floor(i / 8) / 40;
          const w = t * t * (3 - 2 * t);
          attribute.setXYZ(
            i,
            rest[i * 3] + travel.x * w,
            rest[i * 3 + 1],
            rest[i * 3 + 2] + travel.y * w,
          );
        }
        attribute.needsUpdate = true;
        o.geometry.computeVertexNormals();
      });
      if (Math.abs(x - travel.x) + Math.abs(z - travel.y) > 0.001) invalidate();
    }
    if (state.running && !state.reducedMotion)
      model.traverse((o) => {
        if (o.name === "fan-rotor") o.rotation.z += dt * 5 * state.speed;
      });
  });
  const select = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(part.id);
  };
  return (
    <group
      ref={group}
      position={part.position}
      visible={!hidden}
      onClick={select}
      onDoubleClick={select}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <primitive object={model} />
      {(showLabel || hovered) && !hidden && (
        <Html
          position={[0.3, 0.3, 0.1]}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span className={"part-label " + (isSelected ? "chosen" : "")}>
            <i />
            {part.name}
          </span>
        </Html>
      )}
    </group>
  );
}
function World({
  state,
  onSelect,
  onReady,
  balanced,
  onPrintProgress,
}: {
  state: ViewerState;
  onSelect: (id: string) => void;
  onReady: () => void;
  balanced: boolean;
  onPrintProgress: (progress: number) => void;
}) {
  const time = useRef(0);
  const lastPrintProgress = useRef(-1);
  const { invalidate, gl } = useThree();
  const clipping = useMemo(() => {
    if (state.section === "Off") return [];
    const n =
      state.section === "X"
        ? new THREE.Vector3(-1, 0, 0)
        : state.section === "Y"
          ? new THREE.Vector3(0, -1, 0)
          : new THREE.Vector3(0, 0, -1);
    return [
      new THREE.Plane(
        n,
        state.section === "Y"
          ? 3.13 + state.sectionPosition * 3.2
          : state.sectionPosition * 2.6,
      ),
    ];
  }, [state.section, state.sectionPosition]);
  useEffect(() => {
    gl.localClippingEnabled = true;
    onReady();
  }, [gl, onReady]);
  useFrame((_, dt) => {
    if (state.running && !state.reducedMotion) {
      time.current += Math.min(dt, 0.05) * state.speed;
      if (state.mode === "Print demo")
        time.current = Math.min(time.current, PRINT_DURATION);
      invalidate();
    }
    if (state.mode === "Print demo") {
      const progress = Math.floor((time.current / PRINT_DURATION) * 100 + 1e-7);
      if (progress !== lastPrintProgress.current) {
        lastPrintProgress.current = progress;
        onPrintProgress(progress);
      }
    }
  });
  useEffect(() => {
    invalidate();
  }, [state, invalidate]);
  useEffect(() => {
    time.current = 0;
    lastPrintProgress.current = -1;
    invalidate();
  }, [state.mode, invalidate]);
  useEffect(() => {
    if (state.mode === "Print demo") {
      time.current = (state.printSeek * PRINT_DURATION) / 100;
      lastPrintProgress.current = -1;
      invalidate();
    }
  }, [state.printSeek, state.printKey, state.mode, invalidate]);
  const modeLabels: Partial<Record<ViewerState["mode"], string[]>> = {
    Standard: ["display", "door", "plate"],
    "Dual nozzle": ["extruders", "hotend-left", "hotend-right", "lift"],
    "Print demo": ["carriage", "plate"],
    Filament: ["ams", "ptfe", "extruders", "hotend-left"],
    Airflow: ["aux-fan", "ducts", "filter", "exhaust"],
  };
  const labels = state.selected
    ? [state.selected]
    : state.labelCategory !== "All"
      ? parts
          .filter((p) => p.category === state.labelCategory)
          .slice(0, 4)
          .map((p) => p.id)
      : (modeLabels[state.mode] ??
        parts
          .filter((p) => highlighted(p, state))
          .filter((p) => p.id !== "frame")
          .slice(0, 4)
          .map((p) => p.id));
  return (
    <>
      <color attach="background" args={["#151b19"]} />
      <fog attach="fog" args={["#151b19", 27, 65]} />
      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#f4fff2", "#31443c", 1.6]} />
      <directionalLight
        key={balanced ? "balanced-shadow" : "high-shadow"}
        position={[7, 12, 8]}
        intensity={3.2}
        castShadow
        shadow-mapSize={balanced ? [512, 512] : [1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={14}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-8, 7, 0]} intensity={2.5} color="#d6e8ea" />
      <directionalLight position={[2, 8, -8]} intensity={2.4} color="#b7cdac" />
      <group>
        {parts.map((part) => (
          <AssemblyPart
            key={part.id}
            part={part}
            state={state}
            onSelect={onSelect}
            time={time}
            clipping={clipping}
            showLabel={state.labels && labels.includes(part.id)}
          />
        ))}
      </group>
      <Grid
        position={[0, -0.13, 0]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2e3a34"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#3e5146"
        fadeDistance={30}
        fadeStrength={1.8}
        infiniteGrid
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.15, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.25} />
      </mesh>
      {(state.mode === "Filament" || state.mode === "Airflow") && (
        <Flow state={state} time={time} />
      )}
      {state.mode === "Print demo" && state.explosion < 0.02 && (
        <PrintDemo time={time} />
      )}
      {state.mode === "Dual nozzle" && (
        <group position={[0, 1.99, 0]}>
          <mesh position={[0, 0.68, 0]}>
            <boxGeometry args={[1.75, 0.16, 0.7]} />
            <meshStandardMaterial color="#a5d67d" />
          </mesh>
          {[-0.7, 0.7].map((x) => (
            <mesh key={x} position={[x, 0.28, 0]}>
              <boxGeometry args={[0.22, 0.7, 0.7]} />
              <meshStandardMaterial color="#a5d67d" />
            </mesh>
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[-0.49 + i * 0.163, 0.28, 0]}>
              <boxGeometry args={[0.06, 0.61, 0.56]} />
              <meshStandardMaterial
                color="#86b9dc"
                transparent
                opacity={0.75}
              />
            </mesh>
          ))}
        </group>
      )}
      <CameraRig state={state} />
      <LabelLayout />
    </>
  );
}
export default function PrinterScene({
  state,
  onSelect,
  onReady,
  onPrintProgress,
}: {
  state: ViewerState;
  onSelect: (id: string) => void;
  onReady: () => void;
  onPrintProgress: (progress: number) => void;
}) {
  const [narrow, setNarrow] = useState(
    () => window.matchMedia("(max-width: 1000px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1000px)");
    const change = () => setNarrow(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const balanced =
    state.quality === "Balanced" || (state.quality === "Auto" && narrow);
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      frameloop="demand"
      dpr={balanced ? 1 : Math.min(window.devicePixelRatio, 1.5)}
      camera={{ position: [10, 8, 13], fov: 38, near: 0.05, far: 100 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      fallback={
        <div className="webgl-fallback">
          <h2>3D needs WebGL</h2>
          <p>
            Enable hardware acceleration or try another browser. Specifications
            and documentation remain available above.
          </p>
        </div>
      }
    >
      <World
        state={state}
        onSelect={onSelect}
        onReady={onReady}
        balanced={balanced}
        onPrintProgress={onPrintProgress}
      />
    </Canvas>
  );
}
