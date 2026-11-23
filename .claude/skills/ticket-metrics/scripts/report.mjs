#!/usr/bin/env node
// Raport o tickecie z lokalnych logów Claude Code.
//
//   node report.mjs LIB-311            raport markdown dla terminala
//   node report.mjs LIB-311 --json     te same liczby w JSON
//   node report.mjs LIB-311 --dir <katalog projektu>
//
// Logi: <CLAUDE_CONFIG_DIR lub ~/.claude>/projects/<ścieżka projektu przez myślniki>/<sesja>.jsonl
// i <sesja>/subagents/agent-*.jsonl. Ticketu szukamy w nazwie gałęzi (gitBranch) każdego wpisu.
// Faza to attributionSkill odpowiedzi modelu: skill aktywny podczas żądania. Tura bez skilla po
// uruchomieniu fazy w tej samej sesji (odpowiedź na pytanie agenta, „zaktualizuj plan”) to doprecyzowanie tej fazy.
// Format logów jest wewnętrzny i nieudokumentowany: może się zmienić wraz z wersją Claude Code.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SELF_SKILL = "ticket-metrics";
const PHASE_ORDER = ["research", "tdd", "implement"];
const NO_PHASE = "poza fazami";
// Narzędzia, na których agent czeka na człowieka: odstęp do ich wyniku to czas człowieka.
const WAITS_FOR_HUMAN = new Set(["AskUserQuestion", "ExitPlanMode"]);

const args = process.argv.slice(2);
const ticket = args.find((a) => !a.startsWith("--"));
const asJson = args.includes("--json");
const dirArg = args.includes("--dir") ? args[args.indexOf("--dir") + 1] : undefined;
if (!ticket || !/^[A-Za-z][A-Za-z0-9]*-\d+$/.test(ticket)) {
  console.error("Podaj numer ticketu, np.: node report.mjs LIB-311");
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const prices = JSON.parse(readFileSync(join(here, "..", "prices.json"), "utf8"));

function projectRoot() {
  if (dirArg) return dirArg;
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return process.cwd();
  }
}

const configDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
const root = projectRoot();
const logsDir = join(configDir, "projects", root.replace(/[^A-Za-z0-9]/g, "-"));
if (!existsSync(logsDir)) {
  console.error(`Brak logów dla ${root}: ${logsDir}`);
  process.exit(1);
}

const branchRe = new RegExp(`(^|[^A-Za-z0-9])${ticket.replace("-", "-")}([^0-9]|$)`, "i");
const matches = (r) => typeof r.gitBranch === "string" && branchRe.test(r.gitBranch);

function readJsonl(file) {
  const out = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // niedokończona linia bieżącej sesji
    }
  }
  return out;
}

function priceFor(model) {
  if (!model) return undefined;
  const key = Object.keys(prices.models)
    .filter((k) => model === k || model.startsWith(`${k}-`) || model.startsWith(`${k}@`))
    .sort((a, b) => b.length - a.length)[0];
  return key ? { key, ...prices.models[key] } : undefined;
}

function costOf(model, u) {
  const p = priceFor(model);
  if (!p) return undefined;
  const w1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const w5m = u.cache_creation?.ephemeral_5m_input_tokens ?? Math.max(0, (u.cache_creation_input_tokens ?? 0) - w1h);
  const input = u.input_tokens ?? 0;
  const read = u.cache_read_input_tokens ?? 0;
  const out = u.output_tokens ?? 0;
  let rate = p;
  if (p.over && input + read + w5m + w1h > p.over.promptTokens) rate = p.over;
  if (u.speed === "fast" && p.fast) {
    const k = p.fast.input / p.input;
    rate = { input: p.fast.input, output: p.fast.output, cacheWrite5m: rate.cacheWrite5m * k, cacheWrite1h: rate.cacheWrite1h * k, cacheRead: rate.cacheRead * k };
  }
  let usd = (input * rate.input + w5m * rate.cacheWrite5m + w1h * rate.cacheWrite1h + read * rate.cacheRead + out * rate.output) / 1e6;
  if (u.inference_geo === "us") usd *= prices.inferenceGeoUsMultiplier;
  return usd;
}

