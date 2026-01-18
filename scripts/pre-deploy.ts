#!/usr/bin/env bun
/**
 * Pre-deployment validation script
 * Run before deploying to production: bun run scripts/pre-deploy.ts
 *
 * This script runs build tools with hardcoded commands only.
 * No user input is processed.
 */

import { spawnSync } from 'node:child_process';

interface CheckResult {
  name: string;
  passed: boolean;
  message?: string;
  duration?: number;
}

const checks: CheckResult[] = [];

function log(message: string): void {
  console.log(`[pre-deploy] ${message}`);
}

function success(name: string, message?: string, duration?: number): void {
  checks.push({ name, passed: true, message, duration });
  const durationStr = duration ? ` (${duration}ms)` : '';
  console.log(`  [PASS] ${name}${message ? `: ${message}` : ''}${durationStr}`);
}

function fail(name: string, message: string): void {
  checks.push({ name, passed: false, message });
  console.error(`  [FAIL] ${name}: ${message}`);
}

function runCommand(command: string, args: string[]): { stdout: string; success: boolean } {
  const result = spawnSync(command, args, { encoding: 'utf-8', stdio: 'pipe' });
  return {
    stdout: result.stdout ?? '',
    success: result.status === 0,
  };
}

async function checkTypeScript(): Promise<void> {
  log('Checking TypeScript...');
  const start = Date.now();
  const result = runCommand('bun', ['run', 'typecheck']);
  const duration = Date.now() - start;

  if (result.success) {
    success('TypeScript', 'No type errors', duration);
  } else {
    fail('TypeScript', 'Type errors found. Run `bun run typecheck` for details.');
  }
}

async function checkLinting(): Promise<void> {
  log('Checking linting...');
  const start = Date.now();
  const result = runCommand('bun', ['run', 'lint']);
  const duration = Date.now() - start;

  if (result.success) {
    success('Linting', 'No lint errors', duration);
  } else {
    fail('Linting', 'Lint errors found. Run `bun run lint` for details.');
  }
}

async function checkTests(): Promise<void> {
  log('Running tests...');
  const start = Date.now();
  const result = runCommand('bun', ['run', 'test']);
  const duration = Date.now() - start;

  if (result.success) {
    success('Tests', 'All tests passed', duration);
  } else {
    fail('Tests', 'Some tests failed. Run `bun run test` for details.');
  }
}

async function checkBuild(): Promise<void> {
  log('Testing build...');
  const start = Date.now();
  const result = runCommand('bun', ['run', 'build']);
  const duration = Date.now() - start;

  if (result.success) {
    success('Build', 'Build successful', duration);
  } else {
    fail('Build', 'Build failed. Run `bun run build` for details.');
  }
}

function checkEnvironmentVariables(): void {
  log('Checking environment variables...');

  const required = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'TOKEN_ENCRYPTION_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'ABLY_API_KEY',
  ];

  const optional = [
    'SENTRY_DSN',
    'NEXT_PUBLIC_POSTHOG_KEY',
    'AUTH_GOOGLE_ID',
    'AUTH_GITHUB_ID',
  ];

  const missing = required.filter((key) => !process.env[key]);
  const missingOptional = optional.filter((key) => !process.env[key]);

  if (missing.length === 0) {
    success('Required env vars', `All ${required.length} required variables set`);
  } else {
    fail('Required env vars', `Missing: ${missing.join(', ')}`);
  }

  if (missingOptional.length > 0) {
    log(`  [WARN] Optional env vars missing: ${missingOptional.join(', ')}`);
  }
}

function checkGitStatus(): void {
  log('Checking git status...');

  // Check for uncommitted changes
  const statusResult = runCommand('git', ['status', '--porcelain']);
  if (statusResult.stdout.trim()) {
    fail('Git status', 'Uncommitted changes detected');
    return;
  }

  // Check current branch
  const branchResult = runCommand('git', ['branch', '--show-current']);
  const branch = branchResult.stdout.trim();

  if (branch !== 'main' && branch !== 'master') {
    log(`  [WARN] Not on main branch (currently on: ${branch})`);
  }

  success('Git status', `Clean working tree on ${branch}`);
}

function checkDependencies(): void {
  log('Checking dependencies...');

  // Check lock file exists
  const result = runCommand('bun', ['pm', 'ls']);
  if (!result.success) {
    fail('Dependencies', 'Could not check dependencies');
    return;
  }

  success('Dependencies', 'Lock file valid');
}

function checkSecurityPatterns(): void {
  log('Checking for security anti-patterns...');

  const patterns = [
    { pattern: 'console\\.log\\(.*password', name: 'password logging' },
    { pattern: 'console\\.log\\(.*secret', name: 'secret logging' },
    { pattern: 'eval\\s*\\(', name: 'eval usage' },
  ];

  const issues: string[] = [];

  for (const { pattern, name } of patterns) {
    const result = runCommand('grep', ['-rn', pattern, 'src/', '--include=*.ts', '--include=*.tsx']);
    if (result.success && result.stdout.trim()) {
      issues.push(name);
    }
  }

  if (issues.length === 0) {
    success('Security patterns', 'No obvious security issues');
  } else {
    fail('Security patterns', `Found: ${issues.join(', ')}`);
  }
}

function printSummary(): void {
  console.log('');
  console.log('='.repeat(60));
  console.log('PRE-DEPLOYMENT CHECK SUMMARY');
  console.log('='.repeat(60));
  console.log('');

  const passed = checks.filter((c) => c.passed);
  const failed = checks.filter((c) => !c.passed);

  console.log(`Passed: ${passed.length}/${checks.length}`);
  console.log(`Failed: ${failed.length}/${checks.length}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed checks:');
    for (const check of failed) {
      console.log(`  - ${check.name}: ${check.message}`);
    }
    console.log('');
    console.log('Please fix the above issues before deploying.');
    console.log('='.repeat(60));
    process.exit(1);
  }

  console.log('All checks passed! Ready for deployment.');
  console.log('='.repeat(60));
}

async function main(): Promise<void> {
  console.log('');
  console.log('='.repeat(60));
  console.log('DROPDECK PRE-DEPLOYMENT CHECKLIST');
  console.log('='.repeat(60));
  console.log('');

  // Run checks
  checkGitStatus();
  checkEnvironmentVariables();
  checkDependencies();
  checkSecurityPatterns();

  await checkTypeScript();
  await checkLinting();
  await checkTests();
  await checkBuild();

  printSummary();
}

main().catch((error) => {
  console.error('Pre-deployment check failed:', error);
  process.exit(1);
});
