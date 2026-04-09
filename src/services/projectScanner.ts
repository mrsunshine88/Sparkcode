import { readFileContent } from "../lib/fileSystem";

export interface ProjectInsight {
  files: string[];
  folders: string[];
  classes: Set<string>;
  definedClasses: Set<string>;
  ids: Set<string>;
  colors: Map<string, number>; // färg -> antal förekomster
  assetSizes: Map<string, number>; // path -> size i bytes
  referencedAssets: Set<string>; // filer som nämns i HTML/CSS
  dependencies: Map<string, string[]>; // fil -> [referenser]
  logicComplexity: Map<string, number>; // fil -> poäng baserat på funktioner/rader
  namingViolations: { path: string; reason: string }[];
}

/**
 * SparkCode CTO: Project Scanner
 * En tjänst som läser hela projektets struktur för att upptäcka krockar mellan filer.
 */
export const scanProject = async (directoryHandle: FileSystemDirectoryHandle): Promise<ProjectInsight> => {
  const insight: ProjectInsight = {
    files: [],
    folders: [],
    classes: new Set(),
    definedClasses: new Set(),
    ids: new Set(),
    colors: new Map(),
    assetSizes: new Map(),
    referencedAssets: new Set(),
    dependencies: new Map(),
    logicComplexity: new Map(),
    namingViolations: []
  };

  const PROFFS_NAMING_REGEX = /^[a-zA-Z0-9._-]+$/;

  const traverse = async (handle: FileSystemDirectoryHandle, path = "") => {
    // Kontrollera mappnamn
    if (path && !PROFFS_NAMING_REGEX.test(handle.name)) {
      insight.namingViolations.push({ path, reason: "Oproffsigt mappnamn (använd gemener, inga mellanslag)" });
    }
    insight.folders.push(path || "/");

    for await (const entry of (handle as any).values()) {
      const entryPath = path ? `${path}/${entry.name}` : entry.name;
      
      if (entry.kind === 'directory') {
        await traverse(entry, entryPath);
      } else {
        insight.files.push(entryPath);
        
        // Kontrollera filnamn
        if (!PROFFS_NAMING_REGEX.test(entry.name)) {
          insight.namingViolations.push({ path: entryPath, reason: "Oproffsigt filnamn (använd gemener, inga mellanslag)" });
        }

        // Skanna filstorlek (Asset Optimizer)
        try {
          const file = await (entry as FileSystemFileHandle).getFile();
          insight.assetSizes.set(entryPath, file.size);
        } catch (e) { /* ignore */ }

        // Skanna innehåll för korsreferenser (HTML/CSS)
        try {
          const content = await readFileContent(entry as FileSystemFileHandle);
          
          if (entry.name.endsWith('.html')) {
            // Hitta klasser: class="foo bar"
            const classMatches = content.matchAll(/class=["']([^"']+)["']/gi);
            for (const match of classMatches) {
              match[1].split(/\s+/).forEach(cls => insight.classes.add(cls));
            }
            // Hitta IDs: id="foo"
            const idMatches = content.matchAll(/id=["']([^"']+)["']/gi);
            for (const match of idMatches) {
              insight.ids.add(match[1]);
            }
            // Hitta resurser: href/src
            const resMatches = content.matchAll(/(?:href|src)=["']([^"':#]+)["']/gi);
            for (const match of resMatches) {
              insight.referencedAssets.add(match[1].split('/').pop()!);
            }
          } else if (entry.name.endsWith('.css')) {
            // Hitta definierade klasser: .my-class {
            const definedMatches = content.matchAll(/\.([a-z0-9_-]+)\s*\{/gi);
            for (const match of definedMatches) {
              insight.definedClasses.add(match[1]);
            }
            // Hitta färger: #ffffff, rgba(), rgb(), hsl()
            const colorMatches = content.matchAll(/(#[a-f0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\))/gi);
            for (const match of colorMatches) {
              const color = match[1].toLowerCase();
              insight.colors.set(color, (insight.colors.get(color) || 0) + 1);
            }
            // Hitta resurser i CSS: url(...)
            const urlMatches = content.matchAll(/url\(["']?([^"'):#]+)["']?\)/gi);
            for (const match of urlMatches) {
              insight.referencedAssets.add(match[1].split('/').pop()!);
            }
          } else if (entry.name.endsWith('.js')) {
            // CTO Evolution: Logisk analys
            // Hitta funktioner
            const funcCount = (content.match(/function\s+\w+|=>/g) || []).length;
            const lineCount = content.split('\n').length;
            insight.logicComplexity.set(entryPath, funcCount + (lineCount / 10));

            // Hitta beroenden (import/fetch/länkar)
            const deps: string[] = [];
            const importMatches = content.matchAll(/(?:import|from)\s+["']([^"']+)["']/gi);
            for (const match of importMatches) {
              deps.push(match[1]);
            }
            insight.dependencies.set(entryPath, deps);
          } else if (entry.name.endsWith('.java')) {
            // ☕ Java Intelligence
            const lineCount = content.split('\n').length;
            const classCount = (content.match(/class\s+\w+|@Component|@Service/g) || []).length;
            insight.logicComplexity.set(entryPath, classCount + (lineCount / 20));

            const deps: string[] = [];
            const importMatches = content.matchAll(/import\s+([\w.]+);/g);
            for (const match of importMatches) {
              deps.push(match[1]);
            }
            insight.dependencies.set(entryPath, deps);
          } else if (entry.name.endsWith('.cpp') || entry.name.endsWith('.h') || entry.name.endsWith('.cc')) {
            // ⚙️ C++ Intelligence
            const lineCount = content.split('\n').length;
            const funcCount = (content.match(/\w+\s+\w+\s*\([^)]*\)\s*\{/g) || []).length;
            insight.logicComplexity.set(entryPath, funcCount + (lineCount / 15));

            const deps: string[] = [];
            const includeMatches = content.matchAll(/#include\s+["<]([^">]+)[">]/g);
            for (const match of includeMatches) {
              deps.push(match[1]);
            }
            insight.dependencies.set(entryPath, deps);
          } else if (entry.name.endsWith('.py')) {
            // 🐍 Python Intelligence
            const lineCount = content.split('\n').length;
            const defCount = (content.match(/def\s+\w+|class\s+\w+/g) || []).length;
            insight.logicComplexity.set(entryPath, defCount + (lineCount / 10));

            const deps: string[] = [];
            const importMatches = content.matchAll(/(?:import|from)\s+([\w.]+)/g);
            for (const match of importMatches) {
              deps.push(match[1]);
            }
            insight.dependencies.set(entryPath, deps);
          }
        } catch (e) {
          console.warn(`Kunde inte skanna filen ${entryPath}`, e);
        }
      }
    }
  };

  await traverse(directoryHandle);
  return insight;
};
