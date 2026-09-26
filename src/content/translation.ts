import type { Judgment, Sentence } from './types.ts';

/** Preserve interior punctuation and numbers: 3.14 must never become 314. */
export function normalizeAnswer(answer: string): string {
  return answer.normalize('NFKC').toLowerCase().replace(/[‘’]/g, "'")
    .trim().replace(/[.!?。！？]+$/u, '').replace(/\s+/g, ' ');
}

export function referenceMatch(sentence: Sentence, answer: string): Judgment | null {
  const key = normalizeAnswer(answer);
  if (!key || !sentence.references.some(r => normalizeAnswer(r) === key)) return null;
  return { score: 100, verdict: 'Meaning conveyed', units: sentence.units.map(u => ({ unit: u.id, status: 'conveyed' })),
    issues: [], feedback: 'Your translation matches a reference translation.', suggested_translation: sentence.references[0], method: 'reference' };
}

function words(value: string): string {
  return ` ${normalizeAnswer(value).replace(/[^\p{L}\p{N}.']/gu, ' ').replace(/\s+/g, ' ')} `;
}

/** A deliberately limited offline aid, never presented as a model judgment. */
export function approximateJudgment(sentence: Sentence, answer: string): Judgment {
  const exact = referenceMatch(sentence, answer);
  if (exact) return exact;
  const text = words(answer);
  const extraNegation = /\b(?:not|no|never|isn't|aren't|wasn't|doesn't|don't)\b/.test(text) &&
    !sentence.references.some(r => /\b(?:not|no|never|isn't|aren't|wasn't|doesn't|don't)\b/.test(words(r)));
  const units: Judgment['units'] = sentence.units.map(unit => {
    const hits = unit.keywords.map(alternatives => alternatives.some(word => text.includes(words(word))));
    return { unit: unit.id, status: extraNegation ? 'wrong' : hits.length && hits.every(Boolean) ? 'conveyed' : hits.some(Boolean) ? 'partial' : 'missing' };
  });
  const weight = units.reduce((sum, unit) => sum + (unit.status === 'conveyed' ? 1 : unit.status === 'partial' ? .5 : 0), 0);
  let score = Math.min(90, Math.round(100 * weight / Math.max(1, units.length)));
  if (sentence.units.some(u => u.critical && units.find(v => v.unit === u.id)?.status !== 'conveyed')) score = Math.min(score, 40);
  return { score, verdict: 'Approximate keyword check', units,
    issues: units.filter(u => u.status !== 'conveyed').map(u => ({ ja_span: sentence.units.find(unit => unit.id === u.unit)!.ja_span,
      learner_text: '', explanation: extraNegation ? 'Check whether the Japanese sentence is negative.' : 'This meaning was not fully recognized by the offline keyword check.' })),
    feedback: 'This is an approximate keyword check. Compare the reference; paraphrases may not be recognized.',
    suggested_translation: sentence.references[0], method: 'approximate' };
}
