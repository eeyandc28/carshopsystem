const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// Helper to generate sequential delivery number DLV-YYYYMMDD-XXXX
const generateDeliveryNumber = async () => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `DLV-${todayStr}-`;
    
    try {
        const { data } = await supabase
            .from('deliveries')
            .select('delivery_number')
            .like('delivery_number', `${prefix}%`)
            .order('id', { ascending: false })
            .limit(1);

        let seq = 1;
        if (data && data.length > 0) {
            const lastNum = data[0].delivery_number;
            const parts = lastNum.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) seq = lastSeq + 1;
        }
        return `${prefix}${String(seq).padStart(4, '0')}`;
    } catch (e) {
        return `${prefix}${String(Math.floor(Math.random() * 9000) + 1000)}`;
    }
};

// GET /api/v1/deliveries
router.get('/', async (req, res) => {
    try {
        let { data: deliveries, error } = await supabase
            .from('deliveries')
            .select('*, supplier:suppliers(id, name), items:delivery_items(*, inventory:inventories(id, name, part_number, unit_price))')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch deliveries join error, trying plain select:', error);
            const fallback = await supabase
                .from('deliveries')
                .select('*')
                .order('created_at', { ascending: false });
            if (fallback.error) throw fallback.error;
            deliveries = fallback.data || [];
        }
        
        const formatted = (deliveries || []).map(d => {
            const total_cost = (d.items || []).reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);
            const total_items = (d.items || []).reduce((sum, item) => sum + (parseInt(item.quantity_received) || 0), 0);
            return {
                ...d,
                total_cost,
                total_items,
            };
        });

        res.json({ data: formatted });
    } catch (err) {
        console.error('Deliveries error:', err);
        res.status(500).json({ message: 'Failed to fetch deliveries', error: err.message });
    }
});

// POST /api/v1/deliveries
router.post('/', async (req, res) => {
    try {
        const { supplier_id, received_date, reference_number, notes, status, items } = req.body;

        if (!received_date) {
            return res.status(422).json({ errors: { received_date: ['Received date is required.'] } });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(422).json({ errors: { items: ['At least one item is required.'] } });
        }

        const delivery_number = await generateDeliveryNumber();
        const userId = req.user ? req.user.id : null;

        // 1. Create delivery header
        const { data: delivery, error: deliveryErr } = await supabase
            .from('deliveries')
            .insert({
                delivery_number,
                supplier_id: supplier_id || null,
                received_by: userId,
                received_date,
                reference_number: reference_number || null,
                notes: notes || null,
                status: status || 'received'
            })
            .select('*')
            .single();

        if (deliveryErr) throw deliveryErr;

        // 2. Insert line items
        const lineItems = items.map(item => ({
            delivery_id: delivery.id,
            inventory_id: item.inventory_id,
            quantity_received: item.quantity_received,
            unit_cost: item.unit_cost,
            total_cost: (parseFloat(item.quantity_received) || 0) * (parseFloat(item.unit_cost) || 0)
        }));

        const { error: itemsErr } = await supabase
            .from('delivery_items')
            .insert(lineItems);

        if (itemsErr) throw itemsErr;

        // 3. Increment inventory stock if received
        if ((status || 'received') === 'received') {
            for (const item of items) {
                const { data: currentInv } = await supabase
                    .from('inventories')
                    .select('stock_quantity')
                    .eq('id', item.inventory_id)
                    .single();

                const currentStock = currentInv ? (parseInt(currentInv.stock_quantity) || 0) : 0;
                const newStock = currentStock + (parseInt(item.quantity_received) || 0);

                await supabase
                    .from('inventories')
                    .update({ stock_quantity: newStock })
                    .eq('id', item.inventory_id);
            }
        }

        res.status(201).json({ ...delivery, id: delivery.id });
    } catch (err) {
        console.error('Create delivery error:', err);
        const isTableMissing = err.message && (err.message.includes("Could not find the table") || err.message.includes("schema cache"));
        const msg = isTableMissing 
            ? "Table 'public.deliveries' missing in Supabase database. Please run schema_deliveries_and_payments.sql in your Supabase SQL Editor."
            : (err.message || 'Server error');
        res.status(500).json({ message: msg });
    }
});

// GET /api/v1/deliveries/:id
router.get('/:id', async (req, res) => {
    try {
        let { data: delivery, error } = await supabase
            .from('deliveries')
            .select('*, supplier:suppliers(*), items:delivery_items(*, inventory:inventories(*))')
            .eq('id', req.params.id)
            .single();

        if (error || !delivery) {
            const fallback = await supabase
                .from('deliveries')
                .select('*')
                .eq('id', req.params.id)
                .single();
            if (fallback.error || !fallback.data) {
                return res.status(404).json({ message: 'Delivery not found' });
            }
            delivery = fallback.data;
        }

        const total_cost = (delivery.items || []).reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);
        const total_items = (delivery.items || []).reduce((sum, item) => sum + (parseInt(item.quantity_received) || 0), 0);

        res.json({
            ...delivery,
            total_cost,
            total_items
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
