# KoreanMate Runbook

> Purpose: This runbook documents the verification order, root cause analysis approach, temporary mitigation steps, and recovery procedures for common operational issues in the KoreanMate Serverless environment.  
> Baseline environment: AWS Seoul Region `ap-northeast-2`, `dev` environment, Terraform-based Serverless architecture

---

## 1. Runbook Overview

KoreanMate is a serverless application that hosts a React/Vite frontend on S3 and CloudFront, and runs the backend on API Gateway HTTP API, Lambda, DynamoDB, and Amazon Bedrock.

When an incident occurs, the system should be checked in the following order.

```text
User Interface
  ↓
CloudFront / S3
  ↓
API Gateway
  ↓
Cognito JWT Authorizer
  ↓
Lambda
  ↓
DynamoDB / Bedrock
  ↓
CloudWatch / X-Ray / Grafana / CloudTrail
```

The basic incident response principles are as follows.

| Principle | Description |
|---|---|
| Identify the impact scope | First separate whether the issue is related to the frontend, API, authentication, or backend dependencies. |
| Check recent changes | Review recent deployments, Terraform apply history, and GitHub Actions runs. |
| Use logs and metrics | Do not rely on assumptions. Use CloudWatch Logs, API response codes, and Grafana metrics as evidence. |
| Prioritise temporary recovery | If user access is blocked, restore service first before performing a full root cause analysis. |
| Record prevention actions | Document the cause, mitigation, and improvements in `troubleshooting.md`. |

---

## 2. Main Operational Tools

| Tool | Purpose |
|---|---|
| CloudWatch Logs | Review Lambda execution logs |
| CloudWatch Metrics | Review Lambda and API Gateway metrics |
| CloudWatch Alarm | Detect error rate, latency, and 5XX issues |
| X-Ray | Trace Lambda request flows |
| Grafana Cloud | Visualise CloudWatch metrics |
| CloudTrail | Review AWS API change history |
| AWS Budgets | Check cost threshold breaches |
| GitHub Actions | Review CI/CD execution results |
| Terraform | Inspect and recover infrastructure state |

---

## 3. Common Incident Triage Procedure

When an issue occurs, follow the steps below.

### 3.1 Check the User-facing Symptom

| Check item | Example |
|---|---|
| Site unavailable | CloudFront URL cannot be accessed |
| Broken UI | Frontend static assets fail to load |
| API failure | 401, 403, 429, or 500 response |
| AI response failure | No result returned from correction, conversation, or level-test |
| Data retrieval failure | history, usage, or profile data cannot be loaded |

### 3.2 Check Recent Changes

```bash
git log --oneline -5
```

Check GitHub Actions run results:

```text
GitHub Repository
→ Actions
→ serverless-ci.yml / serverless-deploy.yml
→ Check the latest failed job
```

Check Terraform drift or pending changes:

```bash
cd infra/serverless/envs/dev
terraform plan
```

### 3.3 Check AWS Resource Status

```bash
aws sts get-caller-identity
aws apigatewayv2 get-apis --region ap-northeast-2
aws lambda list-functions --region ap-northeast-2
aws dynamodb list-tables --region ap-northeast-2
```

---

## 4. Frontend Access Issue

### Symptoms

| Symptom | Possible cause |
|---|---|
| CloudFront URL cannot be accessed | CloudFront distribution issue |
| 403 Access Denied | S3 OAC or bucket policy issue |
| Old UI is still displayed | CloudFront cache issue |
| JS/CSS files fail to load | Missing S3 upload or incorrect build output |

### Verification Steps

Check the CloudFront response:

```bash
curl -I https://<cloudfront-domain>
```

Check S3 build files:

```bash
aws s3 ls s3://<frontend-bucket-name> --recursive
```

Check CloudFront distribution:

```bash
aws cloudfront get-distribution --id <distribution-id>
```

### Response Steps

Rebuild the frontend:

```bash
cd apps/frontend
npm install
npm run build
```

Re-upload to S3:

```bash
aws s3 sync dist/ s3://<frontend-bucket-name> --delete
```

Invalidate the CloudFront cache:

