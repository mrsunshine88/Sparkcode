import type { ProjectInsight } from "../services/projectScanner";
import type { LintResult } from "./linter";

/**
 * SparkCode CTO: Predictive Audit (The Oracle)
 * Simulerar framtida risker baserat på nuvarande arkitektur.
 */
export const runPredictiveAudit = (insight: ProjectInsight, activeFileName: string): LintResult[] => {
  const results: LintResult[] = [];

  // 1. RISK_GOD_OBJECT: Detektera filer som blir för komplexa
  insight.logicComplexity.forEach((complexity, path) => {
    if (complexity > 50) {
      results.push({
        line: 1,
        category: 'ARCHITECTURE' as any,
        severity: 'warning',
        message: `PREDICTIVE_RISK: Filen "${path}" har hög komplexitet (${complexity.toFixed(0)}). Risk för "God Object". Bryt ut logiken i moduler innan det blir ohanterligt.`,
        fileName: path
      });
    }
  });

  // 2. RISK_MOBILE_CHOKE: Kombination av tunga assets och JS
  let totalJsComplexity = 0;
  insight.logicComplexity.forEach(v => totalJsComplexity += v);
  
  let heavyAssetsCount = 0;
  insight.assetSizes.forEach(size => { if (size > 500 * 1024) heavyAssetsCount++; });

  if (totalJsComplexity > 100 && heavyAssetsCount > 3) {
    results.push({
      line: 1,
      category: 'ARCHITECTURE' as any,
      severity: 'warning',
      message: `SCENARIO_SIMULATION: High Risk för Mobile Performance. Projektet har en tung kombination av logik och stora assets. Användare på svaga nätverk kommer uppleva seghet.`,
      fileName: activeFileName
    });
  }

  // 3. RISK_CIRCULAR_DEP: (Enkel version för beta)
  insight.dependencies.forEach((deps, path) => {
    deps.forEach(dep => {
      const otherDeps = insight.dependencies.get(dep) || [];
      if (otherDeps.includes(path)) {
        results.push({
          line: 1,
          category: 'STRUCTURE' as any,
          severity: 'error',
          message: `LOGIK_FEL: Cirkulärt beroende upptäckt mellan "${path}" och "${dep}". Detta kan orsaka minnesläckor och instabilitet.`,
          fileName: path
        });
      }
    });
  });

  // 4. ARCHITECTURAL_DEBT: Överflöd av stilar utan system
  if (insight.colors.size > 15) {
    results.push({
      line: 1,
      category: 'BEST_PRACTICE' as any,
      severity: 'warning',
      message: `PREDICTIVE_RISK: Arkitektonisk skuld. Du har ${insight.colors.size} unika färger. Utan ett design-system (variabler) kommer underhållet bli extremt dyrt i framtiden.`,
      fileName: activeFileName
    });
  }

  return results;
};
