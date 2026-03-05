output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecr_repository_url" {
  description = "URL of the Django ECR repository"
  value       = aws_ecr_repository.django.repository_url
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the Django target group"
  value       = aws_lb_target_group.django.arn
}

output "django_service_name" {
  description = "Name of the Django ECS service"
  value       = aws_ecs_service.django.name
}

output "celery_worker_service_name" {
  description = "Name of the Celery worker ECS service"
  value       = aws_ecs_service.celery_worker.name
}

output "celery_beat_service_name" {
  description = "Name of the Celery beat ECS service"
  value       = aws_ecs_service.celery_beat.name
}
