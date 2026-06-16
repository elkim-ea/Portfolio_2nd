# KoreanMate Serverless Design

> Purpose: This document explains the design intent, AWS resource structure, request processing flow, security, observability, and cost optimisation strategy of the KoreanMate Serverless version for portfolio and interview use.  
> Target environment: AWS Seoul Region `ap-northeast-2`, `dev` environment, Terraform-based IaC

---

## 1. Project Overview

KoreanMate is an AI-powered Korean learning assistant. Users can use writing correction, scenario-based conversation generation, and level test features. The results are stored as learning records.

The goal of this project is not only to implement application features, but also to demonstrate **serverless operations design**, **cost control**, **authentication and security**, **observability**, and **CI/CD automation**.

The main technology stack is as follows.

| Area | Technology |
|---|---|
| Frontend | React, Vite |
| Hosting | S3, CloudFront |
| Auth | Amazon Cognito |
| API | API Gateway HTTP API |
| Compute | AWS Lambda |
| AI | Amazon Bedrock |
| Data | DynamoDB |
| Config | SSM Parameter Store |
| Security | IAM, KMS, WAF, GitHub OIDC |
| Observability | CloudWatch, X-Ray, Grafana Cloud |
| Audit | CloudTrail |
| Cost | AWS Budgets, Usage Limit |
| IaC / CI/CD | Terraform, GitHub Actions |
| Alerting | SNS Email Notification |

---

## 2. Design Goals

The design goals of this project are as follows.

| Goal | Design Decision |
|---|---|
| Low operational overhead | Chose a serverless architecture that does not require server management |
| Cost optimisation | Applied S3/CloudFront, Lambda, DynamoDB on-demand, usage limits, and AWS Budgets |
| User isolation based on authentication | Used the Cognito JWT `sub` claim as the application userId |
| AI cost control | Checked usage limits before calling Bedrock |
| Improved security | Applied WAF, JWT Authorizer, IAM, KMS, and S3 OAC |
| Operational visibility | Configured CloudWatch Alarms, X-Ray, and Grafana Cloud |
| Incident notification | Connected CloudWatch Alarms with SNS Email Notification |
| Auditability | Stored AWS API call history with CloudTrail |
| Safer deployment | Separated CI and deployment pipelines in GitHub Actions |
| Secure deployment authentication | Removed long-lived AWS access keys by using GitHub OIDC and an IAM Deploy Role |

**Why I chose a serverless architecture**

For a personal portfolio project, traffic is not expected to be consistently high. The main objective is to show architecture design and automation capability rather than server administration. For that reason, I chose a serverless architecture based on Lambda, API Gateway, DynamoDB, S3, and CloudFront instead of EC2 or EKS.

This architecture has low idle cost, reduces infrastructure management overhead, and follows a pay-per-use model. It is therefore suitable for the current purpose of the project.

---

## 3. Architecture Overview

<img src="./images/serverless-design/architecture-overview.png" width="1000">

The overall architecture is divided into the following layers.

| Layer | Components | Role |
|---|---|---|
| Frontend Layer | S3, CloudFront | Deploy React/Vite static files |
| Authentication Layer | Cognito | Sign-up, login, and JWT issuance |
| API Layer | API Gateway HTTP API | API entry point and JWT validation |
| Compute Layer | Lambda | Execute backend logic by feature |
| AI Layer | Bedrock | Generate correction, conversation, and level test responses |
| Data Layer | DynamoDB | Store learning records, usage data, and profiles |
| Observability / Alerting / Audit Layer | CloudWatch, X-Ray, Grafana, CloudTrail, SNS Email | Logs, metrics, traces, notifications, and audit records |
| Security / Config / Cost Layer | IAM, KMS, SSM, Budgets, WAF | Permissions, encryption, configuration, and cost control |

The frontend is stored in S3 and delivered through CloudFront. The S3 bucket is not publicly exposed directly. Access is allowed only through CloudFront OAC. WAF is attached at the CloudFront edge layer to apply basic request filtering and rate limiting.

The backend is built with API Gateway and Lambda. API Gateway validates authentication using a Cognito JWT Authorizer. Lambda uses the `sub` value from JWT claims as the userId.

Amazon Bedrock is used to generate AI responses. The Bedrock Model ID is managed by Terraform through SSM Parameter Store and provided to Lambda as an environment variable during deployment.

KMS is not designed as a single key for all resources. Instead, separate KMS keys are used for Lambda environment variable encryption and CloudTrail audit log encryption. This separates application runtime permissions from audit log protection permissions.

CloudWatch Alarms detect operational signals such as Lambda errors and API Gateway 5XX responses. When an alarm enters the ALARM state, it sends a notification to an SNS Topic, and the confirmed email subscription receives the alert.

