# KoreanMate Project Plan

> Related documents: `docs/serverless-design.md`, `docs/troubleshooting.md`, `docs/runbook.md`

---

## 1. Project Overview

KoreanMate is an AI-powered Korean learning web application for non-native learners of Korean.

Users can use the following features:

- Korean writing correction
- Situation-based Korean conversation generation
- Korean level testing
- User-specific learning history lookup
- Daily usage tracking

The purpose of this project is not simply to build an AI web application. The main goal is to design and implement a realistic AWS Serverless operating environment at a portfolio level.

---

## 2. Problem Definition

Korean learners commonly face the following problems.

| Problem | Description |
|---|---|
| Difficulty checking natural expressions | Learners often cannot easily verify whether their Korean sentences sound natural in real usage. |
| Lack of situation-based conversation examples | It is difficult to generate conversation examples tailored to real-life contexts such as ordering food, travelling, or business situations. |
| Lack of level-based feedback | Learners often do not receive explanations and corrections that match their current Korean level. |
| Lack of structured learning records | General AI tools do not systematically manage previous learning results, usage history, and personal settings. |
| Need to control AI API costs | AI API usage increases costs based on request volume, so usage limits are required. |

KoreanMate addresses these problems through AI correction, conversation generation, level testing, learning history storage, and usage limit control.

---

## 3. Project Goals

### 3.1 Service Goals

| Goal | Description |
|---|---|
| Writing correction | The AI corrects Korean sentences entered by the user. |
| Conversation generation | The AI generates Korean conversation examples based on the situation entered by the user. |
| Level testing | The service estimates the user’s Korean learning level based on their Korean input. |
| Learning history storage | AI learning results are stored and retrieved per user. |
| Usage limiting | Daily usage is limited per user to control costs. |
| Login-based user isolation | User data is separated based on Cognito authentication information. |

### 3.2 Infrastructure Goals

| Goal | Description |
|---|---|
| Serverless architecture | Build the system around API Gateway, Lambda, DynamoDB, S3, and CloudFront. |
| IaC | Manage major AWS resources with Terraform. |
| Authentication and authorization | Use Cognito and API Gateway JWT Authorizer. |
| Cost management | Apply usage limits, DynamoDB On-demand, and AWS Budgets. |
| Security | Use IAM, KMS, WAF, and S3 OAC. |
| Observability | Use CloudWatch, X-Ray, and Grafana Cloud. |
| Alerting | Receive failure alerts through CloudWatch Alarm and SNS Email Notification. |
| Audit | Record AWS API activity with CloudTrail. |
| CI/CD | Separate CI and Deploy workflows in GitHub Actions. |
| CI/CD security | Remove long-term AWS Access Keys by using GitHub OIDC and an IAM Deploy Role. |

### 3.3 Portfolio Goals

This project is intended to demonstrate the following skills:

- AWS Serverless architecture design
- Terraform-based Infrastructure as Code
- Cognito-based authentication and authorization design
- Lambda-based backend API implementation
- DynamoDB data modeling
- AI API usage limit design
- Operational design using CloudWatch, CloudTrail, and Grafana
- Failure alerting with SNS Email Notification
- CI/CD automation using GitHub Actions
- Secure AWS deployment authentication using GitHub OIDC
- Troubleshooting documentation

---

## 4. Target Users and Use Case

### 4.1 Target Users

Non-native learners studying Korean.

### 4.2 Basic Use Case

1. The user signs up or logs in.
2. The user enters a Korean sentence or a conversation topic.
3. The frontend calls the API with a Cognito JWT.
4. API Gateway validates the JWT.
5. Lambda checks the user’s usage limit.
6. If the request is within the allowed limit, Lambda calls Bedrock.
7. The AI result and usage data are stored in DynamoDB.
8. The user checks the result and recent learning history.

---

## 5. Project Scope

### 5.1 Implemented Scope

