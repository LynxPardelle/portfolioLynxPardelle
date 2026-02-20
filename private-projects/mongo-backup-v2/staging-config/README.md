# Staging Overrides

Place any staging-specific configuration files in this directory. The staging Docker Compose stack mounts this path into `/opt/mongo-unified/config` inside the Mongo container so you can override supervisor policies, crontab entries, or MongoDB configuration for staging environments.
