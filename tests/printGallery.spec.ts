import { test, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { printGallery, printKinds } from "../src/data/printGallery";
import {
  getPrintPattern,
  samplePattern,
  NOZZLE_Y,
} from "../src/scene/printPatterns";

test("all gallery patterns have bounded, synchronized paths and separate feature counts", () => {
  const fingerprints = new Set<string>();
  for (const info of printGallery) {
    const p = getPrintPattern(info.id);
    assert.equal(new Set(p.moves.map((m) => m.layer)).size, info.layers);
    assert(p.totals.walls > 0 && p.totals.infill > 0 && p.totals.travel > 0);
    assert.equal(p.totals.supports > 0, info.id === "castle");
    const counts = { walls: 0, infill: 0, supports: 0, travel: 0 };
    let end = 0;
    for (let i = 0; i < p.moves.length; i++) {
      const m = p.moves[i];
      assert.equal(m.start, end);
      assert(m.end > m.start);
      assert.deepEqual(m.before, counts);
      if (i) assert.deepEqual(m.from, p.moves[i - 1].to);
      assert(
        [...m.from, ...m.to].every(
          (n) => Number.isFinite(n) && Math.abs(n) < 1.2,
        ),
      );
      counts[m.kind]++;
      end = m.end;
      if (i % 127 === 0) {
        const frame = samplePattern(
          ((m.start + m.end) / 2 / p.length) * p.duration,
          info.id,
        );
        assert(Math.abs(frame.x - (m.from[0] + m.to[0]) / 2) < 1e-7);
        assert(Math.abs(frame.z - (m.from[1] + m.to[1]) / 2) < 1e-7);
        if (m.extrude)
          assert(
            Math.abs(frame.baseY + (m.layer + 1) * p.layerHeight - NOZZLE_Y) <
              1e-8,
          );
      }
    }
    assert.deepEqual(counts, p.totals);
    assert.deepEqual(samplePattern(p.duration, info.id).counts, p.totals);
    assert.equal(samplePattern(0, info.id).deposited, 0);
    assert.equal(
      printKinds
        .filter((k) => k !== "travel")
        .reduce((n, k) => n + p.totals[k], 0),
      p.deposits,
    );
    fingerprints.add(`${p.length}:${p.deposits}`);
  }
  expect(fingerprints.size).toBe(4);
});

test("gallery selection, feature toggles and finished inspection work for all models", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page
    .getByRole("toolbar")
    .getByRole("button", { name: "Print demo", exact: true })
    .click();
  for (const info of printGallery) {
    await page.getByRole("button", { name: /Choose print/ }).click();
    await page
      .getByRole("button", { name: `Print ${info.name}`, exact: true })
      .click();
    await expect(page.locator(".print-timeline-title strong")).toHaveText(
      info.name,
    );
    await page
      .getByRole("combobox", { name: "Print camera", exact: true })
      .selectOption("Inspect");
    await expect(
      page.getByRole("slider", { name: "Print progress", exact: true }),
    ).toHaveValue("100");
    await expect(
      page.getByRole("heading", { name: info.name, exact: true }).first(),
    ).toBeVisible();
    await expect(page.locator(".tree-footer")).toContainText(
      "Finished print only",
    );
    await page.getByRole("button", { name: "Walls & infill" }).click();
    for (const name of ["Outer walls", "Infill", "Supports"])
      await page.getByRole("checkbox", { name, exact: true }).uncheck();
    await expect(
      page.getByText("All print layers are hidden.", { exact: false }),
    ).toBeVisible();
    await page
      .getByRole("checkbox", { name: "Travel moves", exact: true })
      .check();
    await expect(
      page.getByText("All print layers are hidden.", { exact: false }),
    ).toHaveCount(0);
    for (const name of ["Outer walls", "Infill", "Supports"])
      await page.getByRole("checkbox", { name, exact: true }).check();
    await page
      .getByRole("checkbox", { name: "Travel moves", exact: true })
      .uncheck();
    await page.getByRole("button", { name: "Close print options" }).click();
    await page
      .getByRole("combobox", { name: "Print camera", exact: true })
      .selectOption("Overview");
    await expect(page.locator(".tree-footer")).toContainText(
      "components shown",
    );
  }
  expect(errors).toEqual([]);
});

test("tracking cameras remain selectable and scrubbing exits finished-only inspection", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("toolbar")
    .getByRole("button", { name: "Print demo", exact: true })
    .click();
  const camera = page.getByRole("combobox", {
    name: "Print camera",
    exact: true,
  });
  for (const option of ["Nozzle", "Object", "Inspect"]) {
    await camera.selectOption(option);
    await expect(camera).toHaveValue(option);
    await page.waitForTimeout(350);
  }
  await page
    .getByRole("slider", { name: "Print progress", exact: true })
    .fill("50");
  await expect(camera).toHaveValue("Object");
  await expect(
    page.getByRole("slider", { name: "Print progress", exact: true }),
  ).toHaveValue("50");
  await expect(page.locator(".tree-footer")).toContainText("components shown");
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  await expect(camera).toHaveValue("Overview");
});

test("mobile gallery, layer controls and tour stay usable with reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: "How a print happens" }).click();
  await page
    .getByRole("navigation", { name: "Print tour steps" })
    .getByRole("button", { name: "Build", exact: true })
    .click();
  await page.getByRole("button", { name: /Choose print/ }).click();
  await page
    .getByRole("button", { name: "Print Miniature castle", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Print camera", exact: true })
    .selectOption("Inspect");
  await page.getByRole("button", { name: "Walls & infill" }).click();
  await page.getByRole("checkbox", { name: "Supports", exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", { name: "Print layer visibility" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "How a print happens" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play animation" }),
  ).toBeHidden();
  await page.screenshot({ path: "work/gallery-mobile-tested.png" });
  const tour = page.getByRole("region", { name: "How a print happens" });
  await tour.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    tour.getByRole("heading", { name: "Give each nozzle a role" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
