# KoreanMate Serverless Evidence

> Purpose: This document demonstrates that the KoreanMate Serverless version was deployed to a real AWS environment, that user actions from the web frontend are correctly connected through API Gateway, Lambda, Bedrock, and DynamoDB, and that the system can be observed through CloudWatch and X-Ray.
> Reference environment: AWS Seoul Region `ap-northeast-2`, `dev` environment, Terraform-based IaC

---

## 1. Purpose of This Evidence Document

This document is written to present the implementation result of the KoreanMate Serverless version from the perspective of an operational cloud application, not just as a feature checklist.

The validation criteria are as follows.

| No. | Validation Item | Purpose |
| -: | --- | --- |
| 1 | Web service access and feature execution | Verify that real users can access the service through the CloudFront URL and execute application features |
| 2 | S3 static web deployment | Verify that the React/Vite build output was deployed to S3 |
| 3 | CloudFront distribution URL | Verify that the frontend was deployed through a CDN |
| 4 | API Gateway + Cognito Authorizer | Verify that only authenticated users can call protected APIs |
| 5 | Lambda execution logs | Verify that the serverless backend processes real requests |
| 6 | DynamoDB table creation | Verify that the data storage layer was created through Terraform |
| 7 | DynamoDB item persistence | Verify that API results are actually stored in the database |
| 8 | Usage limit 429 response | Verify cost control and abuse prevention logic |
| 9 | CloudWatch Logs | Verify that log-based operational troubleshooting is possible |
| 10 | X-Ray Trace Map | Verify that request tracing and bottleneck analysis are possible |
| 11 | SSM Parameter Store | Verify that configuration values such as the Bedrock Model ID are separated from source code |
| 12 | IAM Role and permission separation | Verify that Lambda execution permissions are scoped around the required resources |

The overall validation flow is as follows.

```text
User Browser
  ↓
CloudFront
  ↓
S3 Static Frontend
  ↓
API Gateway
  ↓
Cognito JWT Authorizer
  ↓
Lambda
  ↓
Bedrock
  ↓
DynamoDB
  ↓
CloudWatch Logs / X-Ray
```

---

## 2. Web Service Access and Feature Execution Evidence

### Purpose

The web service access evidence shows that KoreanMate was not only provisioned as AWS resources, but also deployed as an actual web service that users can access through a browser.

### Validation Flow

```text
User Browser
  ↓
CloudFront URL
  ↓
React/Vite Frontend
  ↓
API Gateway
  ↓
Lambda
  ↓
Bedrock
  ↓
DynamoDB
```

### Validation Items

| Item | Purpose |
| --- | --- |
| CloudFront URL access screen | Verify that the service is actually deployed as a web application |
| Login or authenticated screen | Verify the Cognito-based authentication flow |
| Dashboard screen | Show that stored results can be viewed from the user interface |
| Successful AI feature execution screen | Verify that users can execute the main application features |

<img src="./images/evidence/web-home-page.png" width="600">

<img src="./images/evidence/web-cognito.png" width="600">

<img src="./images/evidence/web-dashboard.png" width="600">

<img src="./images/evidence/web-ai-feature-success.png" width="600">

### Explanation

I verified that the KoreanMate frontend is accessible through the CloudFront distribution URL.
I also validated the full request flow where a user executes an AI feature from the web UI, receives a result through API Gateway, Lambda, and Bedrock, and then stores the result in DynamoDB.

This proves that the project was deployed as a usable serverless application, rather than only creating isolated infrastructure resources.

---

## 3. S3 Static Web Deployment Evidence

### Purpose

The S3 static web deployment evidence shows that the frontend build output was uploaded to the target deployment bucket.

CloudFront acts as the CDN that serves content to users, while S3 acts as the origin storage for the React/Vite static files.

### Validation Items

