const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// GET /inventory
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventories')
            .select('*, supplier:suppliers(*)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch inventory', error: err.message });
    }
});

// POST /inventory
router.post('/', async (req, res) => {
    try {
        const { name, part_number, brand, supplier_id, stock_quantity, reorder_level, unit_price } = req.body;

        if (!name || !part_number || !brand || stock_quantity === undefined || unit_price === undefined) {
            return res.status(422).json({ message: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('inventories')
            .insert({
                name, part_number, brand,
                supplier_id: supplier_id || null,
                stock_quantity: parseInt(stock_quantity),
                reorder_level: parseInt(reorder_level) || 5,
                unit_price: parseFloat(unit_price)
            })
            .select('*, supplier:suppliers(*)')
            .single();

        if (error) throw error;

        // Log Initial Movement
        if (parseInt(stock_quantity) > 0) {
            await supabase
                .from('stock_movements')
                .insert({
                    inventory_id: data.id,
                    transaction_type: 'IN',
                    quantity: parseInt(stock_quantity),
                    reference_id: 'INITIAL',
                    reference_type: 'Adjustment',
                    balance_after: parseInt(stock_quantity),
                    notes: 'Initial Stock Entry'
                });
        }

        res.status(201).json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create inventory item', error: err.message });
    }
});

// GET /inventory/:id/movements
router.get('/:id/movements', async (req, res) => {
    try {
        const invId = req.params.id;
        const { start_date, end_date } = req.query;

        // 1. Fetch inventory item
        const { data: inv, error: invErr } = await supabase
            .from('inventories')
            .select('*')
            .eq('id', invId)
            .single();

        if (invErr || !inv) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // 2. Fetch deliveries IN
        let deliveryItems = [];
        try {
            // Fetch delivery items for this inventory
            const { data: dItems, error: dErr } = await supabase
                .from('delivery_items')
                .select('*')
                .eq('inventory_id', invId);

            if (!dErr && dItems && dItems.length > 0) {
                // Fetch associated deliveries
                const deliveryIds = [...new Set(dItems.map(di => di.delivery_id).filter(Boolean))];
                let deliveriesMap = {};
                let suppliersMap = {};

                if (deliveryIds.length > 0) {
                    const { data: dList } = await supabase
                        .from('deliveries')
                        .select('*')
                        .in('id', deliveryIds);

                    if (dList) {
                        dList.forEach(d => { deliveriesMap[d.id] = d; });
                        const supplierIds = [...new Set(dList.map(d => d.supplier_id).filter(Boolean))];
                        if (supplierIds.length > 0) {
                            const { data: sList } = await supabase
                                .from('suppliers')
                                .select('*')
                                .in('id', supplierIds);
                            if (sList) {
                                sList.forEach(s => { suppliersMap[s.id] = s.name; });
                            }
                        }
                    }
                }

                deliveryItems = dItems.map(di => {
                    const d = deliveriesMap[di.delivery_id] || {};
                    const supplierName = suppliersMap[d.supplier_id] || 'Supplier';
                    return {
                        id: 'DI-' + di.id,
                        transaction_type: 'IN',
                        reference_type: 'Delivery',
                        reference_id: d.delivery_number || `DLV-${di.delivery_id}`,
                        reference_label: supplierName,
                        quantity: parseInt(di.quantity_received) || 0,
                        unit_cost: parseFloat(di.unit_cost) || 0,
                        notes: d.reference_number ? `DR: ${d.reference_number}` : (d.notes || null),
                        created_at: d.received_date ? `${d.received_date}T00:00:00Z` : di.created_at,
                    };
                });
            }
        } catch (e) {
            console.error('Fetch delivery items error:', e);
        }

        // 3. Fetch job order items OUT
        let jobOrderItems = [];
        try {
            const { data: joItems, error: joErr } = await supabase
                .from('job_order_items')
                .select('*')
                .eq('inventory_id', invId)
                .eq('item_type', 'part');

            if (!joErr && joItems && joItems.length > 0) {
                const joIds = [...new Set(joItems.map(ji => ji.job_order_id).filter(Boolean))];
                let joMap = {};
                if (joIds.length > 0) {
                    const { data: joList } = await supabase
                        .from('job_orders')
                        .select('*')
                        .in('id', joIds);
                    if (joList) {
                        joList.forEach(jo => { joMap[jo.id] = jo; });
                    }
                }

                jobOrderItems = joItems.map(ji => {
                    const jo = joMap[ji.job_order_id] || {};
                    return {
                        id: 'JI-' + ji.id,
                        transaction_type: 'OUT',
                        reference_type: 'Job Order',
                        reference_id: jo.job_order_number || `JO-${ji.job_order_id}`,
                        reference_label: 'Customer Work',
                        quantity: parseInt(ji.quantity) || 0,
                        unit_cost: parseFloat(ji.unit_price) || 0,
                        notes: ji.description || null,
                        created_at: ji.created_at,
                    };
                });
            }
        } catch (e) {
            console.error('Fetch job order items error:', e);
        }

        // 4. Fetch manual stock movements if any
        let manualMovements = [];
        try {
            const { data: mMovements } = await supabase
                .from('stock_movements')
                .select('*')
                .eq('inventory_id', invId);

            if (mMovements && mMovements.length > 0) {
                manualMovements = mMovements.map(m => ({
                    id: 'SM-' + m.id,
                    transaction_type: m.transaction_type,
                    reference_type: m.reference_type || 'Adjustment',
                    reference_id: m.reference_id || 'MANUAL',
                    reference_label: m.reference_label || 'Adjustment',
                    quantity: parseInt(m.quantity) || 0,
                    unit_cost: parseFloat(m.unit_cost) || 0,
                    notes: m.notes || null,
                    created_at: m.created_at,
                }));
            }
        } catch (e) {
            // ignore
        }

        // 5. Merge and filter by dates
        let allMovements = [...deliveryItems, ...jobOrderItems, ...manualMovements];

        if (start_date) {
            allMovements = allMovements.filter(m => new Date(m.created_at) >= new Date(start_date));
        }
        if (end_date) {
            allMovements = allMovements.filter(m => new Date(m.created_at) <= new Date(`${end_date}T23:59:59Z`));
        }

        // Sort chronologically ascending to calculate running balance
        allMovements.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        // 6. Compute running balance walking backwards from current stock
        let currentStock = parseInt(inv.stock_quantity) || 0;
        let total_in = 0;
        let total_out = 0;

        let balance = currentStock;
        for (let i = allMovements.length - 1; i >= 0; i--) {
            allMovements[i].balance_after = balance;
            if (allMovements[i].transaction_type === 'IN') {
                total_in += allMovements[i].quantity;
                balance -= allMovements[i].quantity;
            } else {
                total_out += allMovements[i].quantity;
                balance += allMovements[i].quantity;
            }
        }

        // Reverse so newest appears first for display
        const displayMovements = [...allMovements].reverse();

        res.json({
            data: displayMovements,
            total_in,
            total_out,
            current_stock: currentStock,
        });
    } catch (err) {
        console.error('Movement error:', err);
        res.status(500).json({ message: 'Failed to fetch movements', error: err.message });
    }
});

// GET /inventory/:id
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventories')
            .select('*, supplier:suppliers(*)')
            .eq('id', req.params.id)
            .is('deleted_at', null)
            .single();

        if (error) return res.status(404).json({ message: 'Item not found' });

        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch item', error: err.message });
    }
});

