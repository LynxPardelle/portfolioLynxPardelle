const http = require('http');

function checkHealth(port, path = '/health') {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port, path }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 && data.includes('ok')) {
          resolve(true);
        } else {
          reject(new Error(`Health check failed: ${res.statusCode} ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function runSmokeTests() {
  try {
    await checkHealth(80);
    console.log('prod-nginx /health OK');
    await checkHealth(6165);
    console.log('prod-pm2 /health OK');
    await checkHealth(6164);
    console.log('dev /health OK');
  } catch (err) {
    console.error('Smoke test failed:', err.message);
    process.exit(1);
  }
}

runSmokeTests();
