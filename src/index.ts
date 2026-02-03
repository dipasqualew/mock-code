import { parseArgs } from "./args";
import { loadScenarioFile } from "./scenario";
import { match } from "./matcher";
import { loadHooksConfig, createHookExecutor, createNoopHookExecutor } from "./hooks";
import { createScenario } from "./create-scenario";
import { createSessionContext, appendHistory, appendSession } from "./session";
import type { HookExecutor } from "./hooks";
import type { ScenarioResponse } from "./types";
import type { SessionContext } from "./session";

async function handlePrompt(
  prompt: string,
  responses: ScenarioResponse[],
  hooks: HookExecutor,
  session: SessionContext,
): Promise<void> {
  const submitResponse = await hooks.fire("UserPromptSubmit", { prompt });
  let effectivePrompt = prompt;
  if (submitResponse && typeof submitResponse.prompt === "string") {
    effectivePrompt = submitResponse.prompt;
  }

  await hooks.fire("PreToolUse", { prompt: effectivePrompt });
  const result = match(effectivePrompt, responses);
  console.log(result);
  await hooks.fire("PostToolUse", { prompt: effectivePrompt, result });

  await appendHistory(effectivePrompt, session);
  await appendSession({ type: "user", content: effectivePrompt }, session);
  await appendSession({ type: "assistant", content: result }, session);
}

let hooks: HookExecutor = createNoopHookExecutor();

try {
  const parsed = parseArgs(process.argv);

  if (parsed.command === "help") {
    console.log(parsed.helpText);
    process.exit(0);
  }

  if (parsed.command === "create-scenario") {
    const scenario = await createScenario();
    console.log(JSON.stringify(scenario, null, 2));
    process.exit(0);
  }

  const { scenarioPath, prompt, hooksConfigPath } = parsed;

  const responses = scenarioPath
    ? await loadScenarioFile(scenarioPath)
    : [{ pattern: ".*", message: "[mock-response]" }];

  if (hooksConfigPath) {
    const entries = await loadHooksConfig(hooksConfigPath);
    hooks = createHookExecutor(entries);
  }

  const session = createSessionContext(
    process.cwd(),
    process.env.MOCK_CODE_BASE_DIR,
  );

  await hooks.fire("SessionStart");

  if (prompt !== null) {
    await handlePrompt(prompt, responses, hooks, session);
  } else {
    process.stderr.write("> ");
    for await (const line of console) {
      if (line === "") continue;
      await handlePrompt(line, responses, hooks, session);
      process.stderr.write("> ");
    }
  }

  await hooks.fire("Stop");
  await hooks.fire("SessionEnd");
} catch (error) {
  await hooks.fire("Stop");
  await hooks.fire("SessionEnd");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
