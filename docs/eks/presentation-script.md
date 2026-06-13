# KoreanMate EKS 면접 설명 대본

## 1. 1분 요약 대본

KoreanMate EKS 버전은 AI 기반 한국어 학습 서비스의 Backend API를 컨테이너화하고, Amazon EKS 위에서 Kubernetes 운영 구조를 검증한 프로젝트입니다.

사용자는 React Frontend에서 로그인한 뒤 Cognito JWT를 포함해 API를 호출합니다. 요청은 Application Load Balancer로 들어오고, Kubernetes Ingress와 Service를 거쳐 Backend Pod로 전달됩니다. Backend Pod는 Express 기반 Node.js 서버로 동작하며, IRSA를 통해 DynamoDB, SSM Parameter Store, Amazon Bedrock에 접근합니다.

이 설계에서 중점적으로 보여주고 싶었던 부분은 단순히 Pod를 띄운 것이 아니라, EKS에서 실제 운영에 필요한 요소들을 연결한 것입니다. AWS Load Balancer Controller를 사용해 Ingress 기반 ALB를 구성했고, Backend Pod와 ALB Controller의 IAM Role을 IRSA로 분리했습니다. 또한 GitHub Actions에서 Docker image build, Trivy image scan, ECR push를 자동화했고, Argo CD로 GitOps 배포 흐름을 구성했습니다. 운영 관측성은 Prometheus와 Grafana로 Cluster, Namespace, Backend Pod metrics를 확인하도록 설계했습니다.

이 프로젝트는 대규모 상용 운영 목적보다는 Kubernetes 운영 역량을 증명하기 위한 dev 환경입니다. 그래서 검증 후에는 NodeGroup 축소 또는 terraform destroy를 통해 비용을 통제하는 전략까지 포함했습니다.

---

## 2. 아키텍처 설명 대본

KoreanMate EKS 아키텍처는 크게 Client Layer, Load Balancing Layer, Kubernetes Layer, AWS Managed Services Layer, CI/CD Layer, GitOps Layer, Observability Layer로 나눴습니다.

사용자 요청은 React Frontend에서 시작됩니다. 사용자는 Cognito로 로그인하고 JWT를 발급받습니다. 이후 Frontend는 Authorization Header에 JWT를 포함해서 API 요청을 보냅니다.

외부 요청은 Application Load Balancer로 들어옵니다. ALB는 AWS Load Balancer Controller가 Kubernetes Ingress 리소스를 기준으로 생성한 리소스입니다. ALB는 Ingress 규칙에 따라 요청을 Kubernetes Service로 전달하고, Service는 Backend Pod의 container port인 3000번으로 트래픽을 전달합니다.

Backend Pod는 Express 기반 API 서버입니다. Correction, Conversation, Level Test 요청을 처리하고, Bedrock 호출 전 사용량 제한을 먼저 확인합니다. 한도 내 요청이면 Amazon Bedrock을 호출하고, 결과와 사용량은 DynamoDB에 저장합니다. Bedrock Model ID 같은 설정값은 SSM Parameter Store로 관리합니다.

AWS 서비스 접근은 Pod에 Access Key를 넣는 방식이 아니라 IRSA를 사용했습니다. Backend ServiceAccount에 IAM Role을 연결했고, 이 Role만 DynamoDB, SSM, Bedrock 접근 권한을 갖도록 했습니다. ALB Controller도 별도 ServiceAccount와 IAM Role을 사용해서 ALB 생성 권한과 애플리케이션 권한을 분리했습니다.

---

## 3. 요청 흐름 설명 대본

요청 흐름은 다음 순서로 설명할 수 있습니다.

먼저 사용자가 React Frontend에서 로그인하면 Cognito가 JWT를 발급합니다. 사용자가 Correction, Conversation, Level Test 같은 기능을 실행하면 Frontend는 JWT를 포함해서 API 요청을 보냅니다.

이 요청은 Application Load Balancer로 들어가고, ALB는 Kubernetes Ingress로 요청을 전달합니다. Ingress는 Backend Service를 찾고, Service는 실제 Backend Pod로 요청을 라우팅합니다.

Backend Pod 안에서는 Express API Handler가 요청을 받습니다. Handler는 Body와 Header를 파싱하고 입력값을 검증합니다. 그 다음 AI 기능 요청이면 Usage Limit Check를 먼저 수행합니다. 이 단계는 Bedrock 호출 비용을 제어하기 위한 핵심 단계입니다.

