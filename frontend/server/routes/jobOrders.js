const express = require('express');
const crypto = require('crypto');
const supabase = require('../lib/supabase');

const router = express.Router();

// GET /job-orders
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('job_orders')
            .select(`
                *,
                vehicle:vehicles(*, customer:customers(*)),
                service_advisor:users!job_orders_service_advisor_id_fkey(id, name, email),
                mechanic:users!job_orders_mechanic_id_fkey(id, name, email)
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform to match frontend expected format
        const transformed = (data || []).map(order => ({
            id: order.id,
            order_number: order.job_order_number,
            status: order.status,
            description: order.complaint,
            diagnosis: order.diagnosis,
            repair_action: order.repair_action,
            promised_at: order.estimated_completion,
            estimated_cost: order.estimated_cost,
            actual_cost: order.actual_cost,
            customer: order.vehicle?.customer || null,
            vehicle: order.vehicle ? {
                id: order.vehicle.id,
                plate_number: order.vehicle.plate_number,
                brand: order.vehicle.brand,
                model: order.vehicle.model,
                year: order.vehicle.year
            } : null,
            advisor: order.service_advisor,
            mechanic: order.mechanic,
            created_at: order.created_at
        }));

        res.json({ data: transformed });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch job orders', error: err.message });
    }
});

// POST /job-orders
router.post('/', async (req, res) => {
    try {
        const { vehicle_id, description, promised_at, estimated_cost } = req.body;

        if (!vehicle_id || !description) {
            return res.status(422).json({ message: 'Vehicle and description are required' });
        }

        const jobOrderNumber = 'JO-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        const { data, error } = await supabase
            .from('job_orders')
            .insert({
                job_order_number: jobOrderNumber,
                vehicle_id: parseInt(vehicle_id),
                service_advisor_id: req.user.id,
                complaint: description,
                status: 'pending',
                estimated_completion: promised_at || null,
                estimated_cost: estimated_cost || 0
            })
            .select(`
                *,
                vehicle:vehicles(*, customer:customers(*)),
                service_advisor:users!job_orders_service_advisor_id_fkey(id, name, email)
            `)
            .single();

        if (error) throw error;

        res.status(201).json({
            data: {
                id: data.id,
                order_number: data.job_order_number,
                status: data.status,
                description: data.complaint,
                estimated_cost: data.estimated_cost,
                actual_cost: data.actual_cost,
                customer: data.vehicle?.customer || null,
                vehicle: data.vehicle,
                advisor: data.service_advisor,
                created_at: data.created_at
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create job order', error: err.message });
    }
});

// GET /job-orders/:id
router.get('/:id', async (req, res) => {
    try {
        const { data: order, error } = await supabase
            .from('job_orders')
            .select(`
                *,
                vehicle:vehicles(*, customer:customers(*)),
                service_advisor:users!job_orders_service_advisor_id_fkey(id, name, email),
                mechanic:users!job_orders_mechanic_id_fkey(id, name, email)
            `)
            .eq('id', req.params.id)
            .is('deleted_at', null)
            .single();

        if (error) return res.status(404).json({ message: 'Job order not found' });

        res.json({
            data: {
                id: order.id,
                order_number: order.job_order_number,
                status: order.status,
                description: order.complaint,
                diagnosis: order.diagnosis,
                repair_action: order.repair_action,
                promised_at: order.estimated_completion,
                estimated_cost: order.estimated_cost,
                actual_cost: order.actual_cost,
                customer: order.vehicle?.customer || null,
                vehicle: order.vehicle,
                advisor: order.service_advisor,
                mechanic: order.mechanic,
                created_at: order.created_at
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch job order', error: err.message });
    }
});

// PATCH /job-orders/:id
router.patch('/:id', async (req, res) => {
    try {
        const updates = {};
        
        if (req.body.status) updates.status = req.body.status;
        if (req.body.description) updates.complaint = req.body.description;
        if (req.body.diagnosis !== undefined) updates.diagnosis = req.body.diagnosis || null;
        if (req.body.repair_action !== undefined) updates.repair_action = req.body.repair_action || null;
        if (req.body.promised_at !== undefined) updates.estimated_completion = req.body.promised_at || null;
        if (req.body.estimated_cost !== undefined) updates.estimated_cost = req.body.estimated_cost || 0;
        if (req.body.actual_cost !== undefined) updates.actual_cost = req.body.actual_cost || 0;
        
        updates.updated_at = new Date();

        const { data, error } = await supabase
            .from('job_orders')
            .update(updates)
            .eq('id', req.params.id)
            .select(`
                *,
                vehicle:vehicles(*, customer:customers(*)),
                service_advisor:users!job_orders_service_advisor_id_fkey(id, name, email)
            `)
            .single();

        if (error) throw error;

        res.json({
            data: {
                id: data.id,
                order_number: data.job_order_number,
                status: data.status,
                description: data.complaint,
                diagnosis: data.diagnosis,
                repair_action: data.repair_action,
                promised_at: data.estimated_completion,
                estimated_cost: data.estimated_cost,
                actual_cost: data.actual_cost,
                customer: data.vehicle?.customer || null,
                vehicle: data.vehicle,
                advisor: data.service_advisor,
                created_at: data.created_at
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update job order', error: err.message });
    }
});

// PUT /job-orders/:id (alias for PATCH)
router.put('/:id', async (req, res) => {
    req.method = 'PATCH';
    router.handle(req, res);
});

// DELETE /job-orders/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('job_orders')
            .update({ deleted_at: new Date() })
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete job order', error: err.message });
    }
});

// GET /job-orders/:id/items
router.get('/:id/items', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('job_order_items')
            .select('*')
            .eq('job_order_id', req.params.id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch items', error: err.message });
    }
});

// POST /job-orders/:id/items
router.post('/:id/items', async (req, res) => {
    try {
        const { item_type, description, quantity, unit_price, inventory_id } = req.body;
        const totalPrice = parseFloat(quantity) * parseFloat(unit_price);

        const { data: item, error } = await supabase
            .from('job_order_items')
            .insert({
                job_order_id: req.params.id,
                inventory_id: inventory_id || null,
                item_type,
                description,
                quantity,
                unit_price,
                total_price: totalPrice
            })
            .select()
            .single();

        if (error) throw error;

        // If it's a part, decrease inventory stock
        if (item_type === 'part' && inventory_id) {
            const { data: inv } = await supabase
                .from('inventories')
                .select('stock_quantity')
                .eq('id', inventory_id)
                .single();
            
            if (inv) {
                await supabase
                    .from('inventories')
                    .update({ stock_quantity: inv.stock_quantity - quantity })
                    .eq('id', inventory_id);
                
                // Log Movement
                await supabase
                    .from('stock_movements')
                    .insert({
                        inventory_id: inventory_id,
                        transaction_type: 'OUT',
                        quantity: quantity,
                        reference_id: req.params.id,
                        reference_type: 'JobOrder',
                        balance_after: inv.stock_quantity - quantity,
                        notes: `Used in Job Order #${req.params.id}`
                    });
            }
        }

        // Update actual_cost in job_orders
        const { data: allItems } = await supabase
            .from('job_order_items')
            .select('total_price')
            .eq('job_order_id', req.params.id);
        
        const totalActualCost = (allItems || []).reduce((sum, i) => sum + parseFloat(i.total_price), 0);
        
        await supabase
            .from('job_orders')
            .update({ actual_cost: totalActualCost })
            .eq('id', req.params.id);

        res.status(201).json({ data: item });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add item', error: err.message });
    }
});

