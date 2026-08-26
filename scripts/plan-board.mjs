#!/usr/bin/env node
/**
 * Renders GROWTH-PLAN.md as a status board.
 *
 * Generated from the plan rather than written alongside it, so the board cannot
 * drift from the document it reports on. Re-run it after ticking items.
 *
 * The board adds one thing the markdown does not carry: which open items are
 * waiting on the founder and why. An item nobody can start is not the same as
 * an item nobody has started, and the flat checklist cannot tell them apart.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Open items that cannot move without the founder, and the one-line reason. */
const BLOCKED = {
  14: "A jurisdiction is a decision about where you operate, not a task.",
  15: "Registering a company needs your identity and your money.",
  16: "Needs a PostHog account and its project key.",
  19: "Nothing to build a funnel from until item 16 lands.",
  24: "`npx firebase deploy` needs your Firebase credentials.",
  32: "Needs a service account with backup rights.",
  45: "Fifteen conversations with real people. Cannot be delegated.",
  46: "Follows the interviews.",
  51: "Posting under your name, from your account.",
  52: "Posting under your name, from your account.",
  53: "Needs a hunter, a launch date and your presence on the day.",
  54: "Posting under your name, from your account.",
  55: "Posting under your name, from your account.",
  56: "Posting under your name, from your account.",
  57: "Your personal network.",
  58: "Pick a provider and create the account — everything downstream waits here.",
  105: "Outreach under your name.",
  106: "I can compute the study; the pitch to journalists is yours.",
  107: "Directory submissions ask for a founder and a contact.",
  112: "Needs an X developer account and posting credentials.",
  116: "Needs the email provider from item 58.",
  117: "A community needs someone in it.",
  118: "Sustained presence under your name.",
  119: "Your voice, weekly.",
  120: "Needs a Stripe account with your business details.",
  135: "Affiliate programmes underwrite a person and a company.",
  138: "Outbound under your name.",
  139: "Sales calls.",
  153: "Hiring.",
};

const PHASE_RE = /^# (PHASE \d+ — .+)$/;
const GOAL_RE = /^\*(Goal:.+)\*$/;
const SECTION_RE = /^### (.+)$/;
const ITEM_RE = /^- \[([ x])\] (\d+)\. (.+)$/;

function parse(md) {
  const phases = [];
  let phase = null, section = null;
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    let m;
    if ((m = line.match(PHASE_RE))) {
      phase = { title: m[1], goal: "", sections: [] };
      phases.push(phase);
      section = null;
    } else if (phase && !phase.goal && (m = line.match(GOAL_RE))) {
      phase.goal = m[1];
    } else if ((m = line.match(SECTION_RE))) {
      section = { title: m[1], items: [] };
      (phase ?? phases[phases.length - 1])?.sections.push(section);
    } else if ((m = line.match(ITEM_RE))) {
      if (!phase) continue;
      if (!section) { section = { title: "", items: [] }; phase.sections.push(section); }
      const [, mark, id, rest] = m;
      // "Title — note" splits on the first em dash; everything after it is the
      // record of what was actually done, which is the interesting half.
      const cut = rest.indexOf(" — ");
      section.items.push({
        id: Number(id),
        done: mark === "x",
        title: cut === -1 ? rest : rest.slice(0, cut),
        note: cut === -1 ? "" : rest.slice(cut + 3),
      });
    }
  }
  return phases;
}

const md = (s) => s
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

function statusOf(item) {
  if (item.done) return "done";
  return BLOCKED[item.id] ? "yours" : "mine";
}

const GATES = [
  ["G1", "First signal", "100 signups · 15 interviews · ≥25% week-1 retention"],
  ["G2", "Retention works", "1,000 MAU · ≥30% D30 · digest opens ≥35%"],
  ["G3", "Acquisition works", "10,000 MAU · 50K visits/mo · ≥40% organic"],
  ["G4", "Money works", "$1K MRR · ≥2% conversion · churn <8%"],
  ["G5", "Target", "20,000 MAU · $100K ARR"],
];

