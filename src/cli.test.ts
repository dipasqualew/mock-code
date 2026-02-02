import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { run } from "./test-helpers";

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
