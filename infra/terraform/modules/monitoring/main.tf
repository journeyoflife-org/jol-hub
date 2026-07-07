# -----------------------------------------------------------------------------
# JOL-HUB Monitoring Module (AWS Managed Prometheus & Grafana)
# -----------------------------------------------------------------------------
# Creates AWS Managed Service for Prometheus and Grafana for monitoring
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Amazon Managed Service for Prometheus (AMP)
# -----------------------------------------------------------------------------

resource "aws_prometheus_workspace" "jol_hub" {
  alias = "${var.project_name}-${var.environment}"

  logging_configuration {
    log_group_arn = "${aws_cloudwatch_log_group.prometheus.arn}:*"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-prometheus"
  })
}

resource "aws_cloudwatch_log_group" "prometheus" {
  name              = "/aws/prometheus/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# Alert Manager
resource "aws_prometheus_alert_manager_definition" "jol_hub" {
  workspace_id = aws_prometheus_workspace.jol_hub.id

  definition = templatefile("${path.module}/templates/alertmanager.yaml.tpl", {
    sns_topic_arn = var.alarm_sns_topic_arn
  })
}

# Rule Groups
resource "aws_prometheus_rule_group_namespace" "jol_hub" {
  name         = "${var.project_name}-${var.environment}-rules"
  workspace_id = aws_prometheus_workspace.jol_hub.id

  data = templatefile("${path.module}/templates/rules.yaml.tpl", {
    project_name = var.project_name
    environment  = var.environment
  })
}

# -----------------------------------------------------------------------------
# Amazon Managed Grafana (AMG)
# -----------------------------------------------------------------------------

resource "aws_grafana_workspace" "jol_hub" {
  name                     = "${var.project_name}-${var.environment}"
  account_access_type      = "CURRENT_ACCOUNT"
  authentication_providers = ["SAML"]
  permission_type          = "SERVICE_MANAGED"
  role_arn                 = aws_iam_role.grafana.arn

  data_sources = [
    "PROMETHEUS",
    "CLOUDWATCH",
    "LOKI"
  ]

  description = "JOL-HUB ${var.environment} Grafana workspace"

  configuration = jsonencode({
    plugins = {
      pluginAdminEnabled = true
    }
  })

  network_access_mode = "PRIVATE_WITH_EGRESS"

  vpc_configuration {
    subnet_ids        = var.private_subnet_ids
    security_group_ids = [aws_security_group.grafana.id]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-grafana"
  })
}

# Grafana Security Group
resource "aws_security_group" "grafana" {
  name        = "${var.project_name}-${var.environment}-grafana"
  description = "Security group for Grafana workspace"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-grafana-sg"
  })
}

# IAM Role for Grafana
resource "aws_iam_role" "grafana" {
  name = "${var.project_name}-${var.environment}-grafana"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "grafana.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "grafana_cloudwatch" {
  role       = aws_iam_role.grafana.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
}

resource "aws_iam_role_policy" "grafana_prometheus" {
  name = "${var.project_name}-${var.environment}-grafana-prometheus"
  role = aws_iam_role.grafana.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "aps:ListWorkspaces",
          "aps:DescribeWorkspace",
          "aps:QueryMetrics",
          "aps:GetLabels",
          "aps:GetSeries",
          "aps:GetMetricMetadata"
        ]
        Resource = aws_prometheus_workspace.jol_hub.arn
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms
# -----------------------------------------------------------------------------

# API Latency Alarm
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "p95"
  threshold           = var.api_latency_threshold
  alarm_description   = "API latency is above threshold"
  alarm_actions       = [var.alarm_sns_topic_arn]

  dimensions = {
    LoadBalancer = var.alb_name
  }

  tags = var.tags
}

# API Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "api_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-api-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = var.error_rate_threshold

  metric_query {
    id          = "error_rate"
    expression  = "(error_count / request_count) * 100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "error_count"
    metric {
      metric_name = "HTTPCode_Target_5XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Sum"
      dimensions = {
        LoadBalancer = var.alb_name
      }
    }
  }

  metric_query {
    id = "request_count"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Sum"
      dimensions = {
        LoadBalancer = var.alb_name
      }
    }
  }

  alarm_description = "API error rate is above threshold"
  alarm_actions     = [var.alarm_sns_topic_arn]

  tags = var.tags
}

# Database CPU Alarm
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-db-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.db_cpu_threshold
  alarm_description   = "Database CPU utilization is above threshold"
  alarm_actions       = [var.alarm_sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  tags = var.tags
}

# Database Connections Alarm
resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.project_name}-${var.environment}-db-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.db_max_connections * 0.8
  alarm_description   = "Database connections approaching limit"
  alarm_actions       = [var.alarm_sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  tags = var.tags
}

# Redis Memory Alarm
resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "BytesUsedForCache"
  namespace           = "AWS/ElastiCache"
  period              = 60
  statistic           = "Average"
  threshold           = var.redis_memory_threshold
  alarm_description   = "Redis memory usage is above threshold"
  alarm_actions       = [var.alarm_sns_topic_arn]

  dimensions = {
    CacheClusterId = var.redis_cluster_id
  }

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Dashboard
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_dashboard" "jol_hub" {
  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "API Response Time"
          view  = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_name, { stat = "p95" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "Request Count"
          view  = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_name, { stat = "Sum" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title = "Database CPU"
          view  = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.db_instance_identifier]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title = "Database Connections"
          view  = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.db_instance_identifier]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title = "Redis Memory"
          view  = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ElastiCache", "BytesUsedForCache", "CacheClusterId", var.redis_cluster_id]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title = "Error Count (5XX)"
          view  = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_name, { stat = "Sum" }]
          ]
        }
      }
    ]
  })
}
