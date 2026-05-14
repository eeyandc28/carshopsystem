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
        if (req.body.diagnosis !== undefined) updates.diagnosis = req.body.diagnosis;
        if (req.body.repair_action !== undefined) updates.repair_action = req.body.repair_action;
        if (req.body.promised_at !== undefined) updates.estimated_completion = req.body.promised_at;
        if (req.body.estimated_cost !== undefined) updates.estimated_cost = req.body.estimated_cost;
        if (req.body.actual_cost !== undefined) updates.actual_cost = req.body.actual_cost;
        
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

module.exports = router;
