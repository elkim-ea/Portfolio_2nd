output "budget_name" {
  value = aws_budgets_budget.monthly_cost.name
}

output "budget_limit_usd" {
  value = aws_budgets_budget.monthly_cost.limit_amount
}