사용량 한도 내 요청이면 Backend는 Bedrock을 호출해 AI 응답을 생성합니다. 이후 DynamoDB에 학습 기록과 사용량을 저장하고, API Response를 만들어 Frontend로 반환합니다. 사용자는 React 화면에서 결과를 확인합니다.

이 흐름에서 중요한 점은 Bedrock 호출 전에 사용량 제한을 먼저 확인한다는 것입니다. AI 호출은 비용이 발생하기 때문에, 사용량 초과 요청은 Bedrock을 호출하지 않고 차단하는 구조로 설계했습니다.

---

## 4. Kubernetes 리소스 설명 대본

Kubernetes 리소스는 `koreanmate` namespace 안에 Backend 중심으로 구성했습니다.

Namespace는 애플리케이션 리소스를 `kube-system`, `argocd`, `monitoring` 같은 운영 리소스와 분리하기 위해 사용했습니다.

Backend Pod는 Deployment로 관리했습니다. Pod를 직접 만드는 대신 Deployment를 사용한 이유는 replica 관리, rolling update, 장애 시 Pod 재생성 같은 기본 운영 기능을 활용하기 위해서입니다.

Service는 ClusterIP 타입으로 구성했습니다. 외부 공개는 ALB Ingress가 담당하고, Service는 클러스터 내부에서 Ingress와 Pod 사이의 안정적인 진입점 역할만 하도록 했습니다.

Ingress는 AWS Load Balancer Controller와 연결했습니다. Ingress manifest를 작성하면 Controller가 AWS ALB, Target Group, Listener를 생성합니다. 이렇게 하면 외부 트래픽 진입점도 Kubernetes manifest로 관리할 수 있습니다.

ServiceAccount는 Backend 전용으로 만들고 IRSA Role을 연결했습니다. 이를 통해 Backend Pod만 필요한 AWS 권한을 갖도록 제한했습니다.

---

## 5. CI/CD와 GitOps 설명 대본

EKS 버전의 배포 흐름은 Image Build Pipeline과 GitOps Sync로 나눴습니다.

Image Build Pipeline은 GitHub Actions에서 실행됩니다. Backend 코드가 변경되면 Docker image를 빌드하고, Trivy로 이미지 취약점을 스캔한 뒤 Amazon ECR에 push합니다. AWS 인증은 GitHub OIDC를 통해 IAM Deploy Role을 Assume하는 방식으로 구성했습니다. 그래서 장기 AWS Access Key를 GitHub Secrets에 저장하지 않습니다.

GitOps Sync는 Argo CD가 담당합니다. Kubernetes manifest는 GitHub Repository의 `deploy/k8s/backend` 경로에서 관리하고, Argo CD Application은 해당 경로를 감시합니다. Git의 desired state와 Cluster 상태가 일치하면 Synced, 정상 실행 중이면 Healthy 상태로 확인할 수 있습니다.

이 구조를 선택한 이유는 이미지 생성과 Kubernetes 배포 상태 관리를 분리하기 위해서입니다. GitHub Actions는 이미지를 만들고 ECR에 올리는 역할을 담당하고, Argo CD는 Git에 정의된 manifest 기준으로 EKS 배포 상태를 유지합니다.

---

## 6. 관측성 설명 대본

EKS 관측성은 Prometheus와 Grafana를 중심으로 구성했습니다.

Prometheus는 Kubernetes metrics를 수집하고, Grafana는 Cluster, Namespace, Pod 단위로 시각화합니다. 확인 대상은 Node Ready 상태, Namespace별 CPU/Memory 사용량, Backend Pod의 CPU, Memory, Network metrics, Prometheus Target UP 상태입니다.

EKS에서는 애플리케이션 로그만 보는 것으로는 충분하지 않습니다. Pod가 어떤 Node에서 실행되는지, 리소스가 부족하지 않은지, 특정 namespace의 사용량이 어떤지 확인해야 합니다. 그래서 Prometheus와 Grafana를 사용했습니다.

또한 Argo CD에서는 Application의 Synced, Healthy 상태를 확인하고, kubectl logs와 describe를 통해 Pod 장애, ImagePullBackOff, CrashLoopBackOff, Ingress 이벤트를 확인할 수 있도록 운영 점검 흐름을 정리했습니다.

---

## 7. 비용 관리 설명 대본

