/*
 * SERVICE WORKER: SparkCode PWA Handler
 * Hanterar offline-stöd och installation på hemskärmen.
 */

const CACHE_NAME = 'sparkcode-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Enkel fetch-handler för att uppfylla PWA-krav
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          "<html><body style='background:#050505;color:#00ff41;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;'><div><h1 style='text-shadow: 0 0 10px #00ff41;'>SYSTEM_OFFLINE</h1><p>Check your connection to resume hacking.</p><button onclick='window.location.reload()' style='background:#00ff41;color:black;border:none;padding:12px 24px;font-family:inherit;font-weight:bold;cursor:pointer;margin-top:20px;'>TRY_AGAIN</button></div></body></html>", 
          { 
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          }
        );
      })
    );
  }
});
