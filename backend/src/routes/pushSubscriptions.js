const express = require('express');
const router = express.Router();

// POST /push-subscriptions
router.post('/', async (req, res) => {
    try {
        const { subscription, user_agent } = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(422).json({ message: 'Invalid subscription object' });
        }

        console.log('[Push] Subscription registered for user:', req.user?.id, subscription.endpoint);

        res.status(201).json({
            message: 'Push subscription registered successfully',
            status: 'active'
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to register subscription', error: err.message });
    }
});

// DELETE /push-subscriptions
router.delete('/', async (req, res) => {
    try {
        const { endpoint } = req.body || {};
        console.log('[Push] Subscription removed for user:', req.user?.id, endpoint);
        res.json({ message: 'Push subscription removed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove subscription', error: err.message });
    }
});

module.exports = router;