```bash
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

### Recovery Criteria

| Criteria | How to verify |
|---|---|
| CloudFront URL returns 200 | `curl -I` |
| Latest UI is displayed | Browser refresh |
| JS/CSS files load correctly | Browser DevTools Network tab |

---

## 5. API 401 Unauthorized

### Symptom

The API returns a 401 Unauthorized response.

### Main Causes

| Cause | Description |
|---|---|
| Missing JWT | Authorization header is missing |
| Expired JWT | Access token has expired |
| Wrong token type | ID token and access token are confused |
| Cognito configuration mismatch | issuer, audience, or client id does not match |
| API Gateway Authorizer issue | JWT Authorizer is not attached correctly |

### Verification Steps

Check the request header in browser DevTools:

```text
Authorization: Bearer <token>
```

Check API Gateway Authorizer settings:

```bash
aws apigatewayv2 get-authorizers \
  --api-id <api-id> \
  --region ap-northeast-2
```

Check Cognito User Pool Client:

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id <user-pool-id> \
  --client-id <client-id> \
  --region ap-northeast-2
```

### Response Steps

1. Confirm that the frontend includes the Authorization header.
2. If the token has expired, re-login or verify the refresh token flow.
3. Confirm the issuer and audience values in the API Gateway JWT Authorizer.
4. Confirm that the Cognito User Pool ID and Client ID match the frontend environment variables.

### Recovery Criteria

| Criteria | How to verify |
|---|---|
| Authenticated API request returns 200 | Call the API after login |
| Unauthenticated request returns 401 | Call the API after removing the token |
| Lambda receives Cognito sub | Check CloudWatch Logs |

---

## 6. API 429 Too Many Requests

### Symptom

AI feature requests return a 429 response.

### Types of 429 Responses to Distinguish

| Type | Description |
|---|---|
| API Gateway Throttling 429 | Request throttling at the API Gateway layer |
| Application Usage Limit 429 | Per-user daily AI usage limit |

### Verification Steps

Check the response body:

```json
{
  "message": "You have used all of today's writing correction attempts."
}
```

If the response includes a feature-specific usage limit message like this, it is an application-level 429.

Check API Gateway throttle settings:

```bash
aws apigatewayv2 get-stages \
  --api-id <api-id> \
  --region ap-northeast-2
```

Check DynamoDB UsageLimits:

```bash
aws dynamodb scan \
  --table-name <usage-limits-table-name> \
  --region ap-northeast-2
```

### Response Steps

For an application usage limit 429:

1. Treat it as expected behaviour.
2. Check the count value for the corresponding userId and usageDate in the DynamoDB UsageLimits table.
3. If needed for testing, delete the test account's usage record or test again on the next day.

Example test data deletion:

```bash
aws dynamodb delete-item \
  --table-name <usage-limits-table-name> \
  --key '{"userId":{"S":"<user-id>"},"usageDate":{"S":"YYYY-MM-DD"}}' \
  --region ap-northeast-2
```

For an API Gateway throttling 429:

1. Check the stage throttle settings.
2. If there are many abnormal requests, check WAF Rate Limit and CloudWatch Metrics.
3. If there are many legitimate requests, consider adjusting the throttle limit.

### Recovery Criteria

| Criteria | How to verify |
|---|---|
| Request within limit returns 200 | Reset usage and call the API |
| Request over limit returns 429 | Repeat the request test |
| Unnecessary Bedrock calls are blocked | Check CloudWatch Logs |

---

## 7. API 500 Internal Server Error

### Symptom

The API returns a 500 response.

### Main Causes

| Cause | Description |
|---|---|
| Missing Lambda environment variables | Missing table name, model id, or other required config |
| Insufficient IAM permission | DynamoDB, Bedrock, or X-Ray access failure |
| Bedrock invocation failure | Model access, region, or request format issue |
| DynamoDB request failure | Key schema or UpdateExpression issue |
| Code deployment issue | Incorrect Lambda zip package or handler setting |

### Verification Steps

Check Lambda logs:

```bash
aws logs tail /aws/lambda/<lambda-function-name> \
  --follow \
  --region ap-northeast-2
```

Check Lambda environment variables:

