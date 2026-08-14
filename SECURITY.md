# Production Security Runbook

## Repository and build controls

- Do not commit `.env`, `.env.local`, private keys, certificates, or service-role credentials. Use repository or environment secrets for CI values.
- `VITE_SUPABASE_PUBLISHABLE_KEY` is the only Supabase key permitted in the browser. Service-role keys and database connection strings belong only in Supabase Edge Functions or a server runtime.
- The deployment workflow runs `npm audit --audit-level=high` before building. A high or critical advisory blocks deployment.
- Run a history scanner such as TruffleHog across all branches and tags before launch. Revoke and rotate any active credential before rewriting history.

## Supabase controls

- Every application table must have Row-Level Security enabled and explicit owner-scoped policies.
- Administrative or cross-user operations must run in an authenticated Edge Function with server-side authorization checks.
- Apply migrations through the Supabase migration pipeline and verify RLS in the target project after deployment.
- The `trigger_debug_log` table is deny-by-default and is not available to browser roles.

## Hosting controls

`public/_headers` contains the security header policy for hosts that support the `_headers` convention. GitHub Pages does not apply custom response headers from static files, so production hosting must enforce CSP, HSTS, HTTPS redirects, and the remaining headers at the CDN or reverse proxy before launch.

## Known dependency blocker

As of August 14, 2026, `npm audit --audit-level=high` reports high-severity advisories, including an unfixed advisory for `xlsx`. Deployment must remain blocked until dependencies are upgraded, isolated behind a trusted parser, or the package is removed.

## External launch tasks

Configure TLS certificates, HTTPS redirects, HSTS, WAF/edge rate limits, bot mitigation, secret-manager injection, backup encryption, cookie policy, Search Console/Bing ownership, and TruffleHog history scanning in the production providers. These controls cannot be established from a static GitHub Pages bundle alone.