# docs/contract-logout: logout accepts an empty JSON body

Author: architect. Branch: `docs/contract-logout`. Base: current `main`. Docs only.

## What changed
`docs/architecture/api-contract.md`: `POST /api/auth/logout` accepts no body, an empty body, or `{}`, with or without `Content-Type: application/json`, and still returns `204`. Reason: Fastify rejects an empty body sent with a JSON content type (`400`), and a fetch wrapper that always sets the header would then break logout. Raised by backend-engineer while planning B4. Changelog line added. The Origin check and rate limit still apply.

## Implementation
B4 (backend). QA's contract test (A-CON-5, A-AUTH-4) should cover: no body, empty body with JSON content type, `{}`, and a non-empty invalid body (still a `400`).
