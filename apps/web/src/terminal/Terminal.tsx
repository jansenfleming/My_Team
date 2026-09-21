import { useEffect, useId, useLayoutEffect, useRef } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useTerminal } from "./useTerminal";
import type { UseTerminalOptions } from "./useTerminal";
import "./terminal.css";

export interface TerminalProps extends UseTerminalOptions {
  /** Focus the command input on first render. Default true. */
  readonly autoFocus?: boolean;
}

/**
 * Keyboard-first terminal. Every line, including server or user text, is rendered as a React text
 * node: nothing here ever sets innerHTML. The masked prompt uses an uncontrolled password input,
 * so a secret never enters React state, the scrollback, or history.
 */
export function Terminal({ autoFocus = true, ...options }: TerminalProps) {
  const term = useTerminal(options);
  const { text } = options;
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const lastSecretPrompt = useRef(term.secretPrompt);
  const secretActive = term.secretPrompt !== null;

  // Keep the newest output in view (instant, so it is fine under prefers-reduced-motion).
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [term.lines]);

  // The input element is swapped when a masked prompt opens or closes: keep focus on it.
  useEffect(() => {
    if (lastSecretPrompt.current !== term.secretPrompt) {
      lastSecretPrompt.current = term.secretPrompt;
      inputRef.current?.focus();
    }
  }, [term.secretPrompt]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (secretActive) {
      const el = inputRef.current;
      const value = el?.value ?? "";
      if (el) el.value = "";
      term.submitSecret(value);
    } else {
      void term.submit();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const el = event.currentTarget;
    const hasSelection = el.selectionStart !== el.selectionEnd;
    if (event.key === "Escape" && secretActive) {
      event.preventDefault();
      term.cancel();
    } else if (event.ctrlKey && event.key.toLowerCase() === "c" && !hasSelection) {
      event.preventDefault();
      term.cancel();
    } else if (secretActive) {
      return;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      term.historyPrev();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      term.historyNext();
    } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      term.clear();
    }
  };

  const focusInput = () => {
    if (window.getSelection()?.toString()) return; // do not steal focus while the user selects text
    inputRef.current?.focus();
  };

  const commonInputProps = {
    id: inputId,
    ref: inputRef,
    className: "terminal-input",
    autoComplete: "off",
    autoCapitalize: "off",
    autoCorrect: "off",
    spellCheck: false,
    enterKeyHint: "send",
    onKeyDown,
  } as const;

  return (
    // The container click only forwards focus to the input, which is itself keyboard-reachable.
    <div className="terminal" role="region" aria-label={text.regionLabel} onClick={focusInput}>
      <div className="terminal-log" role="log" aria-live="polite" aria-label={text.logLabel} aria-busy={term.busy} ref={logRef}>
        {term.lines.map((line) => (
          <div key={line.id} className={`terminal-line terminal-line--${line.kind}`} data-kind={line.kind}>
            {line.kind === "input" && <span className="terminal-prompt">{line.prompt}</span>}
            <span className="terminal-text">{line.text}</span>
          </div>
        ))}
      </div>
      <form className="terminal-form" onSubmit={onSubmit}>
        <span className="terminal-prompt" aria-hidden="true">
          {secretActive ? term.secretPrompt : term.prompt}
        </span>
        {secretActive ? (
          <input
            {...commonInputProps}
            key="secret"
            type="password"
            aria-label={term.secretPrompt ?? undefined}
            maxLength={term.maxSecretLength}
            autoFocus
          />
        ) : (
          <input
            {...commonInputProps}
            key="command"
            type="text"
            aria-label={text.inputLabel}
            maxLength={term.maxInputLength}
            value={term.input}
            onChange={(event) => term.setInput(event.target.value)}
            autoFocus={autoFocus}
          />
        )}
      </form>
    </div>
  );
}
