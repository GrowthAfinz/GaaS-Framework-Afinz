import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 900, height: 1000 },
  deviceScaleFactor: 1,
});
mkdirSync("artifacts/vai-de-visa/screenshots", { recursive: true });
for (const touch of ["V1", "V2"])
  for (let i = 1; i <= 6; i++) {
    let html =
      i === 6
        ? '<html lang="pt-BR"><body><h1>Envio bloqueado</h1><p>VDV: nenhuma oferta vigente em BF26_V1 / MODA</p><p>Data simulada: 01/12/2026. Nenhum e-mail é renderizado.</p></body></html>'
        : readFileSync(
            `artifacts/vai-de-visa/previews/${touch}-sample-${i}.html`,
            "utf8",
          );
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page
      .waitForLoadState("networkidle", { timeout: 6000 })
      .catch(() => {});
    await page.screenshot({
      path: `artifacts/vai-de-visa/screenshots/${touch}-sample-${i}-desktop.png`,
      fullPage: true,
    });
    if (i === 1) {
      const boxes = await page.locator(".vdv-card").evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width };
        }),
      );
      if (
        !(
          boxes.length === 3 &&
          boxes[0].y < boxes[1].y &&
          Math.abs(boxes[1].y - boxes[2].y) < 1
        )
      )
        throw Error("Layout desktop inválido " + JSON.stringify(boxes));
      await page.setViewportSize({ width: 390, height: 900 });
      await page
        .waitForLoadState("networkidle", { timeout: 6000 })
        .catch(() => {});
      await page.screenshot({
        path: `artifacts/vai-de-visa/screenshots/${touch}-sample-${i}-mobile.png`,
        fullPage: true,
      });
      const mobile = await page.locator(".vdv-card").evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width };
        }),
      );
      if (
        !(
          mobile[0].y < mobile[1].y &&
          mobile[1].y < mobile[2].y &&
          Math.abs(mobile[0].w - mobile[1].w) < 2 &&
          Math.abs(mobile[1].w - mobile[2].w) < 2
        )
      )
        throw Error("Layout mobile inválido " + JSON.stringify(mobile));
      await page.setViewportSize({ width: 900, height: 1000 });
    }
  }
await browser.close();
console.log("12 screenshots desktop + 2 mobile; geometria dos 3 cards OK.");
