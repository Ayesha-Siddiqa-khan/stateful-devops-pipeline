# DevOps Profile Card Generator

A full-stack application built for DevOps deployment practice on AWS with self-managed Kubernetes.

**Frontend:** Next.js (React)
**Backend:** FastAPI (Python)
**Database:** PostgreSQL (StatefulSet on AWS EBS gp3)
**Infrastructure:** Terraform (AWS VPC, EC2, ECR, IAM, OIDC)
**CI/CD:** GitHub Actions

---

## Architecture

```
User → Frontend (Next.js) → Backend (FastAPI) → PostgreSQL (StatefulSet) → PVC → AWS EBS gp3
```

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS (us-east-1)                          │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│  │  ECR     │    │  ECR     │    │  Kubernetes Cluster  │  │
│  │ backend  │    │ frontend │    │  (Self-Managed)      │  │
│  └────┬─────┘    └────┬─────┘    │                      │  │
│       │               │         │  ┌────────────────┐  │  │
│       └───────────────┘─────────┼──│ Frontend Pods   │  │  │
│                                 │  │ (Deployment)    │  │  │
│                                 │  └───────┬────────┘  │  │
│                                 │          │           │  │
│                                 │  ┌───────▼────────┐  │  │
│                                 │  │ Backend Pods    │  │  │
│                                 │  │ (Deployment)    │  │  │
│                                 │  └───────┬────────┘  │  │
│                                 │          │           │  │
│                                 │  ┌───────▼────────┐  │  │
│                                 │  │ PostgreSQL Pods │  │  │
│                                 │  │ (StatefulSet)   │  │  │
│                                 │  │ db-0, db-1, db-2│  │  │
│                                 │  └───────┬────────┘  │  │
│                                 │          │           │  │
│                                 │  ┌───────▼────────┐  │  │
│                                 │  │ PVC (gp3 EBS)  │  │  │
│                                 │  └────────────────┘  │  │
│                                 └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Production Docker image
├── frontend/
│   ├── pages/
│   │   └── index.js         # Main page with form
│   ├── next.config.js       # Next.js configuration
│   ├── package.json         # Node dependencies
│   └── Dockerfile           # Production Docker image
├── k8s/
│   ├── configmap.yaml       # Non-sensitive configuration
│   ├── secret.yaml          # Sensitive values (passwords)
│   ├── frontend.yaml        # Frontend Deployment
│   ├── frontend-service.yaml# Frontend Service
│   ├── backend.yaml         # Backend Deployment
│   ├── backend-service.yaml # Backend Service
│   ├── statefulset-db.yaml  # PostgreSQL StatefulSet (3 replicas)
│   ├── service-db-headless.yaml # Headless Service for StatefulSet
│   └── storage/
│       └── gp3-storageclass.yaml # EBS gp3 StorageClass
├── terraform/               # AWS infrastructure (VPC, EC2, ECR, IAM, OIDC)
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD pipeline
└── README.md
```

---

## API Endpoints

| Method | Endpoint       | Description                        |
|--------|----------------|------------------------------------|
| GET    | `/health`      | Returns `{"status": "ok"}`        |
| GET    | `/ready`       | Returns `{"status": "ready"}`     |
| POST   | `/api/profile` | Generates a profile card message  |

### POST /api/profile

**Request:**
```json
{
  "name": "Ali",
  "role": "DevOps Engineer",
  "tool": "Kubernetes",
  "headline": "Building cloud-native deployment pipelines"
}
```

**Response:**
```json
{
  "status": "success",
  "profile_card": "Ali is a DevOps Engineer who enjoys working with Kubernetes. LinkedIn headline: Building cloud-native deployment pipelines."
}
```

---

## How to Run Locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`

---

## How to Run with Docker

### Build images

```bash
docker build -t statefullset-backend ./backend
docker build -t statefullset-frontend ./frontend
```

### Run containers

```bash
docker run -d -p 8000:8000 --name backend statefullset-backend
docker run -d -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://host.docker.internal:8000 --name frontend statefullset-frontend
```

---

## How to Deploy on Kubernetes

### Prerequisites

- Terraform infrastructure deployed
- kubectl configured with cluster access
- ECR images built and pushed

### Deploy

```bash
# Apply storage class and namespace
kubectl apply -f k8s/storage/gp3-storageclass.yaml
kubectl apply -f k8s/stateful-app/namespace.yaml

# Apply configuration
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy database StatefulSet
kubectl apply -f k8s/service-db-headless.yaml
kubectl apply -f k8s/statefulset-db.yaml

# Wait for database
kubectl rollout status statefulset/postgres -n stateful-app

# Deploy backend
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/backend-service.yaml

# Deploy frontend
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/frontend-service.yaml
```

### Verify

```bash
kubectl get pods -n stateful-app
kubectl get statefulset -n stateful-app
kubectl get svc -n stateful-app
```

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on push to `main`:

1. Authenticates to AWS via OIDC (no static credentials)
2. Builds Docker images for frontend and backend
3. Pushes images to ECR with commit SHA tag
4. Deploys to Kubernetes cluster via kubectl

### Required Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCOUNT_ID` | AWS account ID |
| `AWS_ROLE_TO_ASSUME` | IAM role ARN for GitHub Actions OIDC |
| `KUBECONFIG` | Base64-encoded kubeconfig for cluster access |

---

## Terraform Resources

| Resource | Name |
|----------|------|
| VPC | `statefullset-vpc` |
| ECR Backend | `statefullset-backend` |
| ECR Frontend | `statefullset-frontend` |
| OIDC Provider | GitHub Actions |
| OIDC Role | `statefullset-github-actions-oidc` |
| Worker Role | `statefullset-worker-ec2-ecr-pull` |
| StorageClass | `gp3` (ebs.csi.aws.com) |
| Namespace | `stateful-app` |

---

## Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | frontend/.env.local | Backend API URL |
| `POSTGRES_HOST` | ConfigMap | PostgreSQL service DNS |
| `POSTGRES_PORT` | ConfigMap | PostgreSQL port |
| `POSTGRES_DB` | Secret | Database name |
| `POSTGRES_USER` | Secret | Database user |
| `POSTGRES_PASSWORD` | Secret | Database password |
| `DATABASE_URL` | Secret | Full connection string |
