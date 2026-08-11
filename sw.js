// Минимальный service worker — нужен браузеру, чтобы предложить установку "как приложение".
// Кэширования не делает, чтобы форма всегда открывалась в актуальной версии.
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { self.clients.claim(); });
self.addEventListener("fetch", (e) => { /* сеть напрямую, без кэша */ });
