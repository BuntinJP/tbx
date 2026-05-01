#!/usr/bin/env bun

import process from 'node:process';
import { parseArgs } from 'node:util';

type PermissionProbe = {
  label: string;
  script: string;
};

const usage = `Usage:
  request-macos-automation-permissions [--include-key-event]

Runs harmless AppleScript probes so macOS can show first-run Automation and
Accessibility permission prompts before workflow scripts need them.

Options:
  --include-key-event  Also send Escape via System Events to trigger the
                       keyboard-event permission path.
  -h, --help           Show this help.
`;

const baseProbes: PermissionProbe[] = [
  {
    label: 'Finder automation',
    script: 'tell application "Finder" to return name of startup disk',
  },
  {
    label: 'System Events process access',
    script:
      'tell application "System Events" to return "processes: " & (count of processes)',
  },
  {
    label: 'System Events UI scripting access',
    script:
      'tell application "System Events" to return "ui elements enabled: " & (UI elements enabled)',
  },
  {
    label: 'Terminal automation',
    script: 'tell application "Terminal" to return count of windows',
  },
  {
    label: 'Shortcuts Events automation',
    script: 'tell application "Shortcuts Events" to return count of shortcuts',
  },
  {
    label: 'AppleScript shell execution',
    script: 'do shell script "printf tbx-permission-check"',
  },
];

const keyEventProbe: PermissionProbe = {
  label: 'System Events keyboard event',
  script: 'tell application "System Events" to key code 53',
};

const runAppleScript = async (
  script: string,
): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
  const proc = Bun.spawn(['osascript', '-e', script], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return {
    exitCode,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
};

const main = async (): Promise<void> => {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'include-key-event': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(usage);
    return;
  }

  const probes = [...baseProbes];
  if (values['include-key-event']) {
    probes.push(keyEventProbe);
  }

  console.log('[request-macos-automation-permissions] Starting permission probes.');
  console.log(
    '[request-macos-automation-permissions] macOS may show prompts. Allow the terminal app you actually use for workflows.',
  );

  let failedCount = 0;

  for (const probe of probes) {
    console.log(`[request-macos-automation-permissions] Probe: ${probe.label}`);

    const result = await runAppleScript(probe.script);
    if (result.exitCode === 0) {
      const suffix = result.stdout.length > 0 ? ` (${result.stdout})` : '';
      console.log(`[request-macos-automation-permissions] OK: ${probe.label}${suffix}`);
      continue;
    }

    failedCount += 1;
    const detail = result.stderr.length > 0 ? result.stderr : `exit ${result.exitCode}`;
    console.error(
      `[request-macos-automation-permissions] Needs attention: ${probe.label}: ${detail}`,
    );
  }

  if (failedCount > 0) {
    console.error(
      `[request-macos-automation-permissions] Completed with ${failedCount} probe failure(s). Check System Settings > Privacy & Security.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log('[request-macos-automation-permissions] Done.');
};

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[request-macos-automation-permissions] ERROR: ${message}`);
  process.exitCode = 1;
}
