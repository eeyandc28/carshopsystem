const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/v1/notifications
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) {
            console.warn('[Notifications] Supabase fetch error or table not yet migrated:', error.message);
            return res.json({ notifications: [], unread_count: 0 });
        }

        const unreadCount = (notifications || []).filter(n => !n.read_at).length;

        res.json({
            notifications: notifications || [],
            unread_count: unreadCount
        });
    } catch (err) {
        console.error('[Notifications] Error fetching notifications:', err.message);
        res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
    }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
    try {
        const userId = req.user?.id;
        const notificationId = req.params.id;

        const { data, error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notificationId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ message: 'Failed to mark notification as read', error: error.message });
        }

        res.json({ message: 'Notification marked as read', notification: data });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/v1/notifications/mark-all-read
router.post('/mark-all-read', async (req, res) => {
    try {
        const userId = req.user?.id;

        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .is('read_at', null);

        if (error) {
            return res.status(400).json({ message: 'Failed to mark all as read', error: error.message });
        }

        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