| Category | Feature |
|---|---|
| Frontend | Home / Login / Signup |
| Frontend | Dashboard |
| Frontend | Correction Page |
| Frontend | Conversation Page |
| Frontend | Level Test Page |
| Frontend | History Page |
| Frontend | Settings Page |
| Backend | Correction API |
| Backend | Conversation API |
| Backend | Level Test API |
| Backend | Profile API |
| Backend | History API |
| Backend | Usage API |
| Infra | API Gateway HTTP API |
| Infra | Lambda |
| Infra | DynamoDB |
| Infra | Cognito |
| Infra | S3 + CloudFront |
| Infra | SSM Parameter Store |
| Infra | KMS |
| Infra | CloudFront WAF |
| Infra | CloudTrail |
| Infra | AWS Budgets |
| CI/CD | GitHub Actions CI |
| CI/CD | GitHub Actions Deploy |
| Security | Trivy Scan |
| Security | GitHub OIDC |
| Alerting | SNS Email Notification |
| Observability | CloudWatch Log / Alarm |
| Observability | Grafana Cloud IAM Role |

### 5.2 Future Expansion Scope

| Category | Feature | Description |
|---|---|---|
| Observability | Enhanced Grafana dashboards | Visualize API, Lambda, and Bedrock-related metrics. |
| Observability | CloudWatch Synthetics | Periodically check the health of key APIs. |
| Alerting | Slack alerts | Extend alerting through AWS Chatbot or Slack Webhook. |
| Security | Bedrock IAM resource restriction | Limit permissions to the Foundation Model ARN actually used. |
| Security | AI response schema validation | Validate Bedrock responses at runtime with Zod. |
| Data | History pagination | Add pagination for learning history queries. |

### 5.3 Out of Scope

| Excluded Item | Reason |
|---|---|
| Payment feature | Not part of the core portfolio scope. |
| Admin page | The current priority is user learning features and infrastructure operation design. |
| Mobile app | The goal is a web-based Serverless portfolio project. |
| Large-scale commercial traffic handling | The project is based on an initial personal portfolio service. |

---

## 6. Requirements

### 6.1 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Users must be able to sign up and log in. | High |
| FR-02 | Users must be able to enter Korean sentences and receive AI correction results. | High |
| FR-03 | Users must be able to enter a conversation topic and generate situation-based Korean conversations. | High |
| FR-04 | Users must be able to check their Korean level through a level test. | Medium |
| FR-05 | User learning records must be stored per user. | High |
| FR-06 | Users must be able to view their recent learning history. | Medium |
| FR-07 | Users must be able to check how many AI feature requests they used today. | Medium |
| FR-08 | Additional AI requests must be blocked when the daily usage limit is exceeded. | High |
| FR-09 | Users must be able to view and update their profile settings. | Medium |

### 6.2 Non-Functional Requirements

| Category | Requirement |
|---|---|
| Availability | Core features must be reliably accessible at a personal portfolio service level. |
| Scalability | Lambda and DynamoDB must be able to scale automatically as requests increase. |
| Security | Only authenticated users must be able to access protected APIs. |
| Cost | Fixed costs must be minimized when traffic is low. |
| Operability | Issues must be diagnosable through logs, metrics, alarms, and troubleshooting records. |
| Deployment | CI and Deploy must be separated in GitHub Actions. |
| Deployment security | GitHub Actions must assume the IAM Deploy Role through OIDC. |
| Maintainability | Infrastructure resources must be managed through Terraform modules. |
| Alerting | Key failure metrics must trigger alerts through CloudWatch Alarm and SNS Email. |
| Audit | AWS API activity must be traceable through CloudTrail. |

---

## 7. Traffic and Operating Assumptions

This project is an initial portfolio service and does not assume large-scale commercial traffic.

| Item | Expected Baseline |
|---|---|
| Initial users | 1–20 users |
| Daily requests | 50–300 requests |
| Main API requests | correction, conversation, level-test |
| AI call limit | Daily per-user limit applied |
| Data volume | Small-scale data focused on user learning records |
| Traffic pattern | Short request bursts followed by long idle periods |

