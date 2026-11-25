// Walks the full path with two ventures (a for-profit and an art collective), at 390 and 1280 wide.
// Saves screenshots and hand-in PDFs to _local/run-<YYMMDD>/, and checks reload, the money check edge cases and the link.
// Run: cd test && node walk.mjs
import { chromium } from "playwright-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = new URL("../docs/", import.meta.url);
const d = new Date(), p2 = (n) => String(n).padStart(2, "0");
const outDir = new URL(`../_local/run-${String(d.getFullYear()).slice(2)}${p2(d.getMonth() + 1)}${p2(d.getDate())}/`, import.meta.url);
fs.mkdirSync(outDir, { recursive: true });
const fsPath = (u) => decodeURIComponent(u.pathname).replace(/^\/([A-Za-z]:)/, "$1");

const TYPES = { ".html": "text/html", ".js": "text/javascript" };
const srv = http.createServer((q, s) => {
  const f = new URL("." + (q.url.split("?")[0].split("#")[0] === "/" ? "/index.html" : q.url.split("?")[0]), root);
  if (!fs.existsSync(fsPath(f))) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { "Content-Type": TYPES[path.extname(f.pathname)] || "text/plain" }); s.end(fs.readFileSync(fsPath(f)));
}).listen(0);
const PAGE = "http://localhost:" + srv.address().port + "/";
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({ executablePath: fs.existsSync(edge) ? edge : undefined, headless: true });
const problems = [];
const ok = (cond, msg) => { if (!cond) problems.push(msg); };

const VENTURES = {
  forprofit: {
    name: "Cleat Swap", about: "Trade-in used soccer cleats for kids who outgrow them every season.",
    blocks: ["Parents of kids 6 to 12 in rec soccer in the Springs.", "Cleats that fit for $15, not $60. Trade the old pair in for credit.",
      "A table at Saturday games and an Instagram page.", "Text me your kid's size, I hold a pair.", "$15 a pair, $5 off with a trade-in.",
      "200 pairs from my garage and my old club's lost and found.", "Clean, sort by size, show up every Saturday.", "Two club coaches who announce it at practice.",
      "Cleaning supplies $40 a month, table permit $25, gas."],
    dial: 70, give: "Free fitting and size advice for anyone.", keep: "The good brands. Only a few pairs each week.",
    pairs: [["holds", ""], ["shaky", "Instagram is not where parents are at 8 a.m."], ["holds", ""], ["breaks", "You need way more cleats in big sizes."], ["shaky", "Coaches change every season."], [null, ""]],
    money: { price: "$15", qty: "40", cost: "120", pay: "500" },
    bpText: "My supply of big sizes runs out by October.", what: "The Arsenal now includes a drop bin at two schools, and The Co-Conspirators adds the PE teachers who run them. More big sizes come in without me buying them.",
    edits: { kr: "200 pairs now, plus drop bins at two elementary schools.", kp: "Two club coaches, and the PE teachers at the drop-bin schools." },
    ai: "No AI.",
  },
  art: {
    name: "Alley Light Collective", about: "Free mural workshops for teens that turn ugly alley walls into public art.",
    blocks: ["Teens 14 to 18 downtown with nowhere to make art after school.", "A real wall, real paint, your name on it.",
      "Flyers at the library and the youth center.", "We paint together every week. Alumni come back as mentors.",
      "Funding mix: a city arts grant, paint donated by a hardware store, a pay-what-you-can mural tour.",
      "Two of us who can teach painting. A van.", "Get wall permission, buy paint, run the Thursday sessions.",
      "The downtown business group that owns the walls.", "Paint $300 a wall, insurance $80 a month."],
    dial: 85, give: "Workshops are free. Anyone can watch us paint.", keep: "Your name goes on a wall only if you finish the whole project.",
    pairs: [["holds", ""], ["holds", ""], ["shaky", "Teens can't pay. Who pays?"], ["holds", ""], ["breaks", "If the business group says no, there are no walls."], [null, ""]],
    money: { price: "400", qty: "1", cost: "", pay: "0" },
    bpText: "", other: "", what: "The Co-Conspirators now includes two churches and a school with walls. The Fuel adds a sponsor-a-wall program for local shops.",
    edits: { kp: "The downtown business group, two churches and one school, so no single owner can stop us." },
    ai: "I used Claude to brainstorm funding sources.",
  },
};

