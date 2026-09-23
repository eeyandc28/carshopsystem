// ==============================================================================
// CarShop Management System - Service Worker
// Version: carshop-v1.0.0
// ==============================================================================

const SW_VERSION = 'carshop-v1.0.0';
const STATIC_CACHE_NAME = `static-${SW_VERSION}`;
const PAGES_CACHE_NAME = `pages-${SW_VERSION}`;

const PRECACHE_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/favicon.svg',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    '/icons/icon-512x512-maskable.png',
    '/icons/apple-touch-icon.png'
];

// ------------------------------------------------------------------------------
// 1. INSTALL EVENT: Pre-cache static shell & offline fallback
// ------------------------------------------------------------------------------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Pre-caching non-fatal issue:', err);
            });
        })
    );
});

// ------------------------------------------------------------------------------
// 2. ACTIVATE EVENT: Clean up stale caches & claim clients
// ------------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (
                        cacheName.startsWith('static-') && cacheName !== STATIC_CACHE_NAME ||
                        cacheName.startsWith('pages-') && cacheName !== PAGES_CACHE_NAME
                    ) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ------------------------------------------------------------------------------
// 3. MESSAGE EVENT: Allow client to trigger SKIP_WAITING on user-approved update
// ------------------------------------------------------------------------------
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ------------------------------------------------------------------------------
// 4. FETCH EVENT: Intelligent Caching Strategies
// ------------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET requests for caching
    if (request.method !== 'GET') {
        return;
    }

    // A. API REQUESTS: Strict Network-Only Policy
    // Prevents caching of customer data, financial records, passwords, or tokens.
    if (url.pathname.startsWith('/api/') || url.pathname.includes('/v1/')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({
                        offline: true,
                        message: 'You are currently offline. Please reconnect to access live data.'
                    }),
                    {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            })
        );
        return;
    }

    // B. NAVIGATION REQUESTS (HTML documents): Network-First with Offline Fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(PAGES_CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedPage = await caches.match(request);
                    if (cachedPage) {
                        return cachedPage;
                    }
                    const appRoot = await caches.match('/');
                    if (appRoot) {
                        return appRoot;
                    }
                    return caches.match('/offline.html');
                })
        );
        return;
    }

    // C. STATIC ASSETS (JS bundles, CSS, Images, Fonts): Stale-While-Revalidate / Cache-First
    const isStaticAsset = (
        url.pathname.startsWith('/assets/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.woff')
    );

    if (isStaticAsset) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                }).catch(() => null);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }
});

// ------------------------------------------------------------------------------
// 5. PUSH NOTIFICATION EVENT (Prepared for Web Push Notifications)
// ------------------------------------------------------------------------------
self.addEventListener('push', (event) => {
    let payload = {
        title: 'Carshop System Notification',
        body: 'You have a new update in Carshop.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        url: '/'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            payload = { ...payload, ...data };
        } catch {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: payload.url || '/'
        },
        actions: [
            { action: 'open', title: 'Open Carshop' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

// ------------------------------------------------------------------------------
// 6. NOTIFICATION CLICK EVENT
// ------------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