---

## 8. Technology Stack

| Area | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, TypeScript, AWS Lambda |
| API | Amazon API Gateway HTTP API |
| Auth | Amazon Cognito, JWT Authorizer |
| AI | Amazon Bedrock |
| Database | Amazon DynamoDB |
| Storage | Amazon S3 |
| CDN | Amazon CloudFront |
| Config | AWS SSM Parameter Store |
| Security | IAM, KMS, WAF, Trivy, GitHub OIDC |
| Monitoring | CloudWatch, X-Ray, Grafana Cloud |
| Audit | CloudTrail |
| Cost | AWS Budgets, Usage Limit |
| IaC | Terraform |
| CI/CD | GitHub Actions |

---

## 9. Technology Selection Rationale

### 9.1 Serverless

Because the initial traffic is small and requests are not continuous, a Serverless architecture is more suitable than always-on EC2 or EKS. By using Lambda, API Gateway, DynamoDB, S3, and CloudFront, the project reduces idle costs and lowers server operation overhead.

### 9.2 S3 + CloudFront

React/Vite builds into static files, so the combination of S3 and CloudFront is appropriate. S3 stores the build artifacts, while CloudFront provides CDN delivery, HTTPS, and caching. S3 is not exposed directly and is accessed only through CloudFront OAC.

### 9.3 API Gateway + Lambda

API Gateway handles authentication, CORS, and routing, while Lambda runs feature-specific business logic. Splitting the backend into feature-specific Lambda functions reduces the blast radius of failures and keeps deployment units small.

### 9.4 DynamoDB

The main access pattern is user-based. Therefore, Cognito `sub` is used as the userId, and learning records, usage data, and profile data are stored with userId-based partition keys. TTL is applied to UsageLimits so that old usage records are automatically removed.

### 9.5 Cognito JWT Authorizer

Instead of implementing sign-up and login directly, the project uses Cognito. API Gateway JWT Authorizer validates tokens, and Lambda uses the Cognito `sub` value as the userId.

### 9.6 SSM Parameter Store

The Bedrock Model ID is managed in SSM Parameter Store instead of being hardcoded in the application code. In the current architecture, Terraform passes the SSM Parameter value to Lambda as an environment variable.

### 9.7 GitHub Actions CI/CD

CI and Deploy are separated. CI handles build, type checking, Terraform validation, and Trivy scanning. Deploy is manually triggered and performs Terraform Plan/Apply, S3 upload, and CloudFront invalidation.

The Deploy Pipeline assumes an AWS IAM Deploy Role through GitHub OIDC. This removes the need to store long-term `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` values in GitHub Repository Secrets. Instead, temporary AWS credentials are issued only during workflow execution.

### 9.8 SNS Email Notification

When CloudWatch Alarm detects failure metrics such as Lambda errors or API Gateway 5XX responses, it sends a notification to an SNS Topic. The operator receives the alert through an SNS Email Subscription. Slack alerts are out of the current scope because they require an additional AWS Chatbot or Webhook setup, but they remain a future improvement.

---

## 10. Architecture Overview

The detailed architecture is maintained in `docs/serverless-design.md`.

The summarized structure is as follows.

```text
User
  ↓
CloudFront + WAF
  ↓
S3 Static Frontend
  ↓
API Gateway HTTP API + JWT Authorizer
  ↓
Lambda Functions
  ├── correction
  ├── conversation
  ├── level-test
  ├── profile
  ├── history
  └── usage
        ↓
    DynamoDB
    ├── LearningRecords
    ├── UsageLimits
    └── UserProfiles

Lambda
  ↓
Amazon Bedrock

Operations
  ↓
CloudWatch / X-Ray / Grafana / CloudTrail / Budgets / SNS Email Notification

CI/CD Security
  ↓
GitHub Actions → GitHub OIDC → IAM Deploy Role
```

---

## 11. Data Design Overview

