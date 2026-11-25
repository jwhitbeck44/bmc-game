// Reads every student-facing string in content.js. Flags dashes, long lines, and long words.
// Run: cd test && node words.mjs
import fs from "node:fs"; import vm from "node:vm";
const win = {}; vm.runInNewContext(fs.readFileSync(new URL("../docs/content.js", import.meta.url), "utf8"), { window: win });
const out = [];
(function walk(v, path) {
  if (typeof v === "string") out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, path + "[" + i + "]"));
  else if (v && typeof v === "object") for (const k of Object.keys(v)) if (!["id", "block", "a", "b"].includes(k)) walk(v[k], path + "." + k);
})(win.CONTENT, "C");
let flags = 0, totalWords = 0, totalSent = 0;
for (const [p, s] of out) {
  const w = s.trim().split(/\s+/).filter(Boolean);
  const sents = s.split(/[.?!:]+\s/).filter((x) => x.trim());
  totalWords += w.length; totalSent += sents.length;
  const longSent = sents.map((x) => x.trim().split(/\s+/).length).filter((n) => n > 15);
  const issues = [];
  if (/[—–]/.test(s)) issues.push("DASH");
  if (longSent.length) issues.push("sentence over 15 words (" + longSent.join(",") + ")");
  const big = w.filter((x) => x.replace(/[^A-Za-z]/g, "").length >= 12 && !/Conspirators|Propositions|Relationships|Partnerships|Entrepreneurship|Distribution/.test(x));
  if (big.length) issues.push("long words: " + big.join(" "));
  if (issues.length) { flags++; console.log(p + ": " + issues.join("; ") + "\n   " + s); }
}
console.log(`\n${out.length} strings, ${totalWords} words, average ${(totalWords / totalSent).toFixed(1)} words per sentence. ${flags} flagged.`);
