import { readFileSync } from 'node:fs';
import { createProvider } from './provider.mjs';
import { createCodexProvider } from './codex-provider.mjs';

export function configuredProvider(env = process.env) {
  const config = JSON.parse(readFileSync(new URL('../config/llm.json', import.meta.url), 'utf8'));
  if (env.CHIZU_LLM_MODEL) config.model = env.CHIZU_LLM_MODEL;
  const kind = env.CHIZU_LLM_PROVIDER || config.provider;
  if (kind === 'codex-cli') return createCodexProvider(config, env);
  if (kind === 'responses') return createProvider({ ...env, CHIZU_LLM_MODEL: config.model });
  throw new Error(`Unknown model provider: ${kind}`);
}
