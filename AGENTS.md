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
- Add `.dockerignore` to exclude `node_modules`, `.next`, `__pycache__`

### 3. Kubernetes Deployment Issues
- Verify image tags exist in ECR
- Check namespace exists: `kubectl get ns stateful-app`
- Check PVC status: `kubectl get pvc -n stateful-app`
- Check pod events: `kubectl describe pod <pod> -n stateful-app`
- **ECR pull fails**: Create `ecr-secret` in namespace (see deploy.yml)
- **NodePort not accessible**: Patch service to NodePort type + open SG ports 30000-32767

### 4. GitHub Actions Workflow Issues
- Validate YAML syntax
- Check secrets/vars are set in repo settings
- Verify OIDC role ARN is correct
- Deploy.yml must create `ecr-secret` for pods to pull from ECR

### 5. Frontend Cannot Reach Backend
- **Root cause**: `NEXT_PUBLIC_API_URL` is baked at build time into JS bundle
- **Fix**: Use custom `server.js` with Node.js `http` proxy (not Next.js rewrites, which are build-time only in standalone mode)
- Frontend proxies `/api/*` to backend via cluster DNS: `http://backend.stateful-app.svc.cluster.local`

### 6. Postgres Probes Failing
- `$(POSTGRES_USER)` shell expansion does NOT work in K8s exec probes
- Hardcode the username: `pg_isready -U kubestate -d kubestate`

### 7. Worker Node Cannot Reach EC2 API (CSI Driver Fails)
- CSI controller must run on master node (which has internet access)
- Fix: Patch `ebs-csi-controller` deployment with `nodeSelector` for `node-role.kubernetes.io/control-plane: ""` and tolerations
- Add inline EBS policy to IAM roles in `terraform/iam.tf`

### 8. Terraform Worker Instance Type
- Changing worker name in `for_each` map causes destroy+recreate (lose all pods/PVCs)
- **NEVER change the map key** - only change `instance_type` value
- Use `instance_type: "t3.small"` (not `t3.micro` which runs out of memory)

### 9. Cross-Node Pod Networking Broken (Calico VXLAN)
- **Root cause**: AWS source/dest check blocks cross-node pod traffic
- **Fix**: Set `source_dest_check = false` on EC2 instances in `terraform/ec2.tf`
- Calico RBAC: The official Calico manifest binds to `calico-system` namespace, but pods run in `kube-system`
- **Fix**: Create extra ClusterRoleBindings for `kube-system` service accounts (see deploy.yml)
- **Root cause 2**: Stale BIRD/felix processes from previous installs hold port 9099
- **Fix**: `sudo killall -9 bird bird6 felix; sudo fuser -k -9 9099/tcp` before redeploying Calico
- `ipset` package must be installed on all nodes for Calico VXLAN filtering

### 10. Backend CrashLoopBackOff — psycopg2 Missing
- `main.py` uses `sqlalchemy.create_engine()` (sync driver) which needs `psycopg2-binary`
- `requirements.txt` only had `asyncpg` (async driver)
- **Fix**: Add `psycopg2-binary==2.9.9` to `backend/requirements.txt`

### 11. Frontend CrashLoopBackOff — Standalone + Webpack
- Custom `server.js` calls `require("next")` which loads webpack bundles
- Next.js standalone mode (`output: "standalone"`) doesn't include full webpack bundles
- **Fix**: Remove `output: "standalone"` from `next.config.js`, copy `.next/` + `node_modules/` instead of `.next/standalone/`
- `npm ci --production` in Dockerfile skips devDependencies needed for build — use `npm ci` instead

### 12. DATABASE_URL Password Has Unencoded `#`
- Password `Kb$9xLm2#pQr7wNz` contains `#` which is a URL fragment delimiter
- Python URL parser treats `#pQr7wNz@host` as fragment, not part of password
- **Fix**: URL-encode `#` as `%23` in the DATABASE_URL secret

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
