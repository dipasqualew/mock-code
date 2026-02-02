import { describe, expect, test } from "bun:test";
import { createScenario, type PromptFunctions } from "./create-scenario";

function mockPrompts(inputs: string[], confirms: boolean[]): PromptFunctions {
  let inputIndex = 0;
  let confirmIndex = 0;

  return {
    input: async ({ validate }) => {
      const value = inputs[inputIndex++];
      if (validate) {
        const result = validate(value);
        if (result !== true) throw new Error(result);
      }
      return value;
    },
    confirm: async () => confirms[confirmIndex++],
  };
}

describe("createScenario", () => {
  test("creates a scenario with a single response", async () => {
    const prompts = mockPrompts(["hello.*", "Hi there!"], [false]);
    const result = await createScenario(prompts);

    expect(result).toEqual({
      responses: [{ pattern: "hello.*", message: "Hi there!" }],
    });
  });

  test("creates a scenario with multiple responses", async () => {
    const prompts = mockPrompts(
      ["hello.*", "Hi there!", "bye", "Goodbye!"],
      [true, false],
    );
    const result = await createScenario(prompts);

    expect(result).toEqual({
      responses: [
        { pattern: "hello.*", message: "Hi there!" },
        { pattern: "bye", message: "Goodbye!" },
      ],
    });
  });

  test("rejects empty pattern", async () => {
    const prompts = mockPrompts(["", "Hi there!"], [false]);
    expect(createScenario(prompts)).rejects.toThrow("Value cannot be empty");
  });

  test("rejects empty message", async () => {
    const prompts = mockPrompts(["hello.*", ""], [false]);
    expect(createScenario(prompts)).rejects.toThrow("Value cannot be empty");
  });

  test("rejects whitespace-only pattern", async () => {
    const prompts = mockPrompts(["   ", "Hi there!"], [false]);
    expect(createScenario(prompts)).rejects.toThrow("Value cannot be empty");
  });

  test("output is valid JSON conforming to ScenarioFile schema", async () => {
    const prompts = mockPrompts([".*", "default"], [false]);
    const result = await createScenario(prompts);
    const json = JSON.stringify(result);
    const parsed = JSON.parse(json);

    expect(Array.isArray(parsed.responses)).toBe(true);
    for (const r of parsed.responses) {
      expect(typeof r.pattern).toBe("string");
      expect(typeof r.message).toBe("string");
    }
  });
});
