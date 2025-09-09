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
  await mongoose.connect(process.env.DATABASE_URL, {
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
