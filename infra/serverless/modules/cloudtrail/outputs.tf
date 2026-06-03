output "cloudtrail_name" {
  value = aws_cloudtrail.this.name
}

output "cloudtrail_arn" {
  value = aws_cloudtrail.this.arn
}

output "cloudtrail_bucket_name" {
  value = aws_s3_bucket.cloudtrail_logs.bucket
}