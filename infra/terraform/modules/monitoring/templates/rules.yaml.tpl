groups:
  - name: jol-hub-alerts
    rules:
      # API Alerts
      - alert: HighAPILatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
        for: 5m
        labels:
          severity: warning
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: High API latency detected
          description: "API latency (p95) is above 1 second. Current value: {{ $value }}s"
      
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 5
        for: 5m
        labels:
          severity: critical
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: High error rate detected
          description: "Error rate is above 5%. Current value: {{ $value }}%"
      
      - alert: APIRequestRateDrop
        expr: sum(rate(http_requests_total[5m])) < 1
        for: 10m
        labels:
          severity: warning
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: API request rate dropped significantly
          description: "API request rate is below 1 req/s. This may indicate a problem."
      
      # Database Alerts
      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count / pg_settings_max_connections * 100 > 80
        for: 5m
        labels:
          severity: warning
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Database connections approaching limit
          description: "Database connections are above 80% of max. Current: {{ $value }}%"
      
      - alert: DatabaseReplicationLag
        expr: pg_replication_lag_seconds > 30
        for: 5m
        labels:
          severity: critical
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Database replication lag is high
          description: "Replication lag is above 30 seconds. Current: {{ $value }}s"
      
      # Redis Alerts
      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Redis memory usage is high
          description: "Redis memory usage is above 80%. Current: {{ $value }}%"
      
      - alert: RedisConnectionsExhausted
        expr: redis_connected_clients / redis_config_maxclients * 100 > 80
        for: 5m
        labels:
          severity: warning
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Redis connections approaching limit
          description: "Redis client connections are above 80% of max. Current: {{ $value }}%"
      
      # Celery Alerts
      - alert: CeleryQueueBacklog
        expr: celery_queue_length > 1000
        for: 10m
        labels:
          severity: warning
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Celery queue backlog is high
          description: "Celery queue has more than 1000 tasks. Current: {{ $value }}"
      
      - alert: CeleryWorkerDown
        expr: celery_workers_online < 2
        for: 5m
        labels:
          severity: critical
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Celery workers are down
          description: "Less than 2 Celery workers are online. Current: {{ $value }}"
      
      # Container Alerts
      - alert: ContainerHighCPU
        expr: container_cpu_usage_seconds_total{namespace="jol-hub"} > 0.8
        for: 10m
        labels:
          severity: warning
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Container CPU usage is high
          description: "Container {{ $labels.pod }} CPU usage is above 80%. Current: {{ $value | humanizePercentage }}"
      
      - alert: ContainerHighMemory
        expr: container_memory_usage_bytes{namespace="jol-hub"} / container_spec_memory_limit_bytes{namespace="jol-hub"} > 0.8
        for: 10m
        labels:
          severity: warning
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Container memory usage is high
          description: "Container {{ $labels.pod }} memory usage is above 80%. Current: {{ $value | humanizePercentage }}"
      
      - alert: ContainerRestartingFrequently
        expr: increase(container_restart_count{namespace="jol-hub"}[1h]) > 5
        for: 5m
        labels:
          severity: warning
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Container is restarting frequently
          description: "Container {{ $labels.pod }} has restarted more than 5 times in the last hour."
      
      # Pod Alerts
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total{namespace="jol-hub"}[15m]) * 60 * 15 > 0
        for: 5m
        labels:
          severity: critical
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Pod is crash looping
          description: "Pod {{ $labels.pod }} is restarting frequently."
      
      - alert: PodNotReady
        expr: kube_pod_status_phase{namespace="jol-hub", phase=~"Pending|Unknown"} == 1
        for: 10m
        labels:
          severity: warning
          project: ${project_name}
          environment: ${environment}
        annotations:
          summary: Pod is not ready
          description: "Pod {{ $labels.pod }} has been in non-ready state for more than 10 minutes."
