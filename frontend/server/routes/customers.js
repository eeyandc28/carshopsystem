const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// GET /customers
router.get('/', async (req, res) => {
    try {
        const { data, error, count } = await supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(0, 9);

        if (error) throw error;

        res.json({ data, meta: { total: count } });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch customers', error: err.message });
    }
});

// POST /customers
router.post('/', async (req, res) => {
    try {
        const { full_name, contact_number, email, address } = req.body;

        if (!full_name || !contact_number || !address) {
            return res.status(422).json({ message: 'Full name, contact number, and address are required' });
        }

        const { data, error } = await supabase
            .from('customers')
            .insert({ full_name, contact_number, email, address })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create customer', error: err.message });
    }
});

// GET /customers/:id
router.get('/:id', async (req, res) => {
    try {
        const { data: customer, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', req.params.id)
            .is('deleted_at', null)
            .single();

        if (error) return res.status(404).json({ message: 'Customer not found' });

        // Get vehicles for this customer
        const { data: vehicles } = await supabase
            .from('vehicles')
            .select('*')
            .eq('customer_id', req.params.id)
            .is('deleted_at', null);

        customer.vehicles = vehicles || [];

        res.json({ data: customer });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch customer', error: err.message });
    }
});

// PUT /customers/:id
router.put('/:id', async (req, res) => {
    try {
        const { full_name, contact_number, email, address } = req.body;

        const { data, error } = await supabase
            .from('customers')
            .update({ full_name, contact_number, email, address, updated_at: new Date() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update customer', error: err.message });
    }
});

// DELETE /customers/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('customers')
            .update({ deleted_at: new Date() })
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete customer', error: err.message });
    }
});

module.exports = router;
