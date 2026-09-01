# KirthiVerse Production Launch Checklist

## Completed

- [x] GitHub Pages publishing from `main` and repository root
- [x] Custom domain: `kirthiverse.omsaravanabhava.org`
- [x] Cloudflare DNS and HTTPS
- [x] Worker custom domain: `api-kirthiverse.omsaravanabhava.org`
- [x] API versioning under `/api/v1`
- [x] Health, status, version, and ping endpoints
- [x] Service identity validation: `kirthiverse-api`
- [x] Environment validation: `production`
- [x] Version contract: `1.0.0`
- [x] Request IDs
- [x] Exact-origin CORS
- [x] Browser API client and production API base URL
- [x] Browser API status page
- [x] Worker source committed under `worker/`
- [x] Wrangler exact-domain configuration
- [x] Rate-limit binding declared in source
- [x] Structured observability declared in source
- [x] Production smoke workflow
- [x] Manual Worker deployment workflow
- [x] Production validation script
- [x] Production operations runbook

## Account-level activation required

- [ ] Add GitHub Actions secret `CLOUDFLARE_API_TOKEN`
- [ ] Add GitHub Actions secret `CLOUDFLARE_ACCOUNT_ID`
- [ ] Run the `deploy-worker` workflow once
- [ ] Confirm the deployed Worker contains the source-controlled rate-limit and observability configuration
- [ ] Configure Cloudflare Email Routing and verify the destination mailbox

## Product implementation required before claiming full production readiness

- [ ] Approve learning-world, lesson, question, quiz, reward, and age-band datasets
- [ ] Implement real `/api/v1/learning-worlds`, `/lessons`, `/quiz`, and public catalogue routes
- [ ] Select an AI provider and securely add its key as a Worker secret
- [ ] Implement child-safety policy, age controls, AI moderation, cost controls, and fallback behaviour
- [ ] Define authentication provider, parent-child account model, consent model, and authorization rules
- [ ] Implement privacy, deletion, retention, safeguarding, and audit controls before storing child data
- [ ] Complete load, abuse, accessibility, security, safeguarding, and educational-quality testing

## Release rule

Do not label KirthiVerse as a fully production-ready child-facing AI platform until every unchecked account-level and product implementation item above has been completed and independently validated. The current deployment is a healthy production foundation and public website/API baseline, not a finished learning backend.
