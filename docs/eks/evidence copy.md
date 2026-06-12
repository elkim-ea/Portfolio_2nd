# evidence.md 이미지 설명 추가용

---

## 1. EKS Cluster / NodeGroup 생성 확인

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl get nodes` 실행 결과에서 EKS Worker Node가 `Ready` 상태로 표시된 화면

<img src="./images/01-eks-nodes-ready.png" width="800">
```

---

## 2. ECR Backend Image Push 확인

```md
> 캡처 위치: AWS CLI 또는 AWS Console ECR  
> 캡처 대상: `koreanmate-dev-backend:dev` 이미지가 ECR에 Push되고 image digest가 생성된 화면

<img src="./images/02-ecr-image-push-success.png" width="800">
```

---

## 3. GitHub Actions EKS Image Build 성공 확인

```md
> 캡처 위치: GitHub Actions  
> 캡처 대상: `EKS Backend Image Build` workflow가 성공하고 전체 checks가 통과한 화면

<img src="./images/03-github-actions-eks-image-build-success.png" width="800">
```

---

## 4. Trivy Image Scan 결과 확인

```md
> 캡처 위치: GitHub Actions 로그  
> 캡처 대상: Trivy가 Backend Docker Image를 스캔하고 취약점 결과를 출력한 화면

<img src="./images/04-trivy-scan-result.png" width="800">
```

---

## 5. AWS Load Balancer Controller 구성 확인

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl get pods -n kube-system` 실행 결과에서 AWS Load Balancer Controller Pod가 `Running` 상태인 화면

<img src="./images/05-alb-controller-running.png" width="800">
```

---

## 6. AWS Load Balancer Controller IRSA 확인

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: AWS Load Balancer Controller ServiceAccount에 IAM Role ARN annotation이 연결된 화면

<img src="./images/06-alb-controller-irsa.png" width="800">
```

---

## 7. Backend Pod IRSA Role 확인

```md
> 캡처 위치: Local Terminal / Git Bash 또는 AWS Console IAM  
> 캡처 대상: Backend Pod 전용 IAM Role의 trust policy가 `system:serviceaccount:koreanmate:backend`로 제한된 화면

<img src="./images/07-backend-pod-irsa-role.png" width="800">
```

---

## 8. Backend Pod 배포 확인

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl get pods -n koreanmate` 실행 결과에서 Backend Pod가 `Running` 상태인 화면

<img src="./images/08-backend-pod-running.png" width="800">
```

---

## 9. Backend Service 내부 통신 확인

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl port-forward` 후 `curl http://localhost:8081/health` 호출이 성공한 화면

<img src="./images/09-backend-service-health-success.png" width="800">
```

---

## 10. ALB Ingress 외부 접근 확인

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: ALB DNS 주소를 통해 `/health` endpoint 호출이 성공한 화면

<img src="./images/10-alb-health-success.png" width="800">
```

---

## 11. Backend API 호출 검증

```md
> 캡처 위치: Local Terminal / Git Bash 또는 API 테스트 도구  
> 캡처 대상: ALB 주소를 통해 `/correction`, `/conversation`, `/level-test` API 호출이 성공한 화면

<img src="./images/11-api-verification-success.png" width="800">
```

---

## 12. Argo CD 설치 확인

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl get pods -n argocd` 실행 결과에서 Argo CD 구성 요소들이 모두 `Running` 상태인 화면

<img src="./images/12-argocd-pods-running.png" width="800">
```

---

## 13. Argo CD Application Synced / Healthy 확인

```md
> 캡처 위치: Argo CD Web UI  
> 캡처 대상: `koreanmate-backend` Application이 `Synced` 및 `Healthy` 상태로 표시된 화면

<img src="./images/13-argocd-synced-healthy.png" width="800">
```

---

## 14. Monitoring Stack Pod 확인

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl get pods -n monitoring` 실행 결과에서 Prometheus, Grafana, Alertmanager, kube-state-metrics, node-exporter가 모두 `Running` 상태인 화면

<img src="./images/14-monitoring-pods-running.png" width="800">
```

---

## 15. Prometheus Targets UP 확인

```md
> 캡처 위치: Prometheus Web UI  
> 캡처 대상: `http://localhost:9090/targets` 화면에서 Prometheus scrape targets가 `UP` 상태로 표시된 화면

<img src="./images/15-prometheus-targets-up.png" width="800">
```

---

## 16. Grafana Cluster Dashboard 확인

```md
> 캡처 위치: Grafana Web UI  
> 캡처 대상: Kubernetes Cluster Dashboard에서 EKS 클러스터 전체 CPU, Memory, Namespace별 리소스 사용량이 표시된 화면

<img src="./images/16-grafana-cluster-dashboard.png" width="800">
```

---

## 17. Grafana KoreanMate Backend Pod Metrics 확인

```md
> 캡처 위치: Grafana Web UI  
> 캡처 대상: Kubernetes Namespace(Pods) Dashboard에서 `koreanmate` namespace와 Backend Pod의 CPU, Memory, Network metrics가 표시된 화면

<img src="./images/17-grafana-backend-pod-metrics.png" width="800">
```
