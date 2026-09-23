// ==============================================================================
// Web Push Notification & In-App Notification Service
// ==============================================================================
import api from './api';

/**
 * Check if Web Push and Service Workers are supported by the current browser/device.
 */
export const isPushNotificationSupported = () => {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
};

/**
 * Get current browser notification permission state ('granted', 'denied', 'default', 'unsupported').
 */
export const getNotificationPermission = () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

/**
 * Request notification permission from the user.
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    const permission = await Notification.requestPermission();
    return permission;
};

/**
 * Convert VAPID base64 string to Uint8Array for PushManager subscription.
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Detect friendly device name based on User-Agent.
 */
export const getDeviceFriendlyName = () => {
    const ua = navigator.userAgent;
    let os = 'Device';
    if (/Windows NT/i.test(ua)) os = 'Windows PC';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac';
    else if (/Android/i.test(ua)) os = 'Android Device';
    else if (/iPad|iPhone|iPod/i.test(ua)) os = 'iOS Device';
    else if (/Linux/i.test(ua)) os = 'Linux PC';

    let browser = 'Browser';
    if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua)) browser = 'Safari';

    return `${os} (${browser})`;
};

/**
 * Fetch VAPID public key from backend or env.
 */
export const getVapidPublicKey = async () => {
    if (import.meta.env.VITE_VAPID_PUBLIC_KEY) {
        return import.meta.env.VITE_VAPID_PUBLIC_KEY;
    }
    try {
        const response = await api.get('/push/vapid-key');
        return response.data?.public_key;
    } catch {
        // Fallback default project key
        return 'BJG0xNGLJ1PuvRfZWjkJTflHZP5p7NW6VDmdz9cAWAIb43zrBX81OVl20XF10KLWzWGMtPeBz2cwUT805-1aKuw';
    }
};

/**
 * Check if the current browser already has an active push subscription with the backend.
 */
export const checkCurrentSubscription = async () => {
    if (!isPushNotificationSupported()) return null;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return subscription;
    } catch (e) {
        console.warn('[Push] Error getting subscription:', e);
        return null;
    }
};

/**
 * Subscribe the current device to Web Push notifications.
 */
export const subscribeUserToPush = async () => {
    if (!isPushNotificationSupported()) {
        throw new Error('Push notifications are not supported by this browser.');
    }

    if (Notification.permission === 'denied') {
        throw new Error('Notifications are blocked by your browser settings. Please enable them in browser site settings.');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission was not granted.');
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        const vapidPublicKey = await getVapidPublicKey();
        if (!vapidPublicKey) {
            throw new Error('VAPID public key is not configured on the server.');
        }

        const subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        };

        subscription = await registration.pushManager.subscribe(subscribeOptions);
    }

    // Send subscription payload to backend
    const payload = {
        subscription: subscription.toJSON(),
        device_name: getDeviceFriendlyName(),
        user_agent: navigator.userAgent
    };

    try {
        // Try /push/subscribe first, fallback to /push-subscriptions
        await api.post('/push/subscribe', payload).catch(() => {
            return api.post('/push-subscriptions', payload);
        });
    } catch (err) {
        console.warn('[Push] Subscription recorded locally, server sync error:', err.message);
    }

    return subscription;
};

/**
 * Unsubscribe the current device from Web Push notifications.
 */
export const unsubscribeUserFromPush = async () => {
    if (!isPushNotificationSupported()) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const endpoint = subscription.endpoint;
            // Inform backend
            try {
                await api.delete('/push/unsubscribe', { data: { endpoint } }).catch(() => {
                    return api.delete('/push-subscriptions', { data: { endpoint } });
                });
            } catch (err) {
                console.warn('[Push] Unsubscribe backend sync notice:', err.message);
            }

            return await subscription.unsubscribe();
        }
        return true;
    } catch (err) {
        console.error('[Push] Unsubscribe failed:', err);
        return false;
    }
};

/**
 * Trigger a backend test push notification.
 */
export const sendTestPushNotification = async () => {
    try {
        const res = await api.post('/push/test');
        return res.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to send test push notification');
    }
};

/**
 * Fetch in-app notifications history for the current user.
 */
export const fetchInAppNotifications = async () => {
    try {
        const res = await api.get('/notifications');
        return res.data; // { notifications: [], unread_count: 0 }
    } catch (err) {
        console.warn('[Notifications] Could not fetch notifications:', err.message);
        return { notifications: [], unread_count: 0 };
    }
};

/**
 * Mark a specific notification as read.
 */
export const markNotificationRead = async (id) => {
    try {
        const res = await api.patch(`/notifications/${id}/read`);
        return res.data;
    } catch (err) {
        console.warn('[Notifications] Could not mark read:', err.message);
    }
};

/**
 * Mark all notifications as read.
 */
export const markAllNotificationsRead = async () => {
    try {
        const res = await api.post('/notifications/mark-all-read');
        return res.data;
    } catch (err) {
        console.warn('[Notifications] Could not mark all read:', err.message);
    }
};

/**
 * Client-side notification category preferences (Job Orders, Vehicles, Quotations, Payments, Inventory, Appointments).
 */
const PREFS_KEY = 'carshop_notification_preferences';

export const getNotificationPreferences = () => {
    try {
        const stored = localStorage.getItem(PREFS_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error(e);
    }
    return {
        webPushEnabled: true,
        jobOrders: true,
        vehicles: true,
        quotations: true,
        payments: true,
        inventory: true,
        appointments: true
    };
};

export const saveNotificationPreferences = (prefs) => {
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
        console.error(e);
    }
};
