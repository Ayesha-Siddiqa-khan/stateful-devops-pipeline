# ECR

resource "aws_ecr_repository" "main_1" {
  name                 = var.ecr_repository_name_1
  image_tag_mutability = var.ecr_image_tag_mutability_1

  image_scanning_configuration {
    scan_on_push = var.ecr_scan_on_push_1
  }

  tags = {
    Name                   = "${var.project_name}"
    Project                = var.project_name
    TerraPilotProject      = var.project_name
    TerraPilotResourceType = "ecr-repository"
    Environment            = var.environment
    ManagedBy              = "TerraPilot"
    CostSensitive          = "true"
  }
}

resource "aws_ecr_lifecycle_policy" "main_1" {
  count      = var.ecr_lifecycle_policy_enabled_1 ? 1 : 0
  repository = aws_ecr_repository.main_1.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images older than 30 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_ecr_repository" "main_2" {
  name                 = var.ecr_repository_name_2
  image_tag_mutability = var.ecr_image_tag_mutability_2

  image_scanning_configuration {
    scan_on_push = var.ecr_scan_on_push_2
  }

  tags = {
    Name                   = "${var.project_name}"
    Project                = var.project_name
    TerraPilotProject      = var.project_name
    TerraPilotResourceType = "ecr-repository"
    Environment            = var.environment
    ManagedBy              = "TerraPilot"
    CostSensitive          = "true"
  }
}

resource "aws_ecr_lifecycle_policy" "main_2" {
  count      = var.ecr_lifecycle_policy_enabled_2 ? 1 : 0
  repository = aws_ecr_repository.main_2.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images older than 30 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

locals {
  ecr_repository_url = aws_ecr_repository.main_1.repository_url
  ecr_repository_arn = aws_ecr_repository.main_1.arn
}
