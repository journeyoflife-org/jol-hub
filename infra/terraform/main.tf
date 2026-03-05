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
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
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
