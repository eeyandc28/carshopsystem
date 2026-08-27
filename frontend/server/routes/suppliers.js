const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// GET /suppliers
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch suppliers', error: err.message });
    }
});

// POST /suppliers
router.post('/', async (req, res) => {
    try {
        const { name, contact_person, contact_number, email, address } = req.body;

        if (!name) {
            return res.status(422).json({ message: 'Supplier name is required' });
        }

        const { data, error } = await supabase
            .from('suppliers')
            .insert({ name, contact_person, contact_number, email, address })
            .select('*')
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Supplier created successfully', data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create supplier', error: err.message });
    }
});

// GET /suppliers/:id
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) return res.status(404).json({ message: 'Supplier not found' });
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /suppliers/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, contact_person, contact_number, email, address } = req.body;

        if (!name) {
            return res.status(422).json({ message: 'Supplier name is required' });
        }

        const { data, error } = await supabase
            .from('suppliers')
            .update({ name, contact_person, contact_number, email, address })
            .eq('id', req.params.id)
            .select('*')
            .single();

        if (error) throw error;
        res.json({ message: 'Supplier updated successfully', data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update supplier', error: err.message });
    }
});

// DELETE /suppliers/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete supplier', error: err.message });
    }
});

module.exports = router;
