import type { HookEntry, HookEvent, HookPayload, HookResponse, HooksConfig } from "./types";

export interface HookExecutor {
  fire(event: HookEvent, data?: Record<string, unknown>): Promise<HookResponse | null>;
}

export async function loadHooksConfig(path: string): Promise<HookEntry[]> {
  const file = Bun.file(path);
  const content: HooksConfig = await file.json();

  if (!Array.isArray(content.hooks)) {
    throw new Error("Invalid hooks config: missing 'hooks' array");
  }

  for (const entry of content.hooks) {
    if (typeof entry.event !== "string" || typeof entry.command !== "string") {
      throw new Error("Invalid hook entry: each entry must have 'event' and 'command' strings");
    }
  }

  return content.hooks;
}

export interface SpawnDeps {
  spawn: typeof Bun.spawn;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export function createHookExecutor(
  hooks: HookEntry[],
  deps: SpawnDeps = { spawn: Bun.spawn },
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): HookExecutor {
  return {
    async fire(event: HookEvent, data: Record<string, unknown> = {}): Promise<HookResponse | null> {
      const matching = hooks.filter((h) => h.event === event);
      if (matching.length === 0) return null;

      let lastResponse: HookResponse | null = null;

      for (const hook of matching) {
        const payload: HookPayload = { event, data };
        const payloadStr = JSON.stringify(payload);

        try {
          const proc = deps.spawn(["sh", "-c", hook.command], {
            stdin: new Blob([payloadStr]),
            stdout: "pipe",
            stderr: "pipe",
          });

          let timer: ReturnType<typeof setTimeout>;
          const result = await Promise.race([
            proc.exited.then((code) => {
              clearTimeout(timer);
              return code;
            }),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => {
                proc.kill();
                reject(new Error(`Hook "${hook.command}" timed out after ${timeoutMs}ms`));
              }, timeoutMs);
            }),
          ]);

          if (result !== 0) {
            const stderr = await new Response(proc.stderr).text();
            process.stderr.write(`Hook "${hook.command}" exited with code ${result}: ${stderr.trim()}\n`);
            continue;
          }

          const stdout = await new Response(proc.stdout).text();
          const trimmed = stdout.trim();
          if (trimmed) {
            lastResponse = JSON.parse(trimmed);
          }
        } catch (error) {
          process.stderr.write(
            `Hook "${hook.command}" failed: ${error instanceof Error ? error.message : String(error)}\n`,
          );
        }
      }

      return lastResponse;
    },
  };
}

export function createNoopHookExecutor(): HookExecutor {
  return {
    async fire(): Promise<null> {
      return null;
    },
  };
}
