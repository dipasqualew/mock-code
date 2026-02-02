import { topLevelHelp, runHelp, createScenarioHelp } from "./help";

export interface RunArgs {
  command: "run";
  scenarioPath: string | null;
  prompt: string | null;
  hooksConfigPath: string | null;
}

export interface CreateScenarioArgs {
  command: "create-scenario";
}

export interface HelpArgs {
  command: "help";
  helpText: string;
}

export type ParsedArgs = RunArgs | CreateScenarioArgs | HelpArgs;

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);

  if (args.length === 0) {
    return { command: "run", scenarioPath: null, prompt: null, hooksConfigPath: null };
  }

  const first = args[0];

  // Top-level help
  if (first === "--help" || first === "-h") {
    return { command: "help", helpText: topLevelHelp() };
  }

  // Subcommand: create-scenario
  if (first === "create-scenario") {
    const subArgs = args.slice(1);
    if (subArgs.includes("--help") || subArgs.includes("-h")) {
      return { command: "help", helpText: createScenarioHelp() };
    }
    if (subArgs.length > 0) {
      throw new Error("create-scenario does not accept additional arguments");
    }
    return { command: "create-scenario" };
  }

  // Subcommand: run (explicit or implicit)
  const flagArgs = first === "run" ? args.slice(1) : args;

  if (flagArgs.includes("--help") || flagArgs.includes("-h")) {
    return { command: "help", helpText: runHelp() };
  }

  let scenarioPath: string | null = null;
  let prompt: string | null = null;
  let hooksConfigPath: string | null = null;

  for (let i = 0; i < flagArgs.length; i++) {
    if (flagArgs[i] === "--scenario") {
      if (i + 1 >= flagArgs.length) {
        throw new Error("Missing value for --scenario");
      }
      scenarioPath = flagArgs[++i];
    } else if (flagArgs[i] === "-p") {
      if (i + 1 >= flagArgs.length) {
        throw new Error("Missing value for -p");
      }
      prompt = flagArgs[++i];
    } else if (flagArgs[i] === "--hooks-config") {
      if (i + 1 >= flagArgs.length) {
        throw new Error("Missing value for --hooks-config");
      }
      hooksConfigPath = flagArgs[++i];
    }
  }

  return { command: "run", scenarioPath, prompt, hooksConfigPath };
}
