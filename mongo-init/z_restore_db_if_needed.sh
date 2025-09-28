#!/bin/bash
set -e

# Debug: Print script start and environment
echo "[restore] DEBUG: Script starting with environment variables:"
echo "[restore] DEBUG: MONGO_RESTORE_ON_INIT=${MONGO_RESTORE_ON_INIT:-true}"
echo "[restore] DEBUG: MONGO_APP_DB=${MONGO_APP_DB:-lynx_portfolio}"
echo "[restore] DEBUG: PWD=$(pwd)"
echo "[restore] DEBUG: Available database_init files: $(ls -la /database_init/ 2>/dev/null || echo 'Directory not found')"

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
  echo "[restore] No collections detected (excluding init_marker). Starting restore."
  
  # Check if database_init directory exists
  if [ ! -d "/database_init" ]; then
    echo "[restore] ERROR: /database_init directory not found!"
    exit 1
  fi
  
  COLLECTIONS="albums articles articlecats articlesections articlesubcats bookimgs cvsections cvsubsections files mains songs videos websites"
  RESTORED_COUNT=0
  FAILED_COUNT=0
  
  echo "[restore] DEBUG: Starting restoration of collections: $COLLECTIONS"
  
  for col in $COLLECTIONS; do
    BSON_GZ="/database_init/${col}.bson.gz"
    echo "[restore] DEBUG: Processing collection '$col', looking for file '$BSON_GZ'"
    
    if [ -f "$BSON_GZ" ]; then
      echo "[restore] DEBUG: Found backup file for '$col', size: $(stat -c%s "$BSON_GZ" 2>/dev/null || echo 'unknown') bytes"
      echo "[restore] Restoring collection '$col'..."
      
      # Create temp file and extract
      TEMP_BSON="/tmp/${col}.bson"
      echo "[restore] DEBUG: Extracting to temporary file '$TEMP_BSON'"
      
      if gunzip -c "$BSON_GZ" > "$TEMP_BSON"; then
        echo "[restore] DEBUG: Successfully extracted, temp file size: $(stat -c%s "$TEMP_BSON" 2>/dev/null || echo 'unknown') bytes"
        
        # Attempt restore
        echo "[restore] DEBUG: Running mongorestore for collection '$col'"
        if mongorestore --host "$HOST" --port $PORT --db "$DB_NAME" --collection "$col" "$TEMP_BSON" 2>&1; then
          echo "[restore] Collection '$col' restored successfully."
          RESTORED_COUNT=$((RESTORED_COUNT + 1))
        else
          echo "[restore] ERROR: Failed to restore collection '$col'." >&2
          FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
      else
        echo "[restore] ERROR: Failed to extract '$BSON_GZ'" >&2
        FAILED_COUNT=$((FAILED_COUNT + 1))
      fi
      
      # Cleanup temp file
      rm -f "$TEMP_BSON"
      echo "[restore] DEBUG: Cleaned up temporary file '$TEMP_BSON'"
    else
      echo "[restore] WARNING: Skipping '$col' (missing backup file '$BSON_GZ')."
    fi
  done
  
  echo "[restore] Restore phase complete. Collections restored: $RESTORED_COUNT, failed: $FAILED_COUNT"
  
  # Verify restoration
  echo "[restore] DEBUG: Verifying restoration by re-checking collections..."
  FINAL_CHECK=$(mongosh --quiet --host "$HOST" --port $PORT "$DB_NAME" --eval "
    try {
      var collections = db.getCollectionNames().filter(c => c !== 'init_marker');
      print('Final collections: ' + JSON.stringify(collections));
      print('Collection count: ' + collections.length);
    } catch (e) {
      print('ERROR during verification: ' + e.toString());
    }
  " 2>&1)
  echo "[restore] DEBUG: Final verification result: $FINAL_CHECK"
  
else
  echo "[restore] Existing collections found (count: $COLLECTION_COUNT, details: $EXISTING); skipping restore."
fi

echo "[restore] Done."
