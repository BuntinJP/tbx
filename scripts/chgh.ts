#!/usr/bin/env bun

import { constants } from 'node:fs';
import {
  access,
  lstat,
  readFile,
  rename,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';

type GithubLoginEntry = {
  configname: string;
  username: string;
  gitconfigPath: string;
  secKeyPath: string;
  pubKeyPath: string;
};

const homeDir = homedir();
const tbxHome = process.env.TBX_HOME ?? path.join(homeDir, '.tbx');
const chghConfigPath = path.join(tbxHome, 'configs', 'chgh.json');
const sshConfigPath = path.join(homeDir, '.ssh', 'config');
const gitconfigPath = path.join(homeDir, '.gitconfig');

const usage = `Usage:
  chgh [--info]
  chgh [--no] [--dry-run]
  chgh [--config]

Options:
  -i, --info     Show the currently selected GitHub identity.
  -n, --no       Switch to the next configured identity without prompting.
  -c, --config   Normalize indentation in ~/.ssh/config before switching.
  -d, --dry-run  Print planned changes without writing files.
  -h, --help     Show this help.

Config:
  ${chghConfigPath}
`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const expandHome = (value: string): string => {
  if (value === '~') return homeDir;
  if (value.startsWith('~/')) return path.join(homeDir, value.slice(2));
  return value;
};

const assertReadable = async (filePath: string): Promise<void> => {
  await access(filePath, constants.R_OK);
};

const loadEntries = async (): Promise<GithubLoginEntry[]> => {
  let rawConfig = '';

  try {
    rawConfig = await readFile(chghConfigPath, 'utf8');
  } catch {
    throw new Error(`Config file is missing: ${chghConfigPath}`);
  }

  const parsed: unknown = JSON.parse(rawConfig);
  if (!Array.isArray(parsed)) {
    throw new Error('Config must be an array of GitHub login entries.');
  }

  const entries: GithubLoginEntry[] = [];
  for (const item of parsed) {
    if (!isRecord(item)) {
      throw new Error('Each config entry must be an object.');
    }

    const { configname, username, gitconfigPath, secKeyPath, pubKeyPath } =
      item;

    if (
      !isString(configname) ||
      !isString(username) ||
      !isString(gitconfigPath) ||
      !isString(secKeyPath) ||
      !isString(pubKeyPath)
    ) {
      throw new Error(
        'Each config entry requires string configname, username, gitconfigPath, secKeyPath, and pubKeyPath.',
      );
    }

    entries.push({
      configname,
      username,
      gitconfigPath: expandHome(gitconfigPath),
      secKeyPath: expandHome(secKeyPath),
      pubKeyPath: expandHome(pubKeyPath),
    });
  }

  if (entries.length === 0) {
    throw new Error('Config must contain at least one GitHub login entry.');
  }

  for (const entry of entries) {
    await assertReadable(entry.gitconfigPath);
    await assertReadable(entry.secKeyPath);
    await assertReadable(entry.pubKeyPath);
  }

  return entries;
};

const readSshConfigLines = async (): Promise<string[]> => {
  try {
    return (await readFile(sshConfigPath, 'utf8')).split('\n');
  } catch {
    throw new Error(`SSH config file is missing: ${sshConfigPath}`);
  }
};

const normalizeSshConfigLines = (lines: string[]): string[] => {
  const normalized: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      normalized.push('');
    } else if (trimmed.startsWith('#') || trimmed.startsWith('Host ')) {
      normalized.push(trimmed);
    } else {
      normalized.push(`  ${trimmed}`);
    }
  }
  return normalized;
};

const findGithubIdentityLine = (
  lines: string[],
): { index: number; identityFile: string } | undefined => {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) continue;

    const trimmed = line.trim();
    if (!trimmed.startsWith('IdentityFile ') || !trimmed.includes('github')) {
      continue;
    }

    const identityFile = trimmed.split(/\s+/)[1];
    if (identityFile === undefined) continue;
    return { index, identityFile: expandHome(identityFile) };
  }

  return undefined;
};

const findCurrentEntry = (
  entries: GithubLoginEntry[],
  identityFile: string,
): { entry: GithubLoginEntry; index: number } | undefined => {
  const currentKeyName = path.basename(identityFile);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry === undefined) continue;
    if (path.basename(entry.secKeyPath) === currentKeyName) {
      return { entry, index };
    }
  }
  return undefined;
};

