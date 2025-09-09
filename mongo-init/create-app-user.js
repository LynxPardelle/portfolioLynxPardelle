// Initialization script executed by the official mongo image.
// It runs only if /data/db is empty. Creates application users and databases.
// Renamed at build time to enforce ordering (01-create-app-user.js).

const adminDB = db.getSiblingDB('admin');

const appDbName = process.env.MONGO_APP_DB || 'lynx_portfolio';
const appTestDbName = process.env.MONGO_APP_TEST_DB || 'lynx_portfolio_test';
const appUser = process.env.MONGO_APP_USER || 'portfolio';
const appPass = process.env.MONGO_APP_PASSWORD || 'portfolio_pass';

print(`\n[mongo-init] Creating application user '${appUser}' for DB '${appDbName}' and test DB '${appTestDbName}'...`);

// Create application database and user with roles
adminDB.runCommand({
  createUser: appUser,
  pwd: appPass,
  roles: [
    { role: 'readWrite', db: appDbName },
    { role: 'readWrite', db: appTestDbName }
  ]
});

print(`[mongo-init] User '${appUser}' created with readWrite on '${appDbName}' and '${appTestDbName}'.`);

// Touch collections to ensure DBs exist
const appDb = db.getSiblingDB(appDbName);
appDb.createCollection('init_marker');
const testDb = db.getSiblingDB(appTestDbName);
testDb.createCollection('init_marker');

print('[mongo-init] Initialization complete.');
