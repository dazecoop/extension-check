export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeName(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const SUFFIXES = ["pro", "plus", "hq", "kit", "tools", "lite", "app", "go"];
const PREFIXES = ["get", "my", "try", "the"];

/** Deterministic, non-AI name variations. */
export function suggestNames(input: string, limit = 6): string[] {
  const base = slugify(input);
  if (!base) return [];
  const out: string[] = [];
  for (let i = 0; i < Math.max(SUFFIXES.length, PREFIXES.length); i++) {
    if (SUFFIXES[i]) out.push(`${base}-${SUFFIXES[i]}`);
    if (PREFIXES[i]) out.push(`${PREFIXES[i]}-${base}`);
  }
  return [...new Set(out)].filter((n) => n !== base).slice(0, limit);
}

/** Parse Chrome Web Store search HTML into {id, name} items. */
export function parseChromeResults(html: string): { id: string; name: string; slug: string }[] {
  const items = new Map<string, { id: string; name: string; slug: string }>();
  const re = /href="\.\/detail\/([^/"]+)\/([a-p]{32})"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (!items.has(m[2])) items.set(m[2], { id: m[2], slug: m[1], name: m[1] });
  }
  const nameRe = /\["([a-p]{32})","https:[^"]*","([^"]{1,200})"/g;
  while ((m = nameRe.exec(html))) {
    const it = items.get(m[1]);
    if (it) it.name = m[2];
    else items.set(m[1], { id: m[1], name: m[2], slug: slugify(m[2]) });
  }
  return [...items.values()];
}

export function findChromeMatch(html: string, query: string) {
  const q = normalizeName(query);
  const s = slugify(query);
  return parseChromeResults(html).find((r) => normalizeName(r.name) === q || r.slug === s) ?? null;
}
