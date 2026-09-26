import { readFile, writeFile, mkdir } from 'node:fs/promises';

const lockPath = process.argv[2] ?? 'pnpm-lock.yaml';
const policy = await readFile('pnpm-workspace.yaml', 'utf8');
for (const required of ['minimumReleaseAge: 4321', 'minimumReleaseAgeIgnoreMissingTime: false', 'minimumReleaseAgeStrict: true']) {
  if (!policy.includes(required)) throw new Error(`Missing quarantine policy: ${required}`);
}
if (/minimumReleaseAgeExclude/.test(policy)) throw new Error('Quarantine exclusions require explicit approval.');
const lock = await readFile(lockPath, 'utf8');
const section = lock.split('\npackages:\n')[1]?.split('\nsnapshots:\n')[0];
if (!section) throw new Error('Unsupported or empty lockfile; cannot verify packages.');
const entries = [...section.matchAll(/^  ['"]?([^\s'"]+)@([^\s:'"]+)['"]?:\s*$/gm)]
  .map(([, name, version]) => ({ name, version }));
if (!entries.length) throw new Error('No packages parsed; refusing to pass an empty audit.');
const checkedAt = new Date();
const registry = new Map();
const results = [];
for (let start = 0; start < entries.length; start += 8) {
  const batch = await Promise.all(entries.slice(start, start + 8).map(async ({ name, version }) => {
    if (!registry.has(name)) registry.set(name, fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      signal: AbortSignal.timeout(30_000),
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Registry ${response.status}: ${name}`);
      return response.json();
    }));
    const metadata = await registry.get(name);
    const published = metadata.time?.[version];
    const age = checkedAt.getTime() - Date.parse(published);
    if (!published || !Number.isFinite(age) || age <= 72 * 60 * 60 * 1000) {
      throw new Error(`Ineligible dependency: ${name}@${version}; timestamp=${published}`);
    }
    return { name, version, published };
  }));
  results.push(...batch);
}
await mkdir('reports', { recursive: true });
await writeFile('reports/dependency-age.json', JSON.stringify({ checkedAt, registry: 'https://registry.npmjs.org', minimumAgeHours: 72, packages: results }, null, 2) + '\n');
console.log(`Verified ${results.length} exact resolutions, all strictly older than 72 hours.`);
