# -----------------------------------------------------------------------------
# ECS Module — Container orchestration for Django, Celery, and supporting services
# -----------------------------------------------------------------------------
# Creates:
#   • ECS cluster with container insights
#   • ECR repositories
#   • CloudWatch log groups
#   • Application Load Balancer
#   • Task definitions (Django web, Celery worker, Celery beat)
#   • ECS services with auto-scaling
# -----------------------------------------------------------------------------

locals {
  container_name = "django"
  container_port = 8000
}

# -----------------------------------------------------------------------------
# ECS Cluster
# -----------------------------------------------------------------------------

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-cluster-${var.environment}"
  })
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 1
    capacity_provider = "FARGATE"
  }
}

# -----------------------------------------------------------------------------
# ECR Repositories
# -----------------------------------------------------------------------------

resource "aws_ecr_repository" "django" {
  name                 = "${var.project_name}/django"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  force_delete = var.environment != "production"

  tags = merge(var.tags, {
    Name = "${var.project_name}-django-${var.environment}"
  })
}

resource "aws_ecr_lifecycle_policy" "django" {
  repository = aws_ecr_repository.django.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Log Groups
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "django" {
  name              = "/ecs/${var.project_name}/django-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.project_name}-django-logs-${var.environment}"
  })
}

resource "aws_cloudwatch_log_group" "celery_worker" {
  name              = "/ecs/${var.project_name}/celery-worker-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.project_name}-celery-worker-logs-${var.environment}"
  })
}

resource "aws_cloudwatch_log_group" "celery_beat" {
  name              = "/ecs/${var.project_name}/celery-beat-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.project_name}-celery-beat-logs-${var.environment}"
  })
}

# -----------------------------------------------------------------------------
# Application Load Balancer
# -----------------------------------------------------------------------------

resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "production"
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-alb-${var.environment}"
  })
}

# Target group for Django
resource "aws_lb_target_group" "django" {
  name        = "${var.project_name}-django-${var.environment}"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/v1/health/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "${var.project_name}-django-tg-${var.environment}"
  })
}

# HTTP listener (redirects to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.django.arn
  }
}

