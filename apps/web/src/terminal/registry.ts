import type { CommandDefinition, CommandInfo } from "./types";

/** Command names and aliases: lowercase, start with a letter, then letters, digits, `_` or `-`. */
const NAME_PATTERN = /^[a-z][a-z0-9_-]*$/;

export interface CommandRegistry {
  /** Look a command up by name or alias, case-insensitively. Unknown names return undefined. */
  resolve(name: string): CommandDefinition | undefined;
  /** Every command's public description, in registration order. */
  list(): readonly CommandInfo[];
}

/**
 * Build a registry. Throws if a name or alias is invalid or used twice, so a typo is caught the
 * first time the app loads. Lookups use a Map, so names like `constructor` or `__proto__` never
 * resolve to anything inherited from Object.prototype.
 */
export function createRegistry(definitions: readonly CommandDefinition[]): CommandRegistry {
  const byName = new Map<string, CommandDefinition>();
  const infos: CommandInfo[] = [];

  for (const def of definitions) {
    const names = [def.name, ...def.aliases];
    for (const name of names) {
      if (!NAME_PATTERN.test(name)) {
        throw new Error(`Invalid command name: ${JSON.stringify(name)}`);
      }
      if (byName.has(name)) {
        throw new Error(`Duplicate command name or alias: ${name}`);
      }
      byName.set(name, def);
    }
    infos.push(Object.freeze({ name: def.name, aliases: [...def.aliases], usage: def.usage, summary: def.summary }));
  }

  const list = Object.freeze(infos);
  return {
    resolve: (name) => byName.get(name.toLowerCase()),
    list: () => list,
  };
}
