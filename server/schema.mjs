/** The small JSON Schema subset used by our provider contracts, fail closed. */
export function validateSchema(value, schema, path = '$') {
  const fail = message => { throw new Error(`${path}: ${message}`); };
  if (schema.enum && !schema.enum.includes(value)) fail('value outside enum');
  if (schema.type === 'null') { if (value !== null) fail('expected null'); return; }
  if (schema.anyOf) {
    if (!schema.anyOf.some(option => { try { validateSchema(value, option, path); return true; } catch { return false; } })) fail('no allowed type');
    return;
  }
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('expected object');
    for (const key of schema.required) if (!(key in value)) fail(`missing ${key}`);
    for (const [key, child] of Object.entries(value)) {
      if (!Object.hasOwn(schema.properties, key)) fail(`unexpected ${key}`);
      validateSchema(child, schema.properties[key], `${path}.${key}`);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) fail('expected array');
    if (value.length < (schema.minItems ?? 0) || value.length > (schema.maxItems ?? Infinity)) fail('array length outside bounds');
    value.forEach((child, i) => validateSchema(child, schema.items, `${path}[${i}]`));
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') fail('expected string');
    if (value.length < (schema.minLength ?? 0) || value.length > (schema.maxLength ?? Infinity)) fail('string length outside bounds');
  } else if (schema.type === 'number' || schema.type === 'integer') {
    if (typeof value !== 'number' || !Number.isFinite(value) || (schema.type === 'integer' && !Number.isInteger(value))) fail('expected finite number');
    if (value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity)) fail('number outside bounds');
  } else if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') fail('expected boolean');
  } else fail('unsupported schema');
}
export const string = (maxLength = 500) => ({ type: 'string', minLength: 1, maxLength });
export const array = (items, minItems, maxItems) => ({ type: 'array', items, minItems, maxItems });
export const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const judgmentSchema = object({
  score: { type: 'integer', minimum: 0, maximum: 100 }, verdict: string(100),
  units: array(object({ unit: string(100), status: { type: 'string', enum: ['conveyed', 'partial', 'missing', 'wrong'] } }), 1, 12),
  issues: array(object({ ja_span: string(300), learner_text: { type: 'string', maxLength: 1000 }, explanation: string(300) }), 0, 12),
  feedback: string(500), suggested_translation: string(600),
});

const segment = object({ text: string(200), reading: { type: 'string', maxLength: 300 }, place_id: { anyOf: [string(40), { type: 'null' }] } });
const unit = object({ id: string(40), ja_span: string(300), meaning: string(300),
  keywords: array(array(string(100), 1, 5), 1, 8), critical: { type: 'boolean' } });
export const readerSchema = object({ sentences: array(object({ text: string(500),
  segments: array(segment, 1, 100), references: array(string(600), 1, 2), units: array(unit, 1, 12),
  difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
  source_fact_ids: array(string(100), 1, 8),
}), 3, 6) });
