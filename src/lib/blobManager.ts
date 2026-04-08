import { readFileContent } from './fileSystem';
import type { FileEntry } from './fileSystem';

/**
 * Hanterar mappning mellan lokala filnamn och webbläsarens minnes-URL:er (Blobs).
 */
export class BlobManager {
  private blobMap: Map<string, string> = new Map();

  /**
   * Skapar Blobs för alla filer i projektet.
   */
  async refreshBlobs(entries: FileEntry[], currentPath: string = ''): Promise<void> {
    // Rensa gamla Blobs för att undvika minnesläckage
    if (currentPath === '') {
      this.blobMap.forEach(url => URL.revokeObjectURL(url));
      this.blobMap.clear();
    }

    for (const entry of entries) {
      const path = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      
      if (entry.kind === 'file') {
        try {
          const content = await readFileContent(entry.handle as FileSystemFileHandle);
          const type = this.getMimeType(entry.name);
          const blob = new Blob([content], { type });
          const url = URL.createObjectURL(blob);
          this.blobMap.set(path, url);
        } catch (err) {
          console.error(`Kunde inte skapa blob för ${path}:`, err);
        }
      } else if (entry.kind === 'directory' && entry.children) {
        await this.refreshBlobs(entry.children, path);
      }
    }
  }

  /**
   * Returnerar den nuvarande mappningen.
   */
  getBlobMap(): Map<string, string> {
    return this.blobMap;
  }

  /**
   * Går igenom HTML-kod och ersätter relativa sökvägar med Blob-URL:er, 
   * samt injicerar debug-script.
   */
  linkHtml(html: string): string {
    let linkedHtml = html;

    // Injicera log-interceptor precis innan </head>
    const debugScript = `
<script>
  (function() {
    const sendToParent = (type, args) => {
      window.parent.postMessage({
        type: 'SPARKCODE_LOG',
        logType: type,
        content: args.map(arg => {
          try {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          } catch(e) { return "[Circular Object]"; }
        }).join(' ')
      }, '*');
    };

    const originalLog = console.log;
    console.log = (...args) => { sendToParent('log', args); originalLog.apply(console, args); };
    console.error = (...args) => { sendToParent('error', args); originalLog.apply(console, args); };
    console.warn = (...args) => { sendToParent('warn', args); originalLog.apply(console, args); };
    console.info = (...args) => { sendToParent('info', args); originalLog.apply(console, args); };

    window.onerror = (msg, url, line, col, error) => {
      sendToParent('error', [msg + ' (' + line + ':' + col + ')']);
    };
  })();
</script>
`;
    linkedHtml = linkedHtml.replace('</head>', `${debugScript}</head>`);

    // Ersätt <link href="...">
    linkedHtml = linkedHtml.replace(/(<link[^>]+href=["'])([^"']+)(["'])/gi, (match, pre, path, post) => {
      const blobUrl = this.findBlobUrl(path);
      return blobUrl ? `${pre}${blobUrl}${post}` : match;
    });

    // Ersätt <script src="...">
    linkedHtml = linkedHtml.replace(/(<script[^>]+src=["'])([^"']+)(["'])/gi, (match, pre, path, post) => {
      const blobUrl = this.findBlobUrl(path);
      return blobUrl ? `${pre}${blobUrl}${post}` : match;
    });

    // Ersätt <img src="...">
    linkedHtml = linkedHtml.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (match, pre, path, post) => {
      const blobUrl = this.findBlobUrl(path);
      return blobUrl ? `${pre}${blobUrl}${post}` : match;
    });

    return linkedHtml;
  }

  private findBlobUrl(path: string): string | undefined {
    // Ta bort ./ i början om det finns
    const cleanPath = path.replace(/^\.\//, '');
    return this.blobMap.get(cleanPath);
  }

  private getMimeType(filename: string): string {
    if (filename.endsWith('.html')) return 'text/html';
    if (filename.endsWith('.css')) return 'text/css';
    if (filename.endsWith('.js')) return 'application/javascript';
    if (filename.endsWith('.png')) return 'image/png';
    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
    if (filename.endsWith('.svg')) return 'image/svg+xml';
    return 'text/plain';
  }
}

export const blobManager = new BlobManager();
