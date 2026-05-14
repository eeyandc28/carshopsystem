const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// GET /vehicles
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*, customer:customers(*)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch vehicles', error: err.message });
    }
});

// POST /vehicles
router.post('/', async (req, res) => {
    try {
        const { customer_id, plate_number, vin, brand, model, year, transmission, fuel_type, mileage, color } = req.body;

        if (!customer_id || !plate_number || !vin || !brand || !model || !year || !transmission || !fuel_type || !color) {
            return res.status(422).json({ message: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('vehicles')
            .insert({ customer_id, plate_number, vin, brand, model, year: parseInt(year), transmission, fuel_type, mileage: parseInt(mileage) || 0, color })
            .select('*, customer:customers(*)')
            .single();

        if (error) throw error;

        res.status(201).json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create vehicle', error: err.message });
    }
});

// GET /vehicles/:id
router.get('/:id', async (req, res) => {
    try {
        const { data: vehicle, error } = await supabase
            .from('vehicles')
            .select('*, customer:customers(*)')
            .eq('id', req.params.id)
            .is('deleted_at', null)
            .single();

        if (error) return res.status(404).json({ message: 'Vehicle not found' });

        // Get job orders for this vehicle
        const { data: jobOrders } = await supabase
            .from('job_orders')
            .select('*, service_advisor:users!job_orders_service_advisor_id_fkey(id, name, email)')
            .eq('vehicle_id', req.params.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        vehicle.job_orders = jobOrders || [];

        res.json({ data: vehicle });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch vehicle', error: err.message });
    }
});

// PUT /vehicles/:id
router.put('/:id', async (req, res) => {
    try {
        const updates = {};
        const fields = ['customer_id', 'plate_number', 'vin', 'brand', 'model', 'year', 'transmission', 'fuel_type', 'mileage', 'color'];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.year) updates.year = parseInt(updates.year);
        if (updates.mileage) updates.mileage = parseInt(updates.mileage);
        updates.updated_at = new Date();

        const { data, error } = await supabase
            .from('vehicles')
            .update(updates)
            .eq('id', req.params.id)
            .select('*, customer:customers(*)')
            .single();

        if (error) throw error;

        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update vehicle', error: err.message });
    }
});

// DELETE /vehicles/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('vehicles')
            .update({ deleted_at: new Date() })
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete vehicle', error: err.message });
    }
});

module.exports = router;