const shortModel = (m) => priceFor(m)?.name ?? m ?? "?";

function isHumanPrompt(r) {
  if (r._sub || r.type !== "user" || r.isMeta || r.isCompactSummary) return false;
  const c = r.message?.content;
  if (typeof c === "string") return true;
  return Array.isArray(c) && c.some((b) => b.type === "text") && !c.some((b) => b.type === "tool_result");
}

function toolUses(r) {
  const c = r.message?.content;
  return Array.isArray(c) ? c.filter((b) => b.type === "tool_use").map((b) => b.name) : [];
}

// Skill, który wpisał człowiek: `<command-name>/research</command-name>` albo linia `/implement LIB-311`
// (skill z context: fork w -p).
function commandOf(r) {
  const c = r.message?.content;
  const text = typeof c === "string" ? c : Array.isArray(c) ? c.filter((b) => b.type === "text").map((b) => b.text).join("\n") : "";
  const m = text.match(/<command-name>\/?([^<\s]+)<\/command-name>/) || text.match(/^\s*\/([A-Za-z0-9_:-]+)/);
  return m?.[1];
}

const blank = (name) => ({ phase: name, models: new Set(), efforts: new Set(), requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, costUSD: 0, agentSeconds: 0, unpriced: 0 });
const phases = new Map();
const phase = (name) => {
  if (!phases.has(name)) phases.set(name, { ...blank(name), followUp: blank("↳ w tym doprecyzowania") });
  return phases.get(name);
};
const phaseOf = (r) => r._phase || r.attributionSkill || NO_PHASE;

// Claude Code ustawia attributionSkill (i skill.name w OpenTelemetry) tylko na turze, w której skill
// uruchomiono. Odpowiedź człowieka na pytanie fazy to już nowa tura bez skilla. Takie odpowiedzi modelu
// w głównej sesji przypisujemy ostatniej fazie tej sesji i oznaczamy jako doprecyzowanie, dopóki człowiek
// nie uruchomi innego skilla. Po /ticket-metrics lub zmianie gałęzi fazy nie ma.
function markFollowUps(records, skills) {
  let current;
  let branch;
  for (const r of records) {
    if (typeof r.gitBranch === "string" && r.gitBranch !== branch) {
      branch = r.gitBranch;
      current = undefined;
    }
    if (isHumanPrompt(r)) {
      const cmd = commandOf(r);
      if (cmd === SELF_SKILL) current = undefined;
      else if (skills.has(cmd)) current = cmd;
    }
    if (r.type !== "assistant") continue;
    if (r.attributionSkill) current = r.attributionSkill === SELF_SKILL ? undefined : r.attributionSkill;
    else if (current) {
      r._phase = current;
      r._followUp = true;
    }
  }
}

const seenRequests = new Set();
const sessions = new Set();
const branches = new Set();
const unknownModels = new Set();
let subagents = 0;
let firstTs;
let lastTs;
let fastSeen = false;

function addUsage(r) {
  const u = r.message?.usage;
  if (!u) return;
  const id = r.requestId || r.message?.id;
  if (id) {
    if (seenRequests.has(id)) return;
    seenRequests.add(id);
  }
  const p = phase(phaseOf(r));
  const model = r.message.model;
  if (model === "<synthetic>") return;
  if (u.speed === "fast") fastSeen = true;
  const usd = costOf(model, u);
  if (usd === undefined) unknownModels.add(model);
  for (const t of r._followUp ? [p, p.followUp] : [p]) {
    t.models.add(shortModel(model));
    if (r.effort) t.efforts.add(r.effort);
    t.requests += 1;
    t.input += u.input_tokens ?? 0;
    t.output += u.output_tokens ?? 0;
    t.cacheRead += u.cache_read_input_tokens ?? 0;
    t.cacheWrite += u.cache_creation_input_tokens ?? 0;
    if (usd === undefined) t.unpriced += 1;
    else t.costUSD += usd;
  }
}