| Item | Description |
|---|---|
| S3 Bucket | Stores frontend static files |
| index.html | SPA entry point |
| assets/ | Vite build output |
| favicon.svg / icons.svg | Frontend static resources |
| Last modified | Confirms the upload time of the latest build output |

<img src="./images/evidence/s3-frontend-objects.png" width="600">

### Explanation

I verified that the React/Vite build output was uploaded to the S3 bucket.
The deployment bucket contains static files such as `index.html`, `assets/`, `favicon.svg`, and `icons.svg`.

S3 acts as the origin storage for the frontend static files, and users access these resources through CloudFront.

---

## 4. CloudFront Distribution URL

### Purpose

The CloudFront distribution URL is evidence that the frontend was deployed to an actual web-accessible environment.

### Deployment Flow

```text
React/Vite Build
  ↓
S3 Upload
  ↓
CloudFront Distribution
  ↓
User Access
```

<img src="./images/evidence/cloudfront-distribution.png" width="600">

### Explanation

The frontend is deployed by uploading the Vite build output to S3 and serving it through CloudFront.
This configuration demonstrates a serverless frontend deployment pattern that includes static web hosting, CDN-based delivery, and cache invalidation.

---

## 5. API Gateway Routes and Authorizer Configuration Evidence

### Purpose

The API Gateway route and authorizer evidence verifies that each API path is connected to a Lambda integration and that only authenticated users can access protected routes through the Cognito JWT Authorizer.

This evidence is based on the API Gateway console, where route, authorization, and integration settings can be checked.

### Validation Items

| Item | Description |
|---|---|
| Route | API paths such as `/correction`, `/conversation`, `/level-test`, `/usage`, and `/history` |
| Method | GET or POST |
| Authorization | Whether the Cognito JWT Authorizer is attached |
| Integration | Lambda integration connected to each route |

<img src="./images/evidence/api-gateway-routes.png" width="600">

### Explanation

I configured a Cognito JWT Authorizer on the API Gateway HTTP API so that only authenticated users can call the AI feature APIs.
This ensures that frontend authentication and backend API access control work together as a single security flow.

I also verified that unauthenticated requests return `401 Unauthorized`, while requests that exceed the usage limit return `429 Too Many Requests`.
This demonstrates not only successful responses, but also access control and cost protection behavior required for an operational application.

--- 

## 6. API Authentication and Usage Limit Response Validation

### Purpose

This validation verifies that the API Gateway Authorizer and the application-level usage limit logic work correctly during real API requests.

The API Gateway console does not directly show 401, 200, and 429 response results, so these cases are validated using curl or the browser developer tools Network tab.

### Validation Cases

| Case | Expected Result | Validation Method |
|---|---|---|
| Missing Authorization header | 401 Unauthorized | curl or Network tab |
| Expired JWT | 401 Unauthorized | curl or Network tab |
| Valid JWT | 200 OK | curl or Network tab |
| Usage limit exceeded | 429 Too Many Requests | curl or Network tab |

<img src="./images/evidence/Authorization401-Unauthorized.png" width="600">

<img src="./images/evidence/JWT401-Unauthorized.png" width="600">

<img src="./images/evidence/200-OK.png" width="600">

<img src="./images/evidence/429-Too-Many-Requests.png" width="600">

---

## 7. Lambda Execution Logs

### Purpose

Lambda execution logs are evidence that the serverless backend is processing real requests.

By checking Lambda logs together with CloudWatch Logs, I can analyze API request processing, Bedrock calls, DynamoDB persistence, and possible errors.

### Validation Items

| Lambda Function | Purpose |
| ------------------- | ------------ |
| correction Lambda | Handles writing correction requests |
| conversation Lambda | Handles conversation generation requests |
| level-test Lambda | Handles Korean level test requests |
| usage Lambda | Retrieves user usage data |
| history Lambda | Retrieves learning history |
| profile Lambda | Retrieves user profile data |

<img src="./images/evidence/Correction-lambda-function-logs.png" width="600">

