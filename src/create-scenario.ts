import type { ScenarioFile, ScenarioResponse } from "./types";
import { input, confirm } from "@inquirer/prompts";

export interface PromptFunctions {
  input: (config: { message: string; validate?: (value: string) => string | true }) => Promise<string>;
  confirm: (config: { message: string }) => Promise<boolean>;
}

const defaultPrompts: PromptFunctions = { input, confirm };

function required(value: string): string | true {
  return value.trim() === "" ? "Value cannot be empty" : true;
}

export async function createScenario(
  prompts: PromptFunctions = defaultPrompts,
): Promise<ScenarioFile> {
  const responses: ScenarioResponse[] = [];

  let addMore = true;
  while (addMore) {
    const pattern = await prompts.input({ message: "Pattern (regex):", validate: required });
    const message = await prompts.input({ message: "Message (response):", validate: required });
    responses.push({ pattern, message });

    addMore = await prompts.confirm({ message: "Add another response?" });
  }

  return { responses };
}
