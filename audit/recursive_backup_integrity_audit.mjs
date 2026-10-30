import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_REPO = path.resolve('.');
const P11_BACKUP = path.resolve('../skillverse_phase11_backup');
const P11_1_BACKUP = path.resolve('../skillverse_phase11_1_supplemental_backup_20261028');
const P12_1_BACKUP = path.resolve('../skillverse_phase12_1_supplemental_backup_20261028');
const P12_2_BACKUP = path.resolve('../skillverse_phase12_2_supplemental_backup_20261028');

const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.venv',
  'dist',
  'test-results',
  '.git',
  '__pycache__',
  'logs',
  'audit'
]);

const EXCLUDE_FILES = new Set([
  '.env',
  'Backend/models/live_faiss.index',
  'Backend/models/live_faiss.index.bak',
  'Backend/models/live_meta.json',
  'Backend/models/live_meta.json.bak'
]);

function getFileHashAndSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return { size: buffer.length, sha256: hash };
}

function scanDir(dir, baseDir = dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) {
        continue;
      }
      results.push(...scanDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      if (EXCLUDE_FILES.has(relPath) || entry.name.endsWith('.pyc')) {
        continue;
      }
      const { size, sha256 } = getFileHashAndSize(fullPath);
      results.push({ relPath, size, sha256 });
    }
  }

  return results;
}

console.log('=== SKILLVERSE RECURSIVE BACKUP INTEGRITY AUDIT ===');
console.log('Source Repository:', ROOT_REPO);

const repoFiles = scanDir(ROOT_REPO);
console.log(`Scanned ${repoFiles.length} required files in source repository (excluding generated dirs/secrets/live indexes).`);

const repoMap = new Map(repoFiles.map(f => [f.relPath, f]));

function compareBackup(name, backupDir) {
  console.log(`\nAuditing Backup: ${name} (${backupDir})`);
  if (!fs.existsSync(backupDir)) {
    console.log(`  ERROR: Directory does not exist!`);
    return null;
  }

  const backupFiles = scanDir(backupDir);
  const backupMap = new Map(backupFiles.map(f => [f.relPath, f]));

  let identicalCount = 0;
  let mismatchedHashCount = 0;
  let missingFromBackup = [];
  let extraInBackup = [];

  for (const [relPath, repoFile] of repoMap.entries()) {
    const backupFile = backupMap.get(relPath);
    if (!backupFile) {
      missingFromBackup.push(relPath);
    } else if (backupFile.sha256 === repoFile.sha256) {
      identicalCount++;
    } else {
      mismatchedHashCount++;
    }
  }

  for (const [relPath] of backupMap.entries()) {
    if (!repoMap.has(relPath)) {
      extraInBackup.push(relPath);
    }
  }

  console.log(`  Total files in backup: ${backupFiles.length}`);
  console.log(`  Identical SHA-256 match with repo: ${identicalCount}`);
  console.log(`  Mismatched SHA-256: ${mismatchedHashCount}`);
  console.log(`  Missing from backup (new since backup): ${missingFromBackup.length}`);
  console.log(`  Extra in backup (deleted in repo): ${extraInBackup.length}`);

  return {
    name,
    path: backupDir,
    totalFiles: backupFiles.length,
    identicalCount,
    mismatchedHashCount,
    missingCount: missingFromBackup.length,
    missingFiles: missingFromBackup,
    extraCount: extraInBackup.length,
    extraFiles: extraInBackup
  };
}

const auditP11 = compareBackup('Phase 11 Primary Backup', P11_BACKUP);
const auditP11_1 = compareBackup('Phase 11.1 Supplemental Backup', P11_1_BACKUP);
const auditP12_1 = compareBackup('Phase 12.1 Supplemental Backup', P12_1_BACKUP);
const auditP12_2 = compareBackup('Phase 12.2 Supplemental Backup', P12_2_BACKUP);

const manifestOutput = {
  timestamp: new Date().toISOString(),
  totalExpectedRequiredFiles: repoFiles.length,
  exclusions: {
    directories: Array.from(EXCLUDE_DIRS),
    files: Array.from(EXCLUDE_FILES),
    patterns: ['*.pyc']
  },
  backups: {
    phase11_primary: auditP11,
    phase11_1_supplemental: auditP11_1,
    phase12_1_supplemental: auditP12_1,
    phase12_2_supplemental: auditP12_2
  },
  files: repoFiles
};

const manifestPath = path.resolve('audit/backup_integrity_manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifestOutput, null, 2), 'utf8');
console.log(`\nMachine-readable integrity manifest written to: ${manifestPath}`);
