#!/usr/bin/env python3
import http.server
import json
import os
import socketserver
import time
from pathlib import Path

STATE_FILE = Path(os.environ.get("MONGO_BACKUP_STATE", "/var/log/mongo-backup/state.json"))
PORT = int(os.environ.get("BACKUP_METRICS_PORT", "9217"))


class MetricsHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802 (BaseHTTPRequestHandler requirement)
        if self.path not in ("/metrics", "/"):
            self.send_error(404)
            return
        metrics = self.build_metrics()
        payload = "\n".join(metrics).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; version=0.0.4")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format, *args):  # noqa: A003 (API override)
        return

    @staticmethod
    def build_metrics():
        now = int(time.time())
        last_success = 0
        last_size = 0
        total = 0
        last_failure = ""
        if STATE_FILE.exists():
            try:
                data = json.loads(STATE_FILE.read_text())
                if data.get("last_success"):
                    last_success = int(time.mktime(time.strptime(data["last_success"], "%Y%m%d_%H%M%S")))
                last_size = int(data.get("last_size_bytes", 0))
                total = int(data.get("total_backups", 0))
                last_failure = data.get("last_failure", "") or ""
            except Exception:
                last_failure = "state_parse_error"
        metrics = [
            f"mongo_backup_last_success_timestamp {last_success}",
            f"mongo_backup_last_run_age_seconds {now - last_success if last_success else 0}",
            f"mongo_backup_last_archive_bytes {last_size}",
            f"mongo_backup_total_runs {total}",
            f'mongo_backup_last_failure{{message="{last_failure}"}} {1 if last_failure else 0}',
        ]
        return metrics


def main():
    with socketserver.TCPServer(("0.0.0.0", PORT), MetricsHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
