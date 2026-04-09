import type { ProjectInsight } from "../services/projectScanner";
import type { LintResult } from "./linter";
import { checkTextSpelling } from "../services/spellService";

/**
 * SparkCode CTO: Anatomy Audit
 * Granskar projektets integritet genom att jämföra skannad data.
 */
export const auditAnatomy = (insight: ProjectInsight, activeCode: string, activeFileName: string): LintResult[] => {
  const results: LintResult[] = [];

  // 1. Kontrollera namngivningsfel från skanningen
  insight.namingViolations.forEach(v => {
    results.push({
      line: 1,
      category: 'STRUCTURE' as any,
      severity: 'error',
      message: `NAMNGIVNINGSFEL: "${v.path}" - ${v.reason}`,
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
          message: `BRUTEN LÄNK: "${path}" hittades inte i projektet.`,
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
      // Ignorera standard-bibliotek
      if (imp.startsWith('java.') || imp.startsWith('javax.')) continue;
      
      const className = imp.split('.').pop()!;
      const exists = insight.files.some(f => f.endsWith(`${className}.java`));
      
      if (!exists) {
        const line = activeCode.substring(0, match.index).split('\n').length;
        results.push({
          line,
          category: 'STRUCTURE' as any,
          severity: 'warning',
          message: `BRUTEN IMPORT: "${imp}" hittades inte i projektet.`,
          fileName: activeFileName
        });
      }
    }
  } else if (activeFileName.endsWith('.cpp') || activeFileName.endsWith('.h')) {
    const includeRegex = /#include\s+["<]([^">]+)[">]/g;
    let match;
    while ((match = includeRegex.exec(activeCode)) !== null) {
      const inc = match[1];
      if (inc.includes('.')) { // Skip standard headers like <iostream>
        const exists = insight.files.some(f => f.endsWith(inc));
        if (!exists) {
          const line = activeCode.substring(0, match.index).split('\n').length;
          results.push({
            line,
            category: 'STRUCTURE' as any,
            severity: 'warning',
            message: `BRUTEN INCLUDE: "${inc}" hittades inte i projektet.`,
            fileName: activeFileName
          });
        }
      }
    }
  }

  // 2.2 Backend Naming Professionalism
  if (activeFileName.endsWith('.java') || activeFileName.endsWith('.cpp') || activeFileName.endsWith('.h')) {
    const fileName = activeFileName.split('/').pop()!;
    const baseName = fileName.split('.')[0];
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(baseName)) {
      results.push({
        line: 1,
        category: 'STRUCTURE' as any,
        severity: 'tip',
        message: `NAMNGIVNING: Backend-klasser (${baseName}) bör vanligtvis använda PascalCase.`,
        fileName: activeFileName
      });
    }
  } else if (activeFileName.endsWith('.py')) {
    const fileName = activeFileName.split('/').pop()!;
    if (!/^[a-z0-9_]+$/.test(fileName.split('.')[0])) {
      results.push({
        line: 1,
        category: 'STRUCTURE' as any,
        severity: 'tip',
        message: `NAMNGIVNING: Python-moduler bör använda snake_case.`,
        fileName: activeFileName
      });
    }
  }

  // 3. Kontrollera saknade CSS-klasser (Cross-Check)
  if (activeFileName.endsWith('.html')) {
    const classMatches = activeCode.matchAll(/class=["']([^"']+)["']/gi);
    for (const match of classMatches) {
      const line = activeCode.substring(0, match.index).split('\n').length;
      match[1].split(/\s+/).forEach(cls => {
        if (cls && !insight.definedClasses.has(cls) && insight.definedClasses.size > 0) {
          results.push({
            line,
            category: 'BEST_PRACTICE' as any,
            severity: 'tip', // Tips istället för error eftersom vi inte vill blockera
            message: `LOGISK LÄNK: Klassen ".${cls}" finns inte definierad i någon CSS-fil.`,
            fileName: activeFileName
          });
        }
      });
    }
  }

  // 4. Design System Guard (Färg-inkonsekvens)
  if (insight.colors.size > 8) {
    results.push({
      line: 1,
      category: 'BEST_PRACTICE' as any,
      severity: 'warning',
      message: `DESIGN_SYSTEM: Du använder ${insight.colors.size} olika färger. Överväg att definiera variabler för att hålla projektet enhetligt.`,
      fileName: activeFileName
    });
  }

  // 5. Asset Optimizer (Tunga filer & Oanvända Assets)
  insight.assetSizes.forEach((size, path) => {
    if (size > 1024 * 1024) { // 1MB
      results.push({
        line: 1,
        category: 'BEST_PRACTICE' as any,
        severity: 'warning',
        message: `PRESTANDA: Filen "${path}" är tung (${(size / 1024 / 1024).toFixed(1)} MB). Överväg att komprimera den.`,
        fileName: path
      });
    }
  });

  // Hitta oanvända filer
  insight.files.forEach(file => {
    const isImageOrFont = /\.(png|jpg|jpeg|gif|svg|woff2?|ttf)$/i.test(file);
    if (isImageOrFont && !insight.referencedAssets.has(file.split('/').pop()!)) {
      results.push({
        line: 1,
        category: 'BEST_PRACTICE' as any,
        severity: 'tip',
        message: `RENSNING: Filen "${file}" verkar inte användas i koden. Ta bort den för att spara plats.`,
        fileName: file
      });
    }
  });

  // 6. Security Shield (Enkel Webb-säkerhet)
  if (activeCode.includes('eval(') || activeCode.includes('innerHTML')) {
    results.push({
      line: 1, // Förenklat för beta
      category: 'STRUCTURE' as any,
      severity: 'warning',
      message: `SÄKERHET: Upptäckte potentiellt osäkra mönster (eval/innerHTML). Använd säkrare alternativ som textContent.`,
      fileName: activeFileName
    });
  }

  // 7. SEO & Semantic Intellect
  if (activeFileName.endsWith('.html')) {
    if (!activeCode.toLowerCase().includes('<title>')) {
      results.push({
        line: 1,
        category: 'SEMANTIC' as any,
        severity: 'error',
        message: `SEO: Sidan saknar en <title>-tagg. Detta är kritiskt för sökbarhet.`,
        fileName: activeFileName
      });
    }
    if (!activeCode.toLowerCase().includes('meta name="description"')) {
      results.push({
        line: 1,
        category: 'SEMANTIC' as any,
        severity: 'warning',
        message: `SEO: Sidan saknar en meta-beskrivning.`,
        fileName: activeFileName
      });
    }

    // 8. Lexical Precision (Stavning & Grammatik i HTML)
    // Extrahera text mellan taggar: <p>Text</p>, <h1>Text</h1> osv.
    const textRegex = />([^<]{4,})</g;
    let textMatch;
    while ((textMatch = textRegex.exec(activeCode)) !== null) {
      const text = textMatch[1].trim();
      if (!text) continue;

      const line = activeCode.substring(0, textMatch.index).split('\n').length;

      // Kontrollera stavning
      const typos = checkTextSpelling(text);
      if (typos.length > 0) {
        results.push({
          line,
          category: 'LEXICAL' as any,
          severity: 'warning',
          message: `STAVFEL: Upptäckte möjliga stavfel: ${typos.join(', ')}`,
          fileName: activeFileName
        });
      }

      // Kontrollera grammatik (Meningar i beskrivningar)
      if (text.length > 20) {
        const startsWithCap = /^[A-ZÅÄÖ]/.test(text);
        const endsWithPeriod = /[.!?]$/.test(text);

        if (!startsWithCap) {
          results.push({
            line,
            category: 'LEXICAL' as any,
            severity: 'tip',
            message: `GRAMMATIK: Meningar bör börja med stor bokstav i beskrivningar.`,
            fileName: activeFileName
          });
        }
        if (!endsWithPeriod) {
          results.push({
            line,
            category: 'LEXICAL' as any,
            severity: 'tip',
            message: `GRAMMATIK: Glöm inte punkt (.) i slutet av din beskrivning.`,
            fileName: activeFileName
          });
        }
      }
    }
  }

  return results;
};
