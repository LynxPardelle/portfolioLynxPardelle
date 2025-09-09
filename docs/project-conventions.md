# Project-Specific Patterns & Conventions

- Health endpoints at `/health` for readiness.
- CORS domains set via `CORS_ORIGIN` env var.
- Graceful shutdown in `index.js`.
- Model indexes in `models/_defineIndexes.js`.
- API endpoints under `/api/main` and `/api/article`.
