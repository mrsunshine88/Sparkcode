import type { LintResult, LintCategory } from './linter';

/**
 * Senior Architect CSS Linter
 * Analyserar CSS för prestanda, underhållbarhet och responsivitet.
 */
export const lintCSS = (code: string): LintResult[] => {
  const results: LintResult[] = [];
  if (!code.trim()) return results;

  const lines = code.split('\n');
  
  // Regler i form av Regex
  const rules = [
    {
      regex: /!important/i,
      category: 'BEST_PRACTICE' as LintCategory,
      severity: 'warning' as const,
      message: `Deklaration av '!important' detekterad. Detta indikerar en bristfällig specificitetsstrategi. En senior arkitekt prioriterar selektor-precedens över tvingande stilar.`
    },
    {
      regex: /z-index:\s*(\d{4,})/i,
      category: 'STRUCTURE' as LintCategory,
      severity: 'tip' as const,
      message: `Extremt z-index-värde detekterat. Revidera din 'stacking context' istället för att förlita dig på godtyckligt höga värden för lagerhantering.`
    },
    {
      regex: /width:\s*\d+px/i,
      category: 'STRUCTURE' as LintCategory,
      severity: 'warning' as const,
      message: `Fast bredd i pixlar (px) upptäckt. Detta gör sidan svår att se på mobiler. Föredra responsiva enheter som '%', 'vw' eller använd 'max-width'.`
    },
    {
      regex: /float:\s*(left|right)/i,
      category: 'BEST_PRACTICE' as LintCategory,
      severity: 'tip' as const,
      message: `'float' används för layout. Moderna seniora utvecklare använder 'Flexbox' eller 'Grid' för att bygga layouter - det är mycket stabilare och enklare.`
    },
    {
      regex: /font-size:\s*\d+px/i,
      category: 'A11Y' as LintCategory,
      severity: 'tip' as const,
      message: `Använd gärna 'rem' istället för 'px' för textstorlek. Det gör att din sida respekterar användarens inställningar för textförstoring.`
    }
  ];

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    
    rules.forEach(rule => {
      if (rule.regex.test(lineContent)) {
        results.push({
          line: i + 1,
          category: rule.category,
          severity: rule.severity,
          message: rule.message
        });
      }
    });
  }

  return results;
};