The `CloudWatch → SNS → Email` path in the diagram is not part of the normal user request path. It is an operational alerting path. User API requests do not always pass through SNS; SNS Email Notification is triggered only when a CloudWatch Alarm occurs.

---

## 4. User Flow

<img src="./images/serverless-design/user flow.png" width="800">

The User Flow shows how a user moves through the application screens after accessing KoreanMate. This diagram explains the user-facing navigation and feature access flow, not the internal AWS processing structure.

The basic user flow is as follows.

1. The user accesses the Home Page.
2. The user moves from the Home Page to the Login Page.
3. Existing users log in and move to the Dashboard.
4. New users sign up on the Signup Page.
5. After signing up, users complete verification on the Confirm Signup Page.
6. After verification, users return to the Login Page and log in.
7. Users who forgot their password reset it through the Forgot Password Page and Reset Password Page, then return to the Login Page.
8. After a successful login, the user moves to the Dashboard.
9. The Dashboard acts as the main hub for checking learning status, daily AI usage, and recent learning records.
10. Users can access Level Test, Correction, Conversation, History, and Settings from the Dashboard or Sidebar.
11. Users can end their session by selecting Logout in the authenticated area.

This User Flow was defined separately to clearly separate pre-authentication screens from authenticated learning features. Home, Login, Signup, and Forgot Password belong to the unauthenticated flow. Dashboard, Level Test, Correction, Conversation, History, and Settings are learning features available only to authenticated users.

The Dashboard is used as the central entry point because users should be able to check their learning status and usage immediately after logging in, then move directly to the feature they need.

---

## 5. Request Flow

<img src="./images/serverless-design/api flow.png" width="800">

The basic request flow is as follows.

1. The user logs in from the React frontend.
2. Cognito issues a JWT.
3. The frontend includes the JWT in the Authorization header when calling the API.
4. API Gateway JWT Authorizer validates the token.
5. Only validated requests are forwarded to Lambda.
6. The Lambda handler parses the request body and validates input values.
7. Lambda uses the Cognito `sub` value as the userId.
8. For AI feature requests, Lambda checks the usage limit before calling Bedrock.
9. Only requests within the limit call Bedrock.
10. The result and usage data are stored in DynamoDB.
11. The API response is returned to the frontend.
12. The user checks the AI response on the result screen.

One important detail is that the current implementation does **not** read SSM Parameter Store on every Lambda request. The Bedrock Model ID is managed in SSM Parameter Store by Terraform and passed to Lambda as the `BEDROCK_MODEL_ID` environment variable during deployment. Therefore, the “Read Model Config” step in the diagram is more accurately described as “Model Config managed by SSM and provided to Lambda env”.

---

## 6. Authentication Design

User authentication is handled by Amazon Cognito User Pool.

| Item | Design |
|---|---|
| Login identifier | Email |
| Token | Access Token, ID Token, Refresh Token |
| API authentication | API Gateway JWT Authorizer |
| User identification | `sub` claim in Cognito JWT claims |
| User Pool Client | No client secret, because the frontend is an SPA |

When the frontend includes the JWT received from Cognito in an API request, API Gateway validates the token. Lambda does not trust any userId sent by the client. Instead, it uses the `sub` value from the validated JWT claims as the userId.

**Why I used Cognito JWT Authorizer**

Token validation could be implemented directly inside Lambda, but that would duplicate authentication logic across multiple Lambda functions. By using API Gateway JWT Authorizer, authentication is handled at the API Gateway layer before requests reach Lambda.

This allows Lambda to focus on business logic after receiving only validated requests. It also improves user data isolation because data is separated by Cognito `sub`, not by a userId arbitrarily sent from the client.

---

## 7. API Processing Flow

The backend is separated into feature-level Lambda functions.

| API | Method | Lambda | Role |
|---|---|---|---|
| `/correction` | POST | correction | Korean writing correction |
| `/conversation` | POST | conversation | Scenario-based conversation generation |
| `/level-test` | POST | level-test | Korean level test |
| `/profile` | GET / PUT | profile | Retrieve and update user profile |
| `/history` | GET | history | Retrieve learning history |
| `/usage` | GET | usage | Retrieve today’s usage |

The internal Lambda flow is as follows.

```text
Handler
  ↓
Request Parsing
  ↓
Validation
  ↓
Service Layer
  ↓
Usage Limit Check
  ↓
Bedrock Client
  ↓
Repository
  ↓
HTTP Response
```

Correction, Conversation, and Level Test check the usage limit before calling Bedrock. Requests that exceed the limit return a 429 response without calling Bedrock.

**Why I used API Gateway and Lambda**

KoreanMate does not require a continuously running backend server. A request-driven execution model is more suitable from both cost and operational perspectives.

