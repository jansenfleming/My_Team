import { commandText } from "../content/site";
import { createRegistry, outputLine } from "../terminal";
import type { CommandDefinition } from "../terminal";

/**
 * Placeholder commands so the F2 terminal is usable in `npm run dev`. Task F4 replaces this
 * module with the command set from the design spec (docs/design/terminal-commands.md).
 */
const help: CommandDefinition = {
  name: "help",
  aliases: [],
  ...commandText.help,
  run: (ctx) => [
    outputLine(commandText.helpHeader),
    ...ctx.commands.map((c) => outputLine(`  ${c.usage.padEnd(12)} ${c.summary}`)),
  ],
};

const clear: CommandDefinition = {
  name: "clear",
  aliases: [],
  ...commandText.clear,
  run: (ctx) => {
    ctx.clear();
  },
};

export const registry = createRegistry([help, clear]);
