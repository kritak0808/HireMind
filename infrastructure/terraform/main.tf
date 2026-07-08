terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

# S3 Bucket for Resume & Audio Recording Storage
resource "aws_s3_bucket" "candidate_assets" {
  bucket        = "hiremind-candidate-assets-prod"
  force_destroy = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets_encryption" {
  bucket = aws_s3_bucket.candidate_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# PostgreSQL RDS Instance for production transactions
resource "aws_db_instance" "hiremind_db" {
  allocated_storage    = 20
  max_allocated_storage = 100
  db_name              = "hiremind_db"
  engine               = "postgres"
  engine_version       = "16"
  instance_class       = "db.t4g.medium"
  username             = "hiremind_admin"
  password             = var.db_password
  parameter_group_name = "default.postgres16"
  skip_final_snapshot  = true
  storage_encrypted    = true
}

variable "db_password" {
  type      = string
  sensitive = true
}
