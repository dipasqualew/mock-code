import { describe, expect, test } from "bun:test";
import { loadScenarioFile } from "./scenario";
import { join } from "path";

const fixturesDir = join(import.meta.dir, "__fixtures__");

describe("loadScenarioFile", () => {
  test("loads a valid scenario file", async () => {
    const responses = await loadScenarioFile(join(fixturesDir, "valid.json"));
    expect(responses).toEqual([
      { pattern: "^hello", message: "Hi there!" },
      { pattern: ".*refactor.*", message: "I'll refactor that for you." },
    ]);
  });

  test("throws on missing responses array", async () => {
    expect(loadScenarioFile(join(fixturesDir, "missing-responses.json"))).rejects.toThrow(
      "Invalid scenario file: missing 'responses' array",
    );
  });

  test("throws on invalid response entry", async () => {
    expect(loadScenarioFile(join(fixturesDir, "invalid-entry.json"))).rejects.toThrow(
      "Invalid scenario response: each entry must have 'pattern' and 'message' strings",
    );
  });
});
