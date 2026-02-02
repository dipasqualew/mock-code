import { parseArgs } from "./args";
import { loadScenarioFile } from "./scenario";
import { match } from "./matcher";

try {
  const { scenarioPath, prompt } = parseArgs(process.argv);
  const responses = await loadScenarioFile(scenarioPath);

  if (prompt !== null) {
    const result = match(prompt, responses);
    console.log(result);
  } else {
    process.stderr.write("> ");
    for await (const line of console) {
      if (line === "") continue;
      const result = match(line, responses);
      console.log(result);
      process.stderr.write("> ");
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
