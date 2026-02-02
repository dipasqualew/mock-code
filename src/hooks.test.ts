import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { resolve, join } from "path";
import { mkdtemp, rm, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { createHookExecutor, createNoopHookExecutor, loadHooksConfig } from "./hooks";
import { run } from "./test-helpers";
import type { HookEntry } from "./types";

const fixturesDir = resolve(import.meta.dir, "__fixtures__");

describe("loadHooksConfig", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "hooks-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  test("loads valid hooks config", async () => {
    const configPath = join(tmpDir, "hooks.json");
    await writeFile(configPath, JSON.stringify({
      hooks: [{ event: "SessionStart", command: "echo '{}'" }],
    }));
    const entries = await loadHooksConfig(configPath);
    expect(entries).toEqual([{ event: "SessionStart", command: "echo '{}'" }]);
  });

  test("throws on missing hooks array", async () => {
    const configPath = join(tmpDir, "bad.json");
    await writeFile(configPath, JSON.stringify({ other: true }));
    await expect(loadHooksConfig(configPath)).rejects.toThrow("missing 'hooks' array");
  });
});

describe("createHookExecutor", () => {
  test("fires matching hooks and returns response", async () => {
    const hooks: HookEntry[] = [
      { event: "SessionStart", command: `echo '{\"started\":true}'` },
    ];
    const executor = createHookExecutor(hooks);
    const response = await executor.fire("SessionStart");
    expect(response).toEqual({ started: true });
  });

  test("returns null when no hooks match", async () => {
    const hooks: HookEntry[] = [
      { event: "SessionStart", command: "echo '{}'" },
    ];
    const executor = createHookExecutor(hooks);
    const response = await executor.fire("Stop");
    expect(response).toBeNull();
  });

  test("handles non-zero exit gracefully", async () => {
    const hooks: HookEntry[] = [
      { event: "SessionStart", command: "exit 1" },
    ];
    const executor = createHookExecutor(hooks);
    const response = await executor.fire("SessionStart");
    expect(response).toBeNull();
  });

  test("handles timeout gracefully", async () => {
    const hooks: HookEntry[] = [
      { event: "SessionStart", command: "sleep 60" },
    ];
    const executor = createHookExecutor(hooks, { spawn: Bun.spawn }, 100);
    const response = await executor.fire("SessionStart");
    expect(response).toBeNull();
  });
});

describe("createNoopHookExecutor", () => {
  test("always returns null", async () => {
    const executor = createNoopHookExecutor();
    expect(await executor.fire("SessionStart")).toBeNull();
    expect(await executor.fire("Stop", { key: "val" })).toBeNull();
  });
});

describe("CLI hook integration", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "hooks-cli-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  test("fires hooks in correct lifecycle order (-p mode)", async () => {
    const logFile = join(tmpDir, "events.log");
    const logHook = resolve(fixturesDir, "log-hook.sh");
    const config = {
      hooks: [
        { event: "SessionStart", command: logHook },
        { event: "UserPromptSubmit", command: logHook },
        { event: "PreToolUse", command: logHook },
        { event: "PostToolUse", command: logHook },
        { event: "Stop", command: logHook },
        { event: "SessionEnd", command: logHook },
      ],
    };
    const configPath = join(tmpDir, "hooks.json");
    await writeFile(configPath, JSON.stringify(config));

    const { exitCode } = await run(
      ["--scenario", `${fixturesDir}/valid.json`, "--hooks-config", configPath, "-p", "hello world"],
      undefined,
      { HOOK_LOG: logFile },
    );
    expect(exitCode).toBe(0);

    const log = (await readFile(logFile, "utf-8")).trim().split("\n");
    expect(log).toEqual([
      "SessionStart",
      "UserPromptSubmit",
      "PreToolUse",
      "PostToolUse",
      "Stop",
      "SessionEnd",
    ]);
  });

  test("fires hooks in correct lifecycle order (interactive mode)", async () => {
    const logFile = join(tmpDir, "events.log");
    const logHook = resolve(fixturesDir, "log-hook.sh");
    const config = {
      hooks: [
        { event: "SessionStart", command: logHook },
        { event: "UserPromptSubmit", command: logHook },
        { event: "PreToolUse", command: logHook },
        { event: "PostToolUse", command: logHook },
        { event: "Stop", command: logHook },
        { event: "SessionEnd", command: logHook },
      ],
    };
    const configPath = join(tmpDir, "hooks.json");
    await writeFile(configPath, JSON.stringify(config));

    const { exitCode } = await run(
      ["--scenario", `${fixturesDir}/valid.json`, "--hooks-config", configPath],
      "hello\n",
      { HOOK_LOG: logFile },
    );
    expect(exitCode).toBe(0);

    const log = (await readFile(logFile, "utf-8")).trim().split("\n");
    expect(log).toEqual([
      "SessionStart",
      "UserPromptSubmit",
      "PreToolUse",
      "PostToolUse",
      "Stop",
      "SessionEnd",
    ]);
  });

  test("hooks receive correct JSON payloads", async () => {
    const payloadFile = join(tmpDir, "payload.json");
    const hookScript = join(tmpDir, "capture-hook.sh");
    await writeFile(hookScript, `#!/bin/sh\ncat > "${payloadFile}"\necho '{}'\n`);
    await Bun.spawn(["chmod", "+x", hookScript]).exited;

    const config = {
      hooks: [{ event: "UserPromptSubmit", command: hookScript }],
    };
    const configPath = join(tmpDir, "hooks.json");
    await writeFile(configPath, JSON.stringify(config));

    await run(
      ["--scenario", `${fixturesDir}/valid.json`, "--hooks-config", configPath, "-p", "hello world"],
    );

    const payload = JSON.parse(await readFile(payloadFile, "utf-8"));
    expect(payload.event).toBe("UserPromptSubmit");
    expect(payload.data.prompt).toBe("hello world");
  });

  test("UserPromptSubmit hook can modify the prompt", async () => {
    const modifyHook = resolve(fixturesDir, "modify-prompt-hook.sh");
    const config = {
      hooks: [{ event: "UserPromptSubmit", command: modifyHook }],
    };
    const configPath = join(tmpDir, "hooks.json");
    await writeFile(configPath, JSON.stringify(config));

    const { stdout } = await run(
      ["--scenario", `${fixturesDir}/valid.json`, "--hooks-config", configPath, "-p", "xyz"],
    );
    // "xyz" would normally return [no-match-found], but the hook modifies prompt to "hello world"
    // which matches the "hello" pattern in valid.json
    expect(stdout.trim()).toBe("Hi there!");
  });

  test("hook failure does not crash mock-code", async () => {
    const failingHook = resolve(fixturesDir, "failing-hook.sh");
    const config = {
      hooks: [{ event: "SessionStart", command: failingHook }],
    };
    const configPath = join(tmpDir, "hooks.json");
    await writeFile(configPath, JSON.stringify(config));

    const { stdout, exitCode } = await run(
      ["--scenario", `${fixturesDir}/valid.json`, "--hooks-config", configPath, "-p", "hello"],
    );
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe("Hi there!");
  });

  test("works without --hooks-config (no hooks)", async () => {
    const { stdout, exitCode } = await run(
      ["--scenario", `${fixturesDir}/valid.json`, "-p", "hello world"],
    );
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe("Hi there!");
  });
});
