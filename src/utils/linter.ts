export type LintCategory = 'ERROR' | 'STRUCTURE' | 'A11Y' | 'SEMANTIC' | 'BEST_PRACTICE';

export interface LintResult {
  line: number;
  message: string;
  category: LintCategory;
  severity: 'error' | 'warning' | 'tip';
  fileName?: string;
}

const VALID_HTML_TAGS = new Set([
  'html', 'head', 'title', 'base', 'link', 'meta', 'style', 'script', 'noscript', 'template',
  'body', 'section', 'nav', 'article', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'footer', 'address', 'main', 'p', 'hr', 'pre', 'blockquote', 'ol', 'ul', 'li',
  'dl', 'dt', 'dd', 'figure', 'figcaption', 'div', 'a', 'em', 'strong', 'small', 's', 'cite',
  'q', 'dfn', 'abbr', 'data', 'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b',
  'u', 'mark', 'ruby', 'rt', 'rp', 'bdi', 'bdo', 'span', 'br', 'wbr', 'ins', 'del', 'img',
  'iframe', 'embed', 'object', 'param', 'video', 'audio', 'source', 'track', 'canvas', 'map',
  'area', 'svg', 'math', 'table', 'caption', 'colgroup', 'col', 'tbody', 'thead', 'tfoot',
  'tr', 'td', 'th', 'form', 'fieldset', 'legend', 'label', 'input', 'button', 'select',
  'datalist', 'optgroup', 'option', 'textarea', 'keygen', 'output', 'progress', 'meter',
  'details', 'summary', 'menu', 'menuitem', 'dialog'
]);

/**
 * Super Mentor HTML Linter (Syntax Shield Edition)
 * Analyserar HTML för både struktur och strikt syntax (tecken, ord).
 */
export const lintHTML = (code: string): LintResult[] => {
  const results: LintResult[] = [];
  const trimmedCode = code.trim();
  
  if (!trimmedCode) return results;

  const lines = code.split('\n');
  const stack: { tag: string; line: number }[] = [];
  const tagRegex = /<(\/?)([a-z1-6_-]+)([^>]*)>/gi;
  const ids = new Set<string>();
  
  let h1Count = 0;
  let lastHeaderLevel = 0;
  let match: RegExpExecArray | null;

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];

    // --- TEKEN-PATRULL: Malformerade taggar ---
    if (/<[a-z1-6]+</i.test(lineContent)) {
      results.push({
        line: i + 1,
        category: 'STRUCTURE',
        severity: 'error',
        message: `Det ser ut som att du råkat skriva < istället för > i slutet av din tagg.`
      });
    }

    while ((match = tagRegex.exec(lineContent)) !== null) {
      const isClosing = match[1] === '/';
      const tagName = match[2].toLowerCase();
      const attributes = match[3];

      // --- STAVNINGS-SKYDD: Kontrollera mot ordlista ---
      if (!VALID_HTML_TAGS.has(tagName)) {
         results.push({
          line: i + 1,
          category: 'ERROR',
          severity: 'error',
          message: `Ogiltig HTML-tagg: "<${tagName}>". Kontrollera stavningen.`
        });
      }

      if (!isClosing) {
        // Rubrik-hierarki
        if (/^h[1-6]$/.test(tagName)) {
          const level = parseInt(tagName[1]);
          if (level === 1) h1Count++;
          if (level > lastHeaderLevel + 1 && lastHeaderLevel !== 0) {
            results.push({
              line: i + 1,
              category: 'STRUCTURE',
              severity: 'warning',
              message: `Rubriknivåer bör följa efter varandra (t.ex. H1 sen H2).`
            });
          }
          lastHeaderLevel = level;
        }

        // Tillgänglighet
        if (tagName === 'img' && !attributes.includes('alt=')) {
          results.push({
            line: i + 1,
            category: 'A11Y',
            severity: 'error',
            message: `Bilder behöver en 'alt'-text: <img alt="...">.`
          });
        }

        // ID-validering
        const idMatch = attributes.match(/id=["']([^"']+)["']/i);
        if (idMatch) {
          const id = idMatch[1];
          if (ids.has(id)) {
            results.push({
              line: i + 1,
              category: 'ERROR',
              severity: 'error',
              message: `ID "${id}" används redan. Ett ID måste vara unikt.`
            });
          }
          ids.add(id);
        }
      }

      const selfClosing = ['img', 'br', 'hr', 'input', 'link', 'meta'].includes(tagName);
      if (selfClosing) continue;

      if (isClosing) {
        if (stack.length === 0) {
          results.push({
            line: i + 1,
            category: 'ERROR',
            severity: 'error',
            message: `Stängningstagg </${tagName}> saknar öppning.`
          });
        } else {
          const last = stack.pop();
          if (last?.tag !== tagName) {
            results.push({
              line: i + 1,
              category: 'ERROR',
              severity: 'error',
              message: `Fel ordning: Du stänger </${tagName}> men senast öppnad var <${last?.tag}>.`
            });
          }
        }
      } else {
        stack.push({ tag: tagName, line: i + 1 });
      }
    }
  }

  // --- SLUT-KONTROLL: Öppna taggar ---
  while (stack.length > 0) {
    const unclosed = stack.pop();
    results.push({
      line: unclosed!.line,
      category: 'ERROR',
      severity: 'error',
      message: `Taggen <${unclosed!.tag}> stängdes aldrig. Skriv </${unclosed!.tag}>.`
    });
  }

  if (h1Count > 1) {
    results.push({
      line: 1,
      category: 'STRUCTURE',
      severity: 'warning',
      message: `Använd bara en H1-rubrik per sida för bättre ordning.`
    });
  }

  return results.sort((a, b) => a.line - b.line);
};
