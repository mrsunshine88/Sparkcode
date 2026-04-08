import type { LintResult, LintCategory } from './linter';

/**
 * Super Mentor CSS Linter (Syntax Shield Edition)
 * Analyserar CSS för både arkitektur och strikt syntax (stavning, tecken).
 */

const VALID_CSS_PROPERTIES = new Set([
  'align-content', 'align-items', 'align-self', 'all', 'animation', 'animation-delay', 'animation-direction',
  'animation-duration', 'animation-fill-mode', 'animation-iteration-count', 'animation-name',
  'animation-play-state', 'animation-timing-function', 'backface-visibility', 'background',
  'background-attachment', 'background-blend-mode', 'background-clip', 'background-color',
  'background-image', 'background-position', 'background-repeat', 'background-size',
  'block-size', 'border', 'border-block', 'border-block-color', 'border-block-end', 'border-block-end-color',
  'border-block-end-style', 'border-block-end-width', 'border-block-start', 'border-block-start-color',
  'border-block-start-style', 'border-block-start-width', 'border-block-style', 'border-block-width',
  'border-bottom', 'border-bottom-color', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'border-bottom-style', 'border-bottom-width', 'border-collapse', 'border-color', 'border-image',
  'border-image-outset', 'border-image-repeat', 'border-image-slice', 'border-image-source',
  'border-image-width', 'border-inline', 'border-inline-color', 'border-inline-end', 'border-inline-end-color',
  'border-inline-end-style', 'border-inline-end-width', 'border-inline-start', 'border-inline-start-color',
  'border-inline-start-style', 'border-inline-start-width', 'border-inline-style', 'border-inline-width',
  'border-left', 'border-left-color', 'border-left-style', 'border-left-width', 'border-radius',
  'border-right', 'border-right-color', 'border-right-style', 'border-right-width', 'border-spacing',
  'border-style', 'border-top', 'border-top-color', 'border-top-left-radius', 'border-top-right-radius',
  'border-top-style', 'border-top-width', 'border-width', 'bottom', 'box-decoration-break', 'box-shadow',
  'box-sizing', 'break-after', 'break-before', 'break-inside', 'caption-side', 'caret-color', 'clear',
  'clip', 'clip-path', 'color', 'column-count', 'column-fill', 'column-gap', 'column-rule',
  'column-rule-color', 'column-rule-style', 'column-rule-width', 'column-span', 'column-width', 'columns',
  'content', 'counter-increment', 'counter-reset', 'cursor', 'direction', 'display', 'empty-cells',
  'filter', 'flex', 'flex-basis', 'flex-direction', 'flex-flow', 'flex-grow', 'flex-shrink', 'flex-wrap',
  'float', 'font', 'font-family', 'font-feature-settings', 'font-kerning', 'font-language-override',
  'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-synthesis', 'font-variant',
  'font-variant-alternates', 'font-variant-caps', 'font-variant-east-asian', 'font-variant-ligatures',
  'font-variant-numeric', 'font-variant-position', 'font-weight', 'gap', 'grid', 'grid-area',
  'grid-auto-columns', 'grid-auto-flow', 'grid-auto-rows', 'grid-column', 'grid-column-end',
  'grid-column-start', 'grid-gap', 'grid-row', 'grid-row-end', 'grid-row-start', 'grid-template',
  'grid-template-areas', 'grid-template-columns', 'grid-template-rows', 'height', 'hyphens',
  'image-orientation', 'image-rendering', 'image-resolution', 'ime-mode', 'initial-letter',
  'initial-letter-align', 'inline-size', 'isolation', 'justify-content', 'justify-items', 'justify-self',
  'left', 'letter-spacing', 'line-break', 'line-height', 'list-style', 'list-style-image',
  'list-style-position', 'list-style-type', 'margin', 'margin-block', 'margin-block-end',
  'margin-block-start', 'margin-bottom', 'margin-inline', 'margin-inline-end', 'margin-inline-start',
  'margin-left', 'margin-right', 'margin-top', 'mask', 'mask-clip', 'mask-composite', 'mask-image',
  'mask-mode', 'mask-origin', 'mask-position', 'mask-repeat', 'mask-size', 'mask-type', 'max-block-size',
  'max-height', 'max-inline-size', 'max-width', 'min-block-size', 'min-height', 'min-inline-size',
  'min-width', 'mix-blend-mode', 'object-fit', 'object-position', 'offset', 'offset-anchor',
  'offset-distance', 'offset-path', 'offset-position', 'offset-rotate', 'opacity', 'order', 'orphans',
  'outline', 'outline-color', 'outline-offset', 'outline-style', 'outline-width', 'overflow',
  'overflow-anchor', 'overflow-wrap', 'overflow-x', 'overflow-y', 'overscroll-behavior',
  'overscroll-behavior-block', 'overscroll-behavior-inline', 'overscroll-behavior-x',
  'overscroll-behavior-y', 'padding', 'padding-block', 'padding-block-end', 'padding-block-start',
  'padding-bottom', 'padding-inline', 'padding-inline-end', 'padding-inline-start', 'padding-left',
  'padding-right', 'padding-top', 'page-break-after', 'page-break-before', 'page-break-inside', 'paint-order',
  'perspective', 'perspective-origin', 'place-content', 'place-items', 'place-self', 'pointer-events',
  'position', 'quotes', 'resize', 'right', 'row-gap', 'scroll-behavior', 'scroll-margin',
  'scroll-margin-block', 'scroll-margin-block-end', 'scroll-margin-block-start', 'scroll-margin-bottom',
  'scroll-margin-inline', 'scroll-margin-inline-end', 'scroll-margin-inline-start', 'scroll-margin-left',
  'scroll-margin-right', 'scroll-margin-top', 'scroll-padding', 'scroll-padding-block',
  'scroll-padding-block-end', 'scroll-padding-block-start', 'scroll-padding-bottom',
  'scroll-padding-inline', 'scroll-padding-inline-end', 'scroll-padding-inline-start',
  'scroll-padding-left', 'scroll-padding-right', 'scroll-padding-top', 'scroll-snap-align',
  'scroll-snap-stop', 'scroll-snap-type', 'scrollbar-color', 'scrollbar-width', 'shape-image-threshold',
  'shape-margin', 'shape-outside', 'tab-size', 'table-layout', 'text-align', 'text-align-last',
  'text-combine-upright', 'text-decoration', 'text-decoration-color', 'text-decoration-line',
  'text-decoration-skip-ink', 'text-decoration-style', 'text-emphasis', 'text-emphasis-color',
  'text-emphasis-position', 'text-emphasis-style', 'text-indent', 'text-justify', 'text-orientation',
  'text-overflow', 'text-rendering', 'text-shadow', 'text-transform', 'text-underline-position', 'top',
  'touch-action', 'transform', 'transform-box', 'transform-origin', 'transform-style', 'transition',
  'transition-delay', 'transition-duration', 'transition-property', 'transition-timing-function',
  'unicode-bidi', 'user-select', 'vertical-align', 'visibility', 'white-space', 'widows', 'width',
  'will-change', 'word-break', 'word-spacing', 'word-wrap', 'writing-mode', 'z-index'
]);

