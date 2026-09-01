# ArivuKids Legacy Migration Contract

Target legacy site: `arivukids.omsaravanabhava.org`
Source product: KirthiVerse

## Non-negotiable rules
- Preserve existing learning content and history; migration is additive and reversible.
- Do not rename Android/iOS package IDs as part of the website migration.
- Do not commit secrets, tokens, private user data, signing material, or credentials.
- Keep KVS internal route/release identifiers unless a functional migration requires a documented change.
- Preserve accessibility, privacy, safety, legal, offline/PWA and direct-route behaviour.
- Use the migration branch and pull request workflow; do not rewrite `main` history.
- DNS/Cloudflare changes must be performed separately and only after repository validation.

## Migration phases
1. Legacy domain + public brand metadata.
2. Brand sweep across visible UI/legal/SEO surfaces.
3. Build and route validation.
4. DNS cutover and live smoke test.
5. Keep KirthiVerse flagship work separate from this legacy branch.
