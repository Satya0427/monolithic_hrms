#!/bin/bash
# =============================================================
# MongoDB Restore Init Script
# Runs inside a temporary init container alongside MongoDB.
# Clones the git repo and restores the mongodump backup.
# =============================================================

set -e   # Exit immediately on any error

REPO_URL="https://github.com/Satya0427/monolithic_hrms.git"
BACKUP_PATH="db-backup/recruitment-hrms"   # path inside the git repo
DB_NAME="recruitment-hrms"
MONGO_HOST="${MONGO_HOST:-mongodb}"
MONGO_PORT="${MONGO_PORT:-27017}"

echo "============================================"
echo "  HRMS MongoDB Restore Init Container"
echo "============================================"

# ── 1. Wait for MongoDB to be truly ready ──
echo "[1/4] Waiting for MongoDB at ${MONGO_HOST}:${MONGO_PORT}..."
until mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
    echo "  MongoDB not ready yet, retrying in 3s..."
    sleep 3
done
echo "  MongoDB is ready."

# ── 2. Check if DB already has data (skip restore if not first run) ──
echo "[2/4] Checking if database '${DB_NAME}' already exists..."
DB_EXISTS=$(mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" --quiet --eval \
    "db.getMongo().getDBNames().indexOf('${DB_NAME}') >= 0" 2>/dev/null || echo "false")

if [ "$DB_EXISTS" = "true" ]; then
    echo "  Database '${DB_NAME}' already exists. Skipping restore."
    echo "  (Delete the mongo_data volume to force a fresh restore)"
    exit 0
fi

# ── 3. Clone the git repo to get the backup ──
echo "[3/4] Cloning repository to get backup files..."
WORK_DIR=$(mktemp -d)
cd "$WORK_DIR"

# Shallow clone for speed – only the latest commit
git clone --depth 1 "$REPO_URL" repo 2>&1 | tail -3

DUMP_DIR="$WORK_DIR/repo/$BACKUP_PATH"

if [ ! -d "$DUMP_DIR" ]; then
    echo "  ERROR: Backup folder not found at: $BACKUP_PATH"
    echo "  Make sure you have pushed the backup folder to git."
    echo "  Run: mkdir -p db-backup && mongodump --db recruitment-hrms --out db-backup"
    exit 1
fi

# ── 4. Restore the database ──
echo "[4/4] Restoring database '${DB_NAME}' from backup..."
mongorestore \
    --host "$MONGO_HOST" \
    --port "$MONGO_PORT" \
    --db "$DB_NAME" \
    --drop \
    "$DUMP_DIR"

echo "============================================"
echo "  Restore completed successfully!"
echo "============================================"

# Cleanup
rm -rf "$WORK_DIR"