API Gateway handles authentication, CORS, and routing. Lambda executes feature-specific logic. This approach avoids server management, allows Lambda functions to be separated by feature, and keeps the failure scope and deployment unit relatively small.

---

## 8. Data Design

DynamoDB is separated into three tables.

| Table | PK | SK | Role |
|---|---|---|---|
| LearningRecords | userId | recordId | Store learning records |
| UsageLimits | userId | usageDate | Store daily usage limits |
| UserProfiles | userId | None | Store user profiles |

The `recordId` in LearningRecords is generated by combining the creation time, feature type, and UUID.

```text
{createdAt}#{type}#{uuid}
```

UsageLimits uses `usageDate` based on KST and applies TTL to automatically delete old usage data. All DynamoDB tables use `PAY_PER_REQUEST` billing so that the project can start without predicting initial traffic volume.

**Why I stored data by userId in DynamoDB**

The main access patterns are “my learning records”, “my usage today”, and “my profile”. By using Cognito `sub` as the userId, data can be naturally separated by authenticated user.

Using userId as the partition key makes it simple to query a specific user’s data and helps explain user data isolation clearly in both IAM and application logic.

**Why I implemented usage limits directly**

Bedrock generates cost based on usage. API Gateway throttling and WAF rate limiting can control request volume, but they cannot directly enforce business-level limits such as “10 corrections per user per day” or “5 level tests per day”.

For that reason, the UsageLimits table stores usage by user and date. Lambda checks the limit before calling Bedrock.

---

## 9. CI/CD Design

<img src="./images/serverless-design/cicd flow.png" width="800">

GitHub Actions is separated into a CI Pipeline and a Deploy Pipeline.

| Pipeline | Trigger | Main Tasks |
|---|---|---|
| CI Pipeline | Pull Request, workflow_dispatch | Backend typecheck and build, frontend build, Terraform fmt/validate, Trivy FS and IaC scan |
| Deploy Pipeline | workflow_dispatch | Backend package, frontend build, configure AWS credentials with OIDC, Terraform plan/apply, S3 sync, CloudFront invalidation |

The CI Pipeline does not change AWS resources. It validates code quality, buildability, Terraform syntax, and security issues.

The Deploy Pipeline runs only through `workflow_dispatch`. It supports both `plan-only` and `apply` modes. `plan-only` runs Terraform Plan only. `apply` runs Terraform Apply, uploads the frontend build to S3, and invalidates the CloudFront cache.

The Deploy Pipeline uses GitHub OIDC to assume the AWS IAM Deploy Role with `AssumeRoleWithWebIdentity`. GitHub Actions receives an OIDC token, and the IAM Role trust policy allows role assumption only from a specific repository and branch. Terraform, S3 Sync, and CloudFront Invalidation then run using temporary AWS credentials issued at runtime, not long-lived access keys.

The deployment authentication flow is as follows.

```text
GitHub Actions Deploy Pipeline
  ↓ Request OIDC Token
GitHub OIDC
  ↓ AssumeRoleWithWebIdentity
AWS IAM Deploy Role
  ↓ Temporary AWS Credentials
Terraform Plan / Apply
  ↓
AWS Resources
```

This structure removes the need to store long-lived credentials such as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in GitHub Secrets.

**Why I separated CI and Deploy in GitHub Actions**

CI verifies whether the code is safe to merge or continue developing. Deploy changes real AWS resources. If both stages are combined, there is a risk that deployment could happen accidentally during PR validation.

Terraform Apply can create or modify resources that incur cost, so it should be controlled manually and separated from normal CI checks. The `plan-only/apply` split also makes the deployment process safer, even in a personal portfolio project.

---

## 10. Security Design

The security design is divided into multiple layers.

| Layer | Component | Purpose |
|---|---|---|
| Edge Security | WAF | Filter common web attack patterns and excessive requests |
| Auth | Cognito | User authentication |
| API Authorization | JWT Authorizer | Allow only authenticated requests to invoke Lambda |
| IAM | Lambda Execution Role | Control access to DynamoDB, Bedrock, and X-Ray |
| Encryption | KMS | Encrypt Lambda environment variables |
| Storage Security | S3 Public Access Block, OAC | Block direct public access to S3 |
| CI/CD Security | GitHub OIDC, IAM Deploy Role | Use temporary credentials for GitHub Actions deployment |
| Audit | CloudTrail | Record AWS API call history |

S3 uses Public Access Block and CloudFront OAC so that it is not directly exposed to the public. Lambda environment variables are encrypted with a KMS key. IAM permissions are scoped using DynamoDB table ARNs.

GitHub Actions deployment authentication is configured with OIDC-based IAM Role federation. The previous access key approach was removed because it required storing long-lived credentials in GitHub Secrets. The Deploy Role trust policy uses repository and branch conditions so that only the configured repository’s `main` branch can assume the role.

