#!/bin/bash
# Runs ESLint on the specific file after any .ts/.tsx write/edit and reports errors back to Claude.
# Receives the tool event JSON on stdin.

cd "$(dirname "$0")/../.." || exit 1

FILE=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)
if ! echo "$FILE" | grep -qE '\.(ts|tsx)$'; then exit 0; fi

if ! output=$(npx eslint "$FILE" 2>&1); then
  echo "$output" | jq -Rs \
    '{hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: ("Lint errors:\n" + .)}}'
fi