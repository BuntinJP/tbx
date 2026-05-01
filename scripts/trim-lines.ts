#!/usr/bin/env bun

import process from 'node:process';
import { parseArgs } from 'node:util';

const usage = `Usage:
  trim-lines [--drop-empty] [--json]

Reads newline-separated text from stdin, trims each line, and writes one
trimmed item per output line.

Options:
  --drop-empty  Omit lines that become empty after trim().
  --json        Emit a JSON array instead of newline-separated text.
  -h, --help    Show this help.
`;

const splitInputLines = (input: string): string[] => {
  if (input.length === 0) return [];

  const lines = input.split(/\r\n|\n|\r/);
  if (
    lines.length > 0 &&
    (input.endsWith('\n') || input.endsWith('\r')) &&
    lines[lines.length - 1] === ''
  ) {
    lines.pop();
  }

  return lines;
};

const main = async (): Promise<void> => {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'drop-empty': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(usage);
    return;
  }

  const input = await Bun.stdin.text();
  const trimmedLines: string[] = [];

  for (const line of splitInputLines(input)) {
    const trimmedLine = line.trim();
    if (values['drop-empty'] === true && trimmedLine.length === 0) continue;
    trimmedLines.push(trimmedLine);
  }

  if (values.json) {
    process.stdout.write(`${JSON.stringify(trimmedLines)}\n`);
    return;
  }

  if (trimmedLines.length === 0) return;
  process.stdout.write(`${trimmedLines.join('\n')}\n`);
};

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[trim-lines] ERROR: ${message}`);
  process.exitCode = 1;
}
