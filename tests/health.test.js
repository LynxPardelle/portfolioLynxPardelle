const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const http = require('http');

describe('Health endpoint', () => {
  it('should return 200 OK and status ok for prod-nginx', done => {
    http.get({
      hostname: 'localhost',
      port: 80,
      path: '/health'
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        expect(res.statusCode).toBe(200);
        expect(data).toContain('ok');
        done();
      });
    }).on('error', done);
  });
});
it('should return 200 and status ok', async () => {
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe('ok');
  expect(res.body).toHaveProperty('timestamp');
});

describe('MongoDB connectivity', () => {
  it('should connect to MongoDB and list databases', async () => {
    // Use the same connection as the app
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    const admin = mongoose.connection.db.admin();
    const info = await admin.serverStatus();
    expect(info.ok).toBe(1);
  });
});