# -----------------------------------------------------------------------------
# S3 Bucket for ALB Logs
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-alb-logs-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-alb-logs-${var.environment}"
  })
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::127311923021:root" # ELB account for eu-west-1
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/alb-logs/*"
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

data "aws_caller_identity" "current" {}

# -----------------------------------------------------------------------------
# IAM Roles
# -----------------------------------------------------------------------------

# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-ecs-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "secrets-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Resource = [
          var.db_secret_arn,
          var.redis_secret_arn,
          aws_secretsmanager_secret.django.arn,
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/${var.project_name}/*"
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "s3-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task_ses" {
  name = "ses-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
        ]
        Resource = "*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Secrets Manager for Django settings
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "django" {
  name                    = "${var.project_name}/django-settings/${var.environment}"
  description             = "Django settings for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = merge(var.tags, {
    Name = "${var.project_name}-django-settings-${var.environment}"
  })
}

resource "aws_secretsmanager_secret_version" "django" {
  secret_id = aws_secretsmanager_secret.django.id
  secret_string = jsonencode({
    SECRET_KEY           = random_password.django_secret.result
    ALLOWED_HOSTS        = "${aws_lb.main.dns_name},*.journeyoflife.org"
    CSRF_TRUSTED_ORIGINS = "https://${aws_lb.main.dns_name},https://*.journeyoflife.org"
    DEBUG                = var.environment == "production" ? "false" : "true"
  })
}

resource "random_password" "django_secret" {
  length  = 50
  special = false
}

# -----------------------------------------------------------------------------
# Task Definitions
# -----------------------------------------------------------------------------

locals {
  django_container_definition = {
    name  = local.container_name
    image = "${aws_ecr_repository.django.repository_url}:latest"
    essential = true

    portMappings = [
      {
        containerPort = local.container_port
        protocol      = "tcp"
      }
    ]

    environment = [
      { name = "DJANGO_SETTINGS_MODULE", value = "backend.django.core.settings.production" },
      { name = "AWS_REGION", value = var.aws_region },
    ]

    secrets = [
      { name = "DATABASE_URL", valueFrom = var.db_secret_arn },
      { name = "REDIS_URL", valueFrom = var.redis_secret_arn },
      { name = "DJANGO_SECRET_KEY", valueFrom = aws_secretsmanager_secret.django.arn },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.django.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "django"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8000/api/v1/health/ || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }

  celery_worker_container_definition = {
    name  = "celery-worker"
    image = "${aws_ecr_repository.django.repository_url}:latest"
    essential = true
    command = ["celery", "-A", "backend.django.core", "worker", "-l", "info", "-c", "4"]

    environment = [
      { name = "DJANGO_SETTINGS_MODULE", value = "backend.django.core.settings.production" },
      { name = "AWS_REGION", value = var.aws_region },
    ]

    secrets = [
      { name = "DATABASE_URL", valueFrom = var.db_secret_arn },
      { name = "REDIS_URL", valueFrom = var.redis_secret_arn },
      { name = "DJANGO_SECRET_KEY", valueFrom = aws_secretsmanager_secret.django.arn },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.celery_worker.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "celery-worker"
      }
    }
  }

  celery_beat_container_definition = {
    name  = "celery-beat"
    image = "${aws_ecr_repository.django.repository_url}:latest"
    essential = true
    command = ["celery", "-A", "backend.django.core", "beat", "-l", "info", "--scheduler", "django_celery_beat.schedulers:DatabaseScheduler"]

    environment = [
      { name = "DJANGO_SETTINGS_MODULE", value = "backend.django.core.settings.production" },
      { name = "AWS_REGION", value = var.aws_region },
    ]

    secrets = [
      { name = "DATABASE_URL", valueFrom = var.db_secret_arn },
      { name = "REDIS_URL", valueFrom = var.redis_secret_arn },
      { name = "DJANGO_SECRET_KEY", valueFrom = aws_secretsmanager_secret.django.arn },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.celery_beat.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "celery-beat"
      }
    }
  }
}

# Django Web Task Definition
resource "aws_ecs_task_definition" "django" {
  family                   = "${var.project_name}-django-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.django_cpu
  memory                   = var.django_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([local.django_container_definition])

  tags = merge(var.tags, {
    Name = "${var.project_name}-django-td-${var.environment}"
  })
}

# Celery Worker Task Definition
resource "aws_ecs_task_definition" "celery_worker" {
  family                   = "${var.project_name}-celery-worker-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.celery_cpu
  memory                   = var.celery_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([local.celery_worker_container_definition])

  tags = merge(var.tags, {
    Name = "${var.project_name}-celery-worker-td-${var.environment}"
  })
}

# Celery Beat Task Definition
resource "aws_ecs_task_definition" "celery_beat" {
  family                   = "${var.project_name}-celery-beat-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.celery_cpu
  memory                   = var.celery_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([local.celery_beat_container_definition])

  tags = merge(var.tags, {
    Name = "${var.project_name}-celery-beat-td-${var.environment}"
  })
}

# -----------------------------------------------------------------------------
# ECS Services
# -----------------------------------------------------------------------------

# Django Web Service
resource "aws_ecs_service" "django" {
  name            = "django"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.django.arn
  desired_count   = var.django_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.django.arn
    container_name   = local.container_name
    container_port   = local.container_port
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  health_check_grace_period_seconds = 60

  propagate_tags = "SERVICE"

  tags = merge(var.tags, {
    Name = "${var.project_name}-django-service-${var.environment}"
  })

  depends_on = [aws_lb_listener.https]
}

# Celery Worker Service
resource "aws_ecs_service" "celery_worker" {
  name            = "celery-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.celery_worker.arn
  desired_count   = var.celery_worker_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  propagate_tags = "SERVICE"

  tags = merge(var.tags, {
    Name = "${var.project_name}-celery-worker-service-${var.environment}"
  })
}

# Celery Beat Service (singleton)
resource "aws_ecs_service" "celery_beat" {
  name            = "celery-beat"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.celery_beat.arn
  desired_count   = 1  # Only one beat instance
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  deployment_configuration {
    maximum_percent         = 100
    minimum_healthy_percent = 0
  }

  propagate_tags = "SERVICE"

  tags = merge(var.tags, {
    Name = "${var.project_name}-celery-beat-service-${var.environment}"
  })
}

# -----------------------------------------------------------------------------
# Auto Scaling
# -----------------------------------------------------------------------------

resource "aws_appautoscaling_target" "django" {
  max_capacity       = var.django_max_count
  min_capacity       = var.django_min_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.django.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "django_cpu" {
  name               = "${var.project_name}-django-cpu-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.django.resource_id
  scalable_dimension = aws_appautoscaling_target.django.scalable_dimension
  service_namespace  = aws_appautoscaling_target.django.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "django_memory" {
  name               = "${var.project_name}-django-memory-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.django.resource_id
  scalable_dimension = aws_appautoscaling_target.django.scalable_dimension
  service_namespace  = aws_appautoscaling_target.django.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 75.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Celery Worker Auto Scaling (based on queue depth would require custom metric)
resource "aws_appautoscaling_target" "celery_worker" {
  max_capacity       = var.celery_worker_max_count
  min_capacity       = var.celery_worker_min_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.celery_worker.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "celery_worker_cpu" {
  name               = "${var.project_name}-celery-cpu-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.celery_worker.resource_id
  scalable_dimension = aws_appautoscaling_target.celery_worker.scalable_dimension
  service_namespace  = aws_appautoscaling_target.celery_worker.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
