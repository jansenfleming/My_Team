import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dispatch } from "./dispatch";
import { CommandHistory, DEFAULT_HISTORY_LIMIT } from "./history";
import { MAX_INPUT_LENGTH } from "./parser";
import type { CommandRegistry } from "./registry";
import type { CommandContext, Line, OutputLine, TerminalText } from "./types";

export const DEFAULT_MAX_SCROLLBACK = 500;
/** Default cap for the masked prompt. Callers with a server-side limit (the API's PASSWORD_MAX) pass it in. */
export const DEFAULT_MAX_SECRET_LENGTH = 256;

export interface UseTerminalOptions {
  readonly registry: CommandRegistry;
  readonly text: TerminalText;
  /** Prompt shown in front of the input and on echoed lines. Site copy: comes from src/content/. */
  readonly prompt: string;
  /** Lines printed once at start (a welcome banner, for example), as system lines. */
  readonly initialLines?: readonly string[];
  readonly maxScrollback?: number;
  readonly maxInputLength?: number;
  readonly maxSecretLength?: number;
  readonly historyLimit?: number;
}

export interface TerminalApi {
  readonly lines: readonly Line[];
  readonly input: string;
  setInput(value: string): void;
  /** True while a command is running. New submissions are ignored until it finishes. */
  readonly busy: boolean;
  /** Label of the active masked prompt, or null. While set, the UI must collect a secret with submitSecret. */
  readonly secretPrompt: string | null;
  readonly maxInputLength: number;
  readonly maxSecretLength: number;
  readonly prompt: string;
  submit(): Promise<void>;
  submitSecret(value: string): void;
  /** Ctrl+C: cancel the masked prompt, else interrupt the running command, else clear the input. */
  cancel(): void;
  clear(): void;
  historyPrev(): void;
  historyNext(): void;
}

type NewLine = Omit<Line, "id">;

export function useTerminal(options: UseTerminalOptions): TerminalApi {
  const {
    registry,
    text,
    prompt,
    maxScrollback = DEFAULT_MAX_SCROLLBACK,
    maxInputLength = MAX_INPUT_LENGTH,
    maxSecretLength = DEFAULT_MAX_SECRET_LENGTH,
    historyLimit = DEFAULT_HISTORY_LIMIT,
  } = options;

  const nextId = useRef(1);
  const stamp = (lines: readonly NewLine[]): Line[] => lines.map((line) => ({ ...line, id: nextId.current++ }));

  const [lines, setLines] = useState<Line[]>(() =>
    stamp((options.initialLines ?? []).map((t): NewLine => ({ kind: "system", text: t }))).slice(-maxScrollback),
  );
  const [input, setInputState] = useState("");
  const [busy, setBusy] = useState(false);
  const [secretPrompt, setSecretPrompt] = useState<string | null>(null);

  const inputRef = useRef("");
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const secretResolver = useRef<((value: string | null) => void) | null>(null);
  const secretLabel = useRef("");
  const historyRef = useRef<CommandHistory | null>(null);
  historyRef.current ??= new CommandHistory(historyLimit);
  const history = historyRef.current;

  // Latest option values for callbacks that outlive a render.
  const latest = useRef({ registry, text, prompt, maxScrollback, maxInputLength });
  latest.current = { registry, text, prompt, maxScrollback, maxInputLength };

  const append = useCallback((added: readonly NewLine[]) => {
    if (added.length === 0) return;
    const stamped = added.map((line): Line => ({ ...line, id: nextId.current++ }));
    setLines((prev) => [...prev, ...stamped].slice(-latest.current.maxScrollback));
  }, []);

  const setInput = useCallback((value: string) => {
    inputRef.current = value;
    setInputState(value);
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const settleSecret = useCallback((value: string | null) => {
    const resolve = secretResolver.current;
    secretResolver.current = null;
    setSecretPrompt(null);
    resolve?.(value);
  }, []);

  const submit = useCallback(async () => {
    if (busyRef.current) return;
    const raw = inputRef.current;
    setInput("");
    history.add(raw);
    const { registry, text, prompt, maxInputLength } = latest.current;
    append([{ kind: "input", prompt, text: raw }]);
    if (raw.trim() === "") return;

    busyRef.current = true;
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const ctx: CommandContext = {
      clear,
      signal: controller.signal,
      commands: registry.list(),
      readSecret: (label) =>
        new Promise<string | null>((resolve) => {
          secretResolver.current?.(null);
          secretResolver.current = resolve;
          secretLabel.current = label;
          setSecretPrompt(label);
        }),
    };

    let output: OutputLine[] = [];
    try {
      output = await dispatch(raw, ctx, { registry, text, maxInputLength });
    } finally {
      busyRef.current = false;
      abortRef.current = null;
      setBusy(false);
    }
    append(output);
  }, [append, clear, history, setInput]);

  const submitSecret = useCallback(
    (value: string) => {
      if (!secretResolver.current) return;
      // Only the label is echoed. The value goes to the waiting command and nowhere else.
      append([{ kind: "input", prompt: secretLabel.current, text: "" }]);
      settleSecret(value);
    },
    [append, settleSecret],
  );

  const cancel = useCallback(() => {
    if (secretResolver.current) {
      // The waiting command receives null and decides what to print.
      append([{ kind: "input", prompt: secretLabel.current, text: "" }]);
      settleSecret(null);
    } else if (abortRef.current) {
      abortRef.current.abort();
    } else {
      setInput("");
      history.reset();
    }
  }, [append, history, setInput, settleSecret]);

  const historyPrev = useCallback(() => {
    const value = history.prev(inputRef.current);
    if (value !== undefined) setInput(value);
  }, [history, setInput]);

  const historyNext = useCallback(() => {
    const value = history.next();
    if (value !== undefined) setInput(value);
  }, [history, setInput]);

  // On unmount, release a waiting command and stop any running one.
  useEffect(
    () => () => {
      secretResolver.current?.(null);
      secretResolver.current = null;
      abortRef.current?.abort();
    },
    [],
  );

  return useMemo(
    () => ({
      lines,
      input,
      setInput,
      busy,
      secretPrompt,
      maxInputLength,
      maxSecretLength,
      prompt,
      submit,
      submitSecret,
      cancel,
      clear,
      historyPrev,
      historyNext,
    }),
    [lines, input, setInput, busy, secretPrompt, maxInputLength, maxSecretLength, prompt, submit, submitSecret, cancel, clear, historyPrev, historyNext],
  );
}
