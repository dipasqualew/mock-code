import { describe, expect, test } from "bun:test";
import { parseArgs } from "./args";

describe("parseArgs", () => {
  test("parses --scenario and -p flags", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json", "-p", "hello"]);
    expect(result).toEqual({ scenarioPath: "test.json", prompt: "hello", hooksConfigPath: null, createScenario: false });
  });

  test("parses --scenario without -p (interactive mode)", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json"]);
    expect(result).toEqual({ scenarioPath: "test.json", prompt: null, hooksConfigPath: null, createScenario: false });
  });

  test("parses flags in any order", () => {
    const result = parseArgs(["node", "index.ts", "-p", "hello", "--scenario", "test.json"]);
    expect(result).toEqual({ scenarioPath: "test.json", prompt: "hello", hooksConfigPath: null, createScenario: false });
  });

  test("parses without --scenario (default mode)", () => {
    const result = parseArgs(["node", "index.ts", "-p", "hello"]);
    expect(result).toEqual({ scenarioPath: null, prompt: "hello", hooksConfigPath: null, createScenario: false });
  });

  test("throws on missing --scenario value", () => {
    expect(() => parseArgs(["node", "index.ts", "--scenario"])).toThrow("Missing value for --scenario");
  });

  test("throws on missing -p value", () => {
    expect(() => parseArgs(["node", "index.ts", "--scenario", "test.json", "-p"])).toThrow("Missing value for -p");
  });

  test("returns null scenarioPath when no arguments provided", () => {
    const result = parseArgs(["node", "index.ts"]);
    expect(result).toEqual({ scenarioPath: null, prompt: null, hooksConfigPath: null, createScenario: false });
  });

  test("parses --hooks-config flag", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json", "--hooks-config", "hooks.json"]);
    expect(result).toEqual({ scenarioPath: "test.json", prompt: null, hooksConfigPath: "hooks.json", createScenario: false });
  });

  test("parses --hooks-config with -p flag", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json", "-p", "hello", "--hooks-config", "hooks.json"]);
    expect(result).toEqual({ scenarioPath: "test.json", prompt: "hello", hooksConfigPath: "hooks.json", createScenario: false });
  });

  test("throws on missing --hooks-config value", () => {
    expect(() => parseArgs(["node", "index.ts", "--scenario", "test.json", "--hooks-config"])).toThrow("Missing value for --hooks-config");
  });

  test("parses --create-scenario flag", () => {
    const result = parseArgs(["node", "index.ts", "--create-scenario"]);
    expect(result).toEqual({ scenarioPath: null, prompt: null, hooksConfigPath: null, createScenario: true });
  });

  test("throws when --create-scenario combined with -p", () => {
    expect(() => parseArgs(["node", "index.ts", "--create-scenario", "-p", "hello"])).toThrow("--create-scenario cannot be combined with -p or --scenario");
  });

  test("throws when --create-scenario combined with --scenario", () => {
    expect(() => parseArgs(["node", "index.ts", "--create-scenario", "--scenario", "test.json"])).toThrow("--create-scenario cannot be combined with -p or --scenario");
  });
});
