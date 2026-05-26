resource "aws_dynamodb_table" "learning_records" {
  name         = var.learning_records_table_name
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "userId"
  range_key = "recordId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "recordId"
    type = "S"
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "usage_limits" {
  name         = var.usage_limits_table_name
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "userId"
  range_key = "usageDate"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "usageDate"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = var.tags
}