EKS는 Cluster, NodeGroup, ALB, EBS, Monitoring Stack이 존재하는 동안 비용이 계속 발생합니다. 그래서 이 프로젝트는 장기 운영 목적이 아니라 EKS 운영 구조 검증과 포트폴리오 증거 확보를 목적으로 설계했습니다.

기본 검증은 최소 NodeGroup으로 수행하고, Argo CD와 Monitoring Stack 검증이 필요할 때만 NodeGroup을 일시적으로 확장했습니다. Evidence 캡처와 문서화가 끝나면 NodeGroup을 축소하거나 terraform destroy를 수행하는 전략을 사용했습니다.

이 비용 관리 전략을 설계서에 포함한 이유는 EKS를 구성할 수 있다는 것뿐 아니라, 비용 구조를 이해하고 필요할 때 리소스를 정리할 수 있다는 운영 판단을 보여주기 위해서입니다.

---
# 예상 Why 질문 답변

## Q1. 왜 EKS를 사용했나요?

Kubernetes 운영 구조를 직접 검증하기 위해서입니다. 단순히 컨테이너를 실행하는 것뿐 아니라 Deployment, Service, Ingress, IRSA, GitOps, Monitoring까지 연결해서 실제 EKS 운영에서 필요한 흐름을 보여주기 위해 선택했습니다. 네 설계서에서도 EKS 버전의 핵심을 EKS 기반 배포, ALB Ingress, IRSA 권한 분리, GitOps, 이미지 보안 스캔, Kubernetes 관측성으로 정의하고 있어.

## Q2. 왜 Pod를 직접 만들지 않고 Deployment를 사용했나요?

Pod는 삭제되거나 장애가 발생하면 직접 복구해야 합니다. Deployment를 사용하면 원하는 replica 수를 유지하고, Pod 장애 시 재생성하며, 이미지 변경 시 rolling update도 가능합니다. Backend API는 지속 실행되는 서버이기 때문에 Deployment가 맞습니다.

## Q3. 왜 Service를 ClusterIP로 만들었나요?

외부 공개는 ALB Ingress가 담당하기 때문입니다. Service는 클러스터 내부에서 Ingress와 Pod 사이의 안정적인 진입점 역할만 하면 됩니다. Service를 LoadBalancer로 만들면 외부 로드밸런서가 중복될 수 있어서, Ingress 중심 구조에서는 ClusterIP가 적절합니다.

## Q4. 왜 ALB Ingress를 사용했나요?

외부 HTTP 요청을 Kubernetes 리소스 기준으로 관리하기 위해서입니다. AWS Load Balancer Controller를 사용하면 Ingress manifest를 기준으로 ALB와 Target Group이 생성됩니다. 그래서 AWS Console에서 수동으로 ALB를 만드는 방식보다 변경 이력을 Git과 Kubernetes manifest로 관리하기 쉽습니다.

## Q5. 왜 ALB Controller와 Backend Pod의 IAM Role을 분리했나요?

두 컴포넌트가 필요한 권한이 다르기 때문입니다. ALB Controller는 ALB, Target Group, Listener, Security Group 같은 네트워크 리소스를 관리해야 하고, Backend Pod는 DynamoDB, SSM, Bedrock 접근만 필요합니다. Role을 분리하면 권한 범위를 줄이고, 문제가 생겼을 때 영향 범위를 제한할 수 있습니다.

## Q6. 왜 IRSA를 사용했나요?

Pod 안에 AWS Access Key를 저장하지 않기 위해서입니다. Access Key를 환경변수나 Secret에 넣으면 유출 위험이 있고 키 교체도 번거롭습니다. IRSA를 사용하면 ServiceAccount에 IAM Role을 연결하고, Pod가 임시 자격 증명으로 AWS API를 호출할 수 있습니다. 설계서에서도 Backend Pod와 ALB Controller에 각각 IRSA Role을 두는 구조로 정리되어 있어.

## Q7. 왜 ECR을 사용했나요?

EKS가 AWS 안에서 동작하기 때문에 ECR을 사용하면 IAM 기반 인증과 이미지 Pull 흐름을 자연스럽게 구성할 수 있습니다. GitHub Actions에서 이미지를 빌드하고 ECR에 Push하면, Deployment가 해당 이미지를 Pull해서 Pod를 실행합니다. 이미지 digest와 push 이력도 확인할 수 있어 배포 추적에 유리합니다.

## Q8. 왜 Trivy를 넣었나요?

