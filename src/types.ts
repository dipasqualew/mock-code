export interface ScenarioResponse {
  pattern: string;
  message: string;
}

export interface ScenarioFile {
  responses: ScenarioResponse[];
}

export type HookEvent =
  | "SessionStart"
  | "UserPromptSubmit"
  | "PreToolUse"
  | "PostToolUse"
  | "Stop"
  | "SessionEnd";

export interface HookEntry {
  event: HookEvent;
  command: string;
}

export interface HooksConfig {
  hooks: HookEntry[];
}

export interface HookPayload {
  event: HookEvent;
  data: Record<string, unknown>;
}

export interface HookResponse {
  [key: string]: unknown;
}
