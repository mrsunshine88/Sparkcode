# SparkCode: Det Tekniska Manifestet v5.0 (Senior Architect Edition) 🏛️🛡️🚀💎🦾

Detta dokument är den slutgiltiga tekniska specifikationen för SparkCode-plattformen. Det är skrivet för seniora ingenjörer och systemarkitekter som kräver en djupgående förståelse för hur systemet hanterar state, synkronisering, lokal persistens och AI-heuristik.

---

## 1. Systemarkitektur & Runtime Hybridisering 🏗️

SparkCode opererar i ett unikt hybridläge mellan webbläsarens sandlåda och det lokala operativsystemets filsystem.

### 1.1. Native File System Access API
På desktop-enheter utnyttjar systemet **Native File System Access API**. 
*   **Asynkron I/O:** Vi använder `async/await` mönster för att interagera med `FileSystemDirectoryHandle` och `FileSystemFileHandle`.
*   **Permission Lifecycle:** Eftersom filhandtag (handles) är flyktiga mellan sessioner, implementerar vi ett säkerhetsflöde där vi sparar handtag i **IndexedDB**. Vid omstart triggas en "Permission Challenge" via `verifyPermission(handle)` där användaren måste ge sitt godkännande genom en explicit UI-interaktion (User Gesture), vilket krävs av W3C-specifikationen.

### 1.2. Virtual Data Mapping (BlobManager.ts)
När körvänliga lokala filer inte är tillgängliga (t.ex. på mobila enheter eller vid molnsynk), aktiveras vår virtuella mappningsmotor:
*   **Object URLs:** Vi transformerar kodsträngar till dymaniska Blobs via `URL.createObjectURL(new Blob([content], { type: 'text/html' }))`.
*   **Recursive Link Rewriting:** `BlobManager` skannar koden efter tillgångar (images, links, scripts) och mappar om dessa till korresponderande interna Blobs. Detta skapar ett isolerat virtuellt universum som exekveras i en sandlådad Iframe utan latens.
*   **Garbage Collection:** För att förhindra minnesläckage anropar vi systematiskt `URL.revokeObjectURL` vid varje filuppdatering eller radering.

---

## 2. PWA Sentinel: Adaptiv Installation & Service Workers 📱

SparkCode är inte bara en hemsida; det är en installerbar plattform som känner av sin omgivning.

### 2.1. Intelligent Platform Detection (PWA Sentinel)
Implementerad i `PwaPrompt.tsx`, använder systemet en rigorös detekteringsmatris för att guida användaren till installation:
*   **iOS/Safari Matris:** Vi detekterar iPad/iPhone/iPod via `navigator.userAgent`. Vi exkluderar explicit `MSStream` (legacy WP-check). Vi verifierar "äkta" Safari genom att söka efter `safari` men utesluta `chrome|crios`. Om dessa kriterier uppfylls, aktiveras en skräddarsydd guide för iOS "Share Sheet" installation.
*   **Android/Chromium Engine:** Vi fångar det nativa `beforeinstallprompt`-eventet. Vi anropar `e.preventDefault()` för att blockera webbläsarens enkla prompt och istället "stasha" eventet i ett internt state (`deferredPrompt`). Detta tillåter oss att erbjuda en premium, glödande "LADDA NER APPEN"-knapp som smälter in i hackers-estetiken.
*   **Display Mode Isolation:** Vi använder `window.matchMedia('(display-mode: standalone)')` för att helt dölja installationsinslag om appen redan körs i sitt installerade läge.

### 2.2. Service Worker Lifecycle (sw.js)
Vår Service Worker är optimerad för transparens och kontroll:
*   **Skip Waiting / Clients Claim:** Vi tvingar fram omedelbar aktivering av nya SW-versioner för att säkerställa att arkitekten alltid kör den senaste audit-motorn.
*   **Navigate Interception:** Vi lyssnar på `fetch`-events. Om nätverket sviker vid en navigering, injicerar vi en in-memory HTML-sträng (`SYSTEM_OFFLINE`) som fungerar som en snygg landningssida med återanslutningslogik.

---

## 3. Realtids-synkronisering: "Ghost Sync" Protokollet ☁️📡

För att möjliggöra samarbete och realtids-fjärrstyrning av desktop-filer från en mobil, använder vi ett avancerat synkroniseringslager.

