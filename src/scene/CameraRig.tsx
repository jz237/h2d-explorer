import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import { byId } from "../data/components";
import { explodedPosition } from "./explosionTransforms";
import type { ViewerState } from "./types";
export function CameraRig({ state }: { state: ViewerState }) {
  const controls = useRef<OrbitImpl>(null);
  const goal = useRef<{ eye: Vector3; target: Vector3 } | null>(null);
  const { camera, scene, invalidate, size } = useThree();
  useEffect(() => {
    const zoom = state.mode === "Exploded" ? 1.52 : state.showAMS ? 1.2 : 1;
    const scale = (size.width < 650 ? 1.36 : 1) * zoom;
    let target = new Vector3(0, state.showAMS ? 4 : 3.1, 0);
    const positions = {
      Perspective: [10, 8.1, 13],
      Front: [0, 3.3, 16],
      Rear: [0, 3.3, -16],
      Left: [-16, 3.3, 0],
      Right: [16, 3.3, 0],
      Top: [0, 19, 0.01],
      Interior: [4, 5.4, 7],
    };
    let eye = new Vector3(...positions[state.view])
      .sub(target)
      .multiplyScalar(scale)
      .add(target);
    if (state.selected) {
      const p = byId[state.selected];
      target = new Vector3(...explodedPosition(p, state.explosion));
      const model = scene.getObjectByName(p.id);
      if (model) {
        scene.updateMatrixWorld(true);
        model.getWorldPosition(target);
      }
      eye = target
        .clone()
        .add(
          new Vector3(3, 2.1, 5.3).multiplyScalar(
            p.id === "frame" ? 2.2 : p.id === "ams" ? 1.8 : 1,
          ),
        );
    }
    goal.current = { eye, target };
    invalidate();
    // Explosion framing is intentional only when the camera action changes, so sliders never fight user orbit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cameraKey, state.selected, state.view, state.showAMS, size.width]);
  useFrame((_, dt) => {
    if (goal.current && controls.current) {
      const alpha = state.reducedMotion ? 1 : 1 - Math.exp(-dt * 5);
      camera.position.lerp(goal.current.eye, alpha);
      controls.current.target.lerp(goal.current.target, alpha);
      controls.current.update();
      if (camera.position.distanceTo(goal.current.eye) < 0.006)
        goal.current = null;
      else invalidate();
    }
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.1}
      maxDistance={40}
      maxPolarAngle={Math.PI * 0.97}
      onStart={() => {
        goal.current = null;
      }}
    />
  );
}
