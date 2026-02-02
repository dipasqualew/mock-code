export function topLevelHelp(): string {
  return `mock-code - A mock CLI tool for testing agent integrations

Usage:
  mock-code [command] [options]

Commands:
  run               Run the mock CLI (default if no command given)
  create-scenario   Interactively create a scenario file

Options:
  --help, -h        Show this help message

Examples:
  mock-code run --scenario scenarios.json -p "hello"
  mock-code run --scenario scenarios.json
  mock-code create-scenario
  mock-code --help

Run 'mock-code <command> --help' for more information on a command.`;
}

export function runHelp(): string {
  return `mock-code run - Run the mock CLI

Usage:
  mock-code run [options]
  mock-code [options]          (implicit run)

Options:
  --scenario <file>    Path to a JSON scenario file. If omitted, a default
                       catch-all response ("[mock-response]") is used.
  -p <prompt>          Run in single-prompt mode: process the given prompt,
                       print the response, and exit.
  --hooks-config <file>
                       Path to a JSON hooks configuration file.
  --help, -h           Show this help message

Modes:
  Single-prompt mode   Use -p to send one prompt and get one response.
  Interactive mode      Omit -p to enter a REPL that reads prompts from stdin.

Scenario file format:
  A JSON array of objects with "pattern" (regex) and "message" (string) fields.
  Patterns are matched in order against the prompt text.

  [
    { "pattern": "hello", "message": "Hi there!" },
    { "pattern": ".*", "message": "Default response" }
  ]

Examples:
  mock-code run --scenario test.json -p "hello world"
  mock-code run --scenario test.json
  mock-code -p "hello"
  mock-code run --scenario test.json --hooks-config hooks.json`;
}

export function createScenarioHelp(): string {
  return `mock-code create-scenario - Interactively create a scenario file

Usage:
  mock-code create-scenario

Options:
  --help, -h    Show this help message

Description:
  Launches an interactive wizard that guides you through creating a scenario
  file. You will be prompted to define pattern/message pairs one at a time.
  The resulting JSON is printed to stdout and can be redirected to a file.

Examples:
  mock-code create-scenario
  mock-code create-scenario > my-scenario.json`;
}
