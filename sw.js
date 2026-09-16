/**
 * ЭлектроОптима — service worker.
 *
 * Стратегия: network-first для страницы приложения.
 * Это принципиально: при cache-first пользователь может месяцами видеть старую
 * версию index.html после обновления на GitHub Pages — именно так возникает
 * "белый экран" и несоответствие кода тому, что залито в репозиторий.
 *
 * ВАЖНО: при каждом обновлении приложения меняйте CACHE_VERSION.
 * Это автоматически удалит все старые кэши при активации.
 */
const CACHE_VERSION = "eo-zakaz-naryad-v3";

self.addEventListener("install", (event) => {
  // новая версия SW берёт управление сразу, не дожидаясь закрытия всех вкладок
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // удаляем все кэши прошлых версий
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // POST-запросы в Google Apps Script никогда не кэшируем и не перехватываем
  if (req.method !== "GET") return;

  // Запросы к чужим origin (Apps Script) отдаём напрямую
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      // 1) Сначала сеть — всегда свежая версия приложения
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE_VERSION);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      // 2) Сети нет — отдаём из кэша, чтобы приложение открывалось офлайн
      const cached = await caches.match(req);
      if (cached) return cached;
      // 3) Для навигации без кэша — пробуем отдать стартовую страницу
      if (req.mode === "navigate") {
        const fallback = await caches.match("./index.html");
        if (fallback) return fallback;
      }
      throw e;
    }
  })());
});
