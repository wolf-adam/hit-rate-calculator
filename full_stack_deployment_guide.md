# Deployment Guide: React + TypeScript, FastAPI, and Neon PostgreSQL

## Goal

Prepare this existing local full-stack project for production deployment while preserving the current application behavior.

**Target architecture**
- **Frontend:** React + TypeScript (assume Vite unless the project proves otherwise)
- **Backend:** Python + FastAPI
- **Database:** Neon PostgreSQL
- **Source control:** GitHub
- **Hosting:** Vercel project with separate frontend and backend services

This is a proposed deployment path, not a requirement to rewrite the app. Inspect the existing repository first and adapt the instructions to its actual structure and tooling.

## Important instructions for the AI assistant

1. Inspect the repository structure and existing configuration before changing files.
2. Identify the frontend build tool, backend entry point, Python dependency manager, database driver/ORM, and current environment-variable names.
3. Do not replace frameworks, rewrite application logic, or make unrelated refactors.
4. Make the smallest changes needed for deployment. Explain each proposed change and why it is needed.
5. Do not invent filenames, commands, module paths, or dependencies. Verify them against the repository.
6. Never ask the user to paste secrets into chat. Do not print or commit database credentials, API keys, or other secrets.
7. Keep Neon credentials on the backend only. Never expose `DATABASE_URL` to React or any `VITE_*` variable.
8. Do not run destructive database migrations or change production data without explicit approval.
9. If a required detail is missing, ask a focused question rather than guessing.
10. After changes, provide local verification steps and a deployment checklist.

---

## 1. Expected architecture

```text
Browser
  |
  | HTTPS
  v
React + TypeScript frontend service (Vercel)
  |
  | Same-origin HTTPS requests through /api
  v
FastAPI backend service (Vercel)
  |
  | PostgreSQL connection using a server-side secret
  v
Neon PostgreSQL
```

The browser should call the FastAPI API. It should not connect directly to Neon.

## 2. Local development assumptions

Typical local URLs (verify the actual project settings):

- React/Vite: `http://localhost:5173`
- FastAPI: `http://localhost:8000`
- FastAPI OpenAPI docs: `http://localhost:8000/docs`
- Neon: hosted PostgreSQL database

The frontend and backend may use different ports or commands in the current project. Preserve working local setup where possible.

## 3. Backend service: FastAPI on Vercel

### Inspect first

Determine:
- The actual FastAPI application import path, such as `app.main:app` or `main:app`
- Whether dependencies are declared in `requirements.txt`, `pyproject.toml`, Poetry, uv, or another tool
- Whether the app currently binds to a fixed port
- How the database connection is initialized
- Whether migrations are used (for example, Alembic)

### Vercel service configuration

The repository-root `vercel.json` defines a `backend` service rooted at `backend` with the `fastapi` framework. Vercel builds and serves it as a function; do not configure a separate Render service or a fixed Uvicorn port. Set backend-only variables in the Vercel project environment:

```text
DATABASE_URL=<Neon PostgreSQL connection string>
NEON_AUTH_URL=<Neon Auth URL>
ADMIN_EMAILS=<comma-separated permitted email addresses>
```

`CORS_ORIGINS` is only needed for direct cross-origin browser requests. The configured Vercel rewrites keep frontend API traffic same-origin.

### Neon connection details

- Copy the connection string from the Neon console into the backend host's environment-variable settings.
- Use a pooled connection string if appropriate for the application's database driver and connection pattern.
- Confirm the required SSL behavior for Neon and the selected driver.
- Never commit `.env` files or credentials.
- Do not rename or modify database schemas merely to deploy the app.

### Health endpoint

If the project does not already have a suitable health endpoint, consider adding a minimal endpoint after inspecting existing routes:

```python
@app.get("/api/health")
def health():
    return {"status": "ok"}
```

Only add it if it fits the existing route conventions. A simple health endpoint does not prove the database is reachable; add a database health check only if needed and implemented safely.

## 4. Frontend deployment: React + TypeScript on Vercel

### Inspect first

Determine:
- Whether the project uses Vite, Create React App, Next.js, or another tool
- The correct frontend root directory
- The package manager and lockfile
- The actual build command and output directory

For a typical Vite app:
- Build command: `npm run build`
- Output directory: `dist`
- Install command: usually inferred from the lockfile

Do not apply Vite settings if the project uses a different framework.

### API base URL

For a Vite app, frontend code may read the API URL like this:

```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

A request could then look like:

```typescript
const response = await fetch(`${API_URL}/api/health`);

if (!response.ok) {
  throw new Error(`API request failed: ${response.status}`);
}