### 3.1. Supabase Realtime & Broadcast Channels
*   **Broadcast Mode:** För UI-uppdateringar som kräver minimal latens (t.ex. när du skriver på mobilen och vill se det på skärmen direkt) använder vi broadcast-kanaler. Dessa går via WebSockets och triggar inte databas-skrivningar för varje tecken, vilket sparar IOPS.
*   **Postgres CDC (Change Data Capture):** För permanent lagring lyssnar vi på `postgres_changes`. När en fil sparas, upsertas den i `file_sync`-tabellen med en unik constraint på `user_id, project_name, file_path`.

### 3.2. Mobil Throttling & Wake Lock
Moderna mobiloperativsystem (iOS/Android) stryper nätverkstrafik för inaktiva flikar. SparkCode bekämpar detta med:
*   **Heartbeat Puls:** En `heartbeat`-kanal skickar en minimal ping varje sekund. Detta håller pipan öppen mot Supabase.
*   **Screen Wake Lock API:** Vi anropar `navigator.wakeLock.request('screen')` i mobilt läge. Detta hindrar enheten från att gå i vila och strypa synk-motorn, vilket är avgörande för långa kodningspass i fält.

---

## 4. Den Allvetande Mentorn: AI & Heuristik 🧠🩺

AI-lagret i SparkCode består av fyra samverkande motorer som utför kontinuerlig statisk och dynamisk analys.

### 4.1. Audit Robot (Structural Analysis)
En dedikerad motor som penetrerar förhandsvisningens DOM:
*   **DOM Node Throttling:** Vi räknar totala noder (`doc.getElementsByTagName('*').length`). Överstiger detta 500 noder varnar vi för prestandadegradering.
*   **Visual Overflow Sentinel:** Vi detekterar horisontell scrollning på `body`-nivå genom att kontrastera `scrollWidth` mot `clientWidth`. Detta flaggar omedelbart för bristfällig mobilanpassning.
*   **Placeholder Heuristics:** En regex-motor som söker efter "lorem ipsum" och ej utbytta bild-adresser (`unsplash.com` etc).

### 4.2. Experience Scoring Algorithm
Din rang (Junior till Expert) beräknas inte på godtyckliga grunder, utan via en viktad formel:
*   **Complexity Score:** `Antal Funktioner + (Totalt antal rader / 10)`. 
*   **Structure Multiplier:** Om projektet innehåller en `/src`-mapp eller separation mellan HTML/CSS/JS, erhålls en bonusfaktor.
*   **Logic Penalty:** Avsaknad av variabeldeklarationer eller massiv användning av globala states sänker poängen.

---

## 5. Pro Server Bridge: Terminal Integration 🌉⚙️

För arkitekter som kör Astro, Vite eller komplexa ramverk lokalt, agerar SparkCode som ett "Control Plane".

### 5.1. Iframe Hijacking & Override
När du anger en `overrideUrl` i SERVER-menyn, stänger vi av Blob-genereringen och omdirigerar Iframens `src` till din lokala dev-server.
*   **Security Context:** Eftersom SparkCode körs på HTTPS och lokala sevrrar oftast på HTTP, guidar vi användaren att tillåta "Insecure Content" för att bryggan ska fungera.

### 5.2. Log Proxying (The Pulse)
För att ge arkitekten insyn i sin lokala server, injicerar vi en proxy i previewsidan:
```javascript
const originalLog = console.log;
console.log = (...args) => {
  window.parent.postMessage({ type: 'SPARKCODE_LOG', content: args.join(' ') }, '*');
  originalLog.apply(console, args);
};
```
Detta mönster replikeras för `warn` och `error`, och matas direkt in i SparkCodes centrala terminal.

---

## 6. Persistens & Dataintegritet: SparkCodeDB 🛡️💾

Vi använder en multi-layer lagringsstrategi för att garantera att ingen kod går förlorad.

*   **Layer 1: RAM (Active State):** React-states för omedelbar respons.
*   **Layer 2: LocalStorage (Backup):** En "flicker-free" kopia av den aktiva filen som används vid hård omladdning (F5).
*   **Layer 3: IndexedDB (Registry):** Sparar `FileSystemHandles` för att bibehålla disk-access mellan dagar.
*   **Layer 4: Cloud (Remote):** Den ultimata sanningen för multi-device workflow.

---

**SparkCode är byggt för att vara det mest stabila och intelligenta verktyget i en modern utvecklares arsenal. Varje komponent är optimerad för prestanda, förutsägbarhet och arkitektonisk elegans.** 🏛️💎🏆🔥🦾
