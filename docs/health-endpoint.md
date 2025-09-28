# Health Endpoint

The `/health` endpoint provides a quick way to check the application status and readiness.

## Purpose
Check if the API server is running and whether MongoDB is connected.

## Usage
Send a GET request to `/health` - no authentication required.

## Response Format

**When MongoDB is connected (HTTP 200):**

```json
{
  "status": "ok",
  "mongo": "connected",
  "error": null,
  "uptime": 123.45,
  "timestamp": "2025-09-27T12:34:56.789Z"
}
```

**When MongoDB is disconnected (HTTP 503):**

```json
{
  "status": "degraded",
  "mongo": "disconnected", 
  "error": "Connection error message",
  "uptime": 123.45,
  "timestamp": "2025-09-27T12:34:56.789Z"
}
```

## Response Fields

- `status`: `"ok"` (healthy) or `"degraded"` (MongoDB down)
- `mongo`: `"connected"` or `"disconnected"`
- `error`: Error message when MongoDB is down, otherwise `null`
- `uptime`: Server uptime in seconds
- `timestamp`: Current server time in ISO format

## Usage in Monitoring

This endpoint is used by:

- Docker health checks
- Load balancers for readiness probes
- Monitoring services for uptime checks
