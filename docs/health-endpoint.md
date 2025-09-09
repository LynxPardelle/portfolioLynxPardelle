# Health Endpoint

This document explains the `/health` endpoint in the Lynx Pardelle Portfolio backend.

## Purpose
- Provides a simple way to check if the API and MongoDB are running.

## Usage
- Send a GET request to `/health`.
- Response includes:
  - `status`: 'ok' if healthy, 'degraded' if DB is down
  - `mongo`: 'connected' or 'disconnected'
  - `error`: error message if DB is down
  - `uptime`: server uptime in seconds
  - `timestamp`: current server time

## Example
```json
{
  "status": "ok",
  "mongo": "connected",
  "error": null,
  "uptime": 123.45,
  "timestamp": "2025-09-08T12:34:56.789Z"
}
```
