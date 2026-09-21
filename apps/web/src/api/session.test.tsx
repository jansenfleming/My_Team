import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { User } from "@site/shared";
import type { ApiClient } from "./client";
import { ApiError } from "./errors";
import { SessionProvider, useSession } from "./session";

const OPERATOR: User = { username: "operator", role: "operator" };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function stubClient(overrides: Partial<ApiClient> = {}): ApiClient {
  const unused = () => Promise.reject(new Error("unexpected call"));
  return {
    getHealth: unused,
    login: unused,
    logout: unused,
    getMe: async () => null,
    listGuestbook: unused,
    createGuestbookEntry: unused,
    deleteGuestbookEntry: unused,
    getDiagnostics: unused,
    ...overrides,
  };
}

function setup(client: ApiClient) {
  const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider client={client}>{children}</SessionProvider>;
  return renderHook(() => useSession(), { wrapper });
}

const offline = () => new ApiError({ code: "network_error", status: 0, message: "down" });

describe("useSession", () => {
  it("starts loading, then reports an anonymous visitor", async () => {
    const me = deferred<User | null>();
    const { result } = setup(stubClient({ getMe: () => me.promise }));
    expect(result.current).toMatchObject({ status: "loading", user: null, error: null });
    await act(async () => me.resolve(null));
    expect(result.current).toMatchObject({ status: "ready", user: null, error: null });
  });

  it("reports the operator when a session already exists", async () => {
    const { result } = setup(stubClient({ getMe: async () => OPERATOR }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.user).toEqual(OPERATOR);
  });

  it("is ready with no user and an error when the session check fails, and recovers on refresh", async () => {
    const getMe = vi.fn<ApiClient["getMe"]>().mockRejectedValueOnce(offline()).mockResolvedValueOnce(OPERATOR);
    const { result } = setup(stubClient({ getMe }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.user).toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    await act(async () => result.current.refresh());
    expect(result.current.user).toEqual(OPERATOR);
    expect(result.current.error).toBeNull();
  });

  it("wraps an unexpected non-ApiError failure in a generic ApiError", async () => {
    const { result } = setup(stubClient({ getMe: () => Promise.reject(new Error("weird")) }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).not.toContain("weird");
  });

  it("login stores the user and passes the credentials straight to the client", async () => {
    const login = vi.fn<ApiClient["login"]>(async () => OPERATOR);
    const { result } = setup(stubClient({ login }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    let returned: User | undefined;
    await act(async () => {
      returned = await result.current.login("operator", "pw-123");
    });
    expect(login).toHaveBeenCalledWith("operator", "pw-123");
    expect(returned).toEqual(OPERATOR);
    expect(result.current.user).toEqual(OPERATOR);
    // The password is not exposed anywhere on the session value.
    expect(JSON.stringify(result.current)).not.toContain("pw-123");
  });

  it("a failed login throws the ApiError and leaves the session as it was", async () => {
    const failure = new ApiError({ code: "invalid_credentials", status: 401, message: "no" });
    const { result } = setup(stubClient({ login: () => Promise.reject(failure) }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    await expect(act(async () => result.current.login("operator", "bad"))).rejects.toBe(failure);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("logout clears the user", async () => {
    const { result } = setup(stubClient({ getMe: async () => OPERATOR, logout: async () => undefined }));
    await waitFor(() => expect(result.current.user).toEqual(OPERATOR));
    await act(async () => result.current.logout());
    expect(result.current.user).toBeNull();
  });

  it("a failed logout throws and keeps the user, since the server still has the session", async () => {
    const failure = offline();
    const { result } = setup(stubClient({ getMe: async () => OPERATOR, logout: () => Promise.reject(failure) }));
    await waitFor(() => expect(result.current.user).toEqual(OPERATOR));
    await expect(act(async () => result.current.logout())).rejects.toBe(failure);
    expect(result.current.user).toEqual(OPERATOR);
  });

  it("ignores an initial session check that finishes after a login", async () => {
    const me = deferred<User | null>();
    const { result } = setup(stubClient({ getMe: () => me.promise, login: async () => OPERATOR }));
    await act(async () => {
      await result.current.login("operator", "pw");
    });
    expect(result.current).toMatchObject({ status: "ready", user: OPERATOR });
    await act(async () => me.resolve(null)); // stale "anonymous" answer arrives late
    expect(result.current.user).toEqual(OPERATOR);
  });

  it("a failed login does not strand the initial session check", async () => {
    const me = deferred<User | null>();
    const { result } = setup(stubClient({ getMe: () => me.promise, login: () => Promise.reject(offline()) }));
    await expect(act(async () => result.current.login("operator", "pw"))).rejects.toBeInstanceOf(ApiError);
    await act(async () => me.resolve(null));
    expect(result.current.status).toBe("ready");
  });

  it("does not update state after unmount", async () => {
    const me = deferred<User | null>();
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { unmount } = setup(stubClient({ getMe: () => me.promise }));
    unmount();
    await act(async () => me.resolve(OPERATOR));
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it("throws a clear error when used outside the provider", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useSession())).toThrow(/SessionProvider/);
    errors.mockRestore();
  });
});
