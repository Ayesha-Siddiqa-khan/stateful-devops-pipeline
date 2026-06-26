# AGENTS.md - StatefulSet Project

## Project Overview

Full-stack DevOps project: Next.js frontend + FastAPI backend + PostgreSQL StatefulSet on AWS EBS gp3.

```
User → Frontend (Next.js) → Backend (FastAPI) → PostgreSQL (StatefulSet) → PVC → AWS EBS gp3
```

## Project Structure

```
├── backend/              # FastAPI Python app
├── frontend/             # Next.js React app
├── k8s/                  # Kubernetes manifests
├── terraform/            # AWS infrastructure (VPC, EC2, ECR, IAM, OIDC)
└── .github/workflows/    # CI/CD pipeline
```

## Before Making Changes - ALWAYS Run These

### Terraform
```bash
cd terraform
terraform fmt -check
terraform validate
```

### Backend (Python)
```bash
cd backend
python -m py_compile main.py
pip install -r requirements.txt
```

### Frontend (Node.js)
```bash
cd frontend
npm install
npm run build
```

### Kubernetes Manifests
```bash
kubectl apply -f k8s/ --dry-run=client
```

## Common Issues and Fixes

### 1. Terraform Validate Errors
- **Missing script files**: Check `terraform/scripts/` directory
- **Syntax errors**: Run `terraform fmt` to auto-fix formatting
- **Variable references**: Ensure all `var.xxx` exist in `variables.tf`

### 2. Docker Build Failures
- Check Dockerfile syntax
- Verify base image exists
- Check for missing files referenced in COPY/ADD

### 3. Kubernetes Deployment Issues
- Verify image tags exist in ECR
- Check namespace exists: `kubectl get ns stateful-app`
- Check PVC status: `kubectl get pvc -n stateful-app`
- Check pod events: `kubectl describe pod <pod> -n stateful-app`

### 4. GitHub Actions Workflow Issues
- Validate YAML syntax
- Check secrets/vars are set in repo settings
- Verify OIDC role ARN is correct

## Key Files to Check When Something Breaks

| Problem | Check These Files |
|---------|-------------------|
| Terraform fails | `terraform/*.tf`, `terraform/scripts/*.sh` |
| Backend crash | `backend/main.py`, `backend/requirements.txt` |
| Frontend crash | `frontend/pages/index.js`, `frontend/package.json` |
| K8s pods not running | `k8s/*.yaml`, check image tags match ECR |
| CI/CD fails | `.github/workflows/deploy.yml` |

## Secrets and Variables (GitHub Actions)

### Required Secrets
- `AWS_ROLE_TO_ASSUME` - IAM role ARN for OIDC
- `KUBECONFIG` - Base64 encoded kubeconfig

### Required Variables
- `AWS_REGION` - e.g. us-east-1
- `AWS_ACCOUNT_ID` - 12 digit account ID
- `BACKEND_REPO` - ECR repo name for backend
- `FRONTEND_REPO` - ECR repo name for frontend

## Infrastructure Resources

| Resource | Name Pattern |
|----------|--------------|
| VPC | `statefullset-vpc` |
| ECR Backend | `statefullset-backend` |
| ECR Frontend | `statefullset-frontend` |
| OIDC Role | `statefullset-github-actions-oidc` |
| Namespace | `stateful-app` |

## Deployment Order

1. `terraform init`
2. `terraform plan`
3. `terraform apply`
4. Push to `main` branch → GitHub Actions auto-deploys

## Quick Debug Commands

```bash
# Check terraform state
terraform state list

# Check k8s resources
kubectl get all -n stateful-app

# Check ECR images
aws ecr describe-images --repository-name statefullset-backend

# Check pod logs
kubectl logs -f deployment/backend -n stateful-app
kubectl logs -f deployment/frontend -n stateful-app
```

## Do NOT

- Hardcode secrets in files
- Skip terraform validate before commit
- Push directly to main without testing
- Delete PVC manually (data loss risk)
