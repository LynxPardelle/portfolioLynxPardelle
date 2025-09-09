if [ "${MONGO_RESTORE_ON_INIT:-true}" = "false" ]; then
  echo "[MongoDB Restore] Skipping restoration because MONGO_RESTORE_ON_INIT is set to 'false'."
  exit 0
fi
#!/bin/bash
set -e

# z_ prefix ensures this runs after user creation script, but during first init
# auth is still disabled (Mongo official entrypoint runs mongod without --auth while executing these).
# We therefore attempt an unauthenticated check first; no credentials needed on first init.

DB_NAME="${MONGO_APP_DB:-lynx_portfolio}"
HOST="localhost"
PORT=27017

echo "[restore] Checking existing collections for database '$DB_NAME' (unauthenticated phase)."
EXISTING=$(mongosh --quiet --host "$HOST" --port $PORT "$DB_NAME" --eval "db.getCollectionNames().filter(c => c !== 'init_marker')") || EXISTING=""
TRIMMED=$(echo "$EXISTING" | tr -d '[][:space:]')

if [ -z "$TRIMMED" ]; then
  echo "[restore] Only init_marker (or no other collections) detected. Starting restore."
  COLLECTIONS="albums articles articlecats articlesections articlesubcats bookimgs cvsections cvsubsections files mains songs videos websites"
  for col in $COLLECTIONS; do
    BSON_GZ="/database_init/${col}.bson.gz"
    if [ -f "$BSON_GZ" ]; then
      echo "[restore] Restoring collection '$col'..."
      gunzip -c "$BSON_GZ" > "/tmp/${col}.bson"
      if mongorestore --quiet --host "$HOST" --port $PORT --db "$DB_NAME" --collection "$col" "/tmp/${col}.bson"; then
        echo "[restore] Collection '$col' restored successfully."
      else
        echo "[restore] WARNING: Failed to restore collection '$col'." >&2
      fi
      rm -f "/tmp/${col}.bson"
    else
      echo "[restore] Skipping '$col' (missing /database_init/${col}.bson.gz)."
    fi
  done
  echo "[restore] Restore phase complete."
else
  echo "[restore] Existing collections found ($EXISTING); skipping restore."
fi

echo "[restore] Done."
