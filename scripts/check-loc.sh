#!/bin/bash
# Check if edited file exceeds LoC threshold
# Called by Claude Code PostToolUse hook

FILE="$1"
WARNING_THRESHOLD=300
CRITICAL_THRESHOLD=500

# Skip non-source files
if [[ ! "$FILE" =~ \.(ts|tsx|js|jsx|astro)$ ]]; then
  exit 0
fi

# Skip test files, type definitions, generated files
if [[ "$FILE" =~ \.(test|spec|d)\.ts$ ]] || [[ "$FILE" =~ node_modules|dist ]]; then
  exit 0
fi

# Count lines
if [[ -f "$FILE" ]]; then
  LINES=$(wc -l < "$FILE" | tr -d ' ')

  if [[ "$LINES" -gt "$CRITICAL_THRESHOLD" ]]; then
    echo "⚠️  $FILE has $LINES lines (critical threshold: $CRITICAL_THRESHOLD)"
    echo "   Consider running @loc-analyzer for modularization suggestions"
  elif [[ "$LINES" -gt "$WARNING_THRESHOLD" ]]; then
    echo "📋 $FILE has $LINES lines (warning threshold: $WARNING_THRESHOLD)"
  fi
fi

exit 0
