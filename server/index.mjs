import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { configuredProvider } from './configured-provider.mjs';
import { createService } from './service.mjs';
import { createHandler } from './http.mjs';

try { process.loadEnvFile('.env'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const service = await createService(root, configuredProvider());
const port = Number(process.env.CHIZU_PORT || 8787);
createServer(createHandler(service)).listen(port, '127.0.0.1', () => console.log(`Chizu content service: http://127.0.0.1:${port}`));
