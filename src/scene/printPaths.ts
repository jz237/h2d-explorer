// Original decorative lantern. Illustrative deposition paths, not slicer output.
export const PRINT_LAYERS = 128;
export const LAYER_HEIGHT = 0.016;
export const PRINT_DURATION = 72;
export const NOZZLE_Y = 3.655;
export type Point = [number, number];
export interface PrintMove {
  from: Point;
  to: Point;
  layer: number;
  extrude: boolean;
  start: number;
  end: number;
  depositedBefore: number;
}
const TAU = Math.PI * 2;
const moves: PrintMove[] = [];
let previous: Point = [0, 0],
  distance = 0,
  deposits = 0;
function move(to: Point, layer: number, extrude: boolean) {
  const length = Math.hypot(to[0] - previous[0], to[1] - previous[1]);
  if (length < 0.00001) return;
  // Travel moves run faster than deposition, but still remain observable.
  const duration = length / (extrude ? 1 : 2.5);
  moves.push({
    from: previous,
    to,
    layer,
    extrude,
    start: distance,
    end: distance + duration,
    depositedBefore: deposits,
  });
  previous = to;
  distance += duration;
  if (extrude) deposits++;
}
function loop(points: Point[], layer: number) {
  move(points[0], layer, false);
  for (let i = 1; i <= points.length; i++)
    move(points[i % points.length], layer, true);
}
function polar(radius: number, angle: number): Point {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}
function circle(radius: number, layer: number, flute = 0) {
  loop(
    Array.from({ length: 96 }, (_, i) => {
      const angle = (i / 96) * TAU;
      return polar(radius + flute * Math.cos(angle * 16), angle);
    }),
    layer,
  );
}
for (let layer = 0; layer < PRINT_LAYERS; layer++) {
  if (layer < 8) {
    const radius = 1.08 - layer * 0.013;
    // A closed base, then stepped concentric decorative foot rings.
    const inner = layer < 3 ? 0.04 : radius - 0.13;
    for (let r = inner; r < radius; r += 0.048)
      circle(r, layer, r > radius - 0.08 ? 0.02 : 0);
    circle(radius, layer, 0.025);
  } else if (layer >= 118) {
    const t = (layer - 118) / 9;
    const radius = 0.87 + t * 0.18;
    circle(radius, layer, t * 0.045);
    circle(radius - 0.055, layer, t * 0.045);
    circle(radius - 0.11, layer, t * 0.045);
  } else {
    const t = (layer - 8) / 109;
    const radius =
      0.94 - 0.16 * Math.sin(t * Math.PI) + 0.07 * Math.sin(t * Math.PI * 2);
    const twist = t * 1.5;
    // Union intersecting clockwise/counterclockwise ribs at each layer,
    // so crossings are deposited once rather than overlapping two loops.
    const bins = 512;
    const width = 0.052 + 0.02 * Math.abs(2 * t - 1);
    const inside = Array.from({ length: bins }, (_, i) => {
      const a = (i / bins) * TAU;
      return [-1, 1].some((hand) => {
        const phase = (a - hand * twist) * 8;
        return (
          Math.abs(Math.atan2(Math.sin(phase), Math.cos(phase))) < width * 8
        );
      });
    });
    const gap = inside.findIndex((value) => !value);
    let run: number[] = [];
    const flush = () => {
      if (!run.length) return;
      const angles = [run[0] - 0.5, ...run, run[run.length - 1] + 0.5].map(
        (i) => (i / bins) * TAU,
      );
      loop(
        [
          ...angles.map((a) => polar(radius + 0.05, a)),
          ...angles.reverse().map((a) => polar(radius - 0.05, a)),
        ],
        layer,
      );
      run = [];
    };
    for (let j = 1; j <= bins; j++) {
      const i = gap + j;
      if (inside[i % bins]) run.push(i);
      else flush();
    }
    flush();
  }
}
export const printMoves: readonly PrintMove[] = moves;
export const PRINT_PATH_LENGTH = distance;
export const PRINT_DEPOSITS = deposits;
export function samplePrint(seconds: number) {
  const progress = Math.max(0, Math.min(seconds / PRINT_DURATION, 1));
  const at = progress * PRINT_PATH_LENGTH;
  let low = 0,
    high = moves.length - 1;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (moves[mid].end < at) low = mid + 1;
    else high = mid;
  }
  const active = moves[low];
  const fraction = Math.max(
    0,
    Math.min((at - active.start) / (active.end - active.start), 1),
  );
  const complete = progress === 1;
  const x = complete
    ? 1.35
    : active.from[0] + (active.to[0] - active.from[0]) * fraction;
  const z = complete
    ? -1.45
    : active.from[1] + (active.to[1] - active.from[1]) * fraction;
  const hop = complete
    ? 0.12
    : active.extrude
      ? 0
      : Math.sin(fraction * Math.PI) * 0.045;
  const baseY = NOZZLE_Y - (active.layer + 1) * LAYER_HEIGHT - hop;
  return {
    progress,
    active,
    fraction,
    complete,
    x,
    z,
    baseY,
    bedOffset: baseY - 1.9325,
    deposited: complete ? deposits : active.depositedBefore,
  };
}
