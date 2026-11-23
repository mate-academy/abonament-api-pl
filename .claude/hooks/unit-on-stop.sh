#!/bin/bash
# Stop: testy jednostkowe, zanim agent zakończy odpowiedź.
# exit 2: agent się nie zatrzymuje i widzi wynik. Drugi Stop z rzędu przepuszczamy.
if [ "$(jq -r '.stop_hook_active')" = "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

if ! out=$(npx vitest run --project unit 2>&1); then
  echo "$out" | tail -40 >&2
  exit 2
fi
exit 0
