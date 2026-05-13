#!/bin/bash
# Pre-commit hook: block commits if staged files exceed LoC threshold
# Install: ln -sf ../../scripts/pre-commit-loc.sh .git/hooks/pre-commit

CRITICAL_THRESHOLD=500
VIOLATIONS=()

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|astro)$' | grep -v -E '\.(test|spec|d)\.ts$')

for FILE in $STAGED_FILES; do
  if [[ -f "$FILE" ]]; then
    LINES=$(wc -l < "$FILE" | tr -d ' ')
    if [[ "$LINES" -gt "$CRITICAL_THRESHOLD" ]]; then
      VIOLATIONS+=("$FILE ($LINES lines)")
    fi
  fi
done

if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
  echo "❌ Commit blocked: Files exceed $CRITICAL_THRESHOLD line threshold"
  echo ""
  for V in "${VIOLATIONS[@]}"; do
    echo "   • $V"
  done
  echo ""
  echo "Options:"
  echo "   1. Refactor the file(s) to reduce size"
  echo "   2. Run '@loc-analyzer' for modularization suggestions"
  echo "   3. Bypass with: git commit --no-verify (not recommended)"
  exit 1
fi

exit 0
