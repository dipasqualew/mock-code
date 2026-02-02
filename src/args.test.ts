import { describe, expect, test } from "bun:test";
import { parseArgs } from "./args";
import { topLevelHelp, runHelp, createScenarioHelp } from "./help";

describe("parseArgs", () => {
  test("parses --scenario and -p flags", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json", "-p", "hello"]);
    expect(result).toEqual({ command: "run", scenarioPath: "test.json", prompt: "hello", hooksConfigPath: null });
  });

  test("parses --scenario without -p (interactive mode)", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json"]);
    expect(result).toEqual({ command: "run", scenarioPath: "test.json", prompt: null, hooksConfigPath: null });
  });

  test("parses flags in any order", () => {
    const result = parseArgs(["node", "index.ts", "-p", "hello", "--scenario", "test.json"]);
    expect(result).toEqual({ command: "run", scenarioPath: "test.json", prompt: "hello", hooksConfigPath: null });
  });

  test("parses without --scenario (default mode)", () => {
    const result = parseArgs(["node", "index.ts", "-p", "hello"]);
    expect(result).toEqual({ command: "run", scenarioPath: null, prompt: "hello", hooksConfigPath: null });
  });

  test("throws on missing --scenario value", () => {
    expect(() => parseArgs(["node", "index.ts", "--scenario"])).toThrow("Missing value for --scenario");
  });

  test("throws on missing -p value", () => {
    expect(() => parseArgs(["node", "index.ts", "--scenario", "test.json", "-p"])).toThrow("Missing value for -p");
  });

  test("returns run command with null values when no arguments provided", () => {
    const result = parseArgs(["node", "index.ts"]);
    expect(result).toEqual({ command: "run", scenarioPath: null, prompt: null, hooksConfigPath: null });
  });

  test("parses --hooks-config flag", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json", "--hooks-config", "hooks.json"]);
    expect(result).toEqual({ command: "run", scenarioPath: "test.json", prompt: null, hooksConfigPath: "hooks.json" });
  });

  test("parses --hooks-config with -p flag", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json", "-p", "hello", "--hooks-config", "hooks.json"]);
    expect(result).toEqual({ command: "run", scenarioPath: "test.json", prompt: "hello", hooksConfigPath: "hooks.json" });
  });

  test("throws on missing --hooks-config value", () => {
    expect(() => parseArgs(["node", "index.ts", "--scenario", "test.json", "--hooks-config"])).toThrow("Missing value for --hooks-config");
  });

});

describe("parseArgs subcommands", () => {
  test("parses 'run' subcommand with flags", () => {
    const result = parseArgs(["node", "index.ts", "run", "--scenario", "test.json", "-p", "hello"]);
    expect(result).toEqual({ command: "run", scenarioPath: "test.json", prompt: "hello", hooksConfigPath: null });
  });

  test("parses 'run' subcommand without flags", () => {
    const result = parseArgs(["node", "index.ts", "run"]);
    expect(result).toEqual({ command: "run", scenarioPath: null, prompt: null, hooksConfigPath: null });
  });

  test("parses 'create-scenario' subcommand", () => {
    const result = parseArgs(["node", "index.ts", "create-scenario"]);
    expect(result).toEqual({ command: "create-scenario" });
  });

  test("throws when create-scenario subcommand has extra arguments", () => {
    expect(() => parseArgs(["node", "index.ts", "create-scenario", "--unexpected"])).toThrow("create-scenario does not accept additional arguments");
  });
});

describe("parseArgs help flags", () => {
  test("--help returns top-level help", () => {
    const result = parseArgs(["node", "index.ts", "--help"]);
    expect(result).toEqual({ command: "help", helpText: topLevelHelp() });
  });

  test("-h returns top-level help", () => {
    const result = parseArgs(["node", "index.ts", "-h"]);
    expect(result).toEqual({ command: "help", helpText: topLevelHelp() });
  });

  test("run --help returns run help", () => {
    const result = parseArgs(["node", "index.ts", "run", "--help"]);
    expect(result).toEqual({ command: "help", helpText: runHelp() });
  });

  test("run -h returns run help", () => {
    const result = parseArgs(["node", "index.ts", "run", "-h"]);
    expect(result).toEqual({ command: "help", helpText: runHelp() });
  });

  test("--help with implicit run returns run help", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json", "--help"]);
    expect(result).toEqual({ command: "help", helpText: runHelp() });
  });

  test("create-scenario --help returns create-scenario help", () => {
    const result = parseArgs(["node", "index.ts", "create-scenario", "--help"]);
    expect(result).toEqual({ command: "help", helpText: createScenarioHelp() });
  });

  test("create-scenario -h returns create-scenario help", () => {
    const result = parseArgs(["node", "index.ts", "create-scenario", "-h"]);
    expect(result).toEqual({ command: "help", helpText: createScenarioHelp() });
  });
});