### 11.1 LearningRecords

| Column | Type | Key | Description |
|---|---|---|---|
| userId | string | PK | Cognito sub |
| recordId | string | SK | createdAt#type#uuid |
| type | string | - | correction / conversation / level-test |
| inputText | string | - | User input |
| outputText | string | - | AI response |
| createdAt | string | - | ISO datetime |

### 11.2 UsageLimits

| Column | Type | Key | Description |
|---|---|---|---|
| userId | string | PK | Cognito sub |
| usageDate | string | SK | YYYY-MM-DD |
| correctionCount | number | - | Number of writing correction requests |
| conversationCount | number | - | Number of conversation generation requests |
| levelTestCount | number | - | Number of level test requests |
| totalCount | number | - | Total request count |
| ttl | number | - | Automatic deletion timestamp |

### 11.3 UserProfiles

| Column | Type | Key | Description |
|---|---|---|---|
| userId | string | PK | Cognito sub |
| currentLevel | string | - | User learning level |
| explanationLanguage | string | - | Explanation language |
| conversationTone | string | - | Conversation tone |
| learningGoal | string | - | Learning goal |

---

## 12. Security Requirements

| Item | Design |
|---|---|
| User authentication | Cognito User Pool |
| API protection | API Gateway JWT Authorizer |
| User identification | Cognito sub-based userId |
| Frontend access | S3 Public Access Block + CloudFront OAC |
| Edge security | CloudFront WAF |
| Permission management | Lambda IAM Role |
| Environment variable encryption | Dedicated KMS Key for Lambda |
| Audit log encryption | Dedicated KMS Key for CloudTrail |
| Configuration management | SSM Parameter Store |
| Audit logs | CloudTrail |
| Security scanning | Trivy |
| CI/CD authentication | GitHub OIDC + IAM Deploy Role |

---

## 13. Cost Optimization Strategy

| Item | Strategy |
|---|---|
| Compute | Costs occur only per request by using Lambda. |
| Frontend | Static hosting with S3 + CloudFront. |
| Database | DynamoDB PAY_PER_REQUEST. |
| Usage Data | TTL applied to UsageLimits. |
| AI Cost | Daily per-user usage limit applied. |
| Logs | CloudWatch Logs Retention configured. |
| Audit Logs | CloudTrail S3 Lifecycle configured. |
| Budget | Cost alerts configured with AWS Budgets. |
| Failure alerts | Receive key failure alerts through CloudWatch Alarm and SNS Email Notification. |

---

## 14. Operations and Monitoring Strategy

| Tool | Purpose |
|---|---|
| CloudWatch Logs | Check Lambda / API Gateway logs. |
| CloudWatch Alarm | Detect Lambda errors, duration issues, and API Gateway 5XX responses. |
| Amazon SNS | Send email alerts when CloudWatch Alarm enters the alarm state. |
| X-Ray | Trace Lambda invocation flow. |
| Grafana Cloud | Visualize CloudWatch metrics and logs. |
| CloudTrail | Audit AWS API activity. |
| AWS Budgets | Detect cost overruns. |

---

## 15. CI/CD Strategy

### 15.1 CI Pipeline

| Job | Role |
|---|---|
| Backend | Typecheck, Build, Lambda Packaging |
| Frontend | React/Vite Build |
| Terraform | fmt, init -backend=false, validate |
| Trivy | Filesystem Scan, IaC Scan |

### 15.2 Deploy Pipeline

The Deploy Pipeline runs only through manual execution. GitHub Actions receives a GitHub OIDC Token and assumes the AWS IAM Deploy Role through `AssumeRoleWithWebIdentity`, using temporary credentials. Therefore, long-term AWS Access Keys are not stored in GitHub Secrets.

| Option | Behavior |
|---|---|
| plan-only | Runs Terraform Plan only. |
| apply | Runs Terraform Apply, S3 Upload, and CloudFront Invalidation. |

---

## 16. WBS and Schedule Plan

