import { describe, expect, test } from "bun:test";
import { parseArgs } from "./args";

describe("parseArgs", () => {
  test("parses --scenario and -p flags", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json", "-p", "hello"]);
    expect(result).toEqual({ scenarioPath: "test.json", prompt: "hello", hooksConfigPath: null });
  });

  test("parses --scenario without -p (interactive mode)", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json"]);
    expect(result).toEqual({ scenarioPath: "test.json", prompt: null, hooksConfigPath: null });
  });

  test("parses flags in any order", () => {
    const result = parseArgs(["node", "index.ts", "-p", "hello", "--scenario", "test.json"]);
    expect(result).toEqual({ scenarioPath: "test.json", prompt: "hello", hooksConfigPath: null });
  });

  test("throws on missing --scenario", () => {
    expect(() => parseArgs(["node", "index.ts", "-p", "hello"])).toThrow("Missing required --scenario flag");
  });

  test("throws on missing --scenario value", () => {
    expect(() => parseArgs(["node", "index.ts", "--scenario"])).toThrow("Missing value for --scenario");
  });

  test("throws on missing -p value", () => {
    expect(() => parseArgs(["node", "index.ts", "--scenario", "test.json", "-p"])).toThrow("Missing value for -p");
  });

  test("throws when no arguments provided", () => {
    expect(() => parseArgs(["node", "index.ts"])).toThrow("Missing required --scenario flag");
  });

  test("parses --hooks-config flag", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json", "--hooks-config", "hooks.json"]);
    expect(result).toEqual({ scenarioPath: "test.json", prompt: null, hooksConfigPath: "hooks.json" });
  });

  test("parses --hooks-config with -p flag", () => {
    const result = parseArgs(["node", "index.ts", "--scenario", "test.json", "-p", "hello", "--hooks-config", "hooks.json"]);
    expect(result).toEqual({ scenarioPath: "test.json", prompt: "hello", hooksConfigPath: "hooks.json" });
  });

  test("throws on missing --hooks-config value", () => {
    expect(() => parseArgs(["node", "index.ts", "--scenario", "test.json", "--hooks-config"])).toThrow("Missing value for --hooks-config");
  });
});