const selectNextIndex = (currentIndex: number, entryCount: number): number => {
  if (entryCount <= 1) {
    throw new Error('At least two config entries are required to switch.');
  }
  return (currentIndex + 1) % entryCount;
};

const promptForIndex = async (
  entries: GithubLoginEntry[],
  currentIndex: number,
): Promise<number> => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log('GitHub identities:');
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (entry === undefined) continue;
      const marker = index === currentIndex ? '*' : ' ';
      console.log(
        `  ${marker} ${index + 1}. ${entry.configname} (${entry.username})`,
      );
    }

    const answer = await rl.question('Select target number: ');
    const selected = Number.parseInt(answer.trim(), 10);
    if (!Number.isInteger(selected) || selected < 1 || selected > entries.length) {
      throw new Error(`Invalid selection: ${answer}`);
    }

    return selected - 1;
  } finally {
    rl.close();
  }
};

const updateGitconfigSymlink = async (
  targetPath: string,
  dryRun: boolean,
): Promise<void> => {
  let stat: Awaited<ReturnType<typeof lstat>> | undefined;
  try {
    stat = await lstat(gitconfigPath);
  } catch {
    stat = undefined;
  }

  if (stat !== undefined && !stat.isSymbolicLink()) {
    throw new Error(
      `${gitconfigPath} exists and is not a symlink. Move it manually before switching.`,
    );
  }

  if (dryRun) return;

  if (stat !== undefined) {
    await unlink(gitconfigPath);
  }
  await symlink(targetPath, gitconfigPath);
};

const writeTextFile = async (
  filePath: string,
  content: string,
  dryRun: boolean,
): Promise<void> => {
  if (dryRun) return;

  const tempPath = `${filePath}.tbx-tmp-${process.pid}`;
  await writeFile(tempPath, content, 'utf8');
  await rename(tempPath, filePath);
};

const printEntry = (label: string, entry: GithubLoginEntry): void => {
  console.log(`${label}: ${entry.configname}`);
  console.log(`  username: ${entry.username}`);
  console.log(`  ssh key:  ${entry.secKeyPath}`);
  console.log(`  gitconf:  ${entry.gitconfigPath}`);
};

const main = async (): Promise<void> => {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      config: { type: 'boolean', short: 'c' },
      'dry-run': { type: 'boolean', short: 'd' },
      help: { type: 'boolean', short: 'h' },
      info: { type: 'boolean', short: 'i' },
      no: { type: 'boolean', short: 'n' },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    console.log(usage);
    return;
  }

  const dryRun = values['dry-run'] === true;
  const entries = await loadEntries();
  const originalLines = await readSshConfigLines();
  const normalizedLines =
    values.config === true ? normalizeSshConfigLines(originalLines) : originalLines;
  const identity = findGithubIdentityLine(normalizedLines);
  if (identity === undefined) {
    throw new Error('No GitHub IdentityFile line was found in ~/.ssh/config.');
  }

  const current = findCurrentEntry(entries, identity.identityFile);
  if (current === undefined) {
    throw new Error(
      `Current GitHub key is not listed in config: ${identity.identityFile}`,
    );
  }

  if (values.info) {
    printEntry('Current', current.entry);
    return;
  }

  const targetIndex =
    values.no === true
      ? selectNextIndex(current.index, entries.length)
      : await promptForIndex(entries, current.index);

  const targetEntry = entries[targetIndex];
  if (targetEntry === undefined) {
    throw new Error(`Invalid target index: ${targetIndex}`);
  }

  const updatedLines = [...normalizedLines];
  updatedLines[identity.index] = `  IdentityFile ${targetEntry.secKeyPath}`;

  printEntry('Current', current.entry);
  printEntry('Target', targetEntry);

  if (dryRun) {
    console.log('Dry run: no files were changed.');
    return;
  }

  await writeTextFile(sshConfigPath, updatedLines.join('\n'), dryRun);
  await updateGitconfigSymlink(targetEntry.gitconfigPath, dryRun);
  console.log('GitHub identity switched.');
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
