import {
  getPrintInfo,
  type PrintKind,
  type PrintModel,
} from "../data/printGallery";
import {
  printMoves as lanternMoves,
  LAYER_HEIGHT,
  NOZZLE_Y,
  type Point,
} from "./printPaths";
export { LAYER_HEIGHT, NOZZLE_Y };
export type KindCounts = Record<PrintKind, number>;
export interface PatternMove {
  from: Point;
  to: Point;
  layer: number;
  extrude: boolean;
  kind: PrintKind;
  start: number;
  end: number;
  depositedBefore: number;
  before: KindCounts;
}
export interface PrintPattern {
  id: PrintModel;
  moves: PatternMove[];
  length: number;
  deposits: number;
  totals: KindCounts;
  layers: number;
  duration: number;
  layerHeight: number;
  travelRanges: { start: number; count: number }[];
}
const TAU = Math.PI * 2;
const emptyCounts = (): KindCounts => ({
  walls: 0,
  infill: 0,
  supports: 0,
  travel: 0,
});
class Paths {
  moves: PatternMove[] = [];
  previous: Point = [0, 0];
  length = 0;
  deposits = 0;
  counts = emptyCounts();
  move(to: Point, layer: number, kind: PrintKind) {
    const length = Math.hypot(
      to[0] - this.previous[0],
      to[1] - this.previous[1],
    );
    if (length < 0.00001) return;
    const extrude = kind !== "travel",
      duration = length / (extrude ? 1 : 2.5);
    this.moves.push({
      from: this.previous,
      to,
      layer,
      extrude,
      kind,
      start: this.length,
      end: this.length + duration,
      depositedBefore: this.deposits,
      before: { ...this.counts },
    });
    this.previous = to;
    this.length += duration;
    this.counts[kind]++;
    if (extrude) this.deposits++;
  }
  path(
    points: Point[],
    layer: number,
    kind: PrintKind = "walls",
    closed = true,
  ) {
    this.move(points[0], layer, "travel");
    for (let i = 1; i < points.length; i++) this.move(points[i], layer, kind);
    if (closed) this.move(points[0], layer, kind);
  }
  rect(
    x: number,
    z: number,
    w: number,
    d: number,
    layer: number,
    kind: PrintKind = "walls",
  ) {
    this.path(
      [
        [x - w / 2, z - d / 2],
        [x + w / 2, z - d / 2],
        [x + w / 2, z + d / 2],
        [x - w / 2, z + d / 2],
      ],
      layer,
      kind,
    );
  }
  circle(
    x: number,
    z: number,
    r: number,
    layer: number,
    kind: PrintKind = "walls",
    shape?: (a: number) => number,
  ) {
    const segments = shape ? 96 : 48;
    this.path(
      Array.from({ length: segments }, (_, i) => {
        const a = (i / segments) * TAU,
          radius = shape?.(a) ?? r;
        return [x + radius * Math.cos(a), z + radius * Math.sin(a)] as Point;
      }),
      layer,
      kind,
    );
  }
  hatch(
    x: number,
    z: number,
    w: number,
    d: number,
    layer: number,
    kind: PrintKind = "infill",
    spacing = 0.13,
  ) {
    const horizontal = layer % 2 === 0;
    for (
      let t = -(horizontal ? d : w) / 2 + 0.025;
      t < (horizontal ? d : w) / 2;
      t += spacing
    ) {
      this.path(
        horizontal
          ? [
              [x - w / 2 + 0.01, z + t],
              [x + w / 2 - 0.01, z + t],
            ]
          : [
              [x + t, z - d / 2 + 0.01],
              [x + t, z + d / 2 - 0.01],
            ],
        layer,
        kind,
        false,
      );
    }
  }
}
function buildCastle(b: Paths) {
  for (let l = 0; l < 128; l++) {
    if (l < 5) {
      b.rect(0, 0, 2.15, 2.15, l);
      b.hatch(0, 0, 2.1, 2.1, l, "infill", 0.07);
      continue;
    }
    if (l < 72) {
      b.rect(0, -0.83, 1.66, 0.16, l);
      b.rect(-0.83, 0, 0.16, 1.66, l);
      b.rect(0.83, 0, 0.16, 1.66, l);
      b.hatch(0, -0.83, 1.56, 0.11, l);
      b.hatch(-0.83, 0, 0.11, 1.56, l);
      b.hatch(0.83, 0, 0.11, 1.56, l);
      const gate =
        l < 31
          ? 0.23
          : l < 45
            ? 0.23 * Math.sqrt(Math.max(0, 1 - ((l - 30) / 15) ** 2))
            : 0;
      if (gate > 0) {
        for (const sign of [-1, 1]) {
          const w = 0.83 - gate;
          b.rect(sign * (gate + w / 2), 0.83, w, 0.16, l);
        }
        b.hatch(
          0,
          0.83,
          Math.max(0.025, gate * 2 - 0.05),
          0.1,
          l,
          "supports",
          0.095,
        );
      } else {
        b.rect(0, 0.83, 1.66, 0.16, l);
        b.hatch(0, 0.83, 1.56, 0.11, l);
      }
    }
    for (const x of [-0.82, 0.82])
      for (const z of [-0.82, 0.82]) {
        if (l < 111) {
          b.circle(x, z, 0.27, l);
          b.circle(x, z, 0.21, l);
        } else
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU;
            b.rect(
              x + Math.cos(a) * 0.235,
              z + Math.sin(a) * 0.235,
              0.1,
              0.1,
              l,
            );
          }
      }
    if (l < 95) {
      const width = l < 86 ? 0.72 : 0.83;
      b.rect(0, -0.1, width, width, l);
      b.rect(0, -0.1, width - 0.1, width - 0.1, l);
      b.hatch(0, -0.1, width - 0.14, width - 0.14, l);
    } else if (l < 107)
      for (const x of [-0.3, 0.3])
        for (const z of [-0.4, 0.2]) b.rect(x, z, 0.16, 0.16, l);
  }
}
function buildGears(b: Paths) {
  const wheels = [
    { x: -0.56, z: -0.28, r: 0.48, n: 18 },
    { x: 0.35, z: -0.28, r: 0.36, n: 14 },
    { x: 0.05, z: 0.63, r: 0.34, n: 13 },
  ];
  for (let l = 0; l < 52; l++)
    for (const w of wheels) {
      const outer = l < 40 ? w.r : 0.16;
      const shape = (a: number) =>
        outer - (l < 40 ? 0.055 * (Math.cos(a * w.n) > 0.15 ? 1 : 0) : 0);
      b.circle(w.x, w.z, outer, l, "walls", shape);
      b.circle(w.x, w.z, 0.095, l);
      for (let v = -outer + 0.07; v < outer - 0.02; v += 0.1) {
        const limit = Math.sqrt(Math.max(0, (outer - 0.065) ** 2 - v * v));
        if (limit < 0.015) continue;
        const hole = Math.abs(v) < 0.12 ? Math.sqrt(0.12 ** 2 - v * v) : 0;
        const line = (a: number, c: number) =>
          b.path(
            l % 2
              ? [
                  [w.x + v, w.z + a],
                  [w.x + v, w.z + c],
                ]
              : [
                  [w.x + a, w.z + v],
                  [w.x + c, w.z + v],
                ],
            l,
            "infill",
            false,
          );
        if (hole > 0) {
          if (limit > hole) {
            line(-limit, -hole);
            line(hole, limit);
          }
        } else line(-limit, limit);
      }
    }
}
function buildVase(b: Paths) {
  for (let l = 0; l < 128; l++) {
    const t = l / 127;
    const radius =
      0.65 +
      0.37 * Math.sin(t * Math.PI * 1.1) -
      0.17 * Math.exp(-(((t - 0.83) / 0.13) ** 2));
    const shape = (a: number) => radius + 0.065 * Math.cos(12 * (a - t * 0.9));
    b.circle(0, 0, radius, l, "walls", shape);
    b.circle(0, 0, radius - 0.055, l, "walls", (a) => shape(a) - 0.055);
    if (l < 4)
      for (let r = 0.055; r < radius - 0.1; r += 0.048)
        b.circle(0, 0, r, l, "infill");
  }
}
const cache = new Map<PrintModel, PrintPattern>();
export function getPrintPattern(id: PrintModel = "lantern"): PrintPattern {
  const cached = cache.get(id);
  if (cached) return cached;
  const info = getPrintInfo(id),
    b = new Paths();
  if (id === "lantern")
    for (const m of lanternMoves)
      b.move(
        m.to,
        m.layer,
        !m.extrude
          ? "travel"
          : m.layer < 3 && Math.hypot(...m.to) < 0.96
            ? "infill"
            : "walls",
      );
  else if (id === "castle") buildCastle(b);
  else if (id === "gears") buildGears(b);
  else buildVase(b);
  const travelRanges = Array.from({ length: info.layers }, () => ({
    start: 0,
    count: 0,
  }));
  for (const move of b.moves)
    if (move.kind === "travel") {
      const r = travelRanges[move.layer];
      if (!r.count) r.start = move.before.travel;
      r.count++;
    }
  const pattern = {
    id,
    moves: b.moves,
    length: b.length,
    deposits: b.deposits,
    totals: b.counts,
    layers: info.layers,
    duration: info.duration,
    layerHeight: id === "gears" ? 0.007 : LAYER_HEIGHT,
    travelRanges,
  };
  cache.set(id, pattern);
  return pattern;
}
export function samplePattern(seconds: number, id: PrintModel = "lantern") {
  const pattern = getPrintPattern(id),
    moves = pattern.moves;
  const progress = Math.max(0, Math.min(seconds / pattern.duration, 1)),
    at = progress * pattern.length;
  let low = 0,
    high = moves.length - 1;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (moves[mid].end < at) low = mid + 1;
    else high = mid;
  }
  const active = moves[low],
    fraction = Math.max(
      0,
      Math.min((at - active.start) / (active.end - active.start), 1),
    ),
    complete = progress === 1;
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
  const baseY = NOZZLE_Y - (active.layer + 1) * pattern.layerHeight - hop;
  return {
    progress,
    active,
    fraction,
    complete,
    x,
    z,
    baseY,
    bedOffset: baseY - 1.9325,
    deposited: complete ? pattern.deposits : active.depositedBefore,
    counts: complete ? pattern.totals : active.before,
  };
}
