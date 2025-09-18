// Lightweight natural language extraction for meeting scheduling
// Extracts: time (HH:MM 24h), am/pm conversion, attendees (after 'with'), possible title tokens
// Note: This is heuristic; backend LLM parsing still used for refinement once core slots present.

export interface PartialSchedule {
  title?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM 24h
  attendees?: string[];
  notes?: string;
}

// Convert expressions like '9 p.m.' '9pm' '9:30pm' to 24h HH:MM
function normalizeTime(raw: string): string | null {
  if (!raw) return null;
  let txt = raw.toLowerCase().replace(/\s+/g,'');
  const match = txt.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);
  if (!match) return null;
  let hour = parseInt(match[1],10);
  let minute = match[2] ? parseInt(match[2],10) : 0;
  const suffix = match[3];
  if (suffix === 'pm' && hour < 12) hour += 12;
  if (suffix === 'am' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
}

// Basic date detection for patterns like 2025-09-18 or 09/18/2025 or 'tomorrow'
function extractDate(text: string): string | undefined {
  // ISO date
  const iso = text.match(/(20\d{2}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  // mm/dd/yyyy
  const us = text.match(/\b(\d{1,2})[\/](\d{1,2})[\/](20\d{2})\b/);
  if (us) {
    const m = us[1].padStart(2,'0');
    const d = us[2].padStart(2,'0');
    return `${us[3]}-${m}-${d}`;
  }
  // tomorrow heuristic
  if (/\btomorrow\b/i.test(text)) {
    const dt = new Date();
    dt.setDate(dt.getDate()+1);
    return dt.toISOString().slice(0,10);
  }
  return undefined;
}

function extractTime(text: string): string | undefined {
  // look for times like 9pm, 9:30pm, 14:00
  const re = /\b(\d{1,2})(?::(\d{2}))?(\s?(am|pm))?\b/i;
  const m = text.match(re);
  if (m) {
    const raw = `${m[1]}${m[2]?':'+m[2]:''}${m[3]?m[3].trim():''}`;
    const t = normalizeTime(raw);
    if (t) return t;
  }
  return undefined;
}

function extractAttendees(text: string): string[] | undefined {
  // After 'with' capture names/emails until punctuation or end
  const withIdx = text.toLowerCase().indexOf(' with ');
  if (withIdx === -1) return undefined;
  const segment = text.slice(withIdx + 6); // after ' with '
  const stop = segment.split(/(?:\.|;|\n| at | on )/i)[0];
  const attendees = stop.split(/,|and|&/i)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/[^a-z0-9@._+-]/gi,''))
    .filter(s => s.length>1);
  return attendees.length? attendees : undefined;
}

// Attempt a naive title: words after 'schedule' or 'meeting' until a time/date keyword
function extractTitle(text: string): string | undefined {
  const lower = text.toLowerCase();
  // if user explicitly says 'schedule a meeting with X at Y' we may infer title 'Meeting with X'
  const withMatch = lower.match(/schedule (?:a |the )?(meeting|call|sync|discussion) with ([^@,\n]+?)(?: at | on | tomorrow| next| for |$)/);
  if (withMatch) {
    const base = withMatch[1];
    const person = withMatch[2].trim().split(/\s+/).slice(0,3).join(' ');
    return `${base.charAt(0).toUpperCase()+base.slice(1)} with ${person.charAt(0).toUpperCase()+person.slice(1)}`;
  }
  return undefined;
}

export function extractPartialSchedule(text: string): PartialSchedule {
  const date = extractDate(text);
  const time = extractTime(text);
  const attendees = extractAttendees(text);
  const title = extractTitle(text);
  return { date, time, attendees, title };
}

export function mergeSchedule(base: PartialSchedule | null, incoming: PartialSchedule): PartialSchedule {
  return { ...(base||{}), ...Object.fromEntries(Object.entries(incoming).filter(([,v]) => v !== undefined && v !== null)) };
}
