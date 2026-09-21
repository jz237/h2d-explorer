import { test, expect } from "@playwright/test";

test("orbit, pan and zoom keep printing; an intentional part click still selects", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("toolbar").getByRole("button", { name: "Print demo", exact: true }).click();
  await expect(page.getByText("Constructing geometry and lighting…")).toHaveCount(0);
  const progress = page.getByRole("slider", { name: "Print progress", exact: true });
  const pause = page.getByRole("button", { name: "Pause animation" });
  const camera = page.getByRole("combobox", { name: "Print camera", exact: true });
  const box = (await page.locator("canvas").boundingBox())!;
  const x = box.x + box.width * .5, y = box.y + box.height * .53;
  for (const view of ["Overview", "Nozzle", "Object"]) {
    await camera.selectOption(view);
    await page.waitForTimeout(1500);
    for (const button of ["left", "right", "middle"] as const) {
      await page.mouse.move(x, y);
      await page.mouse.down({ button });
      await page.mouse.move(x + 90, y + 15, { steps: 10 });
      await page.mouse.up({ button });
      await expect(pause).toBeVisible();
      await expect(camera).toHaveValue(view);
    }
    // A drag returning to its start is still a gesture, not a click.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 50, y + 10, { steps: 5 });
    await page.mouse.move(x, y, { steps: 5 });
    await page.mouse.up();
    await page.mouse.wheel(0, -120);
    await page.mouse.wheel(0, 120);
    await expect(pause).toBeVisible();
    const before = Number(await progress.inputValue());
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(before);
  }
  await camera.selectOption("Overview");
  await page.waitForTimeout(1800);
  await page.mouse.click(x, y);
  await expect(page.getByRole("button", { name: "Play animation" })).toBeVisible();
  await expect(page.locator(".inspector h2")).not.toHaveText("Print studio.");
});

test("touch orbit and pinch keep print playback running", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL!);
  await page.getByRole("toolbar").getByRole("button", { name: "Print demo", exact: true }).click();
  await page.waitForTimeout(1500);
  const box = (await page.locator("canvas").boundingBox())!;
  const x = box.x + box.width * .5, y = box.y + box.height * .55;
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  for (let i = 1; i <= 8; i++)
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + i * 7, y: y + i, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x - 30, y, id: 1 }, { x: x + 30, y, id: 2 }] });
  for (let i = 1; i <= 8; i++)
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 30 - i * 3, y, id: 1 }, { x: x + 30 + i * 3, y, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByRole("button", { name: "Pause animation" })).toBeVisible();
  const progress = page.getByRole("slider", { name: "Print progress", exact: true });
  const before = Number(await progress.inputValue());
  await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(before);
  await context.close();
});
