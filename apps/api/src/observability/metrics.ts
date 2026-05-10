// Process-level counters for the /metrics endpoint (#423). The format
// is Prometheus text exposition v0 — minimal subset that
// scrapers + Grafana Agent both understand. We avoid pulling in a
// metrics library to keep the bundle small; if cardinality grows past
// a few labels we'll revisit.

interface RequestMetricLabels {
  readonly method: string;
  readonly route: string;
  readonly status: number;
}

export class Metrics {
  private readonly bootTime = Date.now();
  private readonly requestCounts = new Map<string, number>();
  private mongoPingMs: number | null = null;

  observeRequest(labels: RequestMetricLabels): void {
    const key = `${labels.method}|${labels.route}|${String(labels.status)}`;
    this.requestCounts.set(key, (this.requestCounts.get(key) ?? 0) + 1);
  }

  setMongoPing(latencyMs: number): void {
    this.mongoPingMs = latencyMs;
  }

  render(): string {
    const lines: string[] = [];
    const uptime = Math.floor((Date.now() - this.bootTime) / 1000);
    lines.push('# HELP process_uptime_seconds Seconds since the apps/api process started.');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${String(uptime)}`);

    lines.push('# HELP http_requests_total Total HTTP requests served, by method/route/status.');
    lines.push('# TYPE http_requests_total counter');
    if (this.requestCounts.size === 0) {
      lines.push('http_requests_total{method="",route="",status=""} 0');
    } else {
      for (const [key, count] of this.requestCounts) {
        const [method, route, status] = key.split('|');
        lines.push(
          `http_requests_total{method="${escape(method ?? '')}",route="${escape(route ?? '')}",status="${escape(status ?? '')}"} ${String(count)}`,
        );
      }
    }

    lines.push('# HELP mongo_ping_milliseconds Last observed Mongo ping latency in ms.');
    lines.push('# TYPE mongo_ping_milliseconds gauge');
    lines.push(
      `mongo_ping_milliseconds ${this.mongoPingMs === null ? 'NaN' : String(this.mongoPingMs)}`,
    );

    return `${lines.join('\n')}\n`;
  }
}

function escape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
