#!/usr/bin/env bash
# Update all repo references from the old (Lovable) Supabase project to your new project.
#
# Usage:
#   bash scripts/migrate-supabase.sh <NEW_REF> "<NEW_URL>" "<NEW_ANON_KEY>"
#
# Example:
#   bash scripts/migrate-supabase.sh abcd1234efgh \
#     "https://abcd1234efgh.supabase.co" \
#     "eyJhbGciOi...your-new-anon-key..."
#
# It updates: .env, codemagic.yaml, supabase/config.toml
set -euo pipefail

NEW_REF="${1:-}"
NEW_URL="${2:-}"
NEW_ANON_KEY="${3:-}"

if [[ -z "$NEW_REF" || -z "$NEW_URL" || -z "$NEW_ANON_KEY" ]]; then
  echo "Usage: bash scripts/migrate-supabase.sh <NEW_REF> \"<NEW_URL>\" \"<NEW_ANON_KEY>\""
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Writing .env"
cat > .env <<EOF
VITE_SUPABASE_PROJECT_ID="$NEW_REF"
VITE_SUPABASE_PUBLISHABLE_KEY="$NEW_ANON_KEY"
VITE_SUPABASE_URL="$NEW_URL"
EOF

echo "→ Updating supabase/config.toml project_id"
# replace the project_id line
sed -i.bak -E "s|^project_id = \".*\"|project_id = \"$NEW_REF\"|" supabase/config.toml && rm -f supabase/config.toml.bak

echo "→ Updating codemagic.yaml env vars (both workflows)"
sed -i.bak \
  -e "s|VITE_SUPABASE_URL: \".*\"|VITE_SUPABASE_URL: \"$NEW_URL\"|g" \
  -e "s|VITE_SUPABASE_PUBLISHABLE_KEY: \".*\"|VITE_SUPABASE_PUBLISHABLE_KEY: \"$NEW_ANON_KEY\"|g" \
  -e "s|VITE_SUPABASE_PROJECT_ID: \".*\"|VITE_SUPABASE_PROJECT_ID: \"$NEW_REF\"|g" \
  codemagic.yaml && rm -f codemagic.yaml.bak

echo ""
echo "✅ Repo updated to new project: $NEW_REF"
echo "   Next: npm run build && npx cap sync"
echo "   Then verify, and only after everything works: cancel Lovable."
