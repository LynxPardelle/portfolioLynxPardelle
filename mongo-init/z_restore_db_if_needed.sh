#!/bin/bash
set -e

# Debug: Print script start and environment
echo "[restore] DEBUG: Script starting with environment variables:"
echo "[restore] DEBUG: MONGO_RESTORE_ON_INIT=${MONGO_RESTORE_ON_INIT:-true}"
echo "[restore] DEBUG: MONGO_APP_DB=${MONGO_APP_DB:-lynx_portfolio}"
echo "[restore] DEBUG: PWD=$(pwd)"
echo "[restore] DEBUG: Using S3-based restoration for production"

if [ "${MONGO_RESTORE_ON_INIT:-true}" = "false" ]; then
  echo "[MongoDB Restore] Skipping restoration because MONGO_RESTORE_ON_INIT is set to 'false'."
  exit 0
fi

# z_ prefix ensures this runs after user creation script, but during first init
# auth is still disabled (Mongo official entrypoint runs mongod without --auth while executing these).
# We therefore attempt an unauthenticated check first; no credentials needed on first init.

DB_NAME="${MONGO_APP_DB:-lynx_portfolio}"
HOST="localhost"
# Use the internal MongoDB port (27017), not the external mapped port
PORT=27017

echo "[restore] DEBUG: Using DB_NAME='$DB_NAME', HOST='$HOST', PORT='$PORT'"

# Wait for MongoDB to be ready
echo "[restore] DEBUG: Waiting for MongoDB to be ready..."
for i in {1..30}; do
  if mongosh --quiet --host "$HOST" --port $PORT --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1; then
    echo "[restore] DEBUG: MongoDB is ready after $i attempts"
    break
  fi
  echo "[restore] DEBUG: MongoDB not ready, attempt $i/30, waiting 2 seconds..."
  sleep 2
  if [ $i -eq 30 ]; then
    echo "[restore] ERROR: MongoDB failed to become ready after 30 attempts"
    exit 1
  fi
done

echo "[restore] Checking existing collections for database '$DB_NAME' (unauthenticated phase)."
echo "[restore] DEBUG: Running collection check command..."

# Improved collection checking with better error handling
EXISTING_RAW=$(mongosh --quiet --host "$HOST" --port $PORT "$DB_NAME" --eval "
  try {
    var collections = db.getCollectionNames().filter(c => c !== 'init_marker');
    print(JSON.stringify(collections));
  } catch (e) {
    print('ERROR: ' + e.toString());
  }
" 2>&1) || EXISTING_RAW=""

echo "[restore] DEBUG: Raw mongosh output: '$EXISTING_RAW'"

# Check if the output contains an error
if echo "$EXISTING_RAW" | grep -q "ERROR:"; then
  echo "[restore] DEBUG: Error detected in mongosh output, treating as empty collections"
  EXISTING_RAW="[]"
fi

# Extract JSON array and parse it
EXISTING=$(echo "$EXISTING_RAW" | grep -E '^\[.*\]$' | head -1)
echo "[restore] DEBUG: Extracted collections JSON: '$EXISTING'"

# Count collections (excluding brackets and quotes, counting commas + 1 if not empty)
if [ -z "$EXISTING" ] || [ "$EXISTING" = "[]" ]; then
  COLLECTION_COUNT=0
else
  # Count commas and add 1, or if no commas but has content, count as 1
  COMMA_COUNT=$(echo "$EXISTING" | tr -cd ',' | wc -c)
  if [ "$COMMA_COUNT" -eq 0 ] && echo "$EXISTING" | grep -q '"'; then
    COLLECTION_COUNT=1
  else
    COLLECTION_COUNT=$((COMMA_COUNT + 1))
  fi
fi

echo "[restore] DEBUG: Collection count: $COLLECTION_COUNT"

if [ "$COLLECTION_COUNT" -eq 0 ]; then
  echo "[restore] Empty database detected."
  echo "[restore] This is expected behavior - the database will start empty and be populated by the application."
  echo "[restore] For production deployments, use S3 backup restoration instead."
  echo "[restore] Skipping local file restoration."
  

  
else
  echo "[restore] Existing collections found (count: $COLLECTION_COUNT, details: $EXISTING); skipping restore."
fi

echo "[restore] Done."
