# Architecture Overview

This project uses Node.js/Express for the backend, MongoDB for persistent storage, and Nginx as a reverse proxy in production. Automated MongoDB backups to S3 are managed via the `mongo-backup` service. Key files include `app.js`, `index.js`, `routes/`, `models/`, and `scripts/`. See `docker-compose.yml` and `Makefile` for workflow automation.
