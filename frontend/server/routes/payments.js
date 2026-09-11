const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// GET /api/v1/payments/unpaid
router.get('/unpaid', async (req, res) => {
    try {
        const { data: jos, error } = await supabase
            .from('job_orders')
            .select('*, vehicle:vehicles(*, customer:customers(*)), payments(*)')
            .in('status', ['completed', 'released'])
            .order('updated_at', { ascending: false });

        if (error) throw error;
        res.json({ data: jos || [] });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch unpaid job orders', error: err.message });
    }
});

// POST /api/v1/payments
router.post('/', async (req, res) => {
    try {
        const { job_order_id, amount, discount, payment_method, reference_number, payment_date } = req.body;

        if (!job_order_id) {
            return res.status(422).json({ message: 'Job order ID is required.' });
        }

        const paidAmount = parseFloat(amount) || 0;
        const discAmount = parseFloat(discount) || 0;

        // Fetch current job order
        const { data: jo, error: joErr } = await supabase
            .from('job_orders')
            .select('*')
            .eq('id', job_order_id)
            .single();

        if (joErr || !jo) {
            return res.status(442).json({ message: 'Job order not found.' });
        }

        // Create payment record
        const { data: payment, error: payErr } = await supabase
            .from('payments')
            .insert({
                job_order_id,
                amount: paidAmount,
                discount: discAmount,
                payment_method,
                reference_number: reference_number || null,
                payment_date: payment_date || new Date().toISOString()
            })
            .select('*')
            .single();

        if (payErr) throw payErr;

        // Update Job Order
        const newDiscount = (parseFloat(jo.discount) || 0) + discAmount;
        const newAmountPaid = (parseFloat(jo.amount_paid) || 0) + paidAmount;
        const actualCost = parseFloat(jo.actual_cost) || 0;
        const netTotal = Math.max(0, actualCost - newDiscount);

        let payment_status = 'unpaid';
        let status = jo.status;

        if (newAmountPaid >= netTotal) {
            payment_status = 'paid';
            status = 'released';
        } else if (newAmountPaid > 0 || newDiscount > 0) {
            payment_status = 'partial';
        }

        await supabase
            .from('job_orders')
            .update({
                discount: newDiscount,
                amount_paid: newAmountPaid,
                payment_status,
                status
            })
            .eq('id', job_order_id);

        res.status(201).json({ message: 'Payment processed successfully', data: payment });
    } catch (err) {
        console.error('Payment error:', err);
        res.status(500).json({ message: 'Failed to process payment: ' + (err.message || 'Server error') });
    }
});

module.exports = router;
