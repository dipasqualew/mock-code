export interface ScenarioResponse {
  pattern: string;
  message: string;
}

export interface ScenarioFile {
  responses: ScenarioResponse[];
}