```bash
aws lambda get-function-configuration \
  --function-name <lambda-function-name> \
  --region ap-northeast-2
```

Check Lambda IAM Role:

```bash
aws lambda get-function-configuration \
  --function-name <lambda-function-name> \
  --query 'Role' \
  --region ap-northeast-2
```

Check CloudWatch Metrics:

```text
CloudWatch
→ Metrics
→ Lambda
→ Errors / Duration / Invocations
```

Check Grafana Cloud:

```text
Grafana Cloud
→ CloudWatch Data Source
→ Lambda / API Gateway Dashboard
→ Check Error, Duration, and 5XX metrics
```

### Response Steps

1. Check the error message in CloudWatch Logs.
2. If an environment variable is missing, check Terraform variables or Lambda module settings.
3. If the error is AccessDenied, check the Lambda Execution Role policy.
4. If the error is a Bedrock ValidationException, check the model ID, region, and Bedrock access status.
5. If the error is a DynamoDB ValidationException, check the key schema and UpdateExpression.
6. If the issue started after a recent deployment, revert to the last known working commit and redeploy.

### Recovery Criteria

| Criteria | How to verify |
|---|---|
| API returns 200 | curl or frontend test |
| Lambda errors decrease | CloudWatch / Grafana |
| Data is stored correctly | Query DynamoDB tables |
| AI result is returned | Test correction / conversation / level-test |

---

## 8. Bedrock Invocation Failure

### Symptom

AI response generation fails, or Lambda logs show a Bedrock-related error.

### Main Causes

| Cause | Description |
|---|---|
| Bedrock Model Access not approved | No permission to use the selected model |
| Incorrect Model ID | SSM Parameter or environment variable value is wrong |
| Insufficient IAM permission | `bedrock:InvokeModel` permission is missing |
| Request format issue | Bedrock API body format does not match the model requirement |
| Region mismatch | Lambda region and supported model region do not match |

### Verification Steps

Check Lambda environment variables:

```bash
aws lambda get-function-configuration \
  --function-name <lambda-function-name> \
  --query 'Environment.Variables' \
  --region ap-northeast-2
```

Check SSM Parameter:

```bash
aws ssm get-parameter \
  --name /<project>/<env>/bedrock/model-id \
  --region ap-northeast-2
```

Check IAM Policy:

```bash
aws iam get-role-policy \
  --role-name <lambda-execution-role-name> \
  --policy-name <policy-name>
```

Check Bedrock errors in CloudWatch Logs:

```bash
aws logs tail /aws/lambda/<lambda-function-name> \
  --region ap-northeast-2
```

### Response Steps

1. Check the Bedrock Model Access approval status in the AWS Console.
2. Confirm that `BEDROCK_MODEL_ID` points to an available model.
3. Confirm that the Lambda IAM Role has `bedrock:InvokeModel` permission.
4. Check the request body format in the code.
5. If the model ID was changed, confirm that Terraform apply updated the Lambda environment variable.

### Recovery Criteria

| Criteria | How to verify |
|---|---|
| Bedrock invocation succeeds | Call an AI feature API |
| No Lambda error | CloudWatch Logs |
| Result is stored in DynamoDB | Query LearningRecords |

---

## 9. DynamoDB Save or Query Failure

### Symptom

The AI result is returned, but the learning record is not saved, or History / Usage lookup fails.

### Main Causes

| Cause | Description |
|---|---|
| Missing table name environment variable | Lambda cannot find the table name |
| Insufficient IAM permission | Missing DynamoDB PutItem, Query, or UpdateItem permission |
| Key schema mismatch | PK/SK names do not match the table design |
| Missing userId | Cognito sub extraction failed |
| UpdateExpression error | Usage count update logic is incorrect |

### Verification Steps

Check table list:

```bash
aws dynamodb list-tables --region ap-northeast-2
```

Check LearningRecords:

```bash
aws dynamodb scan \
  --table-name <learning-records-table-name> \
  --region ap-northeast-2
```

Check UsageLimits:

```bash
aws dynamodb scan \
  --table-name <usage-limits-table-name> \
  --region ap-northeast-2
```

