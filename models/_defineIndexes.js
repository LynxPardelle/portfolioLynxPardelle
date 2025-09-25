// Usage: node models/_defineIndexes.js
// This script ensures all indexes are created for all models.
const mongoose = require('mongoose');
require('dotenv').config();

const models = [
  require('./album'),
  require('./article'),
  require('./articleCat'),
  require('./articleSection'),
  require('./articleSubCat'),
  require('./bookImg'),
  require('./cvSection'),
  require('./cvSubSection'),
  require('./file'),
  require('./main'),
  require('./song'),
  require('./video'),
  require('./website'),
];

async function main() {
  let uri = process.env.MONGO_URI;
  const wantAuthSource = process.env.MONGO_AUTH_SOURCE || 'admin';
  try {
    const hasCreds = /:\/\//.test(uri) && /@/.test(uri);
    const hasDbName = /:\/\/.+\/.+/.test(uri);
    const hasAuthSource = /[?&]authSource=/.test(uri);
    if (hasCreds && hasDbName && !hasAuthSource) {
      const sep = uri.includes('?') ? '&' : '?';
      uri = `${uri}${sep}authSource=${encodeURIComponent(wantAuthSource)}`;
      console.warn(`MongoDB URI missing authSource; appended authSource=${wantAuthSource}.`);
    }
  } catch (_) { /* no-op */ }

  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  });
  for (const model of models) {
    await model.ensureIndexes();
    console.log(`Indexes ensured for ${model.modelName}`);
  }
  await mongoose.disconnect();
  console.log('All indexes ensured.');
}

main().catch(err => {
  console.error('Error ensuring indexes:', err);
  process.exit(1);
});
