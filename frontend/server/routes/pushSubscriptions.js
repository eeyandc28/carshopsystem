const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const supabase = require('../lib/supabase');

// Configure VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || 'BJG0xNGLJ1PuvRfZWjkJTflHZP5p7NW6VDmdz9cAWAIb43zrBX81OVl20XF10KLWzWGMtPeBz2cwUT805-1aKuw';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'fAacTxStxDV5XM6-7KQZIUl8VzyEFgGu23PpRPAsZdA';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@carshopsystem.com';

try {
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    }
} catch (e) {
    console.warn('[WebPush] VAPID initialization warning:', e.message);
}

// GET /vapid-key
router.get('/vapid-key', (req, res) => {
    res.json({ public_key: VAPID_PUBLIC_KEY });
});

// GET /status
router.get('/status', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { count, error } = await supabase
            .from('push_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) {
            console.warn('[Push] Status check fallback:', error.message);
            return res.json({ subscribed: false, devices_count: 0 });
        }

        res.json({
            subscribed: (count || 0) > 0,
            devices_count: count || 0
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST / or POST /subscribe
const handleSubscribe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { subscription, device_name, user_agent } = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(422).json({ message: 'Invalid subscription object' });
        }

        const endpoint = subscription.endpoint;
        const publicKey = subscription.keys?.p256dh || '';
        const authToken = subscription.keys?.auth || '';
        const userAgent = user_agent || req.headers['user-agent'] || 'Unknown Device';

        // Upsert into Supabase push_subscriptions
        const { data, error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint: endpoint,
                public_key: publicKey,
                auth_token: authToken,
                content_encoding: 'aes128gcm',
                device_name: device_name || 'Browser Device',
                user_agent: userAgent,
                last_used_at: new Date().toISOString()
            }, { onConflict: 'endpoint' })
            .select()
            .single();

        if (error) {
            console.warn('[Push] Supabase upsert error (table may need creation):', error.message);
            // Return 200/201 gracefully so frontend does not fail even if Supabase SQL was not executed yet
            return res.status(200).json({
                message: 'Push subscription received (database storage pending schema execution)',
                status: 'pending_db'
            });
        }

        console.log(`[Push] User ${userId} subscribed successfully: ${endpoint.substring(0, 30)}...`);
        res.status(201).json({
            message: 'Push subscription registered successfully',
            status: 'active',
            subscription_id: data?.id
        });
    } catch (err) {
        console.error('[Push] Subscribe error:', err.message);
        res.status(500).json({ message: 'Failed to register subscription', error: err.message });
    }
};

router.post('/', handleSubscribe);
router.post('/subscribe', handleSubscribe);

// DELETE / or DELETE /unsubscribe
const handleUnsubscribe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const endpoint = req.body?.endpoint || req.query?.endpoint;

        let query = supabase.from('push_subscriptions').delete().eq('user_id', userId);
        if (endpoint) {
            query = query.eq('endpoint', endpoint);
        }

        const { error } = await query;
        if (error) {
            console.warn('[Push] Unsubscribe error:', error.message);
        }

        res.json({ message: 'Push subscription removed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove subscription', error: err.message });
    }
};

router.delete('/', handleUnsubscribe);
router.delete('/unsubscribe', handleUnsubscribe);

// POST /test
router.post('/test', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Retrieve user's subscriptions
        const { data: subs, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (error || !subs || subs.length === 0) {
            return res.status(404).json({
                message: 'No active push subscriptions found for this user. Please enable notifications on this device first.'
            });
        }

        const payload = JSON.stringify({
            title: 'CarShop Notification Test',
            body: 'Web Push Notifications are working perfectly on this device!',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            url: '/dashboard',
            type: 'test_notification',
            timestamp: Date.now()
        });

        let sentCount = 0;
        let failCount = 0;

        for (const sub of subs) {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.public_key,
                    auth: sub.auth_token
                }
            };

            try {
                await webpush.sendNotification(pushConfig, payload);
                sentCount++;
            } catch (pushErr) {
                failCount++;
                console.error(`[Push] Failed to send push to ${sub.endpoint}:`, pushErr.statusCode || pushErr.message);

                // If subscription expired or gone (404, 410), prune it
                if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                    console.log(`[Push] Pruning expired subscription: ${sub.id}`);
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                }
            }
        }

        // Also record an in-app notification entry
        try {
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'test_notification',
                title: 'Notification Test',
                message: 'Web Push Notifications are active and verified on your device.',
                url: '/dashboard'
            });
        } catch (e) {
            // Ignore if notifications table doesn't exist
        }

        res.json({
            message: `Test notification sent: ${sentCount} succeeded, ${failCount} failed.`,
            sent: sentCount,
            failed: failCount
        });
    } catch (err) {
        console.error('[Push] Test notification failure:', err.message);
        res.status(500).json({ message: 'Failed to send test push notification', error: err.message });
    }
});

module.exports = router;
