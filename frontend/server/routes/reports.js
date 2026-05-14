const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// GET /reports/sales
router.get('/sales', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = supabase
            .from('job_orders')
            .select(`
                id,
                job_order_number,
                actual_cost,
                estimated_cost,
                status,
                created_at,
                vehicle:vehicles(plate_number, customer:customers(full_name))
            `)
            .is('deleted_at', null)
            .in('status', ['completed', 'released'])
            .order('created_at', { ascending: false });

        if (start_date) {
            query = query.gte('created_at', start_date);
        }
        if (end_date) {
            query = query.lte('created_at', end_date + 'T23:59:59');
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calculate summary
        const summary = {
            total_sales: (data || []).reduce((sum, order) => sum + parseFloat(order.actual_cost || 0), 0),
            total_orders: data.length,
            average_order_value: data.length > 0 ? (data || []).reduce((sum, order) => sum + parseFloat(order.actual_cost || 0), 0) / data.length : 0
        };

        res.json({ data, summary });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch sales report', error: err.message });
    }
});

module.exports = router;
