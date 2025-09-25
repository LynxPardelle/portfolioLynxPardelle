"use strict";

const mongoose = require("mongoose");
const app = require("./app");

// Basic health state to report connection status
let mongoState = { connected: false, lastError: null };

// Lightweight health endpoint (before other routes that depend on DB)
app.get('/health', (_req, res) => {
  const uptime = process.uptime();
  return res.status(mongoState.connected ? 200 : 503).json({
    status: mongoState.connected ? 'ok' : 'degraded',
    mongo: mongoState.connected ? 'connected' : 'disconnected',
    error: mongoState.lastError ? mongoState.lastError.message : null,
    uptime,
    timestamp: new Date().toISOString()
  });
});

mongoose.Promise = global.Promise;

const DEFAULT_URI = "mongodb://127.0.0.1:27519/lynx_portfolio";
let MONGO_URI = process.env.MONGO_URI || DEFAULT_URI;

// Normalize Mongo URI: if credentials + db present but no authSource, default to admin (or MONGO_AUTH_SOURCE)
try {
  const wantAuthSource = process.env.MONGO_AUTH_SOURCE || 'admin';
  const hasCreds = /:\/\//.test(MONGO_URI) && /@/.test(MONGO_URI);
  const hasDbName = /:\/\/.+\/.+/.test(MONGO_URI); // there's a "/<db>" part
  const hasAuthSource = /[?&]authSource=/.test(MONGO_URI);
  if (hasCreds && hasDbName && !hasAuthSource) {
    const sep = MONGO_URI.includes('?') ? '&' : '?';
    MONGO_URI = `${MONGO_URI}${sep}authSource=${encodeURIComponent(wantAuthSource)}`;
    console.warn(`MongoDB URI missing authSource; appended authSource=${wantAuthSource}.`);
  }
} catch (e) {
  // non-fatal; continue with provided URI
}

console.log("MongoDB URI:", MONGO_URI.replace(/\/\/(.*):(.*)@/, '//***:***@'));
console.log("MongoDB URI_Clean:", MONGO_URI);
const MAX_RETRIES = parseInt(process.env.MONGO_MAX_RETRIES || '10', 10);
const RETRY_DELAY_MS = parseInt(process.env.MONGO_RETRY_DELAY_MS || '3000', 10);

async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000
    });
    mongoState.connected = true;
    mongoState.lastError = null;
    console.log(`MongoDB connected on attempt ${attempt}`);
  } catch (err) {
    mongoState.connected = false;
    mongoState.lastError = err;
    console.error(`MongoDB connection attempt ${attempt} failed:`, err.message);
    if (attempt < MAX_RETRIES) {
      const nextAttempt = attempt + 1;
      console.log(`Retrying MongoDB connection in ${RETRY_DELAY_MS}ms (attempt ${nextAttempt}/${MAX_RETRIES})...`);
      setTimeout(() => connectWithRetry(nextAttempt), RETRY_DELAY_MS);
    } else {
      console.error('Max MongoDB connection retries reached. Exiting process.');
      process.exit(1);
    }
  }
}

// Start server immediately; health endpoint reflects readiness
const PORT = process.env.NODE_ENV === 'production' ? process.env.PROD_PORT || 6165 : process.env.DEV_PORT || 6164;
const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}.`);
});

// Kick off DB connection attempts
connectWithRetry();

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\nRecibida señal ${signal}. Cerrando servidor y conexión MongoDB...`);
  try {
    await mongoose.connection.close();
    console.log('Conexión MongoDB cerrada.');
  } catch (err) {
    console.error('Error al cerrar MongoDB:', err.message);
  }
  server.close(() => {
    console.log('Servidor HTTP cerrado. Saliendo del proceso.');
    process.exit(0);
  });
  setTimeout(() => {
    console.warn('Forzando salida tras timeout.');
    process.exit(1);
  }, 10000).unref();
}

['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => gracefulShutdown(sig)));
