import { loadScenarioFile } from "./scenario";
import { match } from "./matcher";

const scenarioPath = process.argv[2];

if (!scenarioPath) {
  console.error("Usage: mock-code <scenario-file>");
  process.exit(1);
}

const responses = await loadScenarioFile(scenarioPath);

for await (const line of console) {
  const result = match(line, responses);
  console.log(result);
}
