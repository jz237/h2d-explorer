import { test, expect } from "@playwright/test";
import assert from "node:assert/strict";
import {
  printMoves,
  samplePrint,
  PRINT_LAYERS,
  PRINT_DURATION,
  PRINT_DEPOSITS,
  PRINT_PATH_LENGTH,
  LAYER_HEIGHT,
  NOZZLE_Y,
} from "../src/scene/printPaths";

test("lantern paths cover every layer, stay continuous, and fit the bed", () => {
  expect(new Set(printMoves.map((m) => m.layer)).size).toBe(PRINT_LAYERS);
  expect(PRINT_DEPOSITS).toBeGreaterThan(10000);
  expect(printMoves.some((m) => !m.extrude && m.layer > 10)).toBeTruthy();
  let previousEnd = 0,
    deposits = 0;
  for (let i = 0; i < printMoves.length; i++) {
    const m = printMoves[i];
    assert.equal(m.start, previousEnd, `Gap at move ${i}`);
    assert(m.end > m.start, `Zero-length move ${i}`);
    assert.equal(m.depositedBefore, deposits);
    if (i) assert.deepEqual(m.from, printMoves[i - 1].to);
    for (const value of [...m.from, ...m.to])
      assert(Math.abs(value) < 1.2, `Outside bed at move ${i}`);
    if (m.extrude) deposits++;
    previousEnd = m.end;
  }
  expect(deposits).toBe(PRINT_DEPOSITS);
});

test("deposition stays under the nozzle and travel never advances the material count", () => {
  for (const move of printMoves.filter((_, i) => i % 41 === 0)) {
    const middle = (move.start + move.end) / 2;
    const frame = samplePrint((middle / PRINT_PATH_LENGTH) * PRINT_DURATION);
    expect(frame.x).toBeCloseTo((move.from[0] + move.to[0]) / 2, 7);
    expect(frame.z).toBeCloseTo((move.from[1] + move.to[1]) / 2, 7);
    expect(frame.deposited).toBe(move.depositedBefore);
    const top = frame.baseY + (move.layer + 1) * LAYER_HEIGHT;
    if (move.extrude) expect(top).toBeCloseTo(NOZZLE_Y, 8);
    else expect(top).toBeLessThan(NOZZLE_Y);
    expect(frame.baseY).toBeCloseTo(1.9325 + frame.bedOffset, 8);
  }
  expect(samplePrint(0).deposited).toBe(0);
  expect(samplePrint(PRINT_DURATION).deposited).toBe(PRINT_DEPOSITS);
  expect(samplePrint(PRINT_DURATION * 2).complete).toBeTruthy();
});
