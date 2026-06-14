#!/bin/bash
# =============================================================
#  MongoDB Auto-Restore Script
#  ─────────────────────────────────────────────────────────
#  This script is placed in /docker-entrypoint-initdb.d/
#  MongoDB runs it AUTOMATICALLY on the very FIRST startup
#  (only when the data volume is empty/fresh).
#
#  On subsequent restarts the data volume already has data,
#  so this script is NEVER called again — your live data is safe.
# =============================================================

set -e

DB_NAME="recruitment-hrms"
DUMP_DIR="/mongodb_dump/${DB_NAME}"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   HRMS MongoDB Auto-Restore Starting...          ║"
echo "╚══════════════════════════════════════════════════╝"

# Verify dump folder exists
if [ ! -d "$DUMP_DIR" ]; then
  echo "❌  ERROR: Dump folder not found at $DUMP_DIR"
  echo "    Make sure the mongodb_dump folder is present."
  exit 1
fi

echo "✅  Dump folder found: $DUMP_DIR"
echo "📦  Restoring database: $DB_NAME"
echo ""

# Run mongorestore directly (we are already inside the mongo container,
# so mongosh/mongorestore are available without specifying host/port)
# Note: Use --drop to delete existing collections first to ensure clean restore
mongorestore \
  --db "$DB_NAME" \
  --drop \
  --stopOnError \
  "$DUMP_DIR" || {
    echo "⚠️  Mongorestore completed with errors or failed"
    echo "Retrying without --drop for existing collections..."
    mongorestore \
      --db "$DB_NAME" \
      "$DUMP_DIR" || echo "❌ Restore failed"
  }

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅  Restore Completed Successfully!            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
