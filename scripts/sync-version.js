/**
 * Sync version from package.json to other files
 * Run after npm version commands
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`Syncing version ${version} across files...`);

// 1. Update index.html
const indexPath = join(rootDir, 'index.html');
let indexHtml = readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace(
    /<meta name="version" content="[^"]*">/,
    `<meta name="version" content="${version}">`
);
indexHtml = indexHtml.replace(
    /<p class="version-tag-bottom">v[^<]*</,
    `<p class="version-tag-bottom">v${version}<`
);
writeFileSync(indexPath, indexHtml);
console.log('✓ Updated index.html');

// 2. Update versionChecker.ts
const versionCheckerPath = join(rootDir, 'src', 'utils', 'versionChecker.ts');
let versionChecker = readFileSync(versionCheckerPath, 'utf8');
versionChecker = versionChecker.replace(
    /const APP_VERSION = '[^']*';/,
    `const APP_VERSION = '${version}';`
);
writeFileSync(versionCheckerPath, versionChecker);
console.log('✓ Updated versionChecker.ts');

console.log(`\n✅ Version ${version} synced successfully!`);
console.log('\nNext steps:');
console.log('1. Update CHANGELOG.md with release notes');
console.log('2. git add -A');
console.log(`3. git commit -m "chore: bump version to ${version}"`);
console.log('4. git push');
