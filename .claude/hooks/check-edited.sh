#!/bin/bash
# PostToolUse (Edit|Write): tsc --noEmit i eslint na właśnie zmienionym pliku .ts.
# exit 2: wynik trafia do agenta.
file=$(jq -r '.tool_input.file_path')
case "$file" in
  *.ts) ;;
  *) exit 0 ;;
esac

# Hook uruchamia się w bieżącym katalogu agenta, więc przechodzimy do katalogu głównego projektu
cd "$CLAUDE_PROJECT_DIR" || exit 0

if ! out=$( { npx tsc --noEmit && npx eslint "$file"; } 2>&1 ); then
  echo "$out" >&2
  exit 2
fi
exit 0