async function walk(key, vp, scale, scheme, shots) {
  const V = VENTURES[key];
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: scale, colorScheme: scheme });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`${key}/${vp.width} pageerror: ${e.message}`));
  page.on("dialog", (dlg) => dlg.accept());
  const tag = `${key}-${vp.width}${scheme === "dark" ? "-dark" : ""}`;
  const shot = async (name) => {
    await page.waitForTimeout(120);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    ok(sw <= vp.width, `${tag}/${name}: page is ${sw}px wide in a ${vp.width}px window`);
    if (shots) await page.screenshot({ path: fsPath(new URL(`${tag}-${name}.png`, outDir)), fullPage: true });
  };
  await page.goto(PAGE);
  await shot("01-start");
  await page.fill("#v-name", V.name); await page.fill("#v-about", V.about);
  await page.click("#go-build");
  for (let i = 0; i < 9; i++) {
    if (i === 0) await shot("02-build-block1");
    if (i === 0) { await page.click("text=Show me an example"); await shot("03-build-example"); }
    await page.fill("#block-text", V.blocks[i]);
    if (i === 4) await shot("04-build-fuel");
    // close the tab mid-round and reopen: the canvas should still be there
    if (i === 5 && key === "forprofit" && vp.width === 390) {
      const before = await page.evaluate(() => JSON.stringify(window.__bbr.state().blocks));
      await page.waitForTimeout(400);
      const p2 = await ctx.newPage(); await page.close();
      await p2.goto(PAGE);
      const after = await p2.evaluate(() => JSON.stringify(window.__bbr.state().blocks));
      ok(before === after, "reload lost blocks: " + before + " vs " + after);
      ok(await p2.isVisible("#block-text"), "reload did not come back to the block screen");
      ok((await p2.inputValue("#block-text")) === V.blocks[5], "reload lost the block text in the box");
      return finish(p2, ctx, V, tag, shot, i, vp, shots);
    }
    await page.click("#block-next");
  }
  return finishFromDial(page, ctx, V, tag, shot, vp);
}
async function finish(page, ctx, V, tag, shotOld, i, vp, shots) {
  page.on("pageerror", (e) => problems.push(`${tag} pageerror: ${e.message}`));
  page.on("dialog", (dlg) => dlg.accept());
  const shot = async (name) => {
    await page.waitForTimeout(120);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    ok(sw <= vp.width, `${tag}/${name}: page is ${sw}px wide in a ${vp.width}px window`);
    if (shots) await page.screenshot({ path: fsPath(new URL(`${tag}-${name}.png`, outDir)), fullPage: true });
  };
  await page.click("#block-next");
  for (let j = i + 1; j < 9; j++) { await page.fill("#block-text", V.blocks[j]); await page.click("#block-next"); }
  return finishFromDial(page, ctx, V, tag, shot, vp);
}
async function finishFromDial(page, ctx, V, tag, shot, vp) {
  await page.waitForSelector("#dial");
  await shot("05-dial-untouched");
  await page.$eval("#dial", (el, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }, V.dial);
  await page.fill("#give", V.give); await page.fill("#keep", V.keep);
  await shot("06-dial");
  await page.click("#go-break");
  await shot("07-break-handoff");
  if (V === VENTURES.art) await page.check("#solo"); else await page.fill("#who", "Maya");
  await page.click("#go-pairs");
  await shot("08-pairs-empty");
  for (let k = 0; k < 6; k++) {
    const [v, why] = V.pairs[k];
    if (v) await page.click(`#pair-${k} button[data-v="${v}"]`);
    if (why) await page.fill(`#pair-${k} input`, why);
  }
  await shot("09-pairs");
  await page.click("#go-money");
  await shot("10-money-blank");
  for (const [k, v] of Object.entries(V.money)) await page.fill("#m-" + k, v);
  await shot("11-money");
  await page.click("#go-cards");
  await shot("12-cards-new");
  await page.click('#card-0 button[data-v="hurts"]'); await page.fill("#card-0 input", "We'd lose a month.");
  await page.click('#card-1 button[data-v="survives"]');
  await page.click('#card-2 button[data-v="kills"]'); await page.fill("#card-2 input", "No backup plan.");
  await shot("13-cards");
  await page.click("#go-bp");
  await shot("14-breakpoint");
  if (V.bpText) {
    await page.click(".pick >> nth=1");
    await page.fill("#bp-text", V.bpText);
  } else {
    await page.fill("#bp-other", "Every wall belongs to one group. If they say no, we're done.");
  }
  await shot("15-breakpoint-picked");
  await page.click("#go-rebuild");
  await shot("16-rebuild-before");
  for (const [id, t] of Object.entries(V.edits)) await page.fill(`#edit-${id} textarea`, t);
  await page.fill("#what", V.what);
  await shot("17-rebuild");
  ok(await page.isVisible("#lock"), tag + ": lock button missing after edits");
  await page.click("#go-handin");
  await page.fill("#ai", V.ai);
  await shot("18-handin");
  const st = await page.evaluate(() => window.__bbr.state());
  const stamp = await page.textContent("#stamp");
  ok(/2/.test(stamp), tag + ": hand-in stamp is not version 2: " + stamp);
  const strip = await page.textContent("#strip");
  ok(/9\/9/.test(strip), tag + ": strip does not show 9/9 built: " + strip);
  return { page, ctx, st, strip };
}