| Step | Period | Category | Main Task | Deliverable |
| -: | --- | -------- | -------------------------------------------- | ---------------------------- |
| 1 | Week 1 | Planning | Select project topic and define service direction | Project Overview |
| 2 | Week 1 | Planning | Define problem, goals, and feature scope | project-plan.md |
| 3 | Week 1 | Design | Design main screen flow and user navigation structure | User Flow / Wireframe |
| 4 | Week 1 | Design | Model data for learning records and usage limits | DynamoDB Table Design |
| 5 | Week 1 | Local Development | Implement local backend API structure | Lambda Handler / Service |
| 6 | Week 1 | Local Development | Separate Bedrock call structure and validate features with mock responses | bedrockClient mock |
| 7 | Week 2 | Local Development | Implement Repository Layer for DynamoDB access | Repository Layer |
| 8 | Week 2 | AWS Integration | Integrate actual Bedrock API and validate response structure | Bedrock API call |
| 9 | Week 2 | AWS Integration | Implement daily usage limit logic per AI feature | UsageLimits |
| 10 | Week 2 | IaC | Build Terraform-based DynamoDB module | DynamoDB Module |
| 11 | Week 2 | IaC | Build Terraform-based Lambda module | Lambda Module |
| 12 | Week 2 | IaC | Configure API Gateway HTTP API and routes | API Module |
| 13 | Week 2 | Auth / Security | Configure Cognito User Pool and App Client | User Pool / App Client |
| 14 | Week 3 | Auth / Security | Connect API Gateway JWT Authorizer and validate authenticated requests | API authentication structure |
| 15 | Week 3 | Deployment | Configure static frontend hosting with S3 + CloudFront | Frontend Hosting |
| 16 | Week 3 | Auth / Security | Configure IAM Roles separating Lambda execution permissions and deployment permissions | IAM Module |
| 17 | Week 3 | Config Management | Manage Bedrock Model ID separately with SSM Parameter Store | Bedrock Model ID management |
| 18 | Week 3 | Security | Configure CloudFront WAF and apply baseline protection rules | CloudFront WAF |
| 19 | Week 3 | Audit | Configure CloudTrail-based AWS API audit logging | Audit Trail |
| 20 | Week 3 | Cost Management | Configure monthly cost alerts with AWS Budgets | Cost alerts |
| 21 | Week 3 | Operations | Configure API / Lambda failure detection with CloudWatch Alarm | Operational alarms |
| 22 | Week 3 | Operations | Integrate Grafana Cloud and verify CloudWatch metric visualization | CloudWatch Metrics Dashboard |
| 23 | Week 3 | Automation | Configure GitHub Actions CI workflow | serverless-ci.yml |
| 24 | Week 3 | Automation | Configure GitHub Actions Terraform deployment workflow | serverless-deploy.yml |
| 25 | Week 3 | Security Automation | Add Trivy-based dependency and IaC security scanning | Security Scan |
| 26 | Week 3 | CI/CD Security | Apply AWS deployment authentication through GitHub OIDC | OIDC Deploy Role |
| 27 | Week 4 | Operational Alerting | Configure CloudWatch Alarm notifications through SNS Email | SNS Email Notification |
| 28 | Week 4 | Documentation | Capture and organize Serverless build and validation results | `evidence.md` |
| 29 | Week 4 | Documentation | Document errors, causes, fixes, and lessons learned | `troubleshooting.md` |
| 30 | Week 4 | Documentation | Document operational checks and incident response procedures | `runbook.md` |
| 31 | Week 4 | Documentation | Document Serverless architecture design intent and components | `serverless-design.md` |

---

## 17. Key Risks and Mitigation Plans

