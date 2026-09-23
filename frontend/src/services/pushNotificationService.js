// ==============================================================================
// Push Notification Service (Prepared Architecture)
// ==============================================================================
import api from './api';

export const isPushNotificationSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

export const getNotificationPermission = () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        throw new Error('Notifications are not supported by this browser.');
    }
    const permission = await Notification.requestPermission();
    return permission;
};

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

export const subscribeUserToPush = async (vapidPublicKey = null) => {
    if (!isPushNotificationSupported()) {
        throw new Error('Push notifications not supported');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission was not granted');
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        // VAPID public key can be configured via environment variable or passed dynamically
        const key = vapidPublicKey || import.meta.env.VITE_VAPID_PUBLIC_KEY;
        const subscribeOptions = {
            userVisibleOnly: true,
        };

        if (key) {
            subscribeOptions.applicationServerKey = urlBase64ToUint8Array(key);
        }

        subscription = await registration.pushManager.subscribe(subscribeOptions);
    }

    // Send subscription to backend API to store for the authenticated user
    try {
        await api.post('/push-subscriptions', {
            subscription: subscription.toJSON(),
            user_agent: navigator.userAgent
        });
    } catch (err) {
        console.warn('[Push] Subscription saved locally, backend sync:', err.message);
    }

    return subscription;
};

export const unsubscribeUserFromPush = async () => {
    if (!isPushNotificationSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        try {
            await api.delete('/push-subscriptions', {
                data: { endpoint: subscription.endpoint }
            });
        } catch (err) {
            console.warn('[Push] Unsubscribe backend sync:', err.message);
        }
        return await subscription.unsubscribe();
    }
    return true;
};