// Czas agenta: odstępy między sąsiednimi wpisami sesji razem z jej subagentami, z wyjątkiem tych, które
// kończą się żądaniem człowieka lub zaczynają od wywołania, na którym agent czeka na człowieka
// (pytanie, zatwierdzenie planu). Subagenci są na jednej osi czasu z sesją: równoległa praca nie jest liczona dwa razy.
function addAgentTime(records) {
  const rs = records.filter((r) => r.timestamp && typeof r.gitBranch === "string" && ["user", "assistant", "system"].includes(r.type)).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  // Faza każdego wpisu: najbliższa odpowiedź modelu dalej w tej samej turze, w przeciwnym razie poprzednia.
  const next = new Array(rs.length);
  let carry;
  for (let i = rs.length - 1; i >= 0; i--) {
    if (rs[i].type === "assistant") carry = rs[i];
    next[i] = carry;
    if (isHumanPrompt(rs[i])) carry = undefined;
  }
  let prev;
  for (let i = 1; i < rs.length; i++) {
    const a = rs[i - 1];
    const b = rs[i];
    if (a.type === "assistant") prev = a;
    if (isHumanPrompt(b)) {
      prev = undefined;
      continue;
    }
    // Start subagenta: odstęp do niego to nie jego praca (znacznik czasu może być wcześniejszy niż żądanie człowieka).
    if (b._subStart) continue;
    if (!matches(b)) continue;
    if (a.type === "assistant" && toolUses(a).some((t) => WAITS_FOR_HUMAN.has(t))) continue;
    const dt = (Date.parse(b.timestamp) - Date.parse(a.timestamp)) / 1000;
    if (dt <= 0) continue;
    const owner = b.type === "assistant" ? b : (next[i] ?? prev);
    const p = phase(owner ? phaseOf(owner) : NO_PHASE);
    p.agentSeconds += dt;
    if (owner?._followUp) p.followUp.agentSeconds += dt;
  }
}

for (const entry of readdirSync(logsDir)) {
  if (!entry.endsWith(".jsonl")) continue;
  const records = readJsonl(join(logsDir, entry));
  // Subagenci sesji: <sesja>/subagents/agent-*.jsonl, w tym skille z context: fork.
  const subFiles = [];
  const subDir = join(logsDir, entry.replace(/\.jsonl$/, ""), "subagents");
  if (existsSync(subDir) && statSync(subDir).isDirectory()) {
    for (const s of readdirSync(subDir)) if (s.endsWith(".jsonl")) subFiles.push(readJsonl(join(subDir, s)).map((r, i) => ({ ...r, _sub: true, _subStart: i === 0 })));
  }
  const mine = records.filter(matches);
  const subMine = subFiles.map((f) => f.filter(matches));
  if (mine.length === 0 && subMine.every((f) => f.length === 0)) continue;
  const skills = new Set(PHASE_ORDER);
  for (const r of [...records, ...subFiles.flat()]) if (r.attributionSkill) skills.add(r.attributionSkill);
  markFollowUps(records, skills);
  let used = false;
  for (const r of [...mine, ...subMine.flat()]) {
    branches.add(r.gitBranch);
    if (r.type === "assistant") {
      addUsage(r);
      if (phaseOf(r) !== SELF_SKILL) used = true;
    }
    const t = Date.parse(r.timestamp);
    if (!Number.isNaN(t)) {
      firstTs = firstTs === undefined || t < firstTs ? t : firstTs;
      lastTs = lastTs === undefined || t > lastTs ? t : lastTs;
    }
  }
  if (used) sessions.add(entry.replace(/\.jsonl$/, ""));
  subagents += subMine.filter((f) => f.some((r) => r.type === "assistant" && phaseOf(r) !== SELF_SKILL)).length;
  addAgentTime([...records, ...subFiles.flat()]);
}

phases.delete(SELF_SKILL);
const rows = [...phases.values()].sort((a, b) => rank(a.phase) - rank(b.phase) || a.phase.localeCompare(b.phase));
function rank(name) {
  const i = PHASE_ORDER.indexOf(name);
  if (i >= 0) return i;
  return name === NO_PHASE ? 100 : 50;
}
const total = rows.reduce(
  (t, r) => {
    for (const k of ["requests", "input", "output", "cacheRead", "cacheWrite", "costUSD", "agentSeconds", "unpriced"]) t[k] += r[k];
    r.models.forEach((m) => t.models.add(m));
    r.efforts.forEach((e) => t.efforts.add(e));
    return t;
  },
  { phase: "razem", models: new Set(), efforts: new Set(), requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, costUSD: 0, agentSeconds: 0, unpriced: 0 },
);

