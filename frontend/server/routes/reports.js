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

// GET /reports/daily-income
router.get('/daily-income', async (req, res) => {
    try {
        const dateStr = req.query.date ? req.query.date : new Date().toISOString().slice(0, 10);

        const { data: payments, error } = await supabase
            .from('payments')
            .select('*, jobOrder:job_orders(job_order_number, vehicle:vehicles(customer:customers(full_name)))')
            .gte('payment_date', `${dateStr}T00:00:00`)
            .lte('payment_date', `${dateStr}T23:59:59`);

        if (error) throw error;

        const summary = {};
        let total = 0;

        (payments || []).forEach(p => {
            const amt = parseFloat(p.amount) || 0;
            total += amt;
            const method = p.payment_method || 'Cash';
            summary[method] = (summary[method] || 0) + amt;
        });

        const formatted = (payments || []).map(p => ({
            id: p.id,
            job_order_number: p.jobOrder?.job_order_number || 'N/A',
            customer: p.jobOrder?.vehicle?.customer?.full_name || 'Walk-in',
            amount: p.amount,
            payment_method: p.payment_method,
            reference_number: p.reference_number,
            time: new Date(p.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

        res.json({
            data: {
                date: dateStr,
                total,
                summary,
                payments: formatted
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch daily income report', error: err.message });
    }
});

module.exports = router;
