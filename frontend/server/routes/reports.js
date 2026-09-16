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

// GET /reports/item-movement
router.get('/item-movement', async (req, res) => {
    try {
        const now = new Date();
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const defaultEnd = now.toISOString().split('T')[0];

        const startDate = req.query.start_date || defaultStart;
        const endDate = req.query.end_date || defaultEnd;

        // 1. Fetch all inventory items (try 'inventories' then 'inventory')
        let inventories = [];
        const { data: invData, error: invErr } = await supabase
            .from('inventories')
            .select('*, supplier:suppliers(id, name)')
            .is('deleted_at', null);

        if (invErr) {
            const { data: fallbackInv, error: fallbackErr } = await supabase
                .from('inventory')
                .select('*, supplier:suppliers(id, name)')
                .is('deleted_at', null);
            if (fallbackErr) throw fallbackErr;
            inventories = fallbackInv || [];
        } else {
            inventories = invData || [];
        }

        // 2. Fetch consumed job order items within the specified date range
        let itemsQuery = supabase
            .from('job_order_items')
            .select(`
                id,
                inventory_id,
                item_type,
                quantity,
                unit_price,
                total_price,
                created_at,
                jobOrder:job_orders(id, status, created_at)
            `)
            .not('inventory_id', 'is', null)
            .eq('item_type', 'part');

        if (startDate) {
            itemsQuery = itemsQuery.gte('created_at', startDate + 'T00:00:00');
        }
        if (endDate) {
            itemsQuery = itemsQuery.lte('created_at', endDate + 'T23:59:59');
        }

        const { data: consumedItems } = await itemsQuery;

        // 3. Aggregate consumption by inventory_id
        const consumptionMap = {};
        (consumedItems || []).forEach(item => {
            // Filter out cancelled job orders if jobOrder relation is present
            if (item.jobOrder && item.jobOrder.status === 'cancelled') return;

            const invId = item.inventory_id;
            if (!invId) return;

            if (!consumptionMap[invId]) {
                consumptionMap[invId] = {
                    total_quantity: 0,
                    total_value: 0,
                    usage_count: 0
                };
            }

            const qty = parseFloat(item.quantity) || 0;
            const val = parseFloat(item.total_price) || (qty * (parseFloat(item.unit_price) || 0));

            consumptionMap[invId].total_quantity += qty;
            consumptionMap[invId].total_value += val;
            consumptionMap[invId].usage_count += 1;
        });

        // 4. Merge consumption into inventory list
        let mergedItems = inventories.map(inv => {
            const usage = consumptionMap[inv.id] || { total_quantity: 0, total_value: 0, usage_count: 0 };
            return {
                id: inv.id,
                name: inv.name,
                part_number: inv.part_number,
                brand: inv.brand,
                supplier: inv.supplier?.name || 'N/A',
                stock_quantity: inv.stock_quantity || 0,
                unit_price: parseFloat(inv.unit_price) || 0,
                total_quantity: usage.total_quantity,
                total_value: Math.round(usage.total_value * 100) / 100,
                usage_count: usage.usage_count,
                classification: 'normal'
            };
        });

        // 5. Sort by total_quantity descending
        mergedItems.sort((a, b) => b.total_quantity - a.total_quantity);

        // 6. Calculate classifications: top 33% = fast, bottom 33% / 0 qty = slow, middle = normal
        const count = mergedItems.length;
        if (count > 0) {
            const fastThreshold = Math.max(1, Math.ceil(count * 0.33));
            const slowStart = Math.max(fastThreshold, count - Math.ceil(count * 0.33));

            mergedItems = mergedItems.map((item, index) => {
                if (item.total_quantity === 0) {
                    item.classification = 'slow';
                } else if (index < fastThreshold) {
                    item.classification = 'fast';
                } else if (index >= slowStart) {
                    item.classification = 'slow';
                } else {
                    item.classification = 'normal';
                }
                return item;
            });
        }

        const fastList = mergedItems.filter(i => i.classification === 'fast');
        const slowList = mergedItems.filter(i => i.classification === 'slow');
        const normalList = mergedItems.filter(i => i.classification === 'normal');

        const totalValueMoved = mergedItems.reduce((sum, i) => sum + i.total_value, 0);
        const totalQtyMoved = mergedItems.reduce((sum, i) => sum + i.total_quantity, 0);

        res.json({
            data: mergedItems,
            summary: {
                total_items: count,
                fast_moving_count: fastList.length,
                slow_moving_count: slowList.length,
                normal_count: normalList.length,
                total_value_moved: Math.round(totalValueMoved * 100) / 100,
                total_qty_moved: totalQtyMoved
            },
            fast: fastList,
            slow: slowList,
            normal: normalList
        });
    } catch (err) {
        console.error('Fetch item movement report error:', err);
        res.status(500).json({ message: 'Failed to fetch item movement report', error: err.message });
    }
});

module.exports = router;
