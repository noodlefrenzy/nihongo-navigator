// Audit the Git index: ignored local map outputs may exist during development.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 32 * 1024 * 1024 });
const files = git('ls-files', '-z').toString().split('\0').filter(Boolean);
if (!files.includes('LICENSE') || !files.includes('data/sources.lock.json')) {
  throw new Error('No complete source tree in the Git index. Stage the reviewed source files before auditing.');
}
const retainedReports = new Set(['reports/dependency-age.json', 'reports/sudachi-dependency-age.json']);
const forbidden = files.filter(path =>
  (path.startsWith('public/data/') && path !== 'public/data/README.md') ||
  path.startsWith('data/facts/') ||
  (path.startsWith('reports/') && !retainedReports.has(path)) ||
  /\.(?:pmtiles|geojson|wkb|zip)$/i.test(path) ||
  /(?:^|\/)(?:\.data-cache|\.venv|node_modules|dist|test-results|playwright-report|__pycache__)(?:\/|$)/.test(path) ||
  /^(?:\.codex\/|\.agents\/|\.impeccable\/(?:review|mocks)\/|RECOVERY\.md$)/.test(path) ||
  (/(?:^|\/)\.env(?:\.|$)/.test(path) && path !== '.env.example'),
);
if (forbidden.length) throw new Error(`Files excluded from this source release are staged/tracked:\n${forbidden.join('\n')}`);

// Check indexed bytes, including upstream snapshots and font-license notices.
const manifest = JSON.parse(git('show', ':data/sources.lock.json').toString());
const inputs = new Map();
for (const source of manifest.sources) {
  if (source.local_path) inputs.set(source.local_path, source.sha256);
  if (source.license_path) inputs.set(source.license_path, source.license_sha256);
}
for (const [path, expected] of inputs) {
  if (!files.includes(path)) throw new Error(`Missing vendored input: ${path}`);
  const actual = createHash('sha256').update(git('show', `:${path}`)).digest('hex');
  if (!expected || actual !== expected) throw new Error(`Pinned input changed: ${path}`);
}
console.log(`PASS: ${files.length} indexed source files; excluded map outputs absent; ${inputs.size} pinned inputs verified.`);
