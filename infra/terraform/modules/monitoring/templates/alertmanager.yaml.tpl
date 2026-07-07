alertmanager_config:
  global:
    resolve_timeout: 5m
  
  route:
    group_by: ['alertname', 'severity']
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 4h
    receiver: 'default-receiver'
    routes:
      - match:
          severity: critical
        receiver: 'critical-receiver'
  
  receivers:
    - name: 'default-receiver'
      sns_configs:
        - topic_arn: ${sns_topic_arn}
          send_resolved: true
    - name: 'critical-receiver'
      sns_configs:
        - topic_arn: ${sns_topic_arn}
          send_resolved: true
