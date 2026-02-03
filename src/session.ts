import { mkdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import { appendFile } from "fs/promises";

export interface SessionContext {
  sessionId: string;
  cwd: string;
  baseDir: string;
  parentUuid: string | null;
}

export function encodePath(cwd: string): string {
  return cwd.replace(/\//g, "-");
}

export function createSessionContext(
  cwd: string,
  baseDir: string = join(homedir(), ".mock-code", "claude"),
): SessionContext {
  return {
    sessionId: randomUUID(),
    cwd,
    baseDir,
    parentUuid: null,
  };
}

export async function appendHistory(
  prompt: string,
  ctx: SessionContext,
): Promise<void> {
  const historyPath = join(ctx.baseDir, "history.jsonl");
  await mkdir(ctx.baseDir, { recursive: true });

  const entry = {
    display: prompt,
    pastedContents: {},
    timestamp: Date.now(),
    project: ctx.cwd,
    sessionId: ctx.sessionId,
  };

  await appendFile(historyPath, JSON.stringify(entry) + "\n");
}

export async function appendSession(
  entry: { type: "user"; content: string } | { type: "assistant"; content: string },
  ctx: SessionContext,
): Promise<string> {
  const encoded = encodePath(ctx.cwd);
  const dir = join(ctx.baseDir, "projects", encoded);
  await mkdir(dir, { recursive: true });

  const filePath = join(dir, `${ctx.sessionId}.jsonl`);
  const uuid = randomUUID();
  const timestamp = new Date().toISOString();

  let line: Record<string, unknown>;

  if (entry.type === "user") {
    line = {
      type: "user",
      parentUuid: ctx.parentUuid,
      sessionId: ctx.sessionId,
      cwd: ctx.cwd,
      message: { role: "user", content: entry.content },
      uuid,
      timestamp,
    };
  } else {
    line = {
      type: "assistant",
      parentUuid: ctx.parentUuid,
      sessionId: ctx.sessionId,
      cwd: ctx.cwd,
      message: { role: "assistant", content: [{ type: "text", text: entry.content }] },
      uuid,
      timestamp,
    };
  }

  await appendFile(filePath, JSON.stringify(line) + "\n");
  ctx.parentUuid = uuid;
  return uuid;
}
