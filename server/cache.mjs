import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export function fileCache(directory) {
  const file = key => {
    if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Invalid cache key');
    return join(directory, `${key}.json`);
  };
  return {
    async get(key) {
      try { return JSON.parse(await readFile(file(key), 'utf8')); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async set(key, value) {
      await mkdir(directory, { recursive: true });
      const temporary = `${file(key)}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(value), { mode: 0o600 });
      await rename(temporary, file(key));
    },
  };
}
