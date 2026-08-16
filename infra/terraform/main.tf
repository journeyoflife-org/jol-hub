# -----------------------------------------------------------------------------
# JOL-HUB Infrastructure — Main Terraform Configuration
# -----------------------------------------------------------------------------
# This is the root module that orchestrates all infrastructure components
# for the JOL-HUB platform on AWS.
# -----------------------------------------------------------------------------

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Backend configuration — uncomment and configure for production
  # backend "s3" {
  #   bucket         = "jol-hub-terraform-state"
  #   key            = "infrastructure/terraform.tfstate"
  #   region         = "eu-west-1"
  #   encrypt        = true
  #   dynamodb_table = "jol-hub-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# VPC Module
# -----------------------------------------------------------------------------

module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  vpc_cidr     = var.vpc_cidr
  az_count     = var.az_count
  tags         = local.common_tags
}

# -----------------------------------------------------------------------------
# Security Module
# -----------------------------------------------------------------------------

module "security" {
  source = "./modules/security"

  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  vpc_cidr            = module.vpc.vpc_cidr
  enable_bastion      = var.enable_bastion
  allowed_admin_cidrs = var.allowed_admin_cidrs
  tags                = local.common_tags
}

# -----------------------------------------------------------------------------
# Database Module (RDS PostgreSQL)
# -----------------------------------------------------------------------------

module "database" {
  source = "./modules/database"

  project_name                = var.project_name
  environment                 = var.environment
  database_subnet_ids         = module.vpc.database_subnet_ids
  security_group_id           = module.security.rds_security_group_id
  db_name                     = var.db_name
  db_username                 = var.db_username
  postgres_version            = var.postgres_version
  instance_class              = var.rds_instance_class
  allocated_storage           = var.rds_allocated_storage
  max_allocated_storage       = var.rds_max_allocated_storage
  backup_retention_days       = var.rds_backup_retention_days
  multi_az                    = var.rds_multi_az
  enable_performance_insights = var.rds_enable_performance_insights
  alarm_sns_topic_arn         = var.alarm_sns_topic_arn
  tags                        = local.common_tags
}

# -----------------------------------------------------------------------------
# ElastiCache Module (Redis)
# -----------------------------------------------------------------------------

module "elasticache" {
  source = "./modules/elasticache"

  project_name            = var.project_name
  environment             = var.environment
  database_subnet_ids     = module.vpc.database_subnet_ids
  security_group_id       = module.security.elasticache_security_group_id
  redis_version           = var.redis_version
  node_type               = var.redis_node_type
  num_cache_clusters      = var.redis_num_cache_clusters
  snapshot_retention_days = var.redis_snapshot_retention_days
  alarm_sns_topic_arn     = var.alarm_sns_topic_arn
  tags                    = local.common_tags
}

# -----------------------------------------------------------------------------
# Storage Module (S3 + CloudFront)
# -----------------------------------------------------------------------------

module "storage" {
  source = "./modules/storage"

  project_name           = var.project_name
  environment            = var.environment
  cloudfront_price_class = var.cloudfront_price_class
  acm_certificate_arn    = var.cloudfront_certificate_arn
  tags                   = local.common_tags
}

# -----------------------------------------------------------------------------
# ECS Module (Fargate + ALB)
# -----------------------------------------------------------------------------

module "ecs" {
  source = "./modules/ecs"

  project_name                = var.project_name
  environment                 = var.environment
  aws_region                  = var.aws_region
  vpc_id                      = module.vpc.vpc_id
  public_subnet_ids           = module.vpc.public_subnet_ids
  private_subnet_ids          = module.vpc.private_subnet_ids
  alb_security_group_id       = module.security.alb_security_group_id
  ecs_security_group_id       = module.security.ecs_security_group_id
  certificate_arn             = var.alb_certificate_arn
  db_secret_arn               = module.database.db_secret_arn
  redis_secret_arn            = module.elasticache.redis_secret_arn
  s3_bucket_arn               = module.storage.s3_bucket_arn
  log_retention_days          = var.log_retention_days
  django_cpu                  = var.django_cpu
  django_memory               = var.django_memory
  django_desired_count        = var.django_desired_count
  django_min_count            = var.django_min_count
  django_max_count            = var.django_max_count
  celery_cpu                  = var.celery_cpu
  celery_memory               = var.celery_memory
  celery_worker_desired_count = var.celery_worker_desired_count
  celery_worker_min_count     = var.celery_worker_min_count
  celery_worker_max_count     = var.celery_worker_max_count
  tags                        = local.common_tags
}

# -----------------------------------------------------------------------------
# Route53 Record (optional)
# -----------------------------------------------------------------------------

resource "aws_route53_record" "app" {
  count = var.route53_zone_id != "" ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.app_domain
  type    = "A"

  alias {
    name                   = module.ecs.alb_dns_name
    zone_id                = module.ecs.alb_zone_id
    evaluate_target_health = true
  }
}

