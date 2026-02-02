import type { ScenarioFile, ScenarioResponse } from "./types";

export async function loadScenarioFile(path: string): Promise<ScenarioResponse[]> {
  const file = Bun.file(path);
  const content: ScenarioFile = await file.json();

  if (!Array.isArray(content.responses)) {
    throw new Error("Invalid scenario file: missing 'responses' array");
  }

  for (const response of content.responses) {
    if (typeof response.pattern !== "string" || typeof response.message !== "string") {
      throw new Error("Invalid scenario response: each entry must have 'pattern' and 'message' strings");
    }
  }

  return content.responses;
}
