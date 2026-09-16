const express = require('express');
const supabase = require('../lib/supabase');
const { requirePermission } = require('../middleware/permission');

const router = express.Router();

// GET /api/v1/permissions - List all permissions grouped by module
router.get('/', requirePermission(['roles.view', 'roles.assign_permissions', 'users.view']), async (req, res) => {
    try {
        const { data: permissions, error } = await supabase
            .from('permissions')
            .select('*')
            .order('module', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;

        // Group permissions by module
        const grouped = (permissions || []).reduce((acc, p) => {
            if (!acc[p.module]) {
                acc[p.module] = [];
            }
            acc[p.module].push(p);
            return acc;
        }, {});

        res.json({
            data: permissions,
            grouped
        });
    } catch (err) {
        console.error('Fetch permissions error:', err);
        res.status(500).json({ message: 'Failed to fetch permissions', error: err.message });
    }
});

module.exports = router;
