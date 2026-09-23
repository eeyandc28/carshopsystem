// ==============================================================================
// Service Worker Registration & Lifecycle Manager
// ==============================================================================

let swRegistration = null;
let updateCallbacks = [];

export function onServiceWorkerUpdate(callback) {
    updateCallbacks.push(callback);
    return () => {
        updateCallbacks = updateCallbacks.filter(cb => cb !== callback);
    };
}

function notifyUpdateWaiting(registration) {
    updateCallbacks.forEach(cb => cb(registration));
}

export function registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        window.addEventListener('load', async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                swRegistration = reg;

                // 1. Check if a worker is already waiting
                if (reg.waiting) {
                    notifyUpdateWaiting(reg);
                }

                // 2. Listen for new workers entering the waiting phase
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                notifyUpdateWaiting(reg);
                            }
                        });
                    }
                });

                // Periodic check for updates every 60 minutes
                setInterval(() => {
                    reg.update().catch(() => {});
                }, 60 * 60 * 1000);

            } catch (err) {
                console.warn('[PWA] Service Worker registration failed:', err);
            }
        });

        // Reload window smoothly when new service worker takes control
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    }
}

export function skipWaitingAndReload(registration) {
    const reg = registration || swRegistration;
    if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
        window.location.reload();
    }
}

export function getServiceWorkerRegistration() {
    return swRegistration;
}
