export type LintCategory = 'ERROR' | 'STRUCTURE' | 'A11Y' | 'SEMANTIC' | 'BEST_PRACTICE';

export interface LintResult {
  line: number;
  message: string;
  category: LintCategory;
  severity: 'error' | 'warning' | 'tip';
}

/**
 * Senior Architect HTML Linter (40 Years Experience Edition)
 * Analyserar kod med extrem noggrannhet och noll tolerans för slarv.
 */
export const lintHTML = (code: string): LintResult[] => {
  const results: LintResult[] = [];
  const trimmedCode = code.trim();
  
  if (!trimmedCode) return results;

  // --- STENHÅRD KONTROLL: Jabbel & Ostrukturerad text ---
  // Om koden innehåller bokstäver men inga taggar överhuvudtaget, eller bara slumpmässiga tecken
  const hasTags = /<[a-z][\s\S]*>/i.test(trimmedCode);
  const isGibberish = trimmedCode.length > 0 && !hasTags;

  if (isGibberish) {
    results.push({
      line: 1,
      category: 'STRUCTURE',
      severity: 'error',
      message: `Vad är det här för någonting? Jag har kodat sedan 1980-talet och jag har aldrig sett något så oprofessionellt. Att bara skriva slumpmässig text utan struktur är oacceptabelt. Etablera ett fundament direkt: Börja med en <h1> eller en <main>-tagg om du vill bli tagen på allvar.`
    });
    return results; // Avbryt direkt, veteranen vägrar titta på mer
  }

  const lines = code.split('\n');
  const stack: { tag: string; line: number }[] = [];
  const tagRegex = /<(\/?)([a-z1-6]+)([^>]*)>/gi;
  const ids = new Set<string>();
  
  let h1Count = 0;
  let lastHeaderLevel = 0;
  let divCount = 0;
  let hasMain = false;

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    let match;

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
              message: `Hoppsan, här går det undan! Du hoppar från H${lastHeaderLevel} till ${tagName.toUpperCase()}. En arkitekt bygger en trappa steg för steg. Följ hierarkin: H1 -> H2 -> H3. Gör om för att säkra SEO-strukturen.`
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
            message: `Inline-stilar? Det här är inte 1995. Separera presentation från struktur. Flytta dina stilar till en CSS-fil: .min-klass { färg: röd; }. Det kallas arkitektur, inte dekorering.`
          });
        }

        // Tillgänglighet (A11y)
        if (tagName === 'img' && !attributes.includes('alt=')) {
          results.push({
            line: i + 1,
            category: 'A11Y',
            severity: 'error',
            message: `KRITISKT FEL: En <img> utan 'alt'-text är blind för skärmläsare. I min värld inkluderar vi alla. Lägg till det nu: <img src="..." alt="Beskriv bilden här">.`
          });
        }

        if (tagName === 'button' && lineContent.includes('><')) {
          results.push({
            line: i + 1,
            category: 'A11Y',
            severity: 'warning',
            message: `En tom knapp? Hur ska användaren veta vad den gör? Lägg till text inuti eller ett 'aria-label="Namn"'. Ge elementet en mening.`
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
              message: `Hörru, ID-namnet "${id}" används redan. Ett ID är som ett personnummer – helt unikt. Behöver du återanvända stilen? Använd class="..." istället.`
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
            message: `Du försöker stänga </${tagName}>, men du har aldrig öppnat den. Var noggrann, slarv leder till buggar.`
          });
        } else {
          const last = stack.pop();
          if (last?.tag !== tagName) {
            results.push({
              line: i + 1,
              category: 'ERROR',
              severity: 'error',
              message: `Total förvirring i strukturen. Du stänger </${tagName}> men senaste öppnade var <${last?.tag}> (rad ${last?.line}). Stäng dem i rätt ordning!`
            });
          }
        }
      } else {
        stack.push({ tag: tagName, line: i + 1 });
      }
    }
  }

  // Slutgiltig bedömning
  if (h1Count > 1) {
    results.push({
      line: 1,
      category: 'STRUCTURE',
      severity: 'warning',
      message: `En sida, en kapten. Du har ${h1Count} stycken H1:or. Bestäm dig för vad som är viktigast och använd bara en huvudrubrik. Det hjälper både Google och dina användare.`
    });
  }

  if (divCount > 12 && !hasMain) {
    results.push({
      line: 1,
      category: 'SEMANTIC',
      severity: 'tip',
      message: `Det börjar dofta 'Div-soppa' här (${divCount} stycken). Varför inte använda <main>, <section> eller <article>? Ge webbläsaren en chans att förstå vad koden faktiskt föreställer.`
    });
  }

  while (stack.length > 0) {
    const unclosed = stack.pop();
    results.push({
      line: unclosed!.line,
      category: 'ERROR',
      severity: 'error',
      message: `Du lämnade <${unclosed!.tag}> öppen. Jag tolererar inte oavslutade jobb. Stäng den med </${unclosed!.tag}>.`
    });
  }

  return results.sort((a, b) => a.line - b.line);
};
