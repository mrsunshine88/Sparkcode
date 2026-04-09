/**
 * En avancerad Arkitekt-robot som skannar förhandsvisningens DOM för att hitta 
 * strukturella brister som en vanlig linter inte ser direkt.
 */
export interface AuditReport {
  score: number;
  criticalIssues: string[];
  warnings: string[];
  performanceTips: string[];
  domCount: number;
  visualAnomalies: string[];
  timestamp: number;
}

export const runStructuralAudit = (iframe: HTMLIFrameElement): AuditReport => {
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    return {
      score: 0,
      criticalIssues: ['Kunde inte nå förhandsvisningens DOM.'],
      warnings: [],
      performanceTips: [],
      domCount: 0,
      visualAnomalies: [],
      timestamp: Date.now()
    };
  }

  const report: AuditReport = {
    score: 100,
    criticalIssues: [],
    warnings: [],
    performanceTips: [],
    domCount: doc.querySelectorAll('*').length,
    visualAnomalies: [],
    timestamp: Date.now()
  };

  // 1. Kontrollera brutna interna länkar
  const links = doc.querySelectorAll('a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href === '#' || href === '') {
      report.criticalIssues.push(`Bruten länk upptäckt: "${link.innerText || 'Text saknas'}" har ingen giltig mål-URL.`);
      report.score -= 10;
    }
  });

  // 2. Kontrollera Metadata (Senior standard)
  if (!doc.title || doc.title === 'Vite + React + TS' || doc.title === 'Document') {
    report.warnings.push('Sidtiteln saknas eller är generisk. En arkitekt sätter alltid en beskrivande <title>.');
    report.score -= 5;
  }

  const metaDesc = doc.querySelector('meta[name="description"]');
  if (!metaDesc) {
    report.warnings.push('Meta-beskrivning saknas. Detta är negativt för SEO-arkitekturen.');
    report.score -= 5;
  }

  // 3. Kontrollera bilder & prestanda
  const images = doc.querySelectorAll('img');
  images.forEach(img => {
    if (!img.alt) {
      report.criticalIssues.push(`Prestanda/A11y: Bild (${img.src.substring(0, 30)}...) saknar alt-text.`);
      report.score -= 10;
    }
    // Kolla om bilden är väldigt stor (här förenklat)
    if (img.naturalWidth > 1920) {
      report.performanceTips.push(`Bilden "${img.src.substring(0, 20)}" är onödigt stor (>1920px). Överväg optimering.`);
    }
  });

  // 4. Semantisk Hierarki (Striktare än lintern)
  const h1s = doc.querySelectorAll('h1');
  if (h1s.length > 1) {
    report.criticalIssues.push('Flera <h1>-element upptäckta. En professionell sida har bara en primär rubrik.');
    report.score -= 15;
  } else if (h1s.length === 0) {
    report.warnings.push('Ingen <h1> hittades. Dokumenthierarkin är otydlig.');
    report.score -= 10;
  }

  // 5. Kontrollera formulär-labels
  const inputs = Array.from(doc.querySelectorAll('input:not([type="submit"]):not([type="button"])')) as HTMLInputElement[];
  inputs.forEach(input => {
    const id = input.id;
    const label = id ? doc.querySelector(`label[for="${id}"]`) : null;
    if (!label) {
      report.warnings.push(`Input-fält (${input.name || input.type}) saknar tillhörande <label>.`);
      report.score -= 5;
    }
  });

  // 6. VISUAL SENTINEL (Layout & Overflow vakt)
  const body = doc.body;
  if (body) {
    const hasHorizontalScroll = body.scrollWidth > body.clientWidth;
    if (hasHorizontalScroll) {
      report.criticalIssues.push('LAYOUT_FEEL: Sidan har horisontell scroll (overflow). Detta förstör mobilupplevelsen.');
      report.score -= 20;
    }
  }

  // Touch-target vakt (BETA)
  const interactive = doc.querySelectorAll('button, a');
  interactive.forEach(el => {
    const rect = (el as HTMLElement).getBoundingClientRect();
    if (rect.width > 0 && (rect.width < 32 || rect.height < 32)) {
      report.visualAnomalies.push(`Liten touch-area: "${(el as HTMLElement).innerText?.substring(0, 10)}" är för liten för mobila fingrar.`);
    }
  });

  // OMNI-AI: Avancerade arkitektur-checker (Korta & Koncisa)
  
  // Mobil-vakt
  const viewport = doc.querySelector('meta[name="viewport"]');
  if (!viewport) {
    report.criticalIssues.push('Viewport-meta saknas. Sidan kommer se trasig ut på mobilen.');
    report.score -= 20;
  }

  // Inline-style vakt
  const inlineStyles = doc.querySelectorAll('[style]');
  if (inlineStyles.length > 3) {
    report.warnings.push('För många inline-styles detekterade. Flytta logiken till CSS-filen.');
    report.score -= 10;
  }

  // Tomma taggar
  const empties = doc.querySelectorAll('div:empty, span:empty, p:empty');
  if (empties.length > 2) {
    report.performanceTips.push('Hittade tomma element i koden. Rensa bort skräp.');
  }

  // Lorem Ipsum vakt
  if (doc.body.innerText.toLowerCase().includes('lorem ipsum')) {
    report.warnings.push('Du har kvar "Lorem Ipsum"-text (platshållare). Byt ut mot riktigt innehåll.');
  }

  report.score = Math.max(0, report.score);
  return report;
};
