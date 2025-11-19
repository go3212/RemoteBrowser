#!/usr/bin/env tsx

/**
 * Master test runner that executes all test suites in order
 * and provides a summary of results
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const tests = [
  { name: 'Health Check', command: 'tsx test/health.test.ts' },
  { name: 'Error Handling', command: 'tsx test/error-handling.test.ts' },
  { name: 'Session Management', command: 'tsx test/session.test.ts' },
  { name: 'Browser Operations', command: 'tsx test/browser.test.ts' },
  { name: 'User Interactions', command: 'tsx test/interaction.test.ts' },
];

async function runTest(name: string, command: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    await execAsync(command);
    const duration = Date.now() - startTime;
    return { name, passed: true, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return { name, passed: false, duration, error: error.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Remote Browser Server - Complete Test Suite          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠  Prerequisites:');
  console.log('   - Docker must be running');
  console.log('   - Server must be running (npm start)');
  console.log('   - These tests may take 5-10 minutes to complete');
  console.log('');
  
  const results: TestResult[] = [];
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n[${i + 1}/${tests.length}] Running ${test.name}...`);
    console.log('─'.repeat(60));
    
    const result = await runTest(test.name, test.command);
    results.push(result);
    
    if (result.passed) {
      console.log(`\n✓ ${test.name} PASSED (${(result.duration / 1000).toFixed(1)}s)`);
    } else {
      console.log(`\n✗ ${test.name} FAILED (${(result.duration / 1000).toFixed(1)}s)`);
      console.log(`  Error: ${result.error}`);
    }
  }
  
  // Print summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  results.forEach((result, index) => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const duration = `${(result.duration / 1000).toFixed(1)}s`;
    console.log(`  ${status}  ${result.name.padEnd(30)} ${duration.padStart(8)}`);
  });
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log('');
  console.log('─'.repeat(60));
  console.log(`  Total: ${passed}/${total} test suites passed`);
  console.log(`  Duration: ${(totalTime / 1000).toFixed(1)}s`);
  console.log('');
  
  if (passed === total) {
    console.log('✓ All tests passed successfully!');
    console.log('');
    process.exit(0);
  } else {
    console.log('✗ Some tests failed. Please review the output above.');
    console.log('');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});

