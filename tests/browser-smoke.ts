import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
async function main() {
  const base = process.env.APP_TEST_URL ?? "http://localhost:3000";
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_EXECUTABLE ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    await page
      .getByRole("heading", { name: "شعبتك، برنامجك، طريقك للنجاح" })
      .waitFor();
    assert.equal(await page.locator(".speciality-card").count(), 6);
    await page.screenshot({
      path: join(tmpdir(), "issam-landing-desktop.png"),
      fullPage: true,
    });
    await page.goto(base + "/preview", { waitUntil: "networkidle" });
    await page
      .getByRole("heading", { name: "أهلاً، أحمد", exact: true })
      .waitFor();
    assert.equal(await page.locator(".nav-item.active").count(), 1);
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector("main.content")!).opacity ===
        "1",
    );
    await page.screenshot({
      path: join(tmpdir(), "issam-dashboard-desktop.png"),
      fullPage: true,
    });
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/preview", { waitUntil: "networkidle" });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        true,
        `Dashboard overflows at ${width}px`,
      );
      if (width === 390) {
        await page
          .getByRole("button", { name: "فتح القائمة", exact: true })
          .click();
        await page
          .locator(".sidebar")
          .getByRole("link", { name: "الدروس المسجلة", exact: true })
          .click();
        await page.waitForURL("**/preview/lessons");
        assert.equal(
          await page
            .locator(".sidebar")
            .evaluate((el) => el.classList.contains("open")),
          false,
        );
        await page.screenshot({
          path: join(tmpdir(), "issam-dashboard-mobile.png"),
          fullPage: true,
        });
      }
      await page.goto(base, { waitUntil: "networkidle" });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        true,
        `Landing overflows at ${width}px`,
      );
    }
    await page.goto(base + "/login", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "إظهار كلمة المرور", exact: true })
      .click();
    assert.equal(await page.locator("#password").getAttribute("type"), "text");
    assert.deepEqual(errors, []);
    console.log(
      "Browser smoke checks passed: RTL, six specialities, desktop/tablet/mobile overflow, navigation and password visibility. Screenshots saved in the system temporary directory.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
