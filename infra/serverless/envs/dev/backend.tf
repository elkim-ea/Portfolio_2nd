terraform {
  backend "s3" {
    bucket         = "koreanmate-dev-tfstate-127696278675"
    key            = "serverless/dev/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "koreanmate-dev-terraform-locks"
    encrypt        = true
  }
}