// PUT /inventory/:id
router.put('/:id', async (req, res) => {
    try {
        // Fetch current stock to calculate difference
        const { data: currentItem } = await supabase
            .from('inventories')
            .select('stock_quantity')
            .eq('id', req.params.id)
            .single();

        const updates = {};
        const fields = ['name', 'part_number', 'brand', 'supplier_id', 'stock_quantity', 'reorder_level', 'unit_price'];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.stock_quantity !== undefined) updates.stock_quantity = parseInt(updates.stock_quantity);
        if (updates.reorder_level !== undefined) updates.reorder_level = parseInt(updates.reorder_level);
        if (updates.unit_price !== undefined) updates.unit_price = parseFloat(updates.unit_price);
        updates.updated_at = new Date();

        const { data, error } = await supabase
            .from('inventories')
            .update(updates)
            .eq('id', req.params.id)
            .select('*, supplier:suppliers(*)')
            .single();

        if (error) throw error;

        // Log movement if stock quantity changed manually
        if (currentItem && updates.stock_quantity !== undefined && updates.stock_quantity !== currentItem.stock_quantity) {
            const diff = updates.stock_quantity - currentItem.stock_quantity;
            await supabase
                .from('stock_movements')
                .insert({
                    inventory_id: data.id,
                    transaction_type: diff > 0 ? 'IN' : 'OUT',
                    quantity: Math.abs(diff),
                    reference_id: 'MANUAL',
                    reference_type: 'Adjustment',
                    balance_after: updates.stock_quantity,
                    notes: req.body.adjustment_notes || 'Manual stock adjustment'
                });
        }

        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update item', error: err.message });
    }
});

// DELETE /inventory/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('inventories')
            .update({ deleted_at: new Date() })
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete item', error: err.message });
    }
});

module.exports = router;
