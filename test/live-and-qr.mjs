// Loads the live page once (checks it renders with no errors), then makes the QR code and decodes it back.
// Run: cd test && node live-and-qr.mjs
import { chromium } from "playwright-core";
import QRCode from "qrcode"; import jsQR from "jsqr"; import { PNG } from "pngjs"; import fs from "node:fs";
const URL_LIVE = "https://jwhitbeck44.github.io/bmc-game/";
const OUT = new URL("../../deck-assets/bmc-game-qr.png", import.meta.url);
const p = (u) => decodeURIComponent(u.pathname).replace(/^\/([A-Za-z]:)/, "$1");
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("requestfailed", (r) => errs.push("failed: " + r.url()));
await page.goto(URL_LIVE, { waitUntil: "networkidle" });
await page.fill("#v-name", "Live check"); await page.click("#go-build");
const h2 = await page.textContent("h2");
console.log("live page:", h2, errs.length ? "ERRORS " + errs.join("; ") : "no errors");
await page.screenshot({ path: p(new URL("../_local/live-build.png", import.meta.url)) });
await browser.close();
await QRCode.toFile(p(OUT), URL_LIVE, { width: 1200, margin: 4, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
const png = PNG.sync.read(fs.readFileSync(p(OUT)));
const got = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
console.log("QR decodes to:", got && got.data, got && got.data === URL_LIVE ? "(matches)" : "(MISMATCH)");