<img src="./images/evidence/Conversation-lambda-function-logs.png" width="600">

<img src="./images/evidence/Level-test-lambda-function-logs.png" width="600">

<img src="./images/evidence/Usage-lambda-function-logs.png" width="600">

<img src="./images/evidence/History-lambda-function-logs.png" width="600">

<img src="./images/evidence/Profile-lambda-function-logs.png" width="600">

### Explanation

I verified through Lambda execution logs that real API requests are processed by serverless functions.
These logs can be used as evidence for troubleshooting request-level failures, Bedrock invocation failures, or DynamoDB persistence issues.

---

## 8. DynamoDB Table Creation Evidence

### Purpose

The DynamoDB table creation evidence shows that the persistence layer of the serverless application was provisioned with Terraform.

The screenshot includes both the application DynamoDB tables and the Terraform lock table used for remote state locking.

### Validation Items

| Table | Purpose |
|---|---|
| koreanmate-dev-learning-records | Stores user learning records |
| koreanmate-dev-usage-limits | Manages daily API usage limits |
| koreanmate-dev-user-profiles | Stores user profile and learning settings |
| koreanmate-dev-terraform-locks | Manages Terraform state locking |

### Application Data Tables

The KoreanMate application directly uses the following three tables.

| Table | Purpose |
|---|---|
| koreanmate-dev-learning-records | Stores user learning records |
| koreanmate-dev-usage-limits | Manages daily API usage limits |
| koreanmate-dev-user-profiles | Stores user profile and learning settings |

`koreanmate-dev-terraform-locks` is not used for application runtime data. It is a lock table used by Terraform remote state management to prevent concurrent infrastructure changes.

<img src="./images/evidence/dynamodb-tables.png" width="600">

---

## 9. DynamoDB Item Persistence Result

### Purpose

The DynamoDB item persistence result is strong evidence that the API result is not only returned from Lambda, but also actually stored in the database.

### Validation Flow

```text
Web Frontend or curl
  ↓
API Gateway
  ↓
Lambda
  ↓
Bedrock
  ↓
DynamoDB Persistence
```

### Example Fields to Check

| Field | Description |
| ------------------------ | -------------------------------------- |
| userId | Cognito user identifier |
| recordId | Sort key based on creation time, feature type, and UUID |
| type | correction / conversation / level-test |
| inputText | User input |
| outputText or outputData | AI response result |
| createdAt | Creation timestamp |

<img src="./images/evidence/dynamodb-saved-item1.png" width="600">

<img src="./images/evidence/dynamodb-saved-item2.png" width="600">

### Explanation

I verified that learning results created through the web UI or API requests are stored in DynamoDB instead of remaining only inside Lambda processing.
This confirms that the Serverless API, Bedrock invocation, Repository Layer, and DynamoDB persistence flow are correctly connected.

---

## 10. Cost Control and Usage Limit Validation

### Purpose

AI API calls can increase cost quickly as usage grows, so I implemented a per-user daily usage limit.

This validation confirms that each AI feature request increments the feature-specific usage count and total usage count in the `UsageLimits` table.

### Validation Items

| Item | Result |
|---|---|
| Per-user daily usage storage | Stored in the `UsageLimits` table using `userId + usageDate` |
| Feature-specific call count increase | `correctionCount`, `conversationCount`, and `levelTestCount` increase |
| Total call count increase | `totalCount` increases |
| Limit exceeded response | Returns `429 Too Many Requests` when the daily limit is exceeded |

<img src="./images/evidence/usage-limit-before.png" width="600">

<img src="./images/evidence/usage-limit-after.png" width="600">

<img src="./images/evidence/429-Too-Many-Requests.png" width="600">

### Explanation

I implemented a DynamoDB-based per-user daily usage limit to control Bedrock invocation costs.
This is a key part of the project because it shows that the serverless design considers operational cost, not only application functionality.

---

