export const DEFAULT_HISTORY_LIMIT = 100;

/**
 * In-memory command history with up/down navigation. Session only: nothing is written to
 * storage. Masked (secret) input never reaches this class; the terminal hook does not call
 * `add` for it.
 */
export class CommandHistory {
  readonly #limit: number;
  readonly #entries: string[] = [];
  #cursor = 0; // index into #entries; equal to length means "not browsing"
  #draft = "";

  constructor(limit: number = DEFAULT_HISTORY_LIMIT) {
    this.#limit = Math.max(1, Math.floor(limit));
  }

  get size(): number {
    return this.#entries.length;
  }

  /** Copy of the stored entries, oldest first. */
  entries(): readonly string[] {
    return [...this.#entries];
  }

  /** Record a submitted line. Blank lines and an immediate repeat of the last entry are skipped. */
  add(line: string): void {
    const entry = line.trim();
    if (entry !== "" && this.#entries[this.#entries.length - 1] !== entry) {
      this.#entries.push(entry);
      if (this.#entries.length > this.#limit) this.#entries.shift();
    }
    this.reset();
  }

  /** Step back to an older entry. `current` is the text being edited; it is kept as a draft. */
  prev(current: string): string | undefined {
    if (this.#entries.length === 0) return undefined;
    if (this.#cursor === this.#entries.length) this.#draft = current;
    if (this.#cursor > 0) this.#cursor -= 1;
    return this.#entries[this.#cursor];
  }

  /** Step forward; past the newest entry it returns the draft. Undefined when not browsing. */
  next(): string | undefined {
    if (this.#cursor >= this.#entries.length) return undefined;
    this.#cursor += 1;
    return this.#cursor === this.#entries.length ? this.#draft : this.#entries[this.#cursor];
  }

  /** Stop browsing and drop the draft. */
  reset(): void {
    this.#cursor = this.#entries.length;
    this.#draft = "";
  }
}
