# -----------------------------------------------------------------------------
# JOL-HUB Logging Module (OpenSearch / ELK)
# -----------------------------------------------------------------------------
# Creates OpenSearch domain for log aggregation
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# OpenSearch Domain
# -----------------------------------------------------------------------------

resource "aws_opensearch_domain" "jol_hub" {
  domain_name    = "${var.project_name}-${var.environment}"
  engine_version = var.opensearch_version

  cluster_config {
    instance_type           = var.instance_type
    instance_count          = var.instance_count
    dedicated_master_enabled = var.dedicated_master_enabled
    dedicated_master_type   = var.dedicated_master_type
    dedicated_master_count  = var.dedicated_master_count
    zone_awareness_enabled  = var.zone_awareness_enabled

    dynamic "zone_awareness_config" {
      for_each = var.zone_awareness_enabled ? [1] : []
      content {
        availability_zone_count = var.availability_zone_count
      }
    }
  }

  ebs_options {
    ebs_enabled = true
    volume_type = "gp3"
    volume_size = var.volume_size
    throughput  = var.throughput
  }

  encrypt_at_rest {
    enabled = true
    kms_key_id = aws_kms_key.opensearch.arn
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  vpc_options {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.opensearch.id]
  }

  advanced_security_options {
    enabled                        = true
    internal_user_database_enabled = true
    master_user_options {
      master_user_name     = var.master_user_name
      master_user_password = var.master_user_password
    }
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "INDEX_SLOW_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch_search.arn
    log_type                 = "SEARCH_SLOW_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch_error.arn
    log_type                 = "ES_APPLICATION_LOGS"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-opensearch"
  })
}

# KMS Key for OpenSearch encryption
resource "aws_kms_key" "opensearch" {
  description             = "OpenSearch encryption key for ${var.project_name}-${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-opensearch-kms"
  })
}

# Security Group for OpenSearch
resource "aws_security_group" "opensearch" {
  name        = "${var.project_name}-${var.environment}-opensearch"
  description = "Security group for OpenSearch domain"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTPS from VPC"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    cidr_blocks     = [var.vpc_cidr]
  }

  ingress {
    description     = "OpenSearch API from VPC"
    from_port       = 9200
    to_port         = 9200
    protocol        = "tcp"
    cidr_blocks     = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-opensearch-sg"
  })
}

# CloudWatch Log Groups for OpenSearch logs
resource "aws_cloudwatch_log_group" "opensearch" {
  name              = "/aws/opensearch/${var.project_name}-${var.environment}/index-slow-logs"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "opensearch_search" {
  name              = "/aws/opensearch/${var.project_name}-${var.environment}/search-slow-logs"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "opensearch_error" {
  name              = "/aws/opensearch/${var.project_name}-${var.environment}/error-logs"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# IAM Role for OpenSearch logging
resource "aws_iam_role" "opensearch_logging" {
  name = "${var.project_name}-${var.environment}-opensearch-logging"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "opensearchservice.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "opensearch_logging" {
  name = "${var.project_name}-${var.environment}-opensearch-logging"
  role = aws_iam_role.opensearch_logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          aws_cloudwatch_log_group.opensearch.arn,
          aws_cloudwatch_log_group.opensearch_search.arn,
          aws_cloudwatch_log_group.opensearch_error.arn
        ]
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Fluent Bit / Fluentd IAM Role (for log shipping)
# -----------------------------------------------------------------------------

resource "aws_iam_role" "fluent_bit" {
  name = "${var.project_name}-${var.environment}-fluent-bit"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.oidc_provider_url}:sub" = "system:serviceaccount:logging:fluent-bit"
          "${var.oidc_provider_url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "fluent_bit" {
  name = "${var.project_name}-${var.environment}-fluent-bit"
  role = aws_iam_role.fluent_bit.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "es:ESHttpPut",
          "es:ESHttpPost",
          "es:ESHttpDelete",
          "es:ESHttpGet"
        ]
        Resource = "${aws_opensearch_domain.jol_hub.arn}/*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# OpenSearch Index Template
# -----------------------------------------------------------------------------

resource "aws_opensearchserverless_security_config" "jol_hub" {
  name = "${var.project_name}-${var.environment}-security"
  type = "saml"

  saml_options {
    metadata = var.saml_metadata_xml
  }
}