## 11. CloudWatch Logs

### Purpose

CloudWatch Logs provide operational evidence for Lambda execution results, error messages, and API processing flow.

### Validation Items

| Log Group | Purpose |
| ------------------------ | ------------------ |
| correction Lambda logs | Writing correction API execution logs |
| conversation Lambda logs | Conversation generation API execution logs |
| level-test Lambda logs | Level test API execution logs |
| usage Lambda logs | Usage retrieval API execution logs |
| history Lambda logs | Learning history API execution logs |

<img src="./images/evidence/cloudwatch-logs.png" width="600">

### Explanation

I configured Lambda execution logs to be available in CloudWatch Logs.
During operation, API errors, Bedrock invocation failures, usage limit handling, and authentication failures can be traced based on logs.

---

## 12. X-Ray Trace Map

### Purpose

The X-Ray Trace Map is observability evidence that visually confirms the serverless request processing flow and traces how each Lambda function handles requests.

### Validation Items

| Item | Description |
|---|---|
| Client Node | External request entry point |
| Lambda Context | Lambda execution context |
| Lambda Function | Serverless function running business logic |
| Request Flow | Verifies which Lambda function handles the request |
| Function Separation | Confirms feature-based Lambda separation such as conversation and correction |

<img src="./images/evidence/xray-trace-map.png" width="600">

### Explanation

I verified through the X-Ray Trace Map that API requests are delivered to Lambda.
This validates an observability setup that can trace request-level execution paths and latency segments beyond simple log inspection.

---

## 13. SSM Parameter Store Configuration Evidence

### Purpose

The SSM Parameter Store evidence shows that environment-specific configuration values such as the Bedrock Model ID are separated from source code.

Storing the Model ID in SSM Parameter Store instead of hardcoding it in code makes it easier to change configuration per environment and manage operational settings more safely.

### Validation Items

| Item | Description |
|---|---|
| Parameter Name | Path where the Bedrock Model ID is stored |
| Type | Whether the parameter uses the String type |
| Value | Whether the actual Bedrock Model ID is stored |
| Tier | Whether the Standard Parameter tier is used |
| Description | Purpose of the parameter |
| Version | Parameter version management information |

<img src="./images/evidence/ssm-parameter-store-detail.png" width="600">

### Explanation

I separated the Bedrock Model ID from application code by storing it in SSM Parameter Store.
This allows the model configuration to be changed without modifying source code and supports environment-based configuration management.

---

## 14. IAM Role and Permission Separation Evidence

### Purpose

The IAM Role and permission separation evidence shows that Lambda execution roles and policies were separated so that Lambda functions can access only the AWS resources they need.

In a serverless environment, Lambda functions communicate directly with multiple AWS services such as DynamoDB, CloudWatch Logs, X-Ray, SSM Parameter Store, and Bedrock. Therefore, limiting the execution role permissions is important.

### Validation Items

| Item | Description |
|---|---|
| Lambda Execution Role | IAM Role used by Lambda functions at runtime |
| CloudWatch Logs permissions | Create log groups, create log streams, and write logs |
| DynamoDB permissions | Read and write access to learning records, usage limits, and user profile tables |
| Bedrock permissions | `bedrock:InvokeModel` permission for AI model invocation |
| Resource restriction | DynamoDB permissions restricted to KoreanMate-related table ARNs |
| KMS permissions | KMS permissions for Lambda environment variable encryption and decryption |

<img src="./images/evidence/lambda-iam-role-summary.png" width="600">

<img src="./images/evidence/lambda-iam-policy-permissions.png" width="600">

<img src="./images/evidence/lambda-iam-kms-policy.png" width="600">

### Explanation

I configured a dedicated Lambda execution role and granted only the required permissions for DynamoDB, CloudWatch Logs, X-Ray, SSM, and Bedrock.
This demonstrates that the serverless application applies IAM design based on the principle of least privilege.