if (rows.length === 0) {
  console.log(`Ticket ${ticket}: w logach ${logsDir} nie ma gałęzi z tym numerem.`);
  process.exit(0);
}

if (asJson) {
  const plain = (r) => ({ ...r, models: [...r.models], efforts: [...r.efforts], costUSD: Number(r.costUSD.toFixed(4)), agentSeconds: Math.round(r.agentSeconds), ...(r.followUp && { followUp: plain(r.followUp) }) });
  console.log(JSON.stringify({ ticket, logsDir, branches: [...branches], sessions: [...sessions], subagents, from: firstTs && new Date(firstTs).toISOString(), to: lastTs && new Date(lastTs).toISOString(), phases: rows.map(plain), total: plain(total), unknownModels: [...unknownModels], fastMode: fastSeen, prices: { source: prices.source, checked: prices.checked } }, null, 2));
  process.exit(0);
}

const tok = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));
const usd = (n) => `$${n.toFixed(2)}`;
const dur = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s - m * 60);
  return m > 0 ? `${m} min ${String(sec).padStart(2, "0")} s` : `${sec} s`;
};
const plural = (n, one, few, many) => {
  const d = n % 10;
  const dd = n % 100;
  if (n === 1) return `${n} ${one}`;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
};
const home = homedir();
const tilde = (p) => (p.startsWith(home) ? `~${p.slice(home.length)}` : p);
const day = (t) => new Date(t).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });

const lines = [];
lines.push(`**Ticket ${ticket}** · gałąź ${[...branches].join(", ")} · ${plural(sessions.size, "sesja", "sesje", "sesji")} · ${plural(subagents, "subagent", "subagenty", "subagentów")}`);
lines.push("");
lines.push("| faza | model | effort | tokeny we / wy / cache | koszt* | czas agenta** |");
lines.push("|---|---|---|---|---:|---:|");
const row = (r, bold) => {
  const b = (s) => (bold ? `**${s}**` : s);
  const cost = usd(r.costUSD) + (r.unpriced ? " +?" : "");
  return `| ${b(r.phase)} | ${[...r.models].join(", ")} | ${[...r.efforts].join(", ")} | ${tok(r.input)} / ${tok(r.output)} / ${tok(r.cacheRead + r.cacheWrite)} | ${b(cost)} | ${b(dur(r.agentSeconds))} |`;
};
for (const r of rows) {
  lines.push(row(r, false));
  if (r.followUp.requests > 0) lines.push(row(r.followUp, false));
}
lines.push(row(total, true));
lines.push("");
if (rows.some((r) => r.followUp.requests > 0)) {
  lines.push("↳ Doprecyzowania to tury bez skilla po uruchomieniu fazy w tej samej sesji, np. odpowiedź na pytanie agenta. Są już wliczone w wiersz fazy. Claude Code ustawia skill.name tylko na turze ze skillem, więc w OpenTelemetry są one „poza fazami”.");
}
lines.push(`\\* Szacunek według cen API (${prices.source.replace("https://", "")}, sprawdzono ${prices.checked.split("-").reverse().join(".")}), nie rachunek.${fastSeen ? " Są żądania w fast mode: policzono je według jego cen." : ""}${unknownModels.size ? ` Brak ceny dla: ${[...unknownModels].join(", ")}.` : ""}`);
lines.push("\\*\\* Przybliżenie ze znaczników czasu w logach: praca agenta bez czekania na człowieka.");
lines.push(`Logi: ${tilde(logsDir)}, ${day(firstTs)}–${day(lastTs)}. Format logów jest wewnętrzny, może się zmienić. Uruchomienia /${SELF_SKILL} nie są wliczone.`);
console.log(lines.join("\n"));
