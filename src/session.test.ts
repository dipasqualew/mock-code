import { describe, expect, test, beforeEach } from "bun:test";
import { mkdtemp, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  encodePath,
  createSessionContext,
  appendHistory,
  appendSession,
} from "./session";

describe("encodePath", () => {
  test("replaces / with -", () => {
    expect(encodePath("/Users/wdp/git/foo")).toBe("-Users-wdp-git-foo");
  });

  test("handles single slash", () => {
    expect(encodePath("/")).toBe("-");
  });
});

describe("appendHistory", () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "mock-code-test-"));
  });

  test("appends a JSONL line with correct fields", async () => {
    const ctx = createSessionContext("/Users/wdp/git/foo", baseDir);
    await appendHistory("hello world", ctx);

    const content = await readFile(join(baseDir, "history.jsonl"), "utf-8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(1);

    const entry = JSON.parse(lines[0]);
    expect(entry.display).toBe("hello world");
    expect(entry.pastedContents).toEqual({});
    expect(typeof entry.timestamp).toBe("number");
    expect(entry.project).toBe("/Users/wdp/git/foo");
    expect(entry.sessionId).toBe(ctx.sessionId);
  });

  test("accumulates across multiple calls", async () => {
    const ctx = createSessionContext("/Users/wdp/git/foo", baseDir);
    await appendHistory("first", ctx);
    await appendHistory("second", ctx);

    const content = await readFile(join(baseDir, "history.jsonl"), "utf-8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).display).toBe("first");
    expect(JSON.parse(lines[1]).display).toBe("second");
  });
});

describe("appendSession", () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "mock-code-test-"));
  });

  test("writes user message with correct format", async () => {
    const ctx = createSessionContext("/Users/wdp/git/foo", baseDir);
    await appendSession({ type: "user", content: "hello" }, ctx);

    const encoded = encodePath("/Users/wdp/git/foo");
    const filePath = join(baseDir, "projects", encoded, `${ctx.sessionId}.jsonl`);
    const content = await readFile(filePath, "utf-8");
    const entry = JSON.parse(content.trim());

    expect(entry.type).toBe("user");
    expect(entry.parentUuid).toBeNull();
    expect(entry.sessionId).toBe(ctx.sessionId);
    expect(entry.cwd).toBe("/Users/wdp/git/foo");
    expect(entry.message).toEqual({ role: "user", content: "hello" });
    expect(typeof entry.uuid).toBe("string");
    expect(typeof entry.timestamp).toBe("string");
  });

  test("writes assistant message with correct format", async () => {
    const ctx = createSessionContext("/Users/wdp/git/foo", baseDir);
    const userUuid = await appendSession({ type: "user", content: "hello" }, ctx);
    await appendSession({ type: "assistant", content: "Hi there!" }, ctx);

    const encoded = encodePath("/Users/wdp/git/foo");
    const filePath = join(baseDir, "projects", encoded, `${ctx.sessionId}.jsonl`);
    const lines = (await readFile(filePath, "utf-8")).trim().split("\n");
    const entry = JSON.parse(lines[1]);

    expect(entry.type).toBe("assistant");
    expect(entry.parentUuid).toBe(userUuid);
    expect(entry.message).toEqual({
      role: "assistant",
      content: [{ type: "text", text: "Hi there!" }],
    });
  });

  test("chains parentUuid correctly across messages", async () => {
    const ctx = createSessionContext("/Users/wdp/git/foo", baseDir);
    const uuid1 = await appendSession({ type: "user", content: "hello" }, ctx);
    const uuid2 = await appendSession({ type: "assistant", content: "Hi!" }, ctx);
    await appendSession({ type: "user", content: "bye" }, ctx);

    const encoded = encodePath("/Users/wdp/git/foo");
    const filePath = join(baseDir, "projects", encoded, `${ctx.sessionId}.jsonl`);
    const lines = (await readFile(filePath, "utf-8")).trim().split("\n");

    expect(JSON.parse(lines[0]).parentUuid).toBeNull();
    expect(JSON.parse(lines[1]).parentUuid).toBe(uuid1);
    expect(JSON.parse(lines[2]).parentUuid).toBe(uuid2);
  });
});
