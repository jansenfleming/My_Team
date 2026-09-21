# QA-003: HTTP-parse-level errors (400 and 431) do not use the contract error body

- Severity: Low
- Status: open (non-blocking)
- Found: 2026-09-21, against `feat/api-core` at commit `170d002`
- Owner to fix: backend-engineer (`apps/api/src/app.ts`), or the Architect if the contract is amended instead
- Affected: every route, when the request is malformed at the HTTP level (before Fastify creates a request object)
- Test case ID: A-CON-2, A-HDR-5 (`qa/test-plan.md`)
- Target: local instance on 127.0.0.1 (spawned from the branch), raw socket

## Summary
Contract section 2 says every non-2xx response has the `ApiError` body and carries `X-Request-Id`. Requests that Node's HTTP parser rejects (bad request line, oversized headers, conflicting or invalid Content-Length, space or NUL in the path) are answered by Fastify's default client-error handler with a different shape and no `X-Request-Id`. No secret or path leaks; a client that reads `body.error.code` gets `undefined` (here `error` is a string).

## Reproduction
Localhost only, against the branch's API on a free port:
```
QA_API_DIR=<worktree>/apps/api node --test qa/gates/b2-api-core.attack.test.mjs   # test "observation QA-003"
```
Or by hand (`PORT=3411 npm start -w @site/api`, then):
```
printf 'GARBAGE\r\n\r\n' | nc 127.0.0.1 3411
printf 'GET /api/health HTTP/1.1\r\nHost: 127.0.0.1\r\nX-Big: %s\r\n\r\n' "$(head -c 20000 /dev/zero | tr '\0' A)" | nc 127.0.0.1 3411
```

## Expected
`HTTP 400` or `431` with `{"error":{"code":"validation_error","message":"...","requestId":"<uuid>"}}` and an `X-Request-Id` header (contract section 1 and 2), or an explicit contract exception for parse-level errors.

## Actual
Real output (bodies verbatim):
```
garbage request line        400  {"error":"Bad Request","message":"Client Error","statusCode":400}
bad http version            400  {"error":"Bad Request","message":"Client Error","statusCode":400}
Content-Length and Transfer-Encoding both, or two Content-Length   400  same body
space or NUL in path        400  same body
Content-Length: abc         400  same body
20 KB header, 20 KB URL, many cookies   431  {"error":"Request Header Fields Too Large","message":"Exceeded maximum ...
```
None carries `X-Request-Id`. `frameworkErrors` handles errors after a request object exists (a malformed percent-encoding in the URL did produce a proper contract body: `/api/%`, `/api/%zz`), but not these.

## Impact
Low. Only hostile or broken clients (browsers do not send these) see it, and there is no information disclosure. It matters for the web client (F3): its error parser must not assume `error` is an object on non-2xx responses, which the Architect already put on the F3 done-criteria. It is also a small contract inconsistency that a strict conformance test (Q3) would flag.

## Suggested fix direction
Set Fastify's `clientErrorHandler` to write the contract body with a generated request id and `Connection: close`, keeping the response tiny and never echoing input. Or amend the contract: "errors raised by the HTTP parser before routing use a plain `{error, message, statusCode}` body". Either is fine; the important part is that it is documented.

## Retest log
| Date | Commit | Result | Evidence and adjacent cases run |
|---|---|---|---|
