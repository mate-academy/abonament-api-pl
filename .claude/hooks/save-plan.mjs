// PostToolUse na ExitPlanMode: zatwierdzony plan → docs/<ticket>/plan.md
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const plan = input.tool_response?.plan ?? "";
const ticket = plan.split("\n")[0].match(/[A-Z][A-Z0-9]*-\d+/)?.[0];

if (!ticket) {
  console.error("Plan nie został zapisany: w pierwszej linii planu nie ma numeru ticketu.");
  process.exit(2); // exit 2 w PostToolUse pokazuje stderr agentowi
}

const dir = join(process.env.CLAUDE_PROJECT_DIR ?? input.cwd, "docs", ticket);
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "plan.md"), plan);

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: `Zatwierdzony plan zapisano w docs/${ticket}/plan.md. Nie pisz testów ani kodu: następny krok to /tdd ${ticket}, uruchamia go programista.`,
  },
}));
