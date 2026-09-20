import type { Part, Vec3 } from "../data/components";
export function explodedPosition(part: Part, amount: number): Vec3 {
  const t = Math.min(1, Math.max(0, (amount - part.stage) / (1 - part.stage)));
  const eased = t * t * (3 - 2 * t);
  return part.position.map((v, i) => v + part.explode[i] * eased) as Vec3;
}
