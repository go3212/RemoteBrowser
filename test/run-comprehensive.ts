import { spawn } from 'child_process';
import path from 'path';

interface TestSuite {
  name: string;
  script: string;
  estimatedTime: string;
}

const testSuites: TestSuite[] = [
  { name: 'Health Check', script: 'test:health', estimatedTime: '< 5s' },
  { name: 'Error Handling', script: 'test:error', estimatedTime: '10-20s' },
  { name: 'Session Management', script: 'test:session', estimatedTime: '30-60s' },
  { name: 'Browser Operations', script: 'test:browser', estimatedTime: '60-120s' },
  { name: 'Page Interactions', script: 'test:interaction', estimatedTime: '60-90s' },
  { name: 'Profiles & Storage', script: 'test:profiles', estimatedTime: '90-120s' },
  { name: 'Advanced Tests', script: 'test:advanced', estimatedTime: '120-180s' },
];

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

async function runTest(suite: TestSuite): Promise<TestResult> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Running: ${suite.name} (estimated: ${suite.estimatedTime})`);
    console.log(`${'='.repeat(80)}\n`);
    
    const proc = spawn('npm', ['run', suite.script], {
      stdio: 'inherit',
      shell: true,
    });
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      const passed = code === 0;
      
      resolve({
        name: suite.name,
        passed,
        duration,
        error: passed ? undefined : `Exit code: ${code}`,
      });
    });
    
    proc.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        name: suite.name,
        passed: false,
        duration,
        error: error.message,
      });
    });
  });
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

function printSummary(results: TestResult[]) {
  console.log('\n\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(25) + 'TEST SUMMARY' + ' '.repeat(41) + '║');
  console.log('╠' + '═'.repeat(78) + '╣');
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  results.forEach((result) => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const color = result.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    const duration = formatDuration(result.duration);
    
    const line = `${color}${status}${reset} ${result.name}`;
    const padding = 70 - result.name.length - 6; // account for color codes
    const durationPadded = duration.padStart(padding);
    
    console.log(`║  ${line}${durationPadded}  ║`);
    
    if (result.error) {
      console.log(`║    Error: ${result.error.substring(0, 60).padEnd(60)}  ║`);
    }
  });
  
  console.log('╠' + '═'.repeat(78) + '╣');
  console.log(`║  Total Tests: ${results.length}  |  Passed: ${passed}  |  Failed: ${failed}  |  Duration: ${formatDuration(totalDuration)}`.padEnd(79) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  } else {
    console.log('\n🎉 All tests passed!');
  }
  
  console.log('\nTest coverage:');
  console.log('  ✅ Session lifecycle management');
  console.log('  ✅ Context and page operations');
  console.log('  ✅ Browser automation (navigation, clicks, typing)');
  console.log('  ✅ Content extraction and queries');
  console.log('  ✅ JavaScript evaluation');
  console.log('  ✅ Screenshots');
  console.log('  ✅ Storage state and cookies');
  console.log('  ✅ Context isolation');
  console.log('  ✅ Error handling');
  console.log('  ✅ Concurrent sessions');
  console.log('  ✅ Large content and rapid operations');
  console.log('  ✅ Complex CSS selectors');
  console.log('\nFor C# tests, run: cd clients/csharp/RemoteBrowserClient && dotnet test');
  console.log('For test documentation, see: test/COMPREHENSIVE_TESTS.md\n');
}

async function main() {
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(15) + 'REMOTE BROWSER COMPREHENSIVE TEST SUITE' + ' '.repeat(24) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  
  console.log('\nThis will run all test suites sequentially.');
  console.log('Estimated total time: 8-12 minutes\n');
  
  console.log('Prerequisites:');
  console.log('  ✓ Docker is running');
  console.log('  ✓ Server is started (or will test against localhost)');
  console.log('  ✓ AUTH_PASSWORD environment variable is set (if needed)\n');
  
  const startTime = Date.now();
  const results: TestResult[] = [];
  
  for (const suite of testSuites) {
    const result = await runTest(suite);
    results.push(result);
    
    // If a test fails, ask if we should continue
    if (!result.passed) {
      console.log(`\n⚠️  ${suite.name} failed.`);
      // Continue with other tests anyway to get full picture
    }
  }
  
  const totalDuration = Date.now() - startTime;
  printSummary(results);
  
  // Exit with error code if any tests failed
  const failed = results.filter(r => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

