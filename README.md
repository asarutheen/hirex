# HireX — AI-Powered Hiring Platform

A full-stack hiring platform built with Node.js, Next.js, PostgreSQL, and AI integration (Groq + Gemini). Built in public as a learning project to transition into DevOps + AI integration engineering.

## Tech Stack

| Layer        | Technology                            |
| ------------ | ------------------------------------- |
| Backend      | Node.js + TypeScript + Express        |
| Frontend     | Next.js                               |
| Database     | PostgreSQL + pgvector                 |
| Cache        | Redis (Upstash)                       |
| AI           | Groq (text gen) + Gemini (embeddings) |
| Monorepo     | Turborepo + pnpm                      |
| Container    | Docker                                |
| Kubernetes   | k3d (local) → EKS (production)        |
| CI/CD        | GitHub Actions → Docker Hub → ArgoCD  |
| File Storage | Cloudflare R2                         |

## Project Structure

hirex/
├── apps/
│ ├── api/ # Node.js monolith backend
│ └── web/ # Next.js frontend
└── packages/
├── db/ # Prisma database client
├── types/ # Shared TypeScript types
├── ui/ # Shared React components
├── eslint-config/
└── typescript-config/

## Getting Started

### Prerequisites

- Node.js v20+
- pnpm v10+
- Docker Desktop
- k3d

### Install dependencies

```bash
pnpm install
```

### Run API locally

```bash
pnpm --filter @hirex/api dev
```

API runs at `http://localhost:3001`

### Health check

```bash
curl http://localhost:3001/health
```

### Local Kubernetes

```bash
# Create cluster
k3d cluster create hirex-local --port "8080:80@loadbalancer" --agents 2

# Create namespace
kubectl create namespace hirex

# Deploy
kubectl apply -f k8s/

# Test pod directly
kubectl port-forward svc/hirex-api-svc 9090:80 -n hirex
curl http://localhost:9090
```

## Development Progress

| Day     | Focus                                  | Status  |
| ------- | -------------------------------------- | ------- |
| Day 1   | Monorepo + K8s + CI foundation         | ✅ Done |
| Day 2   | PostgreSQL + Prisma + Auth API         | 🔜 Next |
| Day 3   | Job board API + Docker image + Ingress | ⏳      |
| Day 4-5 | AI integration (Groq + Gemini)         | ⏳      |
| Day 8   | Monolith → Microservices split         | ⏳      |
| Day 10  | ArgoCD GitOps + Production deploy      | ⏳      |
