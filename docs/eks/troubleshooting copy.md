## 이미지 캡션 추가 형식

각 이미지 위에 아래 형식으로 넣는다.

```md
> 캡처 위치: ...
> 캡처 대상: ...

<img src="./images/troubleshooting/파일명.png" width="800">
```

---

# 1. Backend Pod 실행 중 `BEDROCK_MODEL_ID` 환경변수 누락 문제

기존 이미지:

```md
<img src="./images/troubleshooting/backend-pod-bedrock-model-env-error.png" width="800">
```

수정 후:

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl logs -n koreanmate deployment/backend` 실행 결과에서 `BEDROCK_MODEL_ID` 환경변수 누락으로 인한 `ZodError` 확인 화면

<img src="./images/troubleshooting/backend-pod-bedrock-model-env-error.png" width="800">
```

---

기존 이미지:

```md
<img src="./images/troubleshooting/backend-service-health-success.png" width="800">
```

수정 후:

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl port-forward` 후 `curl http://localhost:8081/health` 호출 성공 화면

<img src="./images/troubleshooting/backend-service-health-success.png" width="800">
```

---

# 2. Argo CD 설치 중 `argocd-redis` Secret 누락 문제

기존 이미지:

```md
<img src="./images/troubleshooting/argocd-install-initial-error.png" width="800">
```

수정 후:

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl get pods -n argocd` 실행 결과에서 Argo CD 일부 Pod가 `CrashLoopBackOff`, `CreateContainerConfigError`, `Pending` 상태인 화면

<img src="./images/troubleshooting/argocd-install-initial-error.png" width="800">
```

---

기존 이미지:

```md
<img src="./images/troubleshooting/argocd-redis-secret-not-found.png" width="800">
```

수정 후:

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl describe pod` 실행 결과에서 `Error: secret "argocd-redis" not found` 이벤트가 표시된 화면

<img src="./images/troubleshooting/argocd-redis-secret-not-found.png" width="800">
```

---

기존 이미지:

```md
<img src="./images/troubleshooting/argocd-pods-running.png" width="800">
```

수정 후:

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl get pods -n argocd` 실행 결과에서 Argo CD 구성 요소들이 모두 `Running` 상태로 전환된 화면

<img src="./images/troubleshooting/argocd-pods-running.png" width="800">
```

---

기존 이미지:

```md
<img src="./images/troubleshooting/argocd-application-synced-healthy.png" width="800">
```

수정 후:

```md
> 캡처 위치: Argo CD Web UI  
> 캡처 대상: `koreanmate-backend` Application이 `Synced` 및 `Healthy` 상태로 표시된 화면

<img src="./images/troubleshooting/argocd-application-synced-healthy.png" width="800">
```

---

# 3. Argo CD 설치 중 t3.small 노드 Pod Capacity 부족 문제

기존 이미지:

```md
<img src="./images/troubleshooting/eks-node-pod-capacity-full.png" width="800">
```

수정 후:

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl describe nodes` 실행 결과에서 `Allocatable pods: 11`, `Non-terminated Pods: 11`로 노드의 Pod capacity가 가득 찬 화면

<img src="./images/troubleshooting/eks-node-pod-capacity-full.png" width="800">
```

---

기존 이미지:

```md
<img src="./images/troubleshooting/eks-nodegroup-scaled-to-2.png" width="800">
```

수정 후:

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl get nodes` 실행 결과에서 Worker Node가 1대에서 2대로 확장되어 모두 `Ready` 상태인 화면

<img src="./images/troubleshooting/eks-nodegroup-scaled-to-2.png" width="800">
```

---

기존 이미지:

```md
<img src="./images/troubleshooting/argocd-pods-running-after-scale-out.png" width="800">
```

수정 후:

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: NodeGroup 확장 후 `kubectl get pods -n argocd` 실행 결과에서 Argo CD Pod들이 모두 `Running` 상태로 스케줄링된 화면

<img src="./images/troubleshooting/argocd-pods-running-after-scale-out.png" width="800">
```

---

# 4. Prometheus Server Pending 문제

기존 이미지:

```md
<img src="./images/troubleshooting/prometheus-server-pending.png" width="800">
```

수정 후:

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: `kubectl get pods -n monitoring` 실행 결과에서 Prometheus Server가 `Pending` 상태로 표시된 화면

<img src="./images/troubleshooting/prometheus-server-pending.png" width="800">
```

---

기존 이미지:

```md
<img src="./images/troubleshooting/monitoring-pods-running.png" width="800">
```

수정 후:

```md
> 캡처 위치: Local Terminal / Git Bash  
> 캡처 대상: NodeGroup 확장 후 `kubectl get pods -n monitoring` 실행 결과에서 Prometheus, Grafana, Alertmanager, kube-state-metrics, node-exporter가 모두 `Running` 상태인 화면

<img src="./images/troubleshooting/monitoring-pods-running.png" width="800">
```

---

기존 이미지:

```md
<img src="./images/troubleshooting/prometheus-targets-up.png" width="800">
```

수정 후:

```md
> 캡처 위치: Prometheus Web UI  
> 캡처 대상: `http://localhost:9090/targets` 화면에서 Prometheus scrape targets가 `UP` 상태로 표시된 화면

<img src="./images/troubleshooting/prometheus-targets-up.png" width="800">
```

---

기존 이미지:

```md
<img src="./images/troubleshooting/grafana-backend-pod-metrics.png" width="800">
```

수정 후:

```md
> 캡처 위치: Grafana Web UI  
> 캡처 대상: Kubernetes Namespace(Pods) Dashboard에서 `koreanmate` namespace와 Backend Pod의 CPU, Memory, Network metrics가 표시된 화면

<img src="./images/troubleshooting/grafana-backend-pod-metrics.png" width="800">
```
