export interface ParsedArgs {
  scenarioPath: string;
  prompt: string | null;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);

  let scenarioPath: string | null = null;
  let prompt: string | null = null;

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
    }
  }

  if (!scenarioPath) {
    throw new Error("Missing required --scenario flag");
  }

  return { scenarioPath, prompt };
}
