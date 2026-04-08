export type LintCategory = 'ERROR' | 'STRUCTURE' | 'A11Y' | 'SEMANTIC' | 'BEST_PRACTICE';

export interface LintResult {
  line: number;
  message: string;
  category: LintCategory;
  severity: 'error' | 'warning' | 'tip';
}

/**
 * Mentor Linter (Direct & Concise Edition)
 * Ger korta, pedagogiska instruktioner för att vägleda utvecklaren.
 */
export const lintHTML = (code: string): LintResult[] => {
  const results: LintResult[] = [];
  const trimmedCode = code.trim();
  
  if (!trimmedCode) return results;

  // --- DIREKT KONTROLL: Saknad struktur ---
  const hasTags = /<[a-z][\s\S]*>/i.test(trimmedCode);
  const isGibberish = trimmedCode.length > 0 && !hasTags;

  if (isGibberish) {
    results.push({
      line: 1,
      category: 'STRUCTURE',
      severity: 'error',
      message: `Du behöver tillföra struktur på din sida. Börja med att lägga till en rubrik (t.ex. <h1>) eller en <main>-tagg.`
    });
    return results;
  }

  const lines = code.split('\n');
  const stack: { tag: string; line: number }[] = [];
  const tagRegex = /<(\/?)([a-z1-6]+)([^>]*)>/gi;
  const ids = new Set<string>();
  
  let h1Count = 0;
  let lastHeaderLevel = 0;
  let divCount = 0;
  let hasMain = false;
  let match: RegExpExecArray | null;

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    // --- EXTRA KONTROLL: Malformerade taggar (t.ex. <style<) ---
    const brokenTagMatch = lineContent.match(/<([a-z1-6]+)</i);
    if (brokenTagMatch) {
      const tagName = brokenTagMatch[1].toLowerCase();
      results.push({
        line: i + 1,
        category: 'STRUCTURE',
        severity: 'error',
        message: `Det ser ut som att du råkat skriva < istället för > i slutet av din tagg. Den ska se ut så här: <${tagName}>.`
      });
    }

    while ((match = tagRegex.exec(lineContent)) !== null) {
      const isClosing = match[1] === '/';
      const tagName = match[2].toLowerCase();
      const attributes = match[3];

      if (!isClosing) {
        if (tagName === 'div') divCount++;
        if (tagName === 'main') hasMain = true;
        
        // Rubrik-hierarki
        if (/^h[1-6]$/.test(tagName)) {
          const level = parseInt(tagName[1]);
          if (level === 1) h1Count++;
          
          if (level > lastHeaderLevel + 1 && lastHeaderLevel !== 0) {
            results.push({
              line: i + 1,
              category: 'STRUCTURE',
              severity: 'warning',
              message: `Hoppa inte över nivåer i rubrikerna. Använd H${lastHeaderLevel + 1} efter H${lastHeaderLevel} för en korrekt struktur.`
            });
          }
          lastHeaderLevel = level;
        }

        // Inline Styles
        if (attributes.includes('style=')) {
          results.push({
            line: i + 1,
            category: 'BEST_PRACTICE',
            severity: 'tip',
            message: `Undvik inline-stilar. Lägg dina stilar i en CSS-fil med klasser (class="...") istället.`
          });
        }

        // Tillgänglighet (A11y)
        if (tagName === 'img' && !attributes.includes('alt=')) {
          results.push({
            line: i + 1,
            category: 'A11Y',
            severity: 'error',
            message: `Lägg till en 'alt'-text på din bild (t.ex. alt="Beskrivning") så att alla kan förstå vad den föreställer.`
          });
        }

        if (tagName === 'button' && lineContent.includes('><')) {
          results.push({
            line: i + 1,
            category: 'A11Y',
            severity: 'warning',
            message: `En knapp behöver text inuti (t.ex. <button>Klicka här</button>) för att användaren ska förstå vad den gör.`
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
              message: `ID-namnet "${id}" används redan. Ett ID måste vara helt unikt på sidan.`
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
            message: `Du försöker stänga </${tagName}> utan att ha öppnat den. Kontrollera stavningen.`
          });
        } else {
          const last = stack.pop();
          if (last?.tag !== tagName) {
            results.push({
              line: i + 1,
              category: 'ERROR',
              severity: 'error',
              message: `Taggen </${tagName}> stängs i fel ordning. Du behöver stänga <${last?.tag}> först.`
            });
          }
        }
      } else {
        stack.push({ tag: tagName, line: i + 1 });
      }
    }
  }

  // Slutgiltig kontroll
  if (h1Count > 1) {
    results.push({
      line: 1,
      category: 'STRUCTURE',
      severity: 'warning',
      message: `Använd bara en H1-rubrik per sida för att göra det tydligt vad som är den viktigaste rubriken.`
    });
  }

  if (divCount > 12 && !hasMain) {
    results.push({
      line: 1,
      category: 'SEMANTIC',
      severity: 'tip',
      message: `Försök använda <main>, <section> eller <article> istället för så många <div>-taggar för att ge sidan mer mening.`
    });
  }

  while (stack.length > 0) {
    const unclosed = stack.pop();
    results.push({
      line: unclosed!.line,
      category: 'ERROR',
      severity: 'error',
      message: `Taggen <${unclosed!.tag}> är fortfarande öppen. Skriv </${unclosed!.tag}> för att stänga den.`
    });
  }

  return results.sort((a, b) => a.line - b.line);
};