# -----------------------------------------------------------------------------
# EKS Module (Kubernetes Cluster) - Optional
# -----------------------------------------------------------------------------

module "eks" {
  count = var.enable_eks ? 1 : 0

  source = "./modules/eks"

  project_name               = var.project_name
  environment                = var.environment
  subnet_ids                 = module.vpc.private_subnet_ids
  node_group_subnet_ids      = module.vpc.private_subnet_ids
  cluster_security_group_id  = module.security.eks_security_group_id
  public_access_cidrs        = var.allowed_admin_cidrs
  s3_bucket_arn              = module.storage.s3_bucket_arn
  cluster_version            = var.eks_cluster_version
  general_instance_types     = var.eks_general_instance_types
  general_desired_size       = var.eks_general_desired_size
  general_min_size           = var.eks_general_min_size
  general_max_size           = var.eks_general_max_size
  compute_instance_types     = var.eks_compute_instance_types
  compute_desired_size       = var.eks_compute_desired_size
  compute_min_size           = var.eks_compute_min_size
  compute_max_size           = var.eks_compute_max_size
  tags                       = local.common_tags
}

# -----------------------------------------------------------------------------
# Monitoring Module (Prometheus & Grafana) - Optional
# -----------------------------------------------------------------------------

module "monitoring" {
  count = var.enable_monitoring ? 1 : 0

  source = "./modules/monitoring"

  project_name            = var.project_name
  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  vpc_cidr                = module.vpc.vpc_cidr
  private_subnet_ids      = module.vpc.private_subnet_ids
  alarm_sns_topic_arn     = var.alarm_sns_topic_arn
  alb_name                = module.ecs.alb_name
  db_instance_identifier  = module.database.db_instance_identifier
  db_max_connections      = var.rds_max_connections
  redis_cluster_id        = module.elasticache.redis_cluster_id
  api_latency_threshold   = var.api_latency_threshold
  error_rate_threshold    = var.error_rate_threshold
  db_cpu_threshold        = var.db_cpu_threshold
  redis_memory_threshold  = var.redis_memory_threshold
  tags                    = local.common_tags
}

# -----------------------------------------------------------------------------
# Logging Module (OpenSearch / ELK) - Optional
# -----------------------------------------------------------------------------

module "logging" {
  count = var.enable_logging ? 1 : 0

  source = "./modules/logging"

  project_name            = var.project_name
  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  vpc_cidr                = module.vpc.vpc_cidr
  subnet_ids              = module.vpc.private_subnet_ids
  oidc_provider_arn       = var.enable_eks ? module.eks[0].cluster_oidc_provider_arn : ""
  oidc_provider_url       = var.enable_eks ? module.eks[0].cluster_oidc_issuer_url : ""
  master_user_password    = var.opensearch_master_password
  log_retention_days      = var.log_retention_days
  tags                    = local.common_tags
}

# -----------------------------------------------------------------------------
# Secrets Management Module (AWS Secrets Manager + Vault)
# -----------------------------------------------------------------------------

module "secrets" {
  source = "./modules/secrets"

  project_name            = var.project_name
  environment             = var.environment
  aws_region              = var.aws_region
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids

  # IAM roles for secret access
  ecs_execution_role_arn = module.ecs.execution_role_arn
  ecs_task_role_arn      = module.ecs.task_role_arn

  # Secret retention
  recovery_window_days   = var.secrets_recovery_window_days
  enable_secret_rotation = var.enable_secret_rotation

  # Payment secrets (PCI-DSS scoped)
  # Model A (ADR-0005): NO PSP-card-processor variables — the payment
  # boundary in jol-m-marketplace solely holds those credentials (STEP 18).
  paypal_client_id        = var.paypal_client_id
  paypal_client_secret    = var.paypal_client_secret
  paypal_mode             = var.paypal_mode

  # Email secrets
  email_host              = var.email_host
  email_port              = var.email_port
  email_host_user         = var.email_host_user
  email_host_password     = var.email_host_password
  email_use_tls           = var.email_use_tls

  # Integration secrets
  bitrix24_webhook_url    = var.bitrix24_webhook_url
  bitrix24_portal_id      = var.bitrix24_portal_id
  bitrix24_contact_group_id = var.bitrix24_contact_group_id

  # OAuth secrets
  google_oauth_client_id     = var.google_oauth_client_id
  google_oauth_client_secret = var.google_oauth_client_secret
  facebook_oauth_client_id   = var.facebook_oauth_client_id
  facebook_oauth_client_secret = var.facebook_oauth_client_secret

  # HashiCorp Vault (optional)
  enable_vault     = var.enable_vault
  vault_addr       = var.vault_addr
  vault_namespace  = var.vault_namespace

  tags = local.common_tags
}
