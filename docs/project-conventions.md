# Project-Specific Patterns & Conventions

## API Structure

**Endpoint Organization:**

- Main API routes: `/api/main` (albums, songs, videos, websites, CV sections)
- Article routes: `/api/article` (articles, categories, sections)
- Performance monitoring: `/api/performance` (metrics, dashboard, health)
- Deployment tools: `/api/canary`, `/api/monitoring`, `/api/rollback`

**Response Format:**

- Success: `{ status: "success", data: {...} }`
- Error: `{ status: "error", message: "...", errorMessage: "..." }`

## Health & Monitoring

**Health Endpoint:**

- Location: `GET /health` (no authentication required)
- Purpose: Check server and MongoDB connection status
- Returns HTTP 200 (connected) or 503 (disconnected)

**Status Endpoints:**

- `GET /api/main/s3-status` - S3 and CloudFront configuration status
- `GET /api/performance/health` - Performance monitoring system health

## Authentication & Security

**Middleware Stack:**

- `md_auth.ensureAuth` - JWT token validation
- `md_admin.isAdmin` - Admin role verification
- Applied to all CREATE, UPDATE, DELETE operations

**CORS Configuration:**

- Domains: Set via `CORS_ORIGIN` environment variable (comma-separated)
- Handles missing origin for API clients and mobile apps

## Database Patterns

**MongoDB Connection:**

- Retry logic with exponential backoff in `index.js`
- Graceful shutdown handling for clean disconnection
- Connection state tracking for health endpoint

**Model Indexes:**

- Defined in `models/_defineIndexes.js`
- Run via: `node models/_defineIndexes.js`
- Ensures all models have proper database indexes

**Population:**

- Consistent population patterns in `populate/populate.js`
- Used across controllers for related data loading

## File Management

**Upload Processing:**

- Memory storage for direct S3 streaming (no local temp files)
- Max file size: 100MB per file, 10 files per request
- File metadata stored in MongoDB, files in S3

**Upload Endpoints:**

- `/api/main/upload-file-*` - Main content uploads
- `/api/article/upload-file-*` - Article content uploads

## Error Handling

**Standard Pattern:**

```javascript
let nError = 500;
try {
  // Operation logic
  if (!result) {
    nError = 404;
    throw new Error("Resource not found");
  }
  return res.status(200).json({ status: "success", data: result });
} catch (err) {
  return res.status(nError).json({ 
    status: "error", 
    message: "Operation failed",
    errorMessage: err.message 
  });
}
```

## Development Conventions

**Controller Structure:**

- CRUD operations: create*, get*, update*, delete*
- Test endpoints: `datosAutor` (returns author info)
- Exported helper functions: Do* (e.g., `DoGetArticles`)

**Route Protection:**

- Public: GET operations (except admin-specific data)
- Protected: All POST, PUT, DELETE operations require admin auth
- File uploads: Always require authentication

**Environment Variables:**

- Required: `MONGO_URI`, `CORS_ORIGIN`
- Optional: S3 config, CloudFront domain, monitoring settings
- Validation on startup with helpful error messages
