// Compile-time checks (enforced by `npm run typecheck`): the inferred types equal the shapes in
// api-contract.md sections 2 and 5. The runtime `it` only exists so vitest reports the file.
import { expectTypeOf, it } from "vitest";
import type { ApiError, ErrorCode, GuestbookEntry, GuestbookListResponse, Role, User } from "./index";

it("inferred types equal the contract types", () => {
  expectTypeOf<Role>().toEqualTypeOf<"operator">();
  expectTypeOf<User>().toEqualTypeOf<{ username: string; role: Role }>();
  expectTypeOf<GuestbookEntry>().toEqualTypeOf<{ id: number; handle: string; message: string; createdAt: string }>();
  expectTypeOf<GuestbookListResponse>().toEqualTypeOf<{ items: GuestbookEntry[]; nextBefore: number | null }>();
  expectTypeOf<ApiError["error"]["code"]>().toEqualTypeOf<ErrorCode>();
  expectTypeOf<ApiError["error"]["requestId"]>().toEqualTypeOf<string>();
  expectTypeOf<ErrorCode>().toEqualTypeOf<
    | "validation_error"
    | "invalid_credentials"
    | "unauthenticated"
    | "origin_rejected"
    | "forbidden"
    | "not_found"
    | "payload_too_large"
    | "unsupported_media_type"
    | "rate_limited"
    | "unavailable"
    | "internal_error"
  >();
});
