// Build. Break. Rebuild. · page logic. All student-facing words come from content.js.
// No server, no accounts, no AI calls. State lives in localStorage under one key; "Copy my link" puts it in the URL fragment.
(() => {
  "use strict";
  const C = window.CONTENT;
  const KEY = "bbr-state";
  const SCHEMA = 1;
  const IDS = C.blocks.map((b) => b.id);
  const B = Object.fromEntries(C.blocks.map((b) => [b.id, b]));
  const BAD_PAIR = ["shaky", "breaks"];
  const BAD_CARD = ["hurts", "kills"];
  const LETTERS = "ABCDEFGHI";

  // ---------- state ----------
  const blank = () => ({
    schema: SCHEMA, name: "", about: "",
    blocks: Object.fromEntries(IDS.map((i) => [i, ""])),
    dial: 50, dialTouched: false, give: "", keep: "",
    who: "", solo: false,
    pairs: C.pairQs.map(() => ({ v: "", why: "" })), p6manual: false,
    money: { price: "", qty: "", cost: "", pay: "" },
    cards: [], // [{ i: deck index, v, why }]
    bp: { pick: "", other: "", text: "" },
    versions: [], // snapshots of blocks; versions[0] is version 1
    what: "", ai: "",
    screen: "start", bi: 0, bstep: "who",
  });
  function normalize(raw) {
    const s = blank();
    if (!raw || typeof raw !== "object") return s;
    for (const k of Object.keys(s)) if (k in raw && typeof raw[k] === typeof s[k] && !Array.isArray(s[k])) s[k] = raw[k];
    s.blocks = Object.fromEntries(IDS.map((i) => [i, String((raw.blocks || {})[i] ?? "")]));
    s.money = Object.assign(blank().money, raw.money || {});
    s.bp = Object.assign(blank().bp, raw.bp || {});
    if (Array.isArray(raw.pairs)) s.pairs = C.pairQs.map((_, i) => Object.assign({ v: "", why: "" }, raw.pairs[i] || {}));
    if (Array.isArray(raw.cards)) s.cards = raw.cards.filter((c) => c && C.deck[c.i]).slice(0, 3).map((c) => ({ i: c.i, v: c.v || "", why: c.why || "" }));
    if (Array.isArray(raw.versions)) s.versions = raw.versions.filter((v) => v && typeof v === "object").map((v) => Object.fromEntries(IDS.map((i) => [i, String(v[i] ?? "")])));
    s.dial = Math.max(0, Math.min(100, Number(raw.dial) || 0));
    if (raw.dial === undefined) s.dial = 50;
    return s;
  }
  let S;
  try { S = normalize(JSON.parse(localStorage.getItem(KEY) || "null")); } catch { S = blank(); }
  let saveTimer = null;
  function saveNow() { clearTimeout(saveTimer); saveTimer = null; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage full or blocked: the page still works for this visit */ } }
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }
  addEventListener("pagehide", saveNow);
  addEventListener("storage", (e) => {
    if (e.key !== KEY || !e.newValue) return;
    clearTimeout(saveTimer); saveTimer = null;
    try { S = normalize(JSON.parse(e.newValue)); } catch { return; }
    render();
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveNow(); });

  // ---------- helpers ----------
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "value") el.value = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const fill = (str, map) => str.replace(/\{(\w+)\}/g, (_, k) => map[k]);
  const words = (s) => (String(s || "").trim().match(/\S+/g) || []).length;
  const $ = (id) => document.getElementById(id);
  const label = (id) => B[id].nick;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.remove("hidden"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add("hidden"), 3200); }
  function input(attrs, onval) {
    const el = h(attrs.rows ? "textarea" : "input", Object.assign({ type: attrs.rows ? null : "text" }, attrs));
    el.addEventListener("input", () => { onval(el.value); save(); live(); });
    return el;
  }

  // ---------- derived ----------
  const builtCount = () => IDS.filter((i) => S.blocks[i].trim()).length;
  const crackedPairs = () => S.pairs.map((p, i) => ({ i, p })).filter(({ p }) => BAD_PAIR.includes(p.v));
  const crackedCards = () => S.cards.map((c, i) => ({ i, c })).filter(({ c }) => BAD_CARD.includes(c.v));
  const cracks = () => crackedPairs().length + crackedCards().length;
  const sameAs = (a, b) => IDS.every((i) => (a[i] || "").trim() === (b[i] || "").trim());
  function versionNum() {
    const n = S.versions.length;
    if (!n) return 1;
    return sameAs(S.blocks, S.versions[n - 1]) ? n : n + 1;
  }
  const changedSinceV1 = (id) => S.versions.length > 0 && S.blocks[id].trim() !== (S.versions[0][id] || "").trim();
  function dialRead(v) { const r = C.dial.read; return v <= 10 ? r[0] : v <= 40 ? r[1] : v < 60 ? r[2] : v < 90 ? r[3] : r[4]; }
  // Every crack, lettered A, B, C... in a fixed order: pairs first, then cards.
  function crackList() {
    const out = [];
    crackedPairs().forEach(({ i, p }) => { const q = C.pairQs[i]; out.push({ key: "p" + i, kind: "pair", blocks: [q.a, q.b], text: q.q, v: p.v, why: p.why }); });
    crackedCards().forEach(({ i, c }) => { const d = C.deck[c.i]; out.push({ key: "c" + i, kind: "card", blocks: [d.block], text: d.t, v: c.v, why: c.why }); });
    out.forEach((x, n) => (x.letter = LETTERS[n] || "+"));
    return out;
  }
  function bpItem() {
    const k = S.bp.pick;
    if (!k || k === "other") return null;
    const i = Number(k.slice(1));
    if (k[0] === "p" && C.pairQs[i]) { const q = C.pairQs[i]; return { blocks: [q.a, q.b], label: label(q.a) + " + " + label(q.b), text: q.q }; }
    if (k[0] === "c" && S.cards[i]) { const d = C.deck[S.cards[i].i]; return { blocks: [d.block], label: label(d.block), text: d.t }; }
    return null;
  }
  const whoLine = () => (S.solo ? C.breakIntro.soloLine : S.who.trim() ? C.handin.foundBy + " " + S.who.trim() : "");
  const sitsLine = () => (S.dialTouched ? fill(C.handin.sitsFmt, { read: dialRead(S.dial), n: S.dial }) : C.handin.empty);
  const tiedBlocks = () => (bpItem() || { blocks: [] }).blocks;

  // ---------- money ----------
  function num(s) {
    const t = String(s || "").replace(/[$,\s]/g, "");
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : NaN;
  }
  function moneyCalc() {
    const price = num(S.money.price), qty = num(S.money.qty), cost = num(S.money.cost), pay = num(S.money.pay);
    const all = [price, qty, cost, pay];
    const bad = all.some((x) => Number.isNaN(x)) ? "nan" : all.some((x) => x !== null && x < 0) ? "neg" : null;
    // whole dollars, so the gap shown always equals the two numbers shown
    const inn = price !== null && qty !== null ? Math.round(price * qty) : null;
    const out = cost !== null || pay !== null ? Math.round((cost || 0) + (pay || 0)) : null;
    const need = out !== null && out > 0 && price ? Math.ceil(out / price) : null;
    let verdict = "";
    if (!bad && inn !== null && out !== null && out > 0) verdict = inn >= out ? "holds" : inn >= 0.75 * out ? "shaky" : "breaks";
    return { price, qty, cost, pay, inn, out, need, bad, verdict, payBlank: pay === null || pay === 0 };
  }
  const usd = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
  // Pair 6 answers itself from the money check until the Board picks a different answer by hand.
  function syncPair6() {
    const idx = C.pairQs.findIndex((q) => q.money);
    if (idx < 0 || S.p6manual) return;
    S.pairs[idx].v = moneyCalc().verdict;
  }

  // ---------- canvas pictures ----------
  function thumb(cur) {
    return h("div", { class: "canvas thumb", role: "group", "aria-label": "Canvas" }, IDS.map((id) => {
      const filled = S.blocks[id].trim() !== "";
      return h("button", { class: "cell" + (filled ? " filled" : "") + (id === cur ? " cur" : ""), style: "--a:" + id, type: "button",
        "aria-label": B[id].nick + (filled ? ", filled" : ", empty"),
        onclick: () => { S.screen = "build"; S.bi = IDS.indexOf(id); save(); render(); } },
        h("span", { class: "s", text: B[id].short }), h("span", { class: "mk", "aria-hidden": "true", text: filled ? "✓" : "+" }));
    }));
  }
  function full(opts = {}) {
    const marks = {};
    if (opts.cracks) for (const c of crackList()) for (const b of c.blocks) (marks[b] = marks[b] || []).push(c);
    return h("div", { class: "canvas full" }, IDS.map((id) => {
      const t = S.blocks[id].trim();
      const ch = opts.changed && changedSinceV1(id);
      const m = marks[id] || [];
      return h("div", { class: "cell" + (ch ? " changed" : "") + (m.length ? " cracked" : ""), style: "--a:" + id },
        m.length ? h("div", { class: "badges" }, m.map((c) => h("span", { class: "badge" + (c.v === "breaks" || c.v === "kills" ? " br" : ""), text: c.letter, title: c.text }))) : null,
        h("div", { class: "n", text: B[id].nick }), h("div", { class: "nm", text: B[id].name + (ch ? " · " + C.rebuild.changed : "") }),
        h("div", { class: "t" + (t ? "" : " empty"), text: t || C.handin.empty }));
    }));
  }

  // ---------- chrome ----------
  function chrome() {
    $("kicker").textContent = C.kicker;
    const brand = $("brand"); brand.textContent = "";
    const parts = C.title.split(" ");
    brand.append(parts.slice(0, -1).join(" ") + " ", h("span", { text: parts[parts.length - 1] }));
    $("foot-note").textContent = C.footer;
    $("foot-link").textContent = C.link.copy;
    $("foot-link").onclick = copyLink;
    $("foot-reset").textContent = C.reset;
    $("foot-reset").onclick = () => { if (confirm(C.resetAsk)) { S = blank(); saveNow(); render(); } };
    $("foot-mine").textContent = C.link.backToMine;
    $("foot-mine").onclick = () => {
      if (!confirm(C.link.backAsk)) return;
      try { S = normalize(JSON.parse(localStorage.getItem(KEY + "-mine"))); localStorage.removeItem(KEY + "-mine"); } catch { return; }
      saveNow(); render();
    };
  }
  function strip() {
    const st = $("strip"); st.textContent = "";
    st.append(h("span", {}, h("b", { text: builtCount() + "/9" }), " " + C.strip.built),
      h("span", {}, h("b", { text: String(cracks()) }), " " + C.strip.cracks),
      h("span", {}, C.strip.version + " ", h("b", { text: String(versionNum()) })));
  }
  const ROUND = { start: "start", build: "build", dial: "build", break: "break", rebuild: "rebuild", handin: "handin" };
  function rail() {
    const r = $("rail"); r.textContent = "";
    for (const k of ["start", "build", "break", "rebuild", "handin"]) {
      r.append(h("button", { type: "button", class: ROUND[S.screen] === k ? "now" : null, "aria-current": ROUND[S.screen] === k ? "step" : null, text: C.rail[k],
        onclick: () => go(k) }));
    }
  }
  function go(screen, extra) {
    S.screen = screen;
    if (extra) Object.assign(S, extra);
    save(); render(); scrollTo(0, 0);
  }
  // Small updates that must not rebuild the screen (so typing keeps focus).
  const liveHooks = [];
  function live() { strip(); for (const f of liveHooks) f(); }

  // ---------- screens ----------
  const screens = {};

  screens.start = () => {
    const s = C.start;
    return [
      h("h1", { text: s.h1 }),
      h("p", { class: "lede", text: s.lede }),
      h("div", { class: "card" },
        h("div", { class: "field" }, h("label", { class: "lab", for: "v-name", text: s.nameLabel }), input({ id: "v-name", placeholder: s.namePh, value: S.name, maxlength: 80 }, (v) => (S.name = v))),
        h("div", { class: "field" }, h("label", { class: "lab", for: "v-about", text: s.aboutLabel }), input({ id: "v-about", rows: 2, placeholder: s.aboutPh, value: S.about }, (v) => (S.about = v))),
        h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", id: "go-build", text: s.go, onclick: () => go("build", { bi: 0 }) })),
        h("p", { class: "small muted", text: s.saved })),
      h("ul", { class: "plain small" }, s.rounds.map((t) => h("li", { text: t }))),
    ];
  };

  screens.build = () => {
    const s = C.build;
    const bi = Math.max(0, Math.min(8, S.bi | 0));
    const b = C.blocks[bi];
    const ex = h("p", { class: "example hidden" }, h("b", { text: s.exLead + " " }), b.ex);
    const exBtn = h("button", { class: "btn link", type: "button", text: s.showEx, "aria-expanded": "false",
      onclick: () => { const open = ex.classList.toggle("hidden"); exBtn.textContent = open ? s.showEx : s.hideEx; exBtn.setAttribute("aria-expanded", String(!open)); } });
    const thumbBox = h("div", {}, thumb(b.id));
    liveHooks.push(() => { thumbBox.replaceChildren(thumb(b.id)); });
    const ta = input({ id: "block-text", rows: 2, placeholder: s.ph, value: S.blocks[b.id], "aria-labelledby": "block-q" }, (v) => (S.blocks[b.id] = v));
    return [
      h("div", { class: "row between" }, h("span", { class: "kicker", text: s.kicker }), h("span", { class: "tag", text: fill(s.blockOf, { n: bi + 1 }) })),
      thumbBox,
      h("p", { class: "small muted", text: s.tapNote }),
      h("div", { class: "card hot" },
        h("div", { class: "blockhead" }, h("h2", { text: b.nick }), h("span", { class: "nm", text: b.name })),
        h("p", { class: "lab", id: "block-q", text: b.q }),
        b.note ? h("p", { class: "note small", text: b.note }) : null,
        ta,
        h("div", {}, exBtn, ex)),
      h("div", { class: "row between" },
        h("button", { class: "btn", type: "button", text: s.back, onclick: () => (bi === 0 ? go("start") : go("build", { bi: bi - 1 })) }),
        h("button", { class: "btn primary", type: "button", id: "block-next", text: bi < 8 ? s.next : s.toDial, onclick: () => (bi < 8 ? go("build", { bi: bi + 1 }) : go("dial")) })),
      h("p", { class: "small muted", text: s.skipNote }),
    ];
  };

  screens.dial = () => {
    const s = C.dial;
    const read = h("p", { class: "read", text: S.dialTouched ? dialRead(S.dial) : "?" });
    const range = h("input", { type: "range", min: 0, max: 100, step: 1, value: S.dial, id: "dial", "aria-label": s.left + " to " + s.right });
    range.addEventListener("input", () => { S.dial = Number(range.value); S.dialTouched = true; read.textContent = dialRead(S.dial); save(); });
    const exLine = (t) => h("p", { class: "example small muted" }, h("b", { text: C.build.exLead + " " }), t);
    return [
      h("span", { class: "kicker", text: s.kicker }),
      h("h2", { text: s.h2 }),
      h("p", { class: "lede", text: s.lede }),
      h("div", { class: "card hot dial" }, h("div", { class: "ends" }, h("span", { text: s.left }), h("span", { text: s.right })), range, read),
      h("div", { class: "field" }, h("label", { class: "lab", for: "give", text: s.giveLabel }), input({ id: "give", rows: 2, placeholder: s.givePh, value: S.give }, (v) => (S.give = v)), exLine(s.giveEx)),
      h("div", { class: "field" }, h("label", { class: "lab", for: "keep", text: s.keepLabel }), input({ id: "keep", rows: 2, placeholder: s.keepPh, value: S.keep }, (v) => (S.keep = v)), exLine(s.keepEx)),
      h("div", { class: "row between" },
        h("button", { class: "btn", type: "button", text: C.build.back, onclick: () => go("build", { bi: 8 }) }),
        h("button", { class: "btn primary", type: "button", id: "go-break", text: s.done, onclick: () => go("break", { bstep: "who" }) })),
    ];
  };

  const BSTEPS = ["who", "pairs", "money", "cards", "bp"];
  function subnav() {
    const names = { who: "Hand off", pairs: "Questions", money: "Money", cards: "Cards", bp: "Breaking point" };
    return h("div", { class: "subnav", role: "group", "aria-label": "Round 2 steps" }, BSTEPS.map((k) =>
      h("button", { type: "button", class: S.bstep === k ? "now" : null, text: names[k], onclick: () => go("break", { bstep: k }) })));
  }
  screens.break = () => {
    const step = BSTEPS.includes(S.bstep) ? S.bstep : "who";
    return [subnav(), ...bscreens[step]()];
  };
  const bscreens = {};
  bscreens.who = () => {
    const s = C.breakIntro;
    const nameIn = input({ id: "who", placeholder: s.whoPh, value: S.solo ? "" : S.who, maxlength: 40, autocomplete: "off" }, (v) => { S.who = v; });
    const solo = h("input", { type: "checkbox", id: "solo", checked: S.solo || null });
    solo.addEventListener("change", () => { S.solo = solo.checked; if (S.solo) S.who = ""; nameIn.disabled = S.solo; nameIn.value = ""; save(); live(); });
    nameIn.disabled = S.solo;
    return [
      h("span", { class: "kicker", text: s.kicker }),
      h("h2", { text: s.h2 }),
      h("p", { class: "lede", text: s.lede }),
      h("div", { class: "card hot" },
        h("div", { class: "field" }, h("label", { class: "lab", for: "who", text: s.whoLabel }), nameIn),
        h("label", { class: "toggle" }, solo, h("span", { text: s.soloLabel })),
        h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", id: "go-pairs", text: s.go, onclick: () => go("break", { bstep: "pairs" }) }))),
      h("p", { class: "small muted", text: s.peek }),
      S.name ? h("h3", { text: S.name }) : null,
      S.about ? h("p", { class: "small", text: S.about }) : null,
      full(),
    ];
  };
  function choice(opts, cur, onpick, keepOnRetap) {
    const wrap = h("div", { class: "choice", role: "group" });
    const draw = (v) => { for (const b of wrap.children) b.setAttribute("aria-pressed", String(b.dataset.v === v)); };
    for (const [v, txt] of opts) wrap.append(h("button", { type: "button", "data-v": v, "aria-pressed": String(cur === v), text: txt,
      onclick: () => { const on = wrap.querySelector(`[data-v="${v}"]`).getAttribute("aria-pressed") === "true"; const nv = on && !(keepOnRetap && keepOnRetap()) ? "" : v; onpick(nv); draw(nv); save(); live(); } }));
    wrap.redraw = draw;
    return wrap;
  }
  bscreens.pairs = () => {
    const s = C.pairs;
    syncPair6();
    return [
      h("span", { class: "kicker", text: s.kicker }),
      h("p", { class: "lede", text: s.lede }),
      ...C.pairQs.map((q, i) => {
        const p = S.pairs[i];
        const ch = choice([["holds", s.holds], ["shaky", s.shaky], ["breaks", s.breaks]], p.v, (v) => { p.v = v; if (q.money) S.p6manual = true; }, q.money ? () => !S.p6manual : null);
        let hint = null;
        if (q.money) {
          hint = h("p", { class: "small note" });
          const upd = () => { const m = moneyCalc(); hint.textContent = !S.p6manual && m.verdict ? fill(s.fromMoney, { in: usd(m.inn), out: usd(m.out) }) : S.p6manual ? "" : s.fillMoney; hint.classList.toggle("hidden", !hint.textContent); };
          upd(); liveHooks.push(upd);
        }
        return h("div", { class: "card", id: "pair-" + i },
          h("div", { class: "row" }, h("span", { class: "qn", text: String(i + 1) }), h("span", { class: "tag", text: label(q.a) + " + " + label(q.b) })),
          h("p", { class: "lab", text: q.q }),
          h("div", { class: "pairblocks" }, [q.a, q.b].map((id) => h("div", {}, h("b", { text: B[id].nick }), S.blocks[id].trim() || C.handin.empty))),
          ch, hint,
          input({ placeholder: s.whyPh, value: p.why, "aria-label": s.whyPh }, (v) => (p.why = v)));
      }),
      h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", id: "go-money", text: s.next, onclick: () => go("break", { bstep: "money" }) })),
    ];
  };
  bscreens.money = () => {
    const s = C.money;
    const box = h("div", { class: "card hot", id: "money-out", "aria-live": "polite" });
    const draw = () => {
      const m = moneyCalc();
      syncPair6();
      box.textContent = "";
      if (m.bad) { box.append(h("p", { class: "alertnote", text: m.bad === "neg" ? s.neg : s.nan })); return; }
      const dl = h("dl", { class: "result" });
      const row = (k, v, cls) => dl.append(h("dt", { text: k }), h("dd", { class: cls || null }, v));
      row(s.moneyIn, m.inn === null ? "?" : [usd(m.inn), h("small", { text: " " + s.perMonth })]);
      row(s.moneyOut, m.out === null ? "?" : [usd(m.out), h("small", { text: " " + s.perMonth })]);
      if (m.inn !== null && m.out !== null) { const g = m.inn - m.out; row(g >= 0 ? s.gap : s.short, [usd(Math.abs(g)), h("small", { text: " " + s.perMonth })], g < 0 ? "neg" : null); }
      if (m.need !== null) row(s.need, [m.need.toLocaleString("en-US"), m.qty !== null ? h("small", { text: " (" + s.youSaid + " " + m.qty.toLocaleString("en-US") + ")" }) : null]);
      box.append(dl);
      if (m.inn !== null && m.out !== null && (m.inn > 0 || m.out > 0)) {
        const max = Math.max(m.inn, m.out);
        box.append(h("div", { class: "bars", "aria-hidden": "true" },
          h("div", { class: "bar", style: "width:" + (100 * m.inn / max) + "%", text: s.barIn }), h("div", { class: "bar out", style: "width:" + (100 * m.out / max) + "%", text: s.barOut })));
      }
      if (m.out === 0) box.append(h("p", { class: "small note", text: s.free }));
      else if (m.out !== null && m.payBlank) box.append(h("p", { class: "small note", text: s.addPay }));
      else if (m.out === null) box.append(h("p", { class: "small muted", text: s.noCosts }));
      if (m.out !== null && m.out > 0 && !m.price) box.append(h("p", { class: "small muted", text: s.noPrice }));
    };
    const f = (k, lab, dollar) => {
      const el = h("input", { id: "m-" + k, inputmode: "decimal", value: S.money[k], autocomplete: "off" });
      el.addEventListener("input", () => { S.money[k] = el.value; save(); draw(); live(); });
      el.addEventListener("change", () => { const t = el.value.replace(/^\s*\$\s*/, ""); if (t !== el.value) { el.value = t; S.money[k] = t; save(); } });
      return h("div", { class: "field" }, h("label", { class: "lab", for: "m-" + k, text: lab }), dollar ? h("div", { class: "dollar" }, h("span", { text: "$" }), el) : el);
    };
    draw();
    return [
      h("span", { class: "kicker", text: s.kicker }),
      h("p", { class: "lede", text: s.lede }),
      h("div", { class: "money" }, f("price", s.price, true), f("qty", s.qty, false), f("cost", s.cost, true), f("pay", s.pay, true)),
      box,
      h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", id: "go-cards", text: s.next, onclick: () => go("break", { bstep: "cards" }) })),
    ];
  };
  function draw3() {
    // three cards that hit three different blocks
    const order = C.deck.map((_, i) => i).sort(() => Math.random() - 0.5);
    const picked = [], seen = new Set();
    for (const i of order) { if (seen.has(C.deck[i].block)) continue; seen.add(C.deck[i].block); picked.push(i); if (picked.length === 3) break; }
    S.cards = picked.map((i) => ({ i, v: "", why: "" }));
  }
  bscreens.cards = () => {
    const s = C.cards;
    if (S.cards.length < 3) { draw3(); save(); }
    return [
      h("span", { class: "kicker", text: s.kicker }),
      h("p", { class: "lede", text: s.lede }),
      ...S.cards.map((c, n) => {
        const d = C.deck[c.i];
        return h("div", { class: "ecard", id: "card-" + n },
          h("span", { class: "tag", text: s.hits + ": " + B[d.block].nick }),
          h("p", { class: "t", text: d.t }),
          choice([["survives", s.survives], ["hurts", s.hurts], ["kills", s.kills]], c.v, (v) => (c.v = v)),
          input({ placeholder: s.whyPh, value: c.why, "aria-label": s.whyPh }, (v) => (c.why = v)));
      }),
      h("div", { class: "row between" },
        h("button", { class: "btn", type: "button", id: "redraw", text: s.redraw, onclick: () => { if (S.cards.some((c) => c.v || c.why) && !confirm(s.redrawAsk)) return; draw3(); save(); render(); } }),
        h("button", { class: "btn primary", type: "button", id: "go-bp", text: s.next, onclick: () => go("break", { bstep: "bp" }) })),
    ];
  };
  bscreens.bp = () => {
    const s = C.breakpoint;
    const list = crackList();
    const picks = h("div", { class: "picks", role: "radiogroup", "aria-label": s.h2 });
    const opt = (key, tag, title, sub, extra) => {
      const r = h("input", { type: "radio", name: "bp", value: key, checked: S.bp.pick === key || null });
      const el = h("label", { class: "pick" + (S.bp.pick === key ? " sel" : "") }, r, h("span", {}, h("span", { class: "tag", text: tag }), h("br"), h("b", { text: title }), sub ? h("span", { class: "why" }, h("br"), sub) : null, extra || null));
      r.addEventListener("change", () => { S.bp.pick = key; for (const p of picks.children) p.classList.toggle("sel", p.contains(picks.querySelector("input:checked"))); save(); live(); });
      return el;
    };
    for (const c of list) {
      const tag = c.letter + " · " + (c.kind === "pair" ? s.pairTag : s.cardTag) + " · " + (c.kind === "pair" ? C.pairs[c.v] : C.cards[c.v]) + " · " + c.blocks.map(label).join(" + ");
      picks.append(opt(c.key, tag, c.text, c.why ? "“" + c.why + "”" : ""));
    }
    const other = input({ id: "bp-other", placeholder: s.otherPh, value: S.bp.other, "aria-label": s.otherPh }, (v) => { S.bp.other = v; if (S.bp.pick !== "other") { S.bp.pick = "other"; const r = picks.querySelector('input[value="other"]'); if (r) r.checked = true; for (const p of picks.children) p.classList.toggle("sel", p.contains(r)); } });
    picks.append(opt("other", s.other, "", "", h("span", { class: "other" }, other)));
    return [
      h("span", { class: "kicker", text: s.kicker }),
      h("h2", { text: s.h2 }),
      h("p", { class: "lede", text: s.lede }),
      whoLine() ? h("p", { class: "small muted", text: whoLine() }) : null,
      full({ cracks: true }),
      list.length ? null : h("p", { class: "alertnote", text: s.none }),
      picks,
      h("div", { class: "field" }, h("label", { class: "lab", for: "bp-text", text: s.sentenceLabel }), input({ id: "bp-text", rows: 2, placeholder: s.sentencePh, value: S.bp.text }, (v) => (S.bp.text = v))),
      h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", id: "go-rebuild", text: s.toRebuild, onclick: () => go("rebuild") })),
    ];
  };

  screens.rebuild = () => {
    const s = C.rebuild;
    const tied = tiedBlocks();
    const editor = (id) => {
      const chip = h("span", { class: "chip", text: s.changed });
      const was = h("p", { class: "was" });
      const upd = () => {
        const c = changedSinceV1(id);
        chip.classList.toggle("hidden", !c);
        was.textContent = s.was + " " + (((S.versions[0] || {})[id] || "").trim() || C.handin.empty);
        was.classList.toggle("hidden", !c);
      };
      upd(); liveHooks.push(upd);
      return h("div", { class: "edit" + (tied.includes(id) ? " tied" : ""), id: "edit-" + id },
        h("div", { class: "h" }, h("b", { text: B[id].nick }), h("span", { class: "tag", text: B[id].name }), chip),
        input({ rows: 2, value: S.blocks[id], "aria-label": B[id].nick + ", " + B[id].name }, (v) => {
          // Version 1 is the canvas as it stood before the first rebuild edit (S.blocks still holds the old text here).
          if (!S.versions.length) S.versions.push({ ...S.blocks });
          S.blocks[id] = v;
        }), was);
    };
    const bp = bpItem();
    const lockBox = h("div", { class: "row" });
    const lockDraw = () => {
      lockBox.textContent = "";
      const n = versionNum(), last = S.versions.length;
      if (n > last) lockBox.append(h("button", { class: "btn small", type: "button", id: "lock", text: fill(s.lock, { n }), onclick: () => { S.versions.push({ ...S.blocks }); save(); live(); toast(fill(s.lockedNote, { n, m: n + 1 })); } }));
    };
    lockDraw(); liveHooks.push(lockDraw);
    return [
      h("span", { class: "kicker", text: s.kicker }),
      h("h2", { text: s.h2 }),
      h("p", { class: "lede", text: s.lede }),
      bp || S.bp.text || S.bp.other ? h("div", { class: "note" },
        h("span", { class: "tag", text: C.handin.step3 }),
        h("p", { class: "lab", text: S.bp.text.trim() || S.bp.other.trim() || bp.text }),
        bp ? h("p", { class: "small muted", text: bp.label }) : null) : h("p", { class: "small muted", text: s.noBp }),
      tied.length ? h("h3", { text: s.tied }) : null,
      ...tied.map(editor),
      tied.length ? h("h3", { text: s.rest }) : null,
      ...IDS.filter((id) => !tied.includes(id)).map(editor),
      h("div", { class: "field" }, h("label", { class: "lab", for: "what", text: s.whatLabel }), input({ id: "what", rows: 4, placeholder: s.whatPh, value: S.what }, (v) => (S.what = v))),
      lockBox,
      h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", id: "go-handin", text: s.toHandin, onclick: () => go("handin") })),
    ];
  };

  function handinText() {
    const s = C.handin, bp = bpItem(), v = versionNum(), L = [];
    const or = (t) => (String(t || "").trim() || s.empty);
    L.push(C.title + " · Design Thinking Part III", "");
    L.push(or(S.name), or(S.about), "");
    L.push(s.canvasH.toUpperCase() + " · " + fill(s.versionStamp, { n: v }));
    for (const id of IDS) L.push(B[id].nick + " (" + B[id].name + ")" + (changedSinceV1(id) ? " [" + C.rebuild.changed + "]" : "") + ": " + or(S.blocks[id]));
    L.push("", s.step2, s.sitsAt + " " + sitsLine(), s.give + " " + or(S.give), s.keep + " " + or(S.keep));
    L.push("", s.step3, or(S.bp.text || S.bp.other));
    if (bp) L.push(bp.label + ": " + bp.text);
    if (whoLine()) L.push(whoLine());
    L.push("", s.step4, or(S.what), "", s.aiH, or(S.ai));
    return L.join("\n");
  }
  const stepWords = () => words(S.give) + words(S.keep) + words(S.bp.text) + words(S.bp.pick === "other" ? S.bp.other : "") + words(S.what);
  screens.handin = () => {
    const s = C.handin, bp = bpItem();
    const or = (t) => (String(t || "").trim() || s.empty);
    const wc = h("p", { class: "words no-print" });
    const wcDraw = () => (wc.textContent = fill(s.words, { n: stepWords() }));
    wcDraw(); liveHooks.push(wcDraw);
    const aiPrint = h("p", { class: "t print-only", text: or(S.ai) });
    const copyArea = h("div", { class: "no-print" });
    return [
      h("span", { class: "kicker", text: s.kicker }),
      h("div", { class: "row between" }, h("h2", { text: S.name.trim() || C.title }), h("span", { class: "stamp", id: "stamp", text: fill(s.versionStamp, { n: versionNum() }) })),
      S.about.trim() ? h("p", { text: S.about }) : null,
      h("div", { class: "hi-sec" }, h("h3", { text: s.canvasH }), full({ changed: true }), S.versions.length ? h("p", { class: "small muted", text: s.changedKey }) : null),
      h("div", { class: "hi-sec" }, h("h3", { text: s.step2 }),
        h("p", {}, h("b", { text: s.sitsAt + " " }), sitsLine()),
        h("p", {}, h("b", { text: s.give + " " }), or(S.give)), h("p", {}, h("b", { text: s.keep + " " }), or(S.keep))),
      h("div", { class: "hi-sec" }, h("h3", { text: s.step3 }),
        h("p", { class: "t", text: or(S.bp.text || S.bp.other) }),
        bp ? h("p", { class: "small muted", text: bp.label + ": " + bp.text }) : null,
        whoLine() ? h("p", { class: "small muted", text: whoLine() }) : null),
      h("div", { class: "hi-sec" }, h("h3", { text: s.step4 }), h("p", { class: "t", text: or(S.what) })),
      h("div", { class: "hi-sec" }, h("h3", { text: s.aiH }),
        h("label", { class: "lab no-print", for: "ai", text: s.aiLabel }),
        input({ id: "ai", rows: 2, placeholder: s.aiPh, value: S.ai }, (v) => { S.ai = v; aiPrint.textContent = or(v); }), aiPrint),
      wc,
      h("div", { class: "row no-print" },
        h("button", { class: "btn primary", type: "button", id: "pdf", text: s.pdf, onclick: () => { saveNow(); window.print(); } }),
        h("button", { class: "btn", type: "button", id: "copytext", text: s.copy, onclick: () => copyText(handinText(), s.copied, copyArea, s.copyFail) }),
        h("button", { class: "btn", type: "button", text: C.link.copy, onclick: copyLink })),
      h("p", { class: "small muted no-print", text: s.pdfTip }),
      copyArea,
    ];
  };

  // ---------- copy text and link ----------
  async function copyText(text, okMsg, fallbackBox, failMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); return true; } catch { /* fall through */ }
    try {
      const t = h("textarea", { style: "position:fixed;top:-1000px", value: text }); document.body.append(t); t.select();
      const ok = document.execCommand("copy"); t.remove();
      if (ok) { toast(okMsg); return true; }
    } catch { /* fall through */ }
    if (fallbackBox) {
      const box = h("textarea", { id: "copybox", readonly: true, value: text });
      fallbackBox.replaceChildren(h("p", { class: "alertnote small", text: failMsg }), box);
      box.focus(); box.select();
    }
    return false;
  }
  function b64urlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlDecode(s) {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }
  function copyLink() {
    saveNow();
    const url = location.href.split("#")[0] + "#c=" + b64urlEncode(JSON.stringify(S));
    copyText(url, C.link.copied + (url.length > 6000 ? " " + C.link.tooBig : ""), null).then((ok) => { if (!ok) prompt(C.link.fail, url); });
  }
  function hasWork(st) { return !!(st.name.trim() || IDS.some((i) => st.blocks[i].trim()) || st.give.trim() || st.what.trim()); }
  function readLink() {
    const m = location.hash.match(/^#c=([A-Za-z0-9_-]+)/);
    if (!m) return;
    history.replaceState(null, "", location.pathname + location.search);
    let incoming;
    try { incoming = normalize(JSON.parse(b64urlDecode(m[1]))); } catch { return; }
    const take = () => {
      if (hasWork(S) && JSON.stringify(S) !== JSON.stringify(incoming)) { try { localStorage.setItem(KEY + "-mine", JSON.stringify(S)); } catch { /* no room for the backup */ } }
      S = incoming; saveNow(); render();
    };
    if (!hasWork(S) || JSON.stringify(S) === JSON.stringify(incoming)) return take();
    const md = $("modal");
    md.replaceChildren(h("div", { class: "box", role: "dialog", "aria-modal": "true", "aria-labelledby": "md-h" },
      h("h3", { id: "md-h", text: C.link.askH }), h("p", { text: C.link.askP }),
      h("div", { class: "row" },
        h("button", { class: "btn primary", type: "button", id: "md-link", text: C.link.useLink, onclick: () => { md.classList.add("hidden"); take(); } }),
        h("button", { class: "btn", type: "button", id: "md-mine", text: C.link.keepMine, onclick: () => md.classList.add("hidden") }))));
    md.classList.remove("hidden");
  }

  // ---------- render ----------
  function render() {
    liveHooks.length = 0;
    if (!screens[S.screen]) S.screen = "start";
    const main = $("main");
    main.replaceChildren(h("section", { class: "screen", id: "screen-" + S.screen + (S.screen === "break" ? "-" + S.bstep : "") }, screens[S.screen]()));
    rail(); strip();
    $("foot-mine").classList.toggle("hidden", !localStorage.getItem(KEY + "-mine"));
    document.title = C.title + " · ENTP 3000";
  }
  chrome();
  render();
  readLink();
  addEventListener("hashchange", readLink); // a link pasted into a tab that already has the page open
  // for tests
  window.__bbr = { state: () => S };
})();
