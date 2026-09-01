# KirthiVerse Production Operations

## Production endpoints

- Website: `https://kirthiverse.omsaravanabhava.org/`
- API root: `https://api-kirthiverse.omsaravanabhava.org/`
- Health: `https://api-kirthiverse.omsaravanabhava.org/health`
- API status: `https://api-kirthiverse.omsaravanabhava.org/api/v1/status`
- Browser status page: `https://kirthiverse.omsaravanabhava.org/api-status.html`

## Expected contract

- `status`: `ok`
- `service`: `kirthiverse-api`
- `environment`: `production`
- `version`: `1.0.0`
- `apiVersion`: `v1`
- `requestId`: non-empty

## Deployment controls

- GitHub Pages publishes from `main` and repository root.
- Worker source is under `worker/`.
- Worker deployment is manual through `.github/workflows/deploy-worker.yml`.
- Production smoke tests run through `.github/workflows/production-smoke.yml`.
- Only the exact custom domain `api-kirthiverse.omsaravanabhava.org` may route to this Worker.
- Never add `*.omsaravanabhava.org/*` or another wildcard Worker route.

## GitHub Pages DNS state

The repository `CNAME` file contains `kirthiverse.omsaravanabhava.org`. A temporary yellow `DNS Check in Progress` indicator does not require changing the domain while the site and HTTPS remain reachable. Do not remove the custom domain or disable HTTPS solely because the check is still refreshing.

## Required GitHub secrets for Worker deployment

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Do not store either value in repository files, frontend variables, issues, workflow logs, or documentation.

## Rate limiting

The source-controlled binding is `RATE_LIMITER`, namespace `31003`, with 120 requests per 60 seconds. Health, status, and version endpoints remain unrestricted. Functional endpoints should use browser client ID, authenticated identity, or tenant identity before falling back to IP address.

## Incident checks

1. Run `scripts/validate-production.ps1`.
2. Check GitHub Actions `production-smoke`.
3. Check Cloudflare Workers Observability for `worker_exception` and elevated 4xx/5xx responses.
4. Verify that the custom domain still points only to `kirthiverse-api`.
5. Roll back by deploying the last known-good Git commit; do not create temporary wildcard routes.

## Deferred work

Authentication remains deferred until private child, parent, profile, progress, history, or administrative routes are implemented. Email Routing is an account-level Cloudflare task and must be verified separately.
