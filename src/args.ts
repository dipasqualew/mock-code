export interface ParsedArgs {
  scenarioPath: string | null;
  prompt: string | null;
  hooksConfigPath: string | null;
  createScenario: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);

  let scenarioPath: string | null = null;
  let prompt: string | null = null;
  let hooksConfigPath: string | null = null;
  let createScenario = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scenario") {
      if (i + 1 >= args.length) {
        throw new Error("Missing value for --scenario");
      }
      scenarioPath = args[++i];
    } else if (args[i] === "-p") {
      if (i + 1 >= args.length) {
        throw new Error("Missing value for -p");
      }
      prompt = args[++i];
    } else if (args[i] === "--hooks-config") {
      if (i + 1 >= args.length) {
        throw new Error("Missing value for --hooks-config");
      }
      hooksConfigPath = args[++i];
    } else if (args[i] === "--create-scenario") {
      createScenario = true;
    }
  }

  if (createScenario && (prompt !== null || scenarioPath !== null)) {
    throw new Error("--create-scenario cannot be combined with -p or --scenario");
  }

  return { scenarioPath, prompt, hooksConfigPath, createScenario };
}