However, the current Bedrock permission still uses `Resource = "*"`. In a production environment, this should be restricted to the specific Foundation Model ARN used by the application.

Separate KMS keys are used for Lambda environment variable encryption and CloudTrail audit log encryption.

| KMS Key | Target | Purpose |
|---|---|---|
| Lambda Environment KMS Key | Lambda environment variables | Encrypt environment variables required at application runtime |
| CloudTrail KMS Key | CloudTrail log files | Encrypt AWS API audit logs and protect log integrity |

The reason for separating the two KMS keys is that the encryption targets and access principals are different.

The Lambda Environment KMS Key is used by the Lambda service and Lambda Execution Role to decrypt environment variables. Therefore, it should grant only the minimum permissions required for Lambda execution.

The CloudTrail KMS Key is used by the CloudTrail service to encrypt audit logs before storing them in S3. Audit logs are used for security investigation and change tracking, so they should be managed separately from application runtime permissions.

This separation prevents Lambda runtime permission issues from affecting CloudTrail audit log encryption, and prevents audit log retention policies from affecting the application runtime. It also makes KMS key policies and IAM permissions easier to narrow by purpose.

---

## 11. Observability and Audit Design

CloudWatch, X-Ray, Grafana Cloud, and CloudTrail are used for different purposes.

| Tool | Role |
|---|---|
| CloudWatch Logs | Store Lambda and API Gateway logs |
| CloudWatch Alarms | Detect Lambda errors, duration issues, and API Gateway 5XX responses |
| Amazon SNS | Send email notifications when CloudWatch Alarms are triggered |
| X-Ray | Trace Lambda invocation flow |
| Grafana Cloud | Visualise CloudWatch metrics and logs |
| CloudTrail | Audit AWS API call history |

**Why I separated CloudWatch, CloudTrail, and Grafana**

These tools serve different purposes. CloudWatch handles application logs, metrics, and alarms. CloudTrail records who called which AWS API and when. Grafana visualises CloudWatch data in dashboards.

In other words, CloudWatch is used for operational detection, CloudTrail for audit, and Grafana for visualisation.

CloudTrail is configured with Multi-region Trail, Global Service Events, Log File Validation, KMS encryption, and S3 Versioning to improve the reliability of audit logs.

SNS Email Notification is connected to CloudWatch Alarms so that the operator can notice incidents without directly checking the AWS Console. The current alert targets are mainly Lambda errors and API Gateway 5XX responses. Duration alarms should be tuned based on operational thresholds to avoid excessive notifications.

---

## 12. Cost Optimization Design

Cost optimisation is reflected in both infrastructure selection and application logic.

| Area | Cost Optimisation Method |
|---|---|
| Frontend | Static hosting with S3 + CloudFront |
| Compute | Run only per request with Lambda |
| Data | DynamoDB `PAY_PER_REQUEST` |
| Usage Data | TTL applied to UsageLimits |
| AI Cost | Usage limit check before Bedrock invocation |
| Logs | CloudWatch Log Retention set to 14 days |
| Trail Logs | CloudTrail S3 Lifecycle set to 180 days |
| Budget | AWS Budgets alert based on a monthly $10 threshold |

**How cost optimisation is reflected in the architecture**

First, the architecture avoids always-on servers and reduces idle cost by using serverless services. Second, DynamoDB starts with on-demand billing so initial traffic does not need to be predicted. Third, AI usage is controlled with per-user daily usage limits. Fourth, log retention and CloudTrail lifecycle rules reduce long-term storage costs. Finally, AWS Budgets is configured to detect cost overrun at 80% actual cost, 100% actual cost, and 100% forecasted cost.

---

## 13. Limitations and Future Improvements

The current design is appropriate for a portfolio-level `dev` environment, but the following improvements would be needed for a production-grade environment.

| Item | Current State | Improvement Direction |
|---|---|---|
| Bedrock IAM | `Resource = "*"` | Restrict to the Foundation Model ARN |
| CI/CD authentication | GitHub OIDC-based AssumeRole applied | Minimise Deploy Role permissions by resource ARN |
| Deploy variables | Some values are hardcoded | Automate through GitHub Variables or Terraform Outputs |
| Alarm notification | SNS Email Notification applied | Consider Slack, AWS Chatbot, or EventBridge integration |
| AI response validation | TypeScript type assertion | Add runtime validation with Zod |
| Data consistency | Usage increment and record storage are separated | Consider DynamoDB TransactWriteItems |
| History retrieval | Fixed to latest 20 records | Add pagination |
| User timezone | Usage counted by KST | Extend to user timezone support |
| Environment separation | Dev-focused | Separate production environment |