Check Lambda logs:

```bash
aws logs tail /aws/lambda/<lambda-function-name> \
  --region ap-northeast-2
```

### Response Steps

1. Check the table names in Lambda environment variables.
2. Compare Terraform output table names with the actual DynamoDB table names.
3. Confirm that the Lambda IAM Role has DynamoDB permissions.
4. Confirm that the query condition matches the PK/SK design.
5. If a UsageLimits UpdateExpression error occurs, fix the count field update logic.

### Recovery Criteria

| Criteria | How to verify |
|---|---|
| Record is saved after an AI request | LearningRecords scan/query |
| Usage count increases | UsageLimits scan/query |
| History lookup succeeds | Call `/history` API |
| Usage lookup succeeds | Call `/usage` API |

---

## 10. GitHub Actions CI Failure

### Symptom

The CI Pipeline fails on a pull request or manual run.

### Main Causes

| Cause | Description |
|---|---|
| TypeScript error | Type check failed |
| Frontend build failure | Vite build error |
| Backend build failure | esbuild or tsconfig error |
| Terraform validate failure | Terraform syntax or provider configuration error |
| Trivy scan failure | Vulnerability or IaC security warning |

### Verification Steps

```text
GitHub Repository
→ Actions
→ serverless-ci.yml
→ Select the failed job
→ Check the failed step logs
```

Run the same commands locally:

```bash
cd apps/backend
npm install
npm run build
```

```bash
cd apps/frontend
npm install
npm run build
```

```bash
cd infra/serverless/envs/dev
terraform fmt -check
terraform init -backend=false
terraform validate
```

### Response Steps

1. Identify the failed job first.
2. Run the same command locally to reproduce the error.
3. For TypeScript errors, fix type definitions or optional value handling.
4. For Terraform errors, check module input/output, provider settings, and missing variables.
5. For Trivy failures, decide whether to fix the issue or document an exception based on the actual risk and portfolio scope.

### Recovery Criteria

| Criteria | How to verify |
|---|---|
| All CI jobs succeed | GitHub Actions |
| Backend build succeeds | `npm run build` |
| Frontend build succeeds | `npm run build` |
| Terraform validate succeeds | `terraform validate` |

---

## 11. GitHub Actions Deploy Failure

### Symptom

The Deploy Pipeline fails during Terraform apply, Lambda packaging, S3 upload, or CloudFront invalidation.

### Main Causes

| Cause | Description |
|---|---|
| Missing GitHub Secrets | Missing AWS credentials, API URL, or Cognito values |
| Missing Lambda package | Zip package generation failed |
| Terraform apply failure | AWS resource conflict or insufficient permission |
| S3 upload failure | Incorrect bucket name or insufficient permission |
| CloudFront invalidation failure | Incorrect distribution ID or invalid path format |

### Verification Steps

```text
GitHub Repository
→ Actions
→ serverless-deploy.yml
→ Check the failed step logs
```

Check GitHub Secrets:

```text
GitHub Repository
→ Settings
→ Secrets and variables
→ Actions
```

Check Terraform plan:

```bash
cd infra/serverless/envs/dev
terraform plan
```

Check CloudFront distribution:

```bash
aws cloudfront list-distributions
```

### Response Steps

1. Separate the cause based on the failed step.
2. Check whether any GitHub Secrets are missing.
3. Confirm that Lambda zip packaging succeeds.
4. If Terraform apply fails, identify whether the error is caused by resource conflict or permission issues.
5. CloudFront invalidation paths must start with `/`.

Correct invalidation example:

