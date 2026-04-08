export type LintCategory = 'ERROR' | 'STRUCTURE' | 'A11Y' | 'SEMANTIC' | 'BEST_PRACTICE';

export interface LintResult {
  line: number;
  message: string;
  category: LintCategory;
  severity: 'error' | 'warning' | 'tip';
}

/**
 * Senior Architect HTML Linter
 * Analyserar kod för kvalitet, tillgänglighet och semantik.
 */
export const lintHTML = (code: string, availableFunctions: string[] = []): LintResult[] => {
  const results: LintResult[] = [];
  if (!code.trim()) return results;

  const lines = code.split('\n');
  const stack: { tag: string; line: number }[] = [];
  const tagRegex = /<(\/?)([a-z1-6]+)([^>]*)>/gi;
  const ids = new Set<string>();
  
  // Arkitekt-state
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
        // --- Arkitekt-regler: Struktur & Semantik ---
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
            message: `Strukturell inkonsekvens: Hierarkiskt hopp från H${lastHeaderLevel} till ${tagName.toUpperCase()} detekterat. En arkitekt följer en strikt logisk ordning för att säkerställa optimal SEO och dokumentstruktur.`
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
            message: `Inline-stilar detekterade. Enligt professionell standard bör presentation separeras från struktur; flytta dina deklarationer till en dedikerad CSS-fil för att bibehålla en ren arkitektur.`
          });
        }

        // --- Arkitekt-regler: Tillgänglighet (A11y) ---
        if (tagName === 'img' && !attributes.includes('alt=')) {
          results.push({
            line: i + 1,
            category: 'A11Y',
            severity: 'error',
            message: `Kritiskt tillgänglighetsfel: <img> saknar 'alt'-attribut. Professionell webb kräver inkludering; beskriv objektets semantiska betydelse för att tillgodose användare med skärmläsare.`
          });
        }

        if (tagName === 'button' && lineContent.includes('><')) {
          results.push({
            line: i + 1,
            category: 'A11Y',
            severity: 'warning',
            message: `Semantisk ofullständighet: Tomma knappar är osynliga för assistiv teknik. Om knappen är rent visuell krävs ett 'aria-label' för att förmedla dess funktion.`
          });
        }

        // --- Arkitekt-regler: Logik-validering (Deep-Linting) ---
        const eventMatch = attributes.match(/on\w+=["'](\w+)\(?.*?["']/i);
        if (eventMatch && availableFunctions.length > 0) {
          const funcName = eventMatch[1];
          if (!availableFunctions.includes(funcName)) {
            results.push({
              line: i + 1,
              category: 'SEMANTIC',
              severity: 'warning',
              message: `Logisk diskrepans: Elementet refererar till funktionen '${funcName}', men ingen sådan deklaration hittades i projektets JavaScript-filer. Verifiera din logik.`
            });
          }
        }

        // Duplicerade ID:n (Kritiskt fel)
        const idMatch = attributes.match(/id=["']([^"']+)["']/i);
        if (idMatch) {
          const id = idMatch[1];
          if (ids.has(id)) {
            results.push({
              line: i + 1,
              category: 'ERROR',
              severity: 'error',
              message: `ID-namnet "${id}" används redan. Ett ID måste vara helt unikt på sidan. Använd 'class' om du vill stila flera element likadant.`
            });
          }
          ids.add(id);
        }
      }

      // --- Klassisk tag-matchning logic ---
      const selfClosing = ['img', 'br', 'hr', 'input', 'link', 'meta'].includes(tagName);
      if (selfClosing) continue;

      if (isClosing) {
        if (stack.length === 0) {
          results.push({
            line: i + 1,
            category: 'ERROR',
            severity: 'error',
            message: `Du försöker stänga </${tagName}>, men det finns ingen matchande öppnings-tagg.`
          });
        } else {
          const last = stack.pop();
          if (last?.tag !== tagName) {
            results.push({
              line: i + 1,
              category: 'ERROR',
              severity: 'error',
              message: `Fel ordning! Du försöker stänga </${tagName}>, men den senaste öppnade taggen var <${last?.tag}> (rad ${last?.line}).`
            });
          }
        }
      } else {
        stack.push({ tag: tagName, line: i + 1 });
      }
    }
  }

  // --- Slutgiltig Arkitekt-bedömning ---
  if (h1Count > 1) {
    results.push({
      line: 1,
      category: 'STRUCTURE',
      severity: 'warning',
      message: `Multiple H1-instanser detekterade (${h1Count}). Standardpraxis kräver en unik huvudrubrik per dokument för att understryka sidans primära syfte och optimera indexering.`
    });
  }

  if (divCount > 10 && !hasMain) {
    results.push({
      line: 1,
      category: 'SEMANTIC',
      severity: 'tip',
      message: `Analys indikerar 'Div-suffocation' (${divCount} stycken). Revidera strukturen och inför semantiska element som <main>, <section> eller <article> för att höja kodens arkitektoniska värde.`
    });
  }

  // Oavslutade taggar
  while (stack.length > 0) {
    const unclosed = stack.pop();
    results.push({
      line: unclosed!.line,
      category: 'ERROR',
      severity: 'error',
      message: `Taggen <${unclosed!.tag}> stängdes aldrig. Webbläsaren kommer gissa var den slutar, vilket kan förstöra din layout.`
    });
  }

  // Kontrollera om det saknas taggar helt (men finns text)
  if (results.length === 0 && h1Count === 0 && divCount === 0 && !hasMain && code.trim().length > 0 && !code.includes('<')) {
    results.push({
      line: 1,
      category: 'STRUCTURE',
      severity: 'error',
      message: `Analys indikerar avsaknad av arkitektoniskt fundament. Professionell utveckling kräver semantisk struktur; etablera källkodens ramverk med korrekta element såsom <h1>, <p> eller <main>.`
    });
  }

  return results.sort((a, b) => a.line - b.line);
};