| Risk | Impact | Mitigation Plan |
| ------------------------ | -------------------- | ------------------------------------------------------ |
| Increased Bedrock cost | Costs may exceed expectations. | Apply daily per-user usage limits and AWS Budgets. |
| Cognito authentication errors | Protected APIs may become inaccessible. | Check JWT expiration, token refresh, and Authorizer settings separately. |
| Missing Lambda environment variables | Runtime errors may occur. | Verify Terraform outputs, Lambda environment variables, and environment schema. |
| Confusion between API 401 and 429 | Root cause analysis may be delayed. | Separate authentication error messages from usage limit error messages. |
| CloudFront cache issues | Latest frontend changes may not appear immediately. | Run CloudFront invalidation after deployment. |
| DynamoDB consistency issue | Usage count and learning record storage may become inconsistent. | Consider DynamoDB TransactWriteItems in future improvements. |
| GitHub Actions authentication management | OIDC Role permissions may be too broad. | Restrict by Repository / Branch conditions and later reduce permissions to resource level. |
| Excessive Bedrock IAM permissions | Permission scope is too wide. | Restrict permissions to the Foundation Model ARN in future improvements. |
| Duplicate CORS configuration | API call policies may become confusing. | Manage CORS primarily at the API Gateway level. |
| Increased log cost | Operational costs may increase. | Apply CloudWatch Logs Retention and CloudTrail S3 Lifecycle. |

---

## 18. Current Limitations and Improvement Directions

The current project is designed for a portfolio-oriented `dev` environment. The following improvements would be required for a more production-like environment.

| Item | Current State | Improvement Direction |
| ----------- | ----------------------------------- | ------------------------------------------------------------------ |
| Deployment rollback | Automatic rollback is not implemented. | Add Lambda Version/Alias, previous frontend artifact backup, and smoke-test-based rollback. |
| GitHub Actions authentication management | OIDC Role permissions may be too broad. | Restrict by Repository / Branch conditions and later migrate to resource-level least privilege. |
| Bedrock IAM | Bedrock invocation permission scope is broad. | Restrict permissions to the Foundation Model ARN actually used. |
| AI response validation | Mainly based on TypeScript types. | Add runtime schema validation with Zod. |
| Data consistency | Usage increment and learning record storage are separated. | Consider DynamoDB TransactWriteItems. |
| History lookup | Basic query only. | Add pagination. |
| Alerting | SNS Email alerting is applied. | Consider Slack or AWS Chatbot integration. |
| Environment separation | Focused on the dev environment. | Consider separating a prod environment. |
| Grafana | Basic metric visualization has been verified. | Improve dashboards around Bedrock failures, 429 responses, and Lambda Duration. |

---

## 19. Final Deliverables

| Document | Purpose |
| --------------------------- | -------------------------------------- |
| `README.md` | Project introduction, technology stack, architecture summary, and run/deploy flow |
| `docs/serverless/project-plan.md` | Project purpose, problem definition, requirements, schedule, and risks |
| `docs/serverless/serverless-design.md` | Serverless architecture, request flow, security, cost, and observability design |
| `docs/serverless/runbook.md` | Operational incident check procedures and recovery steps |
| `docs/serverless/troubleshooting.md` | Actual issues, causes, resolution process, and lessons learned |
| `docs/serverless/evidence.md` | EKS build and validation evidence captures |

---

## 20. Key Differentiators

The key differentiators of the KoreanMate Serverless version are as follows.

- It implements daily per-user usage limits for AI features.
- It separates user data based on Cognito JWT `sub`.
- It separates DynamoDB tables for learning records, usage limits, and profiles.
- It codifies major AWS resources with Terraform.
- It deploys the frontend with S3 + CloudFront + OAC.
- It protects APIs with API Gateway JWT Authorizer.
- It includes CloudWatch, X-Ray, CloudTrail, Grafana, Budgets, and SNS Email Notification in the operational design.
- It separates CI and Deploy workflows in GitHub Actions.
- It uses GitHub OIDC and an IAM Deploy Role to deploy without long-term AWS Access Keys.
- It configures CloudWatch Alarm and SNS Email Notification for failure alerts.
- It includes Trivy security scanning in CI.
- It documents operational response through Evidence, Runbook, and Troubleshooting documents.
