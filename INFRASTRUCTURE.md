# ChalkScore Infrastructure

## Overview

ChalkScore uses two environments: **dev** and **production**. Both share a single Azure resource group and Container Apps environment due to a per-region limit of one Container Apps environment per subscription.

---

## Environments

| | Dev | Production |
|---|---|---|
| Branch | `develop` | `master` |
| API | Azure Container App (`chalkscore-api-dev`) | Azure Container App (`chalkscore-api-prod`) |
| Database | Neon — `chalkscore-dev` project | Neon — `chalkscore-prod` project |
| Auth0 Audience | `https://chalkscore-api-dev` | `https://chalkscore-api` |
| Mobile build config | `--configuration dev` | `--configuration production` |

---

## Azure

- **Subscription ID:** *(stored in `AZURE_SUBSCRIPTION_ID` repository secret)*
- **Region:** East US 2
- **Resource group:** `chalkscore-dev` (shared — hosts both dev and prod container apps)
- **Container Apps environment:** `chalkscore-env-dev` (shared)
- **Container apps:**
  - `chalkscore-api-dev`
  - `chalkscore-api-prod`
- **Scale:** min 0 replicas, max 1 replica (scale to zero when idle)
- **Docker registry:** GitHub Container Registry (GHCR)

A separate `chalkscore-prod` resource group exists but contains only a Log Analytics workspace created as a side effect of an earlier failed deploy attempt. It is not actively used.

---

## Database (Neon)

All databases are serverless PostgreSQL on Neon's free tier (scale to zero).

### Main Database (EF Core / app data)

Each environment has its own database:

- **Dev:** `chalkscore-dev` Neon project
- **Production:** `chalkscore-prod` Neon project

Stored as `DATABASE_URL` in the GitHub environment secret. Injected into the container as `ConnectionStrings__DefaultConnection`.

EF Core migrations run automatically on every deploy via a self-contained migration bundle (`efbundle`) compiled for `linux-x64`.

### Feedback Database (deprecated)

A single shared Neon database used by all environments for feedback storage. Stored as `FEEDBACK_DATABASE_URL` in the GitHub environment secret. Injected into the container as `ConnectionStrings__FeedbackDbConnection`.

> **Note:** This database is being replaced by a direct GitHub project integration (via `GitHubService`) and will be removed once that integration is complete.

### Connection string format

Connection strings are stored as `postgresql://` URIs and converted to Npgsql key-value format at deploy time:

```python
import os, urllib.parse as p
u = p.urlparse(os.environ['DATABASE_URL'])
print(f'Host={u.hostname};Database={u.path[1:]};Username={p.unquote(u.username)};Password={p.unquote(u.password)};SslMode=Require', end='')
```

---

## Auth0

A single Auth0 tenant is used for both environments. The domain is stored in the `AUTH0_DOMAIN` GitHub secret per environment.

### Applications

| App Name | Type | Used by |
|---|---|---|
| ChalkScore Mobile (Dev) | Native | Dev builds |
| ChalkScore Mobile | Native | Production builds |

Client IDs are stored in `environment.dev.ts` and `environment.prod.ts` respectively.

Both apps have the following configured:
- **Allowed Callback URLs:** `com.chalkscore.app://callback`
- **Allowed Logout URLs:** `com.chalkscore.app://callback`

### APIs

| API Name | Audience/Identifier | Used by |
|---|---|---|
| ChalkScore API (Dev) | `https://chalkscore-api-dev` | Dev environment |
| ChalkScore API | `https://chalkscore-api` | Production environment |

### Roles

Roles (`Coach`, `Staff`) are assigned in the Auth0 dashboard and embedded as custom claims in the JWT. Default role on registration is `Staff`. Coach access is granted by an admin in the Auth0 dashboard — no code change required.

---

## GitHub Actions

### Workflows

**`api-deploy.yml`** — triggers on push to `develop` or `master` when API files change.

| Job | What it does |
|---|---|
| Build & Push | Restores, builds migration bundle, builds Docker image, pushes to GHCR |
| Deploy | Logs into Azure, runs migrations, creates or updates the Container App |

**`mobile-build.yml`** — triggers on push to `develop` or `master` (and on pull requests) when mobile files change. Runs `ng build --configuration production` to verify the build compiles.

### GitHub Environments

| Environment | Branch | Secrets |
|---|---|---|
| `dev` | `develop` | `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_MANAGEMENT_CLIENT_ID`, `AUTH0_MANAGEMENT_CLIENT_SECRET`, `AUTH0_STAFF_ROLE_ID`, `AUTH0_COACH_ROLE_ID`, `DATABASE_URL`, `FEEDBACK_DATABASE_URL`, `GHCR_TOKEN` |
| `production` | `master` | `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_MANAGEMENT_CLIENT_ID`, `AUTH0_MANAGEMENT_CLIENT_SECRET`, `AUTH0_STAFF_ROLE_ID`, `AUTH0_COACH_ROLE_ID`, `DATABASE_URL`, `FEEDBACK_DATABASE_URL`, `GHCR_TOKEN` |

### Repository Secrets (shared across all environments)

| Secret | Purpose |
|---|---|
| `AZURE_CREDENTIALS` | Service principal JSON for `az login` |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |

---

## Mobile App Build Configurations

| Angular config | Environment file | Use case |
|---|---|---|
| `production` (default) | `environment.prod.ts` | App Store / TestFlight builds |
| `dev` | `environment.dev.ts` | Sideloaded device builds against dev API |
| *(none / `ionic serve`)* | `environment.ts` | Local browser dev against local API (`localhost:5167`) |

To build for a specific target:
```bash
# Local browser dev
ionic serve

# Sideload on device (dev API)
ionic build --configuration dev
ionic capacitor sync ios
# then run from Xcode

# Production build
ionic build --configuration production
ionic capacitor sync ios
```
