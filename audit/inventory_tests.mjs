import fs from 'node:fs';
import path from 'node:path';

function findTestsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const tests = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // JS/TS: it(..., test(...
    const itMatch = line.match(/^\s*(?:it|test)\s*\(\s*(['"`])(.*?)\1/);
    if (itMatch) {
      tests.push({ file: filePath, line: i + 1, name: itMatch[2] });
    }
    // Python: def test_...
    const pyMatch = line.match(/^\s*def\s+(test_[a-zA-Z0-9_]+)/);
    if (pyMatch) {
      tests.push({ file: filePath, line: i + 1, name: pyMatch[1] });
    }
  }
  return tests;
}

const suites = {
  extension: ['BrowserExtension/tests'],
  backend_js: ['Backend/tests'],
  backend_py: ['Backend/tests'],
  frontend_unit: ['Frontend/tests'],
  frontend_e2e: ['Frontend/tests/e2e']
};

console.log('=== TEST DEFINITION INVENTORY ===');

let totalCount = 0;
const allTests = [];

// 1. Extension
const extTests = fs.readdirSync('BrowserExtension/tests')
  .filter(f => f.endsWith('.test.js'))
  .flatMap(f => findTestsInFile(path.join('BrowserExtension/tests', f)));
console.log(`Browser Extension Tests: ${extTests.length}`);
totalCount += extTests.length;
allTests.push(...extTests);

// 2. Backend JS
const backendJsTests = fs.readdirSync('Backend/tests')
  .filter(f => f.endsWith('.test.js'))
  .flatMap(f => findTestsInFile(path.join('Backend/tests', f)));
console.log(`Backend JS Tests: ${backendJsTests.length}`);
totalCount += backendJsTests.length;
allTests.push(...backendJsTests);

// 3. Backend Python
const backendPyTests = fs.readdirSync('Backend/tests')
  .filter(f => f.startsWith('test_') && f.endsWith('.py'))
  .flatMap(f => findTestsInFile(path.join('Backend/tests', f)));
console.log(`Backend Python Tests: ${backendPyTests.length}`);
totalCount += backendPyTests.length;
allTests.push(...backendPyTests);

// 4. Frontend Unit
const frontendUnitTests = fs.readdirSync('Frontend/tests')
  .filter(f => f.endsWith('.test.js'))
  .flatMap(f => findTestsInFile(path.join('Frontend/tests', f)));
console.log(`Frontend Unit Tests: ${frontendUnitTests.length}`);
totalCount += frontendUnitTests.length;
allTests.push(...frontendUnitTests);

// 5. Frontend E2E
const frontendE2eTests = fs.readdirSync('Frontend/tests/e2e')
  .filter(f => f.endsWith('.spec.ts'))
  .flatMap(f => findTestsInFile(path.join('Frontend/tests/e2e', f)));
console.log(`Frontend Playwright E2E Tests: ${frontendE2eTests.length}`);
totalCount += frontendE2eTests.length;
allTests.push(...frontendE2eTests);

console.log(`\nTotal Test Definitions Found: ${totalCount}`);

// Check uniqueness of test names within each runner
const names = new Set();
let duplicates = 0;
for (const t of allTests) {
  const key = `${t.file}::${t.name}`;
  if (names.has(key)) {
    console.log(`Duplicate test definition: ${key}`);
    duplicates++;
  }
  names.add(key);
}
console.log(`Duplicates within test files: ${duplicates}`);
console.log(`Unique test cases across all test files: ${names.size}`);
