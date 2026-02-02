import { describe, expect, test } from "bun:test";
import { match, NO_MATCH } from "./matcher";
import type { ScenarioResponse } from "./types";

const responses: ScenarioResponse[] = [
  { pattern: "^hello", message: "Hi there!" },
  { pattern: ".*refactor.*", message: "I'll refactor that for you." },
  { pattern: ".*", message: "Catch-all response." },
];

describe("match", () => {
  test("returns the message for a matching pattern", () => {
    expect(match("hello world", responses)).toBe("Hi there!");
  });

  test("returns [no-match-found] when no pattern matches", () => {
    const narrow: ScenarioResponse[] = [
      { pattern: "^hello$", message: "Hi there!" },
    ];
    expect(match("goodbye", narrow)).toBe(NO_MATCH);
  });

  test("returns the first matching message (first-match-wins)", () => {
    // "refactor this" matches both ".*refactor.*" and ".*", should return the first
    expect(match("refactor this", responses)).toBe("I'll refactor that for you.");
  });

  test("skips responses with invalid regex and continues matching", () => {
    const withInvalid: ScenarioResponse[] = [
      { pattern: "[invalid", message: "Should be skipped." },
      { pattern: "^hello", message: "Hi there!" },
    ];
    expect(match("hello", withInvalid)).toBe("Hi there!");
  });

  test("returns [no-match-found] when all patterns are invalid regex", () => {
    const allInvalid: ScenarioResponse[] = [
      { pattern: "[invalid", message: "Nope." },
      { pattern: "(unclosed", message: "Nope." },
    ];
    expect(match("hello", allInvalid)).toBe(NO_MATCH);
  });

  test("returns [no-match-found] for empty responses array", () => {
    expect(match("hello", [])).toBe(NO_MATCH);
  });
});
