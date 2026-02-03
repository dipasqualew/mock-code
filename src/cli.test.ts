import { describe, expect, test, beforeEach } from "bun:test";
import { resolve } from "path";
import { mkdtemp, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { run } from "./test-helpers";
import { encodePath } from "./session";

const fixturesDir = resolve(import.meta.dir, "__fixtures__");

describe("CLI -p mode", () => {
  test("prints matching response and exits", async () => {
    const { stdout, exitCode } = await run(
      ["--scenario", `${fixturesDir}/valid.json`, "-p", "hello world"],
    );
    expect(stdout.trim()).toBe("Hi there!");
    expect(exitCode).toBe(0);
  });

  test("prints [no-match-found] when no pattern matches", async () => {
    const { stdout, exitCode } = await run(
      ["--scenario", `${fixturesDir}/valid.json`, "-p", "xyz"],
    );
    expect(stdout.trim()).toBe("[no-match-found]");
    expect(exitCode).toBe(0);
  });

  test("matches second pattern", async () => {
    const { stdout, exitCode } = await run(
      ["--scenario", `${fixturesDir}/valid.json`, "-p", "please refactor this"],
    );
    expect(stdout.trim()).toBe("I'll refactor that for you.");
    expect(exitCode).toBe(0);
  });
});

describe("CLI interactive mode", () => {
  test("reads lines from stdin and prints responses", async () => {
    const { stdout, exitCode } = await run(
      ["--scenario", `${fixturesDir}/valid.json`],
      "hello\nrefactor this\nunknown\n",
    );
    const lines = stdout.trim().split("\n");
    expect(lines).toEqual([
      "Hi there!",
      "I'll refactor that for you.",
      "[no-match-found]",
    ]);
    expect(exitCode).toBe(0);
  });

  test("writes prompt indicator to stderr", async () => {
    const { stderr } = await run(
      ["--scenario", `${fixturesDir}/valid.json`],
      "hello\n",
    );
    expect(stderr).toContain("> ");
  });
});

describe("CLI --help", () => {
  test("--help exits 0 and prints subcommand list", async () => {
    const { stdout, exitCode } = await run(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("run");
    expect(stdout).toContain("create-scenario");
  });

  test("-h exits 0 and works as alias", async () => {
    const { stdout, exitCode } = await run(["-h"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("run");
    expect(stdout).toContain("create-scenario");
  });

  test("run --help exits 0 and documents flags", async () => {
    const { stdout, exitCode } = await run(["run", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("--scenario");
    expect(stdout).toContain("-p");
    expect(stdout).toContain("--hooks-config");
  });

  test("run -h exits 0", async () => {
    const { stdout, exitCode } = await run(["run", "-h"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("--scenario");
  });

  test("create-scenario --help exits 0 and describes wizard", async () => {
    const { stdout, exitCode } = await run(["create-scenario", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("wizard");
  });

  test("create-scenario -h exits 0", async () => {
    const { stdout, exitCode } = await run(["create-scenario", "-h"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("wizard");
  });
});

describe("CLI subcommand routing", () => {
  test("'run' subcommand works identically to implicit run", async () => {
    const { stdout, exitCode } = await run(
      ["run", "--scenario", `${fixturesDir}/valid.json`, "-p", "hello world"],
    );
    expect(stdout.trim()).toBe("Hi there!");
    expect(exitCode).toBe(0);
  });

  test("'run' subcommand with default catch-all", async () => {
    const { stdout, exitCode } = await run(["run", "-p", "hello"]);
    expect(stdout.trim()).toBe("[mock-response]");
    expect(exitCode).toBe(0);
  });
});

describe("CLI session files", () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "mock-code-cli-"));
  });

  test("-p mode writes history.jsonl", async () => {
    await run(
      ["--scenario", `${fixturesDir}/valid.json`, "-p", "hello world"],
      undefined,
      { MOCK_CODE_BASE_DIR: baseDir },
    );

    const content = await readFile(join(baseDir, "history.jsonl"), "utf-8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(1);

    const entry = JSON.parse(lines[0]);
    expect(entry.display).toBe("hello world");
    expect(entry.pastedContents).toEqual({});
    expect(typeof entry.timestamp).toBe("number");
    expect(typeof entry.sessionId).toBe("string");
  });

  test("-p mode writes session JSONL with user and assistant messages", async () => {
    await run(
      ["--scenario", `${fixturesDir}/valid.json`, "-p", "hello world"],
      undefined,
      { MOCK_CODE_BASE_DIR: baseDir },
    );

    const history = JSON.parse(
      (await readFile(join(baseDir, "history.jsonl"), "utf-8")).trim(),
    );
    const encoded = encodePath(process.cwd());
    const sessionPath = join(
      baseDir,
      "projects",
      encoded,
      `${history.sessionId}.jsonl`,
    );
    const lines = (await readFile(sessionPath, "utf-8")).trim().split("\n");
    expect(lines).toHaveLength(2);

    const userMsg = JSON.parse(lines[0]);
    expect(userMsg.type).toBe("user");
    expect(userMsg.parentUuid).toBeNull();
    expect(userMsg.message.role).toBe("user");
    expect(userMsg.message.content).toBe("hello world");

    const assistantMsg = JSON.parse(lines[1]);
    expect(assistantMsg.type).toBe("assistant");
    expect(assistantMsg.parentUuid).toBe(userMsg.uuid);
    expect(assistantMsg.message.role).toBe("assistant");
    expect(assistantMsg.message.content).toEqual([
      { type: "text", text: "Hi there!" },
    ]);
  });

  test("interactive mode accumulates history.jsonl across prompts", async () => {
    await run(
      ["--scenario", `${fixturesDir}/valid.json`],
      "hello\nrefactor this\n",
      { MOCK_CODE_BASE_DIR: baseDir },
    );

    const content = await readFile(join(baseDir, "history.jsonl"), "utf-8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).display).toBe("hello");
    expect(JSON.parse(lines[1]).display).toBe("refactor this");
  });

  test("interactive mode chains parentUuid in session JSONL", async () => {
    await run(
      ["--scenario", `${fixturesDir}/valid.json`],
      "hello\nrefactor this\n",
      { MOCK_CODE_BASE_DIR: baseDir },
    );

    const history = JSON.parse(
      (await readFile(join(baseDir, "history.jsonl"), "utf-8"))
        .trim()
        .split("\n")[0],
    );
    const encoded = encodePath(process.cwd());
    const sessionPath = join(
      baseDir,
      "projects",
      encoded,
      `${history.sessionId}.jsonl`,
    );
    const lines = (await readFile(sessionPath, "utf-8")).trim().split("\n");
    // 2 prompts × 2 messages each = 4 lines
    expect(lines).toHaveLength(4);

    const entries = lines.map((l: string) => JSON.parse(l));
    // First user: null parent
    expect(entries[0].parentUuid).toBeNull();
    // First assistant: parent is first user
    expect(entries[1].parentUuid).toBe(entries[0].uuid);
    // Second user: parent is first assistant
    expect(entries[2].parentUuid).toBe(entries[1].uuid);
    // Second assistant: parent is second user
    expect(entries[3].parentUuid).toBe(entries[2].uuid);
  });
});

describe("CLI error cases", () => {
  test("uses default catch-all response when --scenario is missing", async () => {
    const { stdout, exitCode } = await run(["-p", "hello"]);
    expect(stdout.trim()).toBe("[mock-response]");
    expect(exitCode).toBe(0);
  });

  test("exits with 1 for non-existent scenario file", async () => {
    const { exitCode } = await run(
      ["--scenario", "/nonexistent/file.json", "-p", "hello"],
    );
    expect(exitCode).toBe(1);
  });

  test("exits with 1 for invalid JSON scenario file", async () => {
    const { exitCode, stderr } = await run(
      ["--scenario", `${fixturesDir}/missing-responses.json`, "-p", "hello"],
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Invalid scenario file");
  });
});
