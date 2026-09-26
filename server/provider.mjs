import { validateSchema } from './schema.mjs';

export class UnavailableError extends Error {}

/** Provider boundary. Applications may inject another object with generate(). */
export function createProvider(env = process.env, fetcher = fetch) {
  const base = env.CHIZU_LLM_BASE_URL || 'https://api.openai.com/v1';
  const model = env.CHIZU_LLM_MODEL;
  const key = env.CHIZU_LLM_API_KEY || env.OPENAI_API_KEY;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname);
  if (!base.startsWith('https://') && !(local && base.startsWith('http://'))) throw new Error('Model URL requires HTTPS or local HTTP');
  return {
    model,
    async generate({ name, schema, instructions, input, maxTokens = 6000 }) {
      if (!model || (!key && !local)) throw new UnavailableError('Configure a server-side model and API key before generating content.');
      const response = await fetcher(`${base.replace(/\/$/, '')}/responses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
        body: JSON.stringify({ model, store: false, instructions, input: JSON.stringify(input), max_output_tokens: maxTokens,
          text: { format: { type: 'json_schema', name, strict: true, schema } } }),
        signal: AbortSignal.timeout(90000),
      });
      // Never echo provider bodies: they can contain submitted text or credentials.
      if (!response.ok) throw new UnavailableError(`Model service returned HTTP ${response.status}.`);
      const result = await response.json();
      if (result.status !== 'completed' || result.error) throw new UnavailableError('Model response was incomplete.');
      const content = (result.output ?? []).flatMap(item => item.content ?? []);
      if (content.some(item => item.type === 'refusal')) throw new UnavailableError('Model declined this request.');
      const texts = content.filter(item => item.type === 'output_text');
      if (texts.length !== 1) throw new Error('Expected exactly one structured model response');
      const value = JSON.parse(texts[0].text);
      validateSchema(value, schema);
      return value;
    },
  };
}
