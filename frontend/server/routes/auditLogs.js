const express = require('express');
const supabase = require('../lib/supabase');
const { requirePermission } = require('../middleware/permission');

const router = express.Router();

// GET /api/v1/audit-logs - Query audit trail
router.get('/', requirePermission('audit_logs.view'), async (req, res) => {
    try {
        const { search, module: mod, action, user_id, start_date, end_date, page = 1, limit = 20, all } = req.query;

        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' });

        if (mod) {
            query = query.eq('module', mod);
        }
        if (action) {
            query = query.eq('action', action);
        }
        if (user_id) {
            query = query.eq('user_id', user_id);
        }
        if (start_date) {
            query = query.gte('created_at', start_date);
        }
        if (end_date) {
            query = query.lte('created_at', `${end_date}T23:59:59Z`);
        }
        if (search) {
            query = query.or(`description.ilike.%${search}%,user_name.ilike.%${search}%,user_email.ilike.%${search}%,record_id.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false });

        if (all !== 'true') {
            const pageNum = parseInt(page) || 1;
            const pageSize = parseInt(limit) || 20;
            const offset = (pageNum - 1) * pageSize;
            query = query.range(offset, offset + pageSize - 1);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        res.json({
            data: data || [],
            total: count || 0,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
        });
    } catch (err) {
        console.error('Fetch audit logs error:', err);
        res.status(500).json({ message: 'Failed to fetch audit logs', error: err.message });
    }
});

module.exports = router;
