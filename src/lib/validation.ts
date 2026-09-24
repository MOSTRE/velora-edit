/** Input validation + sanitization. No dependencies. */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function sanitizeText(s: string, max = 2000): string {
  return s.replace(/[<>"'`]/g, '').trim().slice(0, max);
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

export function isValidUrl(u: string): boolean {
  try {
    const x = new URL(u);
    return ['http:', 'https:'].includes(x.protocol);
  } catch { return false; }
}

export interface CsvRow { data: Record<string, string>; line: number }
export interface ImportVerdict {
  valid: Partial<Record<string, string>>[];
  invalid: { line: number; errors: string[] }[];
  duplicates: number[];
  missingAffiliate: number[];
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line, i) => {
    // simple CSV: supports quoted commas
    const cells: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cells.push(cur.trim());
    const data: Record<string, string> = {};
    headers.forEach((h, idx) => { data[h] = (cells[idx] || '').replace(/^"|"$/g, '').trim(); });
    return { data, line: i + 2 };
  });
}

export function validateImportRow(data: Record<string, string>, seen: Set<string>): string[] {
  const errors: string[] = [];
  if (!data.title) errors.push('missing title');
  if (data.price && Number.isNaN(Number(data.price))) errors.push('price is not a number');
  if (!data.affiliate_url) errors.push('missing affiliate_url — will stay DRAFT/unpublished');
  else if (!isValidUrl(data.affiliate_url)) errors.push('affiliate_url invalid');
  const slug = data.slug || slugify(data.title || '');
  if (!slug) errors.push('missing slug');
  else if (seen.has(slug)) errors.push('duplicate slug');
  return errors;
}
