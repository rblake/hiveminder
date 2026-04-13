/**
 * parseVoiceInput — convert natural speech to Hiveminder braindump syntax.
 *
 * The user speaks naturally; this function extracts metadata phrases and
 * rewrites them as braindump tokens that CreateTask already parses:
 *
 *   "buy milk due tomorrow"              → "buy milk [due: tomorrow]"
 *   "call dentist high priority"         → "call dentist [priority: high]"
 *   "buy milk tags errands groceries"    → "buy milk [errands groceries]"
 *   "pay rent every month"               → "pay rent [every: month]"
 *   "buy presents hide until christmas"  → "buy presents [hide: christmas]"
 *   "expense report for group work"      → "expense report [group: work]"
 *
 * Anything not matched is left as the task name. Braindump dates in the
 * task name (e.g. "call dentist friday") are parsed server-side without
 * needing an explicit [due:] token.
 */
export function parseVoiceInput(transcript: string): string {
  let text = transcript.trim();
  const tokens: string[] = [];

  // Lookahead: stop capturing a value when another metadata keyword starts,
  // or at end of string.
  const STOP = '(?=\\s+(?:due|priority|prio|tags?|hide|starts?|every|repeats?|group)\\b|$)';

  // ---- Priority ----
  // "priority high" / "prio high" / "high priority"
  text = text.replace(
    /\b(?:priority|prio)\s+(highest|high|medium|normal|low|lowest)\b/gi,
    (_, p) => { tokens.push(`[priority: ${p.toLowerCase()}]`); return ''; }
  );
  text = text.replace(
    /\b(highest|high|medium|low|lowest)\s+(?:priority|prio)\b/gi,
    (_, p) => { tokens.push(`[priority: ${p.toLowerCase()}]`); return ''; }
  );

  // ---- Tags ----
  // "tag errands" / "tags errands groceries"
  text = text.replace(
    new RegExp(`\\btags?\\s+([\\w][\\w\\s]*)${STOP}`, 'gi'),
    (_, t) => { tokens.push(`[${t.trim()}]`); return ''; }
  );

  // ---- Hide until ----
  // "hide until friday" (more specific — must come before plain "hide X")
  text = text.replace(
    new RegExp(`\\bhide\\s+until\\s+([\\w][\\w\\s]*)${STOP}`, 'gi'),
    (_, d) => { tokens.push(`[hide: ${d.trim()}]`); return ''; }
  );

  // "starts friday" / "hide friday"
  text = text.replace(
    new RegExp(`\\b(?:starts?|hide)\\s+([\\w][\\w\\s]*)${STOP}`, 'gi'),
    (_, d) => { tokens.push(`[hide: ${d.trim()}]`); return ''; }
  );

  // ---- Due date ----
  // "due tomorrow" / "due on friday" / "due next week"
  text = text.replace(
    new RegExp(`\\bdue\\s+(?:on\\s+)?([\\w][\\w\\s]*)${STOP}`, 'gi'),
    (_, d) => { tokens.push(`[due: ${d.trim()}]`); return ''; }
  );

  // ---- Repeat ----
  // "every week" / "repeats monthly" / "repeat daily"
  const PERIOD_MAP: Record<string, string> = {
    daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year',
  };
  text = text.replace(
    /\b(?:every|repeats?)\s+(day|week|month|year|daily|weekly|monthly|yearly)\b/gi,
    (_, p) => {
      tokens.push(`[every: ${PERIOD_MAP[p.toLowerCase()] ?? p.toLowerCase()}]`);
      return '';
    }
  );

  // ---- Group ----
  // "for group work" / "in group work" / "group work"
  text = text.replace(
    new RegExp(`\\b(?:(?:for|in)\\s+)?group\\s+([\\w][\\w\\s]*)${STOP}`, 'gi'),
    (_, g) => { tokens.push(`[group: ${g.trim()}]`); return ''; }
  );

  // Clean up leftover whitespace from removed phrases
  const name = text.replace(/\s{2,}/g, ' ').trim();
  return tokens.length ? `${name} ${tokens.join(' ')}`.trim() : name;
}
