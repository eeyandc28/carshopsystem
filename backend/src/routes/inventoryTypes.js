const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// GET /inventory-types
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventory_types')
            .select('*')
            .is('deleted_at', null)
            .order('name', { ascending: true });

        if (error) throw error;

        res.json({ data: data || [] });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch inventory types', error: err.message });
    }
});

// POST /inventory-types
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(422).json({ message: 'Type name is required' });
        }

        const { data, error } = await supabase
            .from('inventory_types')
            .insert({
                name: name.trim(),
                description: description ? description.trim() : null
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create inventory type', error: err.message });
    }
});

// PUT /inventory-types/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const updates = { updated_at: new Date() };

        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = description ? description.trim() : null;

        const { data, error } = await supabase
            .from('inventory_types')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update inventory type', error: err.message });
    }
});

// DELETE /inventory-types/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('inventory_types')
            .update({ deleted_at: new Date() })
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete inventory type', error: err.message });
    }
});

module.exports = router;