async function main() {
  const phases = parse(await readFile(path.join(ROOT, "GROWTH-PLAN.md"), "utf8"));
  const all = phases.flatMap((p) => p.sections.flatMap((s) => s.items));
  const n = (st) => all.filter((i) => statusOf(i) === st).length;
  const counts = { done: n("done"), mine: n("mine"), yours: n("yours"), total: all.length };

  const phaseHtml = phases.map((p) => {
    const items = p.sections.flatMap((s) => s.items);
    const d = items.filter((i) => i.done).length;
    const pctDone = Math.round((d / items.length) * 100);
    return `
<section class="phase" aria-labelledby="ph-${p.title.match(/\d+/)[0]}">
  <header class="phase-head">
    <div class="phase-id">${md(p.title.split(" — ")[0])}</div>
    <h2 id="ph-${p.title.match(/\d+/)[0]}">${md(p.title.split(" — ")[1] ?? p.title)}</h2>
    <p class="phase-goal">${md(p.goal.replace(/^Goal:\s*/, ""))}</p>
    <div class="meter" role="img" aria-label="${d} of ${items.length} complete">
      <span style="width:${pctDone}%"></span>
    </div>
    <div class="phase-count"><b>${d}</b> / ${items.length} done</div>
  </header>
  ${p.sections.filter((s) => s.items.length).map((s) => `
  <div class="group">
    ${s.title ? `<h3 class="group-title">${md(s.title)}</h3>` : ""}
    <ul class="items">
      ${s.items.map((i) => {
        const st = statusOf(i);
        return `<li class="item" data-status="${st}">
        <span class="num">${String(i.id).padStart(3, "0")}</span>
        <span class="chip chip-${st}">${st === "done" ? "done" : st === "mine" ? "open" : "needs you"}</span>
        <span class="body">
          <span class="title">${md(i.title)}</span>
          ${i.note ? `<span class="note">${md(i.note)}</span>` : ""}
          ${st === "yours" ? `<span class="why">${md(BLOCKED[i.id])}</span>` : ""}
        </span>
      </li>`;
      }).join("\n")}
    </ul>
  </div>`).join("\n")}
</section>`;
  }).join("\n");

  const html = `<title>Road to 20,000</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">
<style>
:root{
  --ground:#EEEFF2; --surface:#FFFFFF; --surface-2:#F6F7F9;
  --ink:#15161A; --ink-2:#4A4D57; --ink-3:#767A86;
  --line:#DDDFE5; --line-2:#EAEBEF;
  --accent:#8A6320; --accent-soft:#F3E9D6;
  --done:#2C7A55; --done-soft:#E2F1E9;
  --mine:#3B5EA8; --mine-soft:#E5EBF7;
  --yours:#A8482C; --yours-soft:#F8E7E1;
  --shadow:0 1px 2px rgba(20,22,28,.05),0 8px 24px -16px rgba(20,22,28,.25);
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --ground:#0C0D11; --surface:#15171C; --surface-2:#1B1E24;
    --ink:#EDEEF1; --ink-2:#A7ACB8; --ink-3:#767C8A;
    --line:#252932; --line-2:#1E222A;
    --accent:#D9A94A; --accent-soft:#2C2413;
    --done:#4FC98D; --done-soft:#132A20;
    --mine:#7FA6EE; --mine-soft:#141C2C;
    --yours:#F0866A; --yours-soft:#2B1710;
    --shadow:0 1px 2px rgba(0,0,0,.5),0 10px 30px -18px rgba(0,0,0,.9);
  }
}
:root[data-theme="dark"]{
  --ground:#0C0D11; --surface:#15171C; --surface-2:#1B1E24;
  --ink:#EDEEF1; --ink-2:#A7ACB8; --ink-3:#767C8A;
  --line:#252932; --line-2:#1E222A;
  --accent:#D9A94A; --accent-soft:#2C2413;
  --done:#4FC98D; --done-soft:#132A20;
  --mine:#7FA6EE; --mine-soft:#141C2C;
  --yours:#F0866A; --yours-soft:#2B1710;
  --shadow:0 1px 2px rgba(0,0,0,.5),0 10px 30px -18px rgba(0,0,0,.9);
}
*{box-sizing:border-box}
body{
  margin:0; background:var(--ground); color:var(--ink);
  font-family:Archivo,ui-sans-serif,system-ui,sans-serif;
  font-size:15px; line-height:1.5; -webkit-font-smoothing:antialiased;
}
.wrap{max-width:1180px;margin:0 auto;padding:40px 24px 80px}
.masthead{display:flex;flex-direction:column;gap:6px;padding-bottom:26px;border-bottom:2px solid var(--ink)}
.eyebrow{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}
h1{font-size:clamp(30px,5vw,46px);line-height:1.02;margin:0;font-weight:700;letter-spacing:-.022em;text-wrap:balance}
.sub{font-family:"Source Serif 4",Georgia,serif;font-size:17px;color:var(--ink-2);max-width:62ch;margin:6px 0 0}

.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);margin:26px 0 0;box-shadow:var(--shadow)}
.stat{background:var(--surface);padding:16px 18px;display:flex;flex-direction:column;gap:3px}
.stat b{font-family:"IBM Plex Mono",monospace;font-size:30px;font-weight:500;line-height:1;font-variant-numeric:tabular-nums}
.stat span{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);font-family:"IBM Plex Mono",monospace}
.stat.s-done b{color:var(--done)} .stat.s-mine b{color:var(--mine)} .stat.s-yours b{color:var(--yours)}

.bar{margin:22px 0 0;display:flex;height:10px;border:1px solid var(--line);background:var(--surface)}
.bar i{display:block;height:100%}
.bar .b-done{background:var(--done)} .bar .b-mine{background:var(--mine)} .bar .b-yours{background:var(--yours)}

.controls{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px;align-items:center;
  margin:26px 0 0;padding:12px 0;background:var(--ground);border-bottom:1px solid var(--line)}
.filter{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.04em;padding:6px 12px;
  border:1px solid var(--line);background:var(--surface);color:var(--ink-2);cursor:pointer;border-radius:0}
.filter:hover{border-color:var(--ink-3);color:var(--ink)}
.filter[aria-pressed="true"]{background:var(--ink);color:var(--ground);border-color:var(--ink)}
.filter:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

.gates{margin:34px 0 0;border:1px solid var(--line);background:var(--surface);box-shadow:var(--shadow)}
.gates h2{margin:0;padding:14px 18px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;
  font-family:"IBM Plex Mono",monospace;color:var(--ink-3);border-bottom:1px solid var(--line-2);font-weight:500}
.gate{display:grid;grid-template-columns:52px 1fr;gap:0 16px;padding:12px 18px;border-bottom:1px solid var(--line-2);align-items:baseline}
.gate:last-child{border-bottom:0}
.gate-id{font-family:"IBM Plex Mono",monospace;font-weight:500;color:var(--accent);font-size:14px}
.gate-name{font-weight:600;font-size:14.5px}
.gate-crit{font-family:"IBM Plex Mono",monospace;font-size:12.5px;color:var(--ink-3);grid-column:2}

.phase{margin:44px 0 0}
.phase-head{display:grid;grid-template-columns:1fr auto;gap:4px 20px;align-items:end;
  padding-bottom:12px;border-bottom:1px solid var(--line)}
.phase-id{grid-column:1;font-family:"IBM Plex Mono",monospace;font-size:11.5px;letter-spacing:.16em;color:var(--ink-3)}
.phase h2{grid-column:1;margin:0;font-size:23px;letter-spacing:-.015em;font-weight:700}
.phase-goal{grid-column:1;margin:2px 0 0;font-family:"Source Serif 4",Georgia,serif;color:var(--ink-2);font-size:15px;max-width:60ch}
.meter{grid-column:2;grid-row:2;width:150px;height:6px;background:var(--line);overflow:hidden}
.meter span{display:block;height:100%;background:var(--done)}
.phase-count{grid-column:2;grid-row:3;font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--ink-3);text-align:right}
.phase-count b{color:var(--ink)}

.group{margin:22px 0 0}
.group-title{margin:0 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;
  font-family:"IBM Plex Mono",monospace;color:var(--ink-3);font-weight:500}
.items{list-style:none;margin:0;padding:0;border:1px solid var(--line);background:var(--surface);box-shadow:var(--shadow)}
.item{display:grid;grid-template-columns:46px 84px 1fr;gap:0 12px;padding:11px 16px;
  border-bottom:1px solid var(--line-2);align-items:baseline}
.item:last-child{border-bottom:0}
.item[hidden]{display:none}
.num{font-family:"IBM Plex Mono",monospace;font-size:12.5px;color:var(--ink-3);font-variant-numeric:tabular-nums}
.chip{font-family:"IBM Plex Mono",monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;
  padding:2px 7px;border:1px solid currentColor;justify-self:start;white-space:nowrap}
.chip-done{color:var(--done);background:var(--done-soft)}
.chip-mine{color:var(--mine);background:var(--mine-soft)}
.chip-yours{color:var(--yours);background:var(--yours-soft)}
.body{display:flex;flex-direction:column;gap:4px;min-width:0}
.title{font-size:14.5px;font-weight:500;line-height:1.4}
.note{font-family:"Source Serif 4",Georgia,serif;font-size:14px;color:var(--ink-2);line-height:1.55;max-width:74ch}
.why{font-family:"IBM Plex Mono",monospace;font-size:12.5px;color:var(--yours);line-height:1.5}
code{font-family:"IBM Plex Mono",monospace;font-size:.9em;background:var(--surface-2);padding:1px 4px;border:1px solid var(--line-2)}
.foot{margin:56px 0 0;padding-top:18px;border-top:1px solid var(--line);font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--ink-3)}
@media (max-width:640px){
  .item{grid-template-columns:40px 1fr;gap:0 10px}
  .chip{grid-column:2;margin-bottom:2px}
  .body{grid-column:2}
  .phase-head{grid-template-columns:1fr}
  .meter,.phase-count{grid-column:1;grid-row:auto;text-align:left;width:100%}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>

<div class="wrap">
  <header class="masthead">
    <div class="eyebrow">Global Financial Terminal · status ${new Date().toISOString().slice(0, 10)}</div>
    <h1>Road to 20,000 users</h1>
    <p class="sub">Every item in the growth plan, and — the part the checklist cannot show — which of the
    open ones are waiting on you rather than on me.</p>
  </header>

  <div class="summary">
    <div class="stat s-done"><b>${counts.done}</b><span>done</span></div>
    <div class="stat s-mine"><b>${counts.mine}</b><span>open · I can build</span></div>
    <div class="stat s-yours"><b>${counts.yours}</b><span>needs you</span></div>
    <div class="stat"><b>${counts.total}</b><span>total</span></div>
  </div>
  <div class="bar" role="img" aria-label="${counts.done} done, ${counts.mine} open, ${counts.yours} need you">
    <i class="b-done" style="width:${counts.done / counts.total * 100}%"></i>
    <i class="b-mine" style="width:${counts.mine / counts.total * 100}%"></i>
    <i class="b-yours" style="width:${counts.yours / counts.total * 100}%"></i>
  </div>

  <div class="controls" role="group" aria-label="Filter items">
    <button class="filter" data-f="all" aria-pressed="true">All ${counts.total}</button>
    <button class="filter" data-f="yours" aria-pressed="false">Needs you ${counts.yours}</button>
    <button class="filter" data-f="mine" aria-pressed="false">Open ${counts.mine}</button>
    <button class="filter" data-f="done" aria-pressed="false">Done ${counts.done}</button>
  </div>

  <div class="gates">
    <h2>Milestone gates — do not advance a phase until its gate is met</h2>
    ${GATES.map(([id, name, crit]) => `<div class="gate">
      <div class="gate-id">${id}</div><div class="gate-name">${name}</div>
      <div class="gate-crit">${crit}</div>
    </div>`).join("\n")}
  </div>

  ${phaseHtml}

  <p class="foot">Generated from GROWTH-PLAN.md by scripts/plan-board.mjs. Re-run it after ticking items.</p>
</div>

<script>
(function(){
  var buttons = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var items = Array.prototype.slice.call(document.querySelectorAll(".item"));
  function apply(f){
    buttons.forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.f === f)); });
    items.forEach(function(i){ i.hidden = f !== "all" && i.dataset.status !== f; });
    // A group whose every item is filtered out should go too, or the page fills
    // with empty headings.
    Array.prototype.slice.call(document.querySelectorAll(".group")).forEach(function(g){
      g.hidden = !g.querySelector(".item:not([hidden])");
    });
    Array.prototype.slice.call(document.querySelectorAll(".phase")).forEach(function(p){
      p.hidden = !p.querySelector(".item:not([hidden])");
    });
  }
  buttons.forEach(function(b){ b.addEventListener("click", function(){ apply(b.dataset.f); }); });
})();
</script>`;

  const out = path.join(ROOT, "docs", "plan-board.html");
  await writeFile(out, html);
  console.log(`  plan board: ${counts.done} done · ${counts.mine} open · ${counts.yours} need the founder -> ${out}`);
}

main().catch((e) => { console.error("plan board failed:", e); process.exit(1); });
