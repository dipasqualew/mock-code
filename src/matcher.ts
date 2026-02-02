import type { ScenarioResponse } from "./types";

export const NO_MATCH = "[no-match-found]";

export function match(input: string, responses: ScenarioResponse[]): string {
  for (const response of responses) {
    let regex: RegExp;
    try {
      regex = new RegExp(response.pattern);
    } catch {
      continue;
    }

    if (regex.test(input)) {
      return response.message;
    }
  }

  return NO_MATCH;
}