// DELETE /job-orders/items/:itemId
router.delete('/items/:itemId', async (req, res) => {
    try {
        // Get item info first to know the job_order_id and inventory_id
        const { data: item } = await supabase
            .from('job_order_items')
            .select('*')
            .eq('id', req.params.itemId)
            .single();

        if (!item) return res.status(404).json({ message: 'Item not found' });

        const { error } = await supabase
            .from('job_order_items')
            .delete()
            .eq('id', req.params.itemId);

        if (error) throw error;

        // If it was a part, restore inventory stock
        if (item.item_type === 'part' && item.inventory_id) {
            const { data: inv } = await supabase
                .from('inventories')
                .select('stock_quantity')
                .eq('id', item.inventory_id)
                .single();
            
            if (inv) {
                await supabase
                    .from('inventories')
                    .update({ stock_quantity: inv.stock_quantity + item.quantity })
                    .eq('id', item.inventory_id);
                
                // Log Movement
                await supabase
                    .from('stock_movements')
                    .insert({
                        inventory_id: item.inventory_id,
                        transaction_type: 'IN',
                        quantity: item.quantity,
                        reference_id: item.job_order_id.toString(),
                        reference_type: 'JobOrderReturn',
                        balance_after: inv.stock_quantity + item.quantity,
                        notes: `Returned from Job Order #${item.job_order_id}`
                    });
            }
        }

        // Update actual_cost in job_orders
        const { data: allItems } = await supabase
            .from('job_order_items')
            .select('total_price')
            .eq('job_order_id', item.job_order_id);
        
        const totalActualCost = (allItems || []).reduce((sum, i) => sum + parseFloat(i.total_price), 0);
        
        await supabase
            .from('job_orders')
            .update({ actual_cost: totalActualCost })
            .eq('id', item.job_order_id);

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete item', error: err.message });
    }
});

module.exports = router;
