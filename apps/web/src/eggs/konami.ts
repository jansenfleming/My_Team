// Pure, testable Konami-code sequence matcher and unlock-flag storage, egg 3
// (docs/design/easter-eggs.md §3, board task E6). Kept separate from the DOM keydown
// listener (KonamiEasterEgg.tsx) per that spec's explicit instruction: "keep it separate
// from the DOM listener so it's unit-testable without simulating keydown events."
//
// The unmodified, classic 30-key-era Konami code — no variant, no Start/Select
// substitution (there's nothing on this site those would map to).
export const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

/** The exact localStorage key/value D5 fixes — reused verbatim, not reinvented, by
 * ProductPage's gated lookup (src/pages/ProductPage.tsx). */
export const KONAMI_STORAGE_KEY = "zj_unlocked_200ok";
const KONAMI_UNLOCKED_VALUE = "1";

/** Arrow keys compare exactly (the browser reports them consistently); the two letter
 * keys compare case-insensitively per docs/design/easter-eggs.md §3. */
function keysMatch(pressedKey: string, expectedKey: string): boolean {
  if (expectedKey.startsWith("Arrow")) {
    return pressedKey === expectedKey;
  }
  return pressedKey.toLowerCase() === expectedKey.toLowerCase();
}

/**
 * Advances the sequence-progress index for one keystroke. The caller is responsible for
 * treating a returned value of `KONAMI_SEQUENCE.length` as "complete" (fire the reveal,
 * then reset its own progress state to 0) — this function only computes the next index.
 *
 * - A matching key at the current position advances progress by 1.
 * - A mismatch resets progress to 0, then re-checks the same key against
 *   `KONAMI_SEQUENCE[0]` — if it matches, progress becomes 1 instead of 0. This is the
 *   "fumbled retry" fix: without it, a visitor who mistypes partway through (e.g.
 *   ArrowUp, ArrowUp, ArrowUp) can't restart without an extra keystroke being absorbed.
 */
export function nextKonamiProgress(progress: number, key: string): number {
  const expected = KONAMI_SEQUENCE[progress];
  if (expected !== undefined && keysMatch(key, expected)) {
    return progress + 1;
  }
  const first = KONAMI_SEQUENCE[0];
  return keysMatch(key, first) ? 1 : 0;
}

/** True for elements a keystroke must never be intercepted from — a future text field
 * (there is none in the current shell) typing "b"/"a", or arrow-navigating a <select>,
 * must never silently advance or complete the sequence (docs/design/easter-eggs.md §3). */
export function isEditableTarget(target: Element | null): boolean {
  if (!target) {
    return false;
  }
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
    return true;
  }
  return (target as HTMLElement).isContentEditable === true;
}

// In-memory fallback flag, scoped to the current page session (a module-level variable —
// resets on a real reload). Used only when localStorage itself throws or is unavailable,
// mirroring the try/catch + in-memory-fallback pattern E3 established in
// src/cart/CartContext.tsx: a blocked/unavailable localStorage (private browsing,
// disabled storage) must never crash the app or break the reveal for the current visit —
// only the "stays unlocked next visit" behavior is lost in that fallback case.
let memoryUnlocked = false;

/** Sets the unlock flag. Wrapped in try/catch: a blocked/unavailable localStorage falls
 * back to the in-memory flag above, so the reveal still works for the current visit. */
export function setKonamiUnlocked(): void {
  try {
    window.localStorage.setItem(KONAMI_STORAGE_KEY, KONAMI_UNLOCKED_VALUE);
  } catch {
    // Storage unavailable/blocked — fall back to the in-memory flag below.
  }
  memoryUnlocked = true;
}

/** Reads the unlock flag fresh. ProductPage calls this on every render/mount (per D5)
 * rather than caching it anywhere — the listener and the page are decoupled entirely
 * through this flag. */
export function isKonamiUnlocked(): boolean {
  try {
    if (window.localStorage.getItem(KONAMI_STORAGE_KEY) === KONAMI_UNLOCKED_VALUE) {
      return true;
    }
  } catch {
    // Storage unavailable/blocked — fall through to the in-memory flag.
  }
  return memoryUnlocked;
}

/** Test-only: resets the in-memory fallback flag between tests, since it's a module-level
 * singleton that would otherwise leak state across test cases in the same file. Not
 * called by any application code. */
export function resetKonamiMemoryFlagForTests(): void {
  memoryUnlocked = false;
}
