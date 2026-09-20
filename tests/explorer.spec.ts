import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByText("Constructing geometry and lighting…"),
  ).toHaveCount(0);
});
test("assembled viewer, responsive bounds and keyboard controls", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Bambu Lab H2D" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBeTruthy();
  await page.keyboard.press("e");
  await expect(
    page.getByRole("slider", { name: "Explosion percentage" }),
  ).toHaveValue("100");
  await page.keyboard.press("h");
  await expect(
    page.getByRole("slider", { name: "Explosion percentage" }),
  ).toHaveValue("0");
  await page.keyboard.press("l");
  await expect(
    page.getByRole("button", { name: "Toggle labels" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.screenshot({ path: "work/desktop.png" });
});
test("search selects and opens source-backed component; isolate and restore", async ({
  page,
}) => {
  await page.getByRole("textbox", { name: "Search components" }).fill("hotend");
  await page
    .getByRole("button", { name: "Left hotend & nozzle", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Left hotend & nozzle" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open documentation" }),
  ).toHaveAttribute("href", /bambulab.*hotend/);
  await page.getByRole("button", { name: "Isolate", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Restore all components" }),
  ).toBeVisible();
  await expect(page.locator(".tree-footer")).toContainText(
    "1 components shown",
  );
  await page.getByRole("button", { name: "Restore all components" }).click();
  await page
    .getByRole("button", { name: "Related parts", exact: true })
    .click();
  await expect(page.locator(".filter-chip")).toBeVisible();
});
test("all visualization modes render without runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const name of [
    "Exploded",
    "Motion",
    "Filament",
    "Heat map",
    "Airflow",
    "Electronics",
    "Maintenance",
    "Print demo",
    "Dual nozzle",
    "Standard",
  ]) {
    await page
      .getByRole("toolbar", { name: "Visualization modes" })
      .getByRole("button", { name, exact: true })
      .click();
    await expect(
      page.getByRole("toolbar").getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(250);
  }
  expect(errors).toEqual([]);
});
test("camera presets, cutaway and maintenance intervals", async ({ page }) => {
  for (const view of [
    "Front",
    "Rear",
    "Left",
    "Right",
    "Top",
    "Interior",
    "Perspective",
  ])
    await page.getByLabel("Camera view").selectOption(view);
  await page
    .getByRole("button", { name: "Viewer settings and cross-section" })
    .click();
  for (const axis of ["X", "Y", "Z"]) {
    await page.getByLabel("Section axis").selectOption(axis);
    await page
      .getByRole("slider", { name: "Section position", exact: true })
      .fill("0.4");
  }
  await page.getByLabel("Section axis").selectOption("Off");
  await page.getByRole("button", { name: "Close settings" }).click();
  await page
    .getByRole("toolbar")
    .getByRole("button", { name: "Maintenance", exact: true })
    .click();
  await page.getByLabel("Maintenance interval").selectOption("Daily");
  await expect(
    page.getByText("No verified tasks in this interval."),
  ).toBeVisible();
  await page.getByLabel("Maintenance interval").selectOption("Weekly");
  await expect(
    page.locator(".category-name").filter({ hasText: "Dual toolhead" }),
  ).toBeVisible();
});
test("specifications and document library remain searchable and source-linked", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Specifications", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search specifications" })
    .fill("nozzle");
  await expect(page.getByRole("table")).toContainText("Stainless steel");
  await expect(
    page.getByRole("table").getByRole("link").first(),
  ).toHaveAttribute("href", /^https:\/\//);
  await page
    .getByRole("textbox", { name: "Search specifications" })
    .fill("nonsense-no-result");
  await expect(
    page.getByText("No matching specifications. Try a broader term."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Documentation", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /H2D technical data sheet/ }),
  ).toHaveAttribute("href", /TDS.pdf$/);
  await page
    .getByRole("button", { name: "Sources & accuracy", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Asset provenance" }),
  ).toBeVisible();
});
test("export is a valid GLB with named reconstructed components", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Viewer settings and cross-section" })
    .click();
  const waiting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export reconstructed GLB" }).click();
  const download = await waiting;
  await download.saveAs("work/h2d-test.glb");
  const data = readFileSync("work/h2d-test.glb");
  expect(data.toString("utf8", 0, 4)).toBe("glTF");
  expect(data.readUInt32LE(4)).toBe(2);
  const jsonLength = data.readUInt32LE(12);
  const gltf = JSON.parse(data.toString("utf8", 20, 20 + jsonLength));
  expect(
    gltf.nodes.some((n: { name: string }) => n.name === "hotend-left"),
  ).toBeTruthy();
  expect(
    gltf.nodes.some(
      (n: { extras?: { accuracy: string } }) =>
        n.extras?.accuracy === "Approximate geometry",
    ),
  ).toBeTruthy();
});
test("mobile tree, inspector sheet and touch-sized viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Open assembly tree" }).click();
  await page.getByRole("textbox", { name: "Search components" }).fill("filter");
  await page
    .getByRole("button", { name: "Air filter assembly", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Air filter assembly" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close inspector" }).click();
  await page.screenshot({ path: "work/mobile.png" });
});
test("reduced motion and help focus are respected", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  await page
    .getByRole("toolbar")
    .getByRole("button", { name: "Motion", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play animation" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Help and keyboard shortcuts" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