```bash
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

### Recovery Criteria

| Criteria | How to verify |
|---|---|
| Deploy Pipeline succeeds | GitHub Actions |
| API responds correctly | curl or frontend test |
| Latest frontend is reflected | CloudFront URL |
| Latest Lambda code is applied | CloudWatch Logs or test response |

---

## 12. Cost Increase Response

### Symptom

AWS cost increases faster than expected.

### Main Causes

| Cause | Description |
|---|---|
| Increased Bedrock calls | Excessive AI requests |
| Increased CloudWatch Logs | Excessive log output |
| Increased CloudTrail S3 storage | Accumulated audit logs |
| Increased DynamoDB requests | Repeated tests or infinite calls |
| Increased CloudFront requests | Abnormal access or cache miss |

### Verification Steps

Check AWS Budgets:

```text
AWS Console
→ Billing and Cost Management
→ Budgets
```

Check Cost Explorer:

```text
AWS Console
→ Billing and Cost Management
→ Cost Explorer
→ Check cost by service
```

Check CloudWatch Logs storage:

```text
CloudWatch
→ Logs
→ Log groups
→ Check stored bytes
```

Check UsageLimits data:

```bash
aws dynamodb scan \
  --table-name <usage-limits-table-name> \
  --region ap-northeast-2
```

### Response Steps

1. Identify the service driving the cost increase in Cost Explorer.
2. If the cost is from Bedrock, check whether per-user usage limits are working correctly.
3. If the cost is from CloudWatch Logs, reduce log retention and log volume.
4. For CloudTrail logs, check the S3 Lifecycle policy.
5. If there are many abnormal requests, check WAF Rate Limit.

### Recovery Criteria

| Criteria | How to verify |
|---|---|
| Cost-driving service is identified | Cost Explorer |
| Bedrock call limit works correctly | UsageLimits |
| Log retention is applied | CloudWatch Log Group |
| Budget alert works | AWS Budgets |

---

## 13. CloudWatch / Grafana Verification Criteria

### Metrics to Check in CloudWatch

| Resource | Main metrics |
|---|---|
| Lambda | Invocations, Errors, Duration, Throttles |
| API Gateway | Count, 4XX, 5XX, Latency |
| DynamoDB | ConsumedReadCapacityUnits, ConsumedWriteCapacityUnits, ThrottledRequests |
| CloudFront | Requests, 4xxErrorRate, 5xxErrorRate |
| WAF | BlockedRequests, AllowedRequests |

### Metrics to Check in Grafana

| Dashboard area | What to check |
|---|---|
| API Gateway | Request count, 4XX, 5XX, Latency |
| Lambda | Invocation count, error count, duration |
| DynamoDB | Read/write requests and throttling |
| CloudFront | Request count and error rate |
| Cost-related | Budgets or cost alerts should be confirmed in the AWS Console |

Grafana Cloud is connected to CloudWatch Data Source. When API requests are executed, metric collection can be verified by checking changes in the dashboard graphs.

---

## 14. Incident Record Template

When an issue occurs, record it in `docs/troubleshooting.md` using the following format.

```md
## Issue Title

### Symptom
- Describe which feature was affected

### Cause
- Describe the root cause based on logs and metrics

### Resolution
- Describe the actual action taken

### Result
- Describe whether the issue was recovered and how it was verified

### Lessons Learned
- Describe improvements to prevent recurrence
```

---

## 15. Emergency Recovery Checklist

When an incident occurs, quickly check at least the following items.

```text
[ ] Check whether the CloudFront URL is accessible
[ ] Call the API Gateway URL directly
[ ] Check whether the Authorization header is included after login
[ ] Check Lambda errors in CloudWatch Logs
[ ] Check API/Lambda metrics in Grafana
[ ] Check whether data is stored in DynamoDB
[ ] Check whether Bedrock invocation errors exist
[ ] Check recent GitHub Actions deploy failures
[ ] Check recent Terraform apply changes
[ ] Check abnormal cost increase
```

---

## 16. Planned Operational Improvements

This runbook currently targets the `dev` environment. The following improvements are planned to raise the operational level.

| Improvement | Description |
|---|---|
| SNS / Slack alerts | Send immediate notifications when CloudWatch Alarms occur |
| Grafana Dashboard enhancement | Build dashboards focused on Lambda, API Gateway, Bedrock, and 429 responses |
| GitHub OIDC | Remove long-term AWS Access Keys from GitHub Actions |
| Bedrock IAM restriction | Reduce permission scope to Foundation Model ARN level |
| DynamoDB Transaction | Improve consistency between usage count updates and learning record writes |
| History Pagination | Improve learning history query performance |
| prod environment separation | Separate dev and prod infrastructure |