컨테이너 이미지는 애플리케이션 코드뿐 아니라 base image, OS package, Node dependency 취약점의 영향을 받습니다. Trivy를 GitHub Actions에 넣으면 ECR에 Push하기 전에 취약점 확인 로그를 남길 수 있고, 이미지 보안 검증을 배포 흐름에 포함했다는 근거가 됩니다.

## Q9. 왜 GitHub Actions와 Argo CD를 둘 다 사용했나요?

역할이 다릅니다. GitHub Actions는 Docker image를 빌드하고, Trivy scan 후 ECR에 Push하는 역할입니다. Argo CD는 Git repository의 Kubernetes manifest를 기준으로 EKS 배포 상태를 동기화하는 역할입니다. 즉, GitHub Actions는 이미지 생성 파이프라인이고, Argo CD는 Kubernetes 배포 상태 관리입니다.

## Q10. 왜 GitOps를 사용했나요?

Kubernetes 리소스를 수동으로 kubectl apply만 하면 현재 클러스터 상태가 Git과 일치하는지 추적하기 어렵습니다. Argo CD를 사용하면 Git이 desired state가 되고, Cluster 상태가 다르면 OutOfSync로 확인할 수 있습니다. 또한 Synced와 Healthy 상태를 통해 배포 결과를 시각적으로 검증할 수 있습니다.

## Q11. 왜 Prometheus와 Grafana를 사용했나요?

EKS에서는 Pod, Node, Namespace 단위의 리소스 상태를 확인해야 합니다. CloudWatch 로그만으로는 Pod CPU, Memory, Network, Namespace별 리소스 사용량을 한눈에 보기 어렵습니다. Prometheus는 Kubernetes metrics 수집에 적합하고, Grafana는 이를 시각화하기 좋기 때문에 사용했습니다.

## Q12. 왜 Backend Pod replica를 1개로 시작했나요?

dev 검증 환경이기 때문입니다. 이 프로젝트의 목적은 대규모 트래픽 대응이 아니라 EKS 운영 구조 검증입니다. replica를 1개로 시작해 비용과 리소스 사용량을 줄이고, 향후 운영 확장 시 HPA나 replica 증가로 확장할 수 있게 설계했습니다.

## Q13. 왜 HPA나 Karpenter는 제외했나요?

현재 범위에서는 핵심 운영 흐름인 배포, Ingress, IRSA, GitOps, Monitoring 검증이 우선입니다. HPA, Karpenter, Canary 배포, NetworkPolicy까지 한 번에 포함하면 범위가 과도하게 커집니다. 그래서 설계서에서는 Future Improvements로 분리했습니다. 현재 설계서에도 HTTPS, HPA, Karpenter, Loki, Canary 배포는 향후 개선 항목으로 정리되어 있어.

## Q14. 왜 비용 정리 전략을 설계서에 넣었나요?

EKS는 Cluster, NodeGroup, ALB, EBS, Monitoring Stack이 존재하는 동안 계속 비용이 발생합니다. 포트폴리오 dev 환경에서 장기 운영할 이유가 크지 않기 때문에, 구축 후 검증하고 캡처와 문서화를 마치면 축소하거나 삭제하는 전략이 필요합니다. 이건 비용 구조를 이해하고 운영 판단을 할 수 있다는 근거가 됩니다.

## Q15. 장애가 나면 어떤 순서로 확인하나요?

Client에서 시작해서 ALB, Ingress, Service, Pod, AWS Service 순서로 확인합니다. 예를 들어 503이면 ALB Target Group Health를 보고, Service endpoint가 있는지 확인하고, Pod readiness와 container port가 맞는지 봅니다. ImagePullBackOff면 ECR image tag와 Node의 ECR pull 권한을 확인하고, AWS API 접근 실패면 ServiceAccount annotation과 IAM Trust Policy를 확인합니다.

## Q16. 이 설계의 한계는 무엇인가요?

현재는 dev 검증 환경이기 때문에 HTTPS, Route 53 domain, HPA, Node autoscaling, NetworkPolicy, Loki 기반 로그 수집, Canary 배포까지는 포함하지 않았습니다. 대신 핵심 EKS 운영 흐름을 먼저 검증했고, 운영 수준으로 확장할 항목은 개선 방향으로 분리했습니다.

면접에서 조심할 표현

“EKS를 운영했습니다”라고 말하면 범위가 과장될 수 있어. 더 정확한 표현은 “EKS dev 환경에서 Backend 배포, ALB Ingress, IRSA, GitOps, Prometheus/Grafana 관측성을 구성하고 검증했습니다”