const result = await response.json();
```

Adapt the example to the existing API client, error handling, and route paths rather than duplicating API configuration.

In Vercel, leave `VITE_API_URL` unset. The client defaults to `/api`, which the root `vercel.json` rewrites to the backend service. Set the public Neon Auth URL for the frontend build:

```text
VITE_NEON_AUTH_URL=<Neon Auth URL>
```

For local development, either leave `VITE_API_URL` unset and use the Vite `/api` proxy or point it directly at the backend:

```text
VITE_API_URL=http://localhost:8000
```

These are examples; confirm the actual backend URL and API prefix. Vite variables prefixed with `VITE_` are bundled into browser code, so they must never contain secrets.

If the app uses another frontend framework, use its supported public environment-variable convention instead.

## 5. FastAPI CORS configuration

The deployed frontend and backend usually have different origins. Configure FastAPI CORS with the exact origins that need browser access.

Example only:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://<your-project>.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Requirements:
- Replace example domains with actual origins.
- Include local development origins only as needed.
- Do not use `allow_origins=["*"]` together with credentialed requests.
- If cookies or session authentication are used, inspect the authentication flow before choosing CORS and cookie settings.
- CORS is not authentication; protect API endpoints independently.
- Vercel's same-origin `/api` rewrite does not require a production CORS origin.

## 6. Secrets and configuration

Create or update a local `.env.example` containing placeholder values only. Do not copy real secrets into it.

Example (adapt names to the actual code):

```dotenv
# Backend only; never expose to the frontend
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DATABASE?sslmode=require

# Frontend public configuration (Vite example)
VITE_NEON_AUTH_URL=https://<your-neon-auth-domain>
# Optional for direct local backend access. Omit on Vercel to use /api rewrites.
# VITE_API_URL=http://localhost:8000
```

The backend and frontend may need separate environment files, such as `backend/.env.example` and `frontend/.env.example`.

Confirm `.env`, `.env.*` files containing real values, and other secret files are ignored by Git. Keep safe example files tracked. If a secret has ever been committed, removing the file is not enough; rotate the secret.

## 7. Database migrations and startup behavior

Before deployment:
- Identify whether schema migrations are managed by Alembic or another tool.
- Do not run `create_all`, migrations, or schema-altering commands against production without confirming the existing workflow and obtaining approval.
- Avoid relying on application startup to perform risky schema changes.
- Confirm the deployed backend can connect to Neon with the expected role and permissions.
- Verify connection pooling and connection limits if the app opens many database connections.

## 8. Suggested deployment sequence

1. Inspect repository and current local commands.
2. Confirm the app works locally and document its current behavior.
3. Check `.gitignore` and remove secrets from tracked files if necessary; rotate exposed credentials.
4. Make minimal configuration changes for environment-based API URLs, CORS, and production startup.
5. Test the frontend build and backend startup locally.
6. Push the code to GitHub.
7. Create one Vercel project from the repository root so it reads `vercel.json` and builds both services.
8. Configure `DATABASE_URL`, `NEON_AUTH_URL`, and `ADMIN_EMAILS` for the backend service; configure `VITE_NEON_AUTH_URL` for the frontend service. Do not set `VITE_API_URL` on Vercel.
9. Configure Neon Auth's allowed origins and Google OAuth redirect URLs for the deployed Vercel domain.
10. Deploy and verify `/health`, sign-in, API reads, and safe writes. The API calls should use the same Vercel origin under `/api`.

## 9. Verification checklist

### Local
- [ ] Frontend starts using the documented command.
- [ ] Backend starts using the documented command.
- [ ] Frontend API requests reach FastAPI.
- [ ] FastAPI connects to Neon.
- [ ] No secrets are exposed in frontend source or browser bundles.
- [ ] Frontend production build succeeds.

### Production
- [ ] Vercel builds both backend and frontend services.
- [ ] `/health` and `/api/*` are routed to FastAPI over HTTPS.
- [ ] Backend can connect to Neon.
- [ ] Frontend uses same-origin `/api` requests, not localhost or a separate backend URL.
- [ ] Core user flows work end to end.
- [ ] Secrets are configured in hosting dashboards, not committed to Git.
- [ ] Logs do not expose credentials or sensitive data.

## 10. What the AI assistant should deliver

After inspecting the repository, provide:

1. A concise summary of the current project structure and detected tools.
2. The exact files that need changes, with a brief reason for each.
3. Minimal patches or edits to those files.
4. The exact local commands to verify the changes.
5. The precise Vercel multi-service settings required for this repository.
6. A list of environment variables, specifying which service each belongs to and whether each value is secret.
7. Any unresolved questions or risks that must be addressed before deployment.

Do not assume the example paths, API endpoints, or hosting URLs in this document match the repository. Verify them first.
