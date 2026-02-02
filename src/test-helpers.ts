import { resolve } from "path";

const entrypoint = resolve(import.meta.dir, "index.ts");

export function run(
  args: string[],
  stdin?: string,
  env?: Record<string, string>,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", entrypoint, ...args], {
    stdin: stdin !== undefined ? new Blob([stdin]) : "ignore",
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, ...env },
  });

  return Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]).then(([stdout, stderr, exitCode]) => ({ stdout, stderr, exitCode }));
}
