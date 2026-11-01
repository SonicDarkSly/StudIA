const MIN_FENCED_LINES = 2;
const OPENING_FENCE = /^```/;
const CLOSING_FENCE = /^```\s*$/;
const YAML_FENCE = /^```\s*(ya?ml)?\s*$/i;
const HEADER_LINE = /^([A-Za-z_-]+):\s*(.*)$/;
const HEADER_START = /^(name|description):/;
const DASHES = /^---\s*$/;
const MARKDOWN_FILE = /\.(md|mdc)$/;
const SEPARATOR = /^(-{3,}|\*{3,}|_{3,})\s*$/;
const HEADER_DELIMITERS = 2;

export const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const FIX_MESSAGES = {
  fencedHeader: 'En-tête YAML remis entre deux lignes --- : le modèle l’avait placé dans un bloc ```.',
  bareHeader: 'En-tête YAML entouré des lignes --- qui manquaient.',
  trailingHeader: 'Champ(s) d’en-tête écrit(s) après le corps, replacé(s) dans l’en-tête.',
  trailingRule: 'Ligne --- isolée retirée en fin de fichier.',
  leadingSeparator: 'Ligne --- isolée retirée en tête du fichier : il n’a pas d’en-tête YAML.',
  trailingSeparator:
    'Ligne === FIN === manquante : le séparateur --- ajouté par le modèle en fin de fichier a été retiré.',
};

function trimBlankEdges(content: string): string {
  return content.replace(/^\n+|\s+$/g, '');
}

export function unfence(content: string): string {
  const lines = trimBlankEdges(content).split('\n');
  if (
    lines.length >= MIN_FENCED_LINES &&
    OPENING_FENCE.test(lines[0]) &&
    CLOSING_FENCE.test(lines[lines.length - 1])
  ) {
    return lines.slice(1, -1).join('\n');
  }
  return lines.join('\n');
}

function withoutDashes(header: string[]): string[] {
  const start = DASHES.test(header[0] ?? '') ? 1 : 0;
  const end = DASHES.test(header[header.length - 1] ?? '') ? header.length - 1 : header.length;
  return header.slice(start, end);
}

function buildMarkdown(header: string[], body: string): string {
  const cleanBody = unfence(body);
  return ['---', ...header, '---', ...(cleanBody ? ['', cleanBody] : [])].join('\n');
}

function repairFencedHeader(content: string): string | undefined {
  const lines = content.split('\n');
  if (!YAML_FENCE.test(lines[0] ?? '')) return undefined;
  const close = lines.findIndex((line, index) => index > 0 && CLOSING_FENCE.test(line));
  if (close < 0) return undefined;
  const header = withoutDashes(lines.slice(1, close));
  if (!HEADER_START.test(header[0] ?? '')) return undefined;
  return buildMarkdown(header, lines.slice(close + 1).join('\n'));
}

function repairBareHeader(content: string): string | undefined {
  const lines = content.split('\n');
  if (!HEADER_START.test(lines[0] ?? '')) return undefined;
  const end = lines.findIndex((line) => !line.trim() || line.startsWith('#') || DASHES.test(line));
  const close = end < 0 ? lines.length : end;
  const rest = lines.slice(close);
  const body = DASHES.test(rest[0] ?? '') ? rest.slice(1) : rest;
  return buildMarkdown(lines.slice(0, close), body.join('\n'));
}

function lastDashesIndex(lines: string[]): number {
  for (let index = lines.length - 1; index >= 0; index--) if (DASHES.test(lines[index])) return index;
  return -1;
}

function moveTrailingHeader(content: string): string | undefined {
  const lines = content.split('\n');
  if (!DASHES.test(lines[0] ?? '')) return undefined;
  const close = lines.findIndex((line, index) => index > 0 && DASHES.test(line));
  const last = lastDashesIndex(lines);
  if (close < 0 || last <= close) return undefined;
  const trailing = lines.slice(last + 1).filter((line) => line.trim());
  if (!trailing.length || !trailing.every((line) => HEADER_LINE.test(line))) return undefined;
  const header = [...lines.slice(1, close), ...trailing];
  return buildMarkdown(header, lines.slice(close + 1, last).join('\n'));
}

export function cleanContent(path: string, raw: string): { content: string; fixes: string[] } {
  const cleaned = cleanMarkdown(path, raw);
  if (!MARKDOWN_FILE.test(path)) return cleaned;
  const fixes = [...cleaned.fixes];
  const moved = moveTrailingHeader(cleaned.content);
  if (moved !== undefined) fixes.push(FIX_MESSAGES.trailingHeader);
  const content = moved ?? cleaned.content;
  const dropped = dropTrailingSeparator(content);
  if (dropped !== undefined) fixes.push(FIX_MESSAGES.trailingRule);
  return { content: dropped ?? content, fixes };
}

function cleanMarkdown(path: string, raw: string): { content: string; fixes: string[] } {
  const trimmed = trimBlankEdges(raw);
  if (!MARKDOWN_FILE.test(path)) return { content: unfence(trimmed), fixes: [] };
  for (const candidate of [trimmed, unfence(trimmed)]) {
    const fenced = repairFencedHeader(candidate);
    if (fenced !== undefined) return { content: fenced, fixes: [FIX_MESSAGES.fencedHeader] };
  }
  const content = unfence(trimmed);
  const bare = repairBareHeader(content);
  if (bare !== undefined) return { content: bare, fixes: [FIX_MESSAGES.bareHeader] };
  const lines = content.split('\n');
  if (DASHES.test(lines[0] ?? '') && !HEADER_LINE.test(lines[1] ?? ''))
    return { content: trimBlankEdges(lines.slice(1).join('\n')), fixes: [FIX_MESSAGES.leadingSeparator] };
  return { content, fixes: [] };
}

export function dropTrailingSeparator(content: string): string | undefined {
  const lines = content.split('\n');
  if (!SEPARATOR.test(lines[lines.length - 1] ?? '')) return undefined;
  const closesHeader =
    DASHES.test(lines[0] ?? '') && lines.filter((line) => DASHES.test(line)).length === HEADER_DELIMITERS;
  if (closesHeader) return undefined;
  return trimBlankEdges(lines.slice(0, -1).join('\n'));
}

export function frontmatter(content: string): Record<string, string> | undefined {
  const m = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return undefined;
  const out: Record<string, string> = {};
  let key: string | undefined;
  for (const line of m[1].split('\n')) {
    const kv = line.match(HEADER_LINE);
    if (kv) {
      key = kv[1];
      out[key] = kv[2].trim();
    } else if (key && line.trim()) {
      out[key] = `${out[key]} ${line.trim()}`.trim();
    }
  }
  return out;
}

export function markdownBody(content: string): string {
  return content.replace(/^---[\s\S]*?\n---/, '');
}

export function listValue(raw: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let current = '';
  const push = () => {
    const item = current.replace(/^-+/, '').replace(/^["']|["']$/g, '');
    if (item) items.push(item);
    current = '';
  };
  for (const char of raw) {
    if (char === '(') depth++;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && /[\s,[\]]/.test(char)) {
      push();
      continue;
    }
    current += char;
  }
  push();
  return items;
}
