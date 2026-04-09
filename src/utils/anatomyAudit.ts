import type { ProjectInsight } from "../services/projectScanner";
import type { LintResult } from "./linter";
import { checkTextSpelling } from "../services/spellService";

/**
 * SparkCode CTO: Anatomy Audit
 * Granskar projektets integritet genom att jämföra skannad data.
 */
export const auditAnatomy = (insight: ProjectInsight, activeCode: string, activeFileName: string): LintResult[] => {
  const results: LintResult[] = [];

  const lineCount = activeCode.split('\n').length;
  const isSketching = lineCount < 25 && !activeCode.includes('<body');
  const level = insight.experienceLevel;

  // 1. Kontrollera namngivningsfel från skanningen
  insight.namingViolations.forEach(v => {
    results.push({
      line: 1,
      category: 'STRUCTURE' as any,
      severity: level === 'EXPERT' ? 'warning' : 'error',
      message: level === 'JUNIOR' 
        ? `FILNAMN: "${v.path}" följer inte standard. Prova att använda gemener och undvika mellanslag för bättre kompatibilitet.`
        : `NAMNGIVNINGSFEL: "${v.path}" - ${v.reason}`,
      fileName: v.path
    });
  });

  // 2. Kontrollera brutna länkar i den aktiva filen
  if (activeFileName.endsWith('.html')) {
    const pathRegex = /(?:href|src|url)=["']([^"':#]+)["']/gi;
    let match;
    while ((match = pathRegex.exec(activeCode)) !== null) {
      const path = match[1];
      if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('mailto:')) continue;
      const fileName = path.split('/').pop()!;
      const exists = insight.files.some(f => f.endsWith(fileName));
      if (!exists && !path.includes('node_modules')) {
        const line = activeCode.substring(0, match.index).split('\n').length;
        results.push({
          line,
          category: 'STRUCTURE' as any,
          severity: 'error',
          message: `BRUTEN LÄNK: "${path}" hittades inte i projektet (Kontrollera stavningen).`,
          fileName: activeFileName
        });
      }
    }
  }

  // 2.1 Backend Link Audit (Java Imports & C++ Includes)
  if (activeFileName.endsWith('.java')) {
    const importRegex = /import\s+([\w.]+);/g;
    let match;
    while ((match = importRegex.exec(activeCode)) !== null) {
      const imp = match[1];
      if (imp.startsWith('java.') || imp.startsWith('javax.')) continue;
      
      const className = imp.split('.').pop()!;
      const exists = insight.files.some(f => f.endsWith(`${className}.java`));
      
      if (!exists) {
        const line = activeCode.substring(0, match.index).split('\n').length;
        results.push({
          line,
          category: 'STRUCTURE' as any,
          severity: 'warning',
          message: `BRUTEN IMPORT: "${imp}" hittades inte.`,
          fileName: activeFileName
        });
      }
    }
  } else if (activeFileName.endsWith('.cpp') || activeFileName.endsWith('.h')) {
    const includeRegex = /#include\s+["<]([^">]+)[">]/g;
    let match;
    while ((match = includeRegex.exec(activeCode)) !== null) {
      const inc = match[1];
      if (inc.includes('.')) { 
        const exists = insight.files.some(f => f.endsWith(inc));
        if (!exists) {
          const line = activeCode.substring(0, match.index).split('\n').length;
          results.push({
            line,
            category: 'STRUCTURE' as any,
            severity: 'warning',
            message: `BRUTEN INCLUDE: "${inc}" hittades inte.`,
            fileName: activeFileName
          });
        }
      }
    }
  }

  // 3. Kontrollera saknade CSS-klasser (Cross-Check)
  if (activeFileName.endsWith('.html') && !isSketching) {
    const classMatches = activeCode.matchAll(/class=["']([^"']+)["']/gi);
    for (const match of classMatches) {
      const line = activeCode.substring(0, match.index).split('\n').length;
      match[1].split(/\s+/).forEach(cls => {
        if (cls && !insight.definedClasses.has(cls) && insight.definedClasses.size > 0) {
          results.push({
            line,
            category: 'BEST_PRACTICE' as any,
            severity: 'tip',
            message: `LOGISK LÄNK: Klassen ".${cls}" finns inte definierad i din CSS ännu.`,
            fileName: activeFileName
          });
        }
      });
    }
  }

  // 4. Design System Guard (Färg-inkonsekvens)
  if (insight.colors.size > 10 && !isSketching) {
    results.push({
      line: 1,
      category: 'BEST_PRACTICE' as any,
      severity: 'warning',
      message: `DESIGN_SYSTEM: Du använder ${insight.colors.size} olika färger. För en professionell look, prova att använda CSS-variabler.`,
      fileName: activeFileName
    });
  }

  // 7. SEO & Semantic Intellect (Mjukare vid skiss)
  if (activeFileName.endsWith('.html')) {
    if (!activeCode.toLowerCase().includes('<title>')) {
      results.push({
        line: 1,
        category: 'SEMANTIC' as any,
        severity: isSketching ? 'tip' : 'error',
        message: isSketching 
          ? 'TIPS: Glöm inte att lägga till en <title> för fliken senare.' 
          : 'SEO: Sidan saknar en <title>-tagg. Detta är kritiskt för sökbarhet.',
        fileName: activeFileName
      });
    }
    if (!activeCode.toLowerCase().includes('meta name="description"') && !isSketching) {
      results.push({
        line: 1,
        category: 'SEMANTIC' as any,
        severity: 'warning',
        message: `SEO: Sidan saknar en beskrivning för Google.`,
        fileName: activeFileName
      });
    }

    // 8. Lexical Precision (Stavning & Grammatik i HTML)
    if (!isSketching) {
      const textRegex = />([^<]{4,})</g;
      let textMatch;
      while ((textMatch = textRegex.exec(activeCode)) !== null) {
        const text = textMatch[1].trim();
        if (!text) continue;
        const line = activeCode.substring(0, textMatch.index).split('\n').length;
        const typos = checkTextSpelling(text);
        if (typos.length > 0) {
          results.push({
            line,
            category: 'LEXICAL' as any,
            severity: 'warning',
            message: `STAVNING: Hittade möjliga stavfel: ${typos.join(', ')}`,
            fileName: activeFileName
          });
        }
      }
    }
  }

  return results;
};
