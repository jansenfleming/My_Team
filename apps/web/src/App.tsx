import { PROMPT, SITE_NAME, terminalText, WELCOME_LINES } from "./content/site";
import { registry } from "./commands";
import { Terminal } from "./terminal";

export function App() {
  return (
    <main className="shell">
      <h1>{SITE_NAME}</h1>
      <Terminal registry={registry} text={terminalText} prompt={PROMPT} initialLines={WELCOME_LINES} />
    </main>
  );
}
