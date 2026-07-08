// Service Worker — Kiva360 PWA
const CACHE_NAME = 'kiva360-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Network-first strategy for all requests
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
