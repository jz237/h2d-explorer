import { useFrame, useThree } from "@react-three/fiber";
// A small screen-space layout pass keeps the sparse DOM labels apart during orbit.
export function LabelLayout() {
  const { gl } = useThree();
  useFrame(() => {
    const canvas = gl.domElement;
    const host = canvas.closest(".scene-area");
    if (!host) return;
    const bounds = canvas.getBoundingClientRect();
    const occupied: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }[] = [];
    const nodes = [...host.querySelectorAll<HTMLElement>(".part-label")];
    for (const node of nodes) {
      node.style.visibility = "visible";
      node.style.transform = "translateX(50%)";
      let r = node.getBoundingClientRect();
      let placed = false;
      for (const offset of [0, -28, 28, -56, 56]) {
        const top = r.top + offset,
          bottom = r.bottom + offset;
        const collision = occupied.some(
          (o) =>
            r.left < o.right + 8 &&
            r.right > o.left - 8 &&
            top < o.bottom + 8 &&
            bottom > o.top - 8,
        );
        if (
          !collision &&
          r.left > bounds.left + 50 &&
          r.right < bounds.right - 10 &&
          top > bounds.top + 105 &&
          bottom < bounds.bottom - 95
        ) {
          node.style.transform = `translateX(50%) translateY(${offset}px)`;
          occupied.push({ left: r.left, right: r.right, top, bottom });
          placed = true;
          break;
        }
      }
      if (!placed) node.style.visibility = "hidden";
    }
  });
  return null;
}