export const lintCSS = (code: string): LintResult[] => {
  const results: LintResult[] = [];
  if (!code.trim()) return results;

  const lines = code.split('\n');
  let openBraces = 0;
  
  // Regler i form av Regex (Arkitektur & Design)
  const architectRules = [
    {
      regex: /!important/i,
      category: 'BEST_PRACTICE' as LintCategory,
      severity: 'warning' as const,
      message: `Deklaration av '!important' detekterad. En senior arkitekt prioriterar selektor-precedens över tvingande stilar.`
    },
    {
      regex: /width:\s*\d+px/i,
      category: 'STRUCTURE' as LintCategory,
      severity: 'warning' as const,
      message: `Fast bredd i pixlar (px). Detta gör sidan svår att se på mobiler. Föredra responsiva enheter som '%' eller 'vw'.`
    }
  ];

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i].trim();
    if (!lineContent) continue;

    // --- STENHÅRD SYNTAX-KOLL ---
    
    // 1. Måsvingar
    openBraces += (lineContent.match(/{/g) || []).length;
    openBraces -= (lineContent.match(/}/g) || []).length;

    if (openBraces < 0) {
      results.push({
        line: i + 1,
        category: 'ERROR',
        severity: 'error',
        message: `Du försöker stänga en måsvinge } som aldrig har öppnats. Kontrollera din kod.`
      });
      openBraces = 0;
    }

    // 2. Stavningskontroll egenskaper
    const propertyMatch = lineContent.match(/^([a-z-]+)\s*:/i);
    if (propertyMatch) {
      const property = propertyMatch[1].toLowerCase();
      if (!VALID_CSS_PROPERTIES.has(property)) {
        // Försök hitta en nära matchning (pedagogiskt)
        let suggestion = "";
        if (property === 'backgroun' || property === 'backgroun-color') suggestion = "Menade du 'background-color'?";
        
        results.push({
          line: i + 1,
          category: 'ERROR',
          severity: 'error',
          message: `Ogiltig CSS-egenskap: "${property}". ${suggestion || "Kontrollera stavningen."}`
        });
      }
    }

    // 3. Glömda semikolon
    if (lineContent.includes(':') && !lineContent.endsWith(';') && !lineContent.endsWith('{') && !lineContent.includes('}')) {
       results.push({
        line: i + 1,
        category: 'ERROR',
        severity: 'error',
        message: `Du har glömt ett semikolon (;) i slutet av raden.`
      });
    }

    // 4. Arkitekt-regler
    architectRules.forEach(rule => {
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

  // Slutkontroll måsvingar
  if (openBraces > 0) {
    results.push({
      line: lines.length,
      category: 'ERROR',
      severity: 'error',
      message: `Du har glömt att stänga en eller flera måsvingar (}).`
    });
  }

  return results;
};