// ---- run the walks ----
const results = {};
for (const [key, vp, scale, scheme, shots] of [
  ["forprofit", { width: 390, height: 844 }, 2, "light", true],
  ["forprofit", { width: 1280, height: 800 }, 1, "light", true],
  ["art", { width: 390, height: 844 }, 2, "light", true],
  ["art", { width: 1280, height: 800 }, 1, "light", true],
  ["art", { width: 390, height: 844 }, 2, "dark", true],
]) {
  const r = await walk(key, vp, scale, scheme, shots);
  results[`${key}-${vp.width}-${scheme}`] = r.strip;
  if (vp.width === 1280 && scheme === "light") {
    await r.page.emulateMedia({ media: "print" });
    await r.page.pdf({ path: fsPath(new URL(`handin-${key}.pdf`, outDir)), format: "Letter", printBackground: true });
    await r.page.screenshot({ path: fsPath(new URL(`${key}-print-preview.png`, outDir)), fullPage: true });
    await r.page.emulateMedia({ media: "screen" });
    // copy as text (clipboard may be blocked headless; the fallback box must then appear)
    await r.ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: PAGE.replace(/\/$/, "") }).catch(() => {});
    await r.page.click("#copytext");
    await r.page.waitForTimeout(300);
    const txt = await r.page.evaluate(() => navigator.clipboard.readText().catch(() => document.querySelector("#copybox")?.value || ""));
    ok(txt.includes("Step 3 · The Breaking Point") && txt.includes("AI line"), key + ": copied text is missing sections");
    fs.writeFileSync(fsPath(new URL(`handin-${key}.txt`, outDir)), txt);
    // link round trip into a fresh browser that already has its own canvas
    await r.page.click("text=Copy my link >> nth=0");
    await r.page.waitForTimeout(200);
    const link = await r.page.evaluate(() => navigator.clipboard.readText());
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx2.newPage();
    await p.goto(PAGE); await p.fill("#v-name", "Someone else's thing"); await p.waitForTimeout(400);
    await p.goto(link); await p.waitForSelector("#md-link");
    await p.screenshot({ path: fsPath(new URL(`${key}-link-ask.png`, outDir)) });
    await p.click("#md-link");
    const got = await p.evaluate(() => window.__bbr.state());
    ok(got.name === r.st.name && JSON.stringify(got.blocks) === JSON.stringify(r.st.blocks) && got.versions.length === r.st.versions.length, key + ": link did not carry the canvas");
    ok(!(await p.evaluate(() => location.hash)), key + ": hash not cleared after reading the link");
    results[key + "-link-length"] = link.length;
    await ctx2.close();
  }
  await r.ctx.close();
}

// ---- money check edge cases ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push("money pageerror: " + e.message));
  await page.addInitScript((st) => localStorage.setItem("bbr-state", st), JSON.stringify({ screen: "break", bstep: "money" }));
  await page.goto(PAGE);
  const cases = [
    ["all blank", { price: "", qty: "", cost: "", pay: "" }],
    ["all zero", { price: "0", qty: "0", cost: "0", pay: "0" }],
    ["price zero", { price: "0", qty: "10", cost: "100", pay: "200" }],
    ["price only", { price: "12", qty: "", cost: "", pay: "" }],
    ["no pay", { price: "10", qty: "20", cost: "300", pay: "" }],
    ["commas and $", { price: "$1,500", qty: "2", cost: "$1,000", pay: "1,000" }],
    ["negative", { price: "-5", qty: "10", cost: "1", pay: "1" }],
    ["letters", { price: "ten", qty: "10", cost: "1", pay: "1" }],
    ["decimals", { price: "7.50", qty: "33", cost: "100", pay: "150" }],
  ];
  const lines = [];
  for (const [name, m] of cases) {
    for (const [k, v] of Object.entries(m)) await page.fill("#m-" + k, v);
    const out = (await page.textContent("#money-out")).replace(/\s+/g, " ").trim();
    ok(!/NaN|Infinity|undefined/.test(out), `money "${name}" shows a broken number: ${out}`);
    const v6 = await page.evaluate(() => window.__bbr.state().pairs[5].v);
    lines.push(`${name}: ${out}  | pair 6 = ${v6 || "(none)"}`);
  }
  await page.screenshot({ path: fsPath(new URL("money-decimals.png", outDir)), fullPage: true });
  fs.writeFileSync(fsPath(new URL("money-cases.txt", outDir)), lines.join("\n") + "\n");
  console.log(lines.join("\n"));
  await ctx.close();
}

// ---- breaking point screen with no cracks ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.addInitScript((st) => localStorage.setItem("bbr-state", st), JSON.stringify({ screen: "break", bstep: "bp" }));
  await page.goto(PAGE);
  ok(await page.isVisible(".alertnote"), "no-cracks nudge missing");
  await page.screenshot({ path: fsPath(new URL("breakpoint-no-cracks.png", outDir)), fullPage: true });
  await ctx.close();
}

await browser.close(); srv.close();
console.log(JSON.stringify(results, null, 1));
console.log(problems.length ? "PROBLEMS:\n" + problems.join("\n") : "No problems found.");
console.log("Output:", fsPath(outDir));
process.exit(problems.length ? 1 : 0);
