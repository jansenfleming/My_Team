// Dev-console / view-source message, egg 1b (docs/design/easter-eggs.md §1b, board task
// E6). Fires exactly once per full browser page load — called from a
// `useEffect(() => ..., [])` in App (src/App.tsx), which runs once per App mount and
// never again on a client-side route change (only the Pages component re-renders on
// navigation; App itself doesn't remount — see App.tsx). Kept as a plain function rather
// than inlined in App.tsx so a test can spy on console.log and call it directly, or
// assert call counts after rendering the app, without duplicating the three strings.
//
// Exact strings and call order per docs/design/easter-eggs.md §1b — do not reword or
// reorder. The inline style intentionally hardcodes literal values that match D2's real
// tokens in spirit (font-weight:700 matches --zjc-weight-bold, monospace matches
// --zjc-font-mono) since a console.log format string can't reference CSS custom
// properties directly — this is not a token violation, per that spec's own note.
export function logDevConsoleMessage(): void {
  console.log(
    "%cZeroJance",
    "font-weight:700;font-size:16px;font-family:monospace;letter-spacing:0.02em;",
  );
  console.log("console.log is still the most common debugger. No shame in it.");
  console.log("Not everything here is in the catalog.");
}
