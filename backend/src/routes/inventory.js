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

        res.status(201).json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create inventory item', error: err.message });
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
        const updates = {};
        const fields = ['name', 'part_number', 'brand', 'supplier_id', 'stock_quantity', 'reorder_level', 'unit_price'];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.stock_quantity) updates.stock_quantity = parseInt(updates.stock_quantity);
        if (updates.reorder_level) updates.reorder_level = parseInt(updates.reorder_level);
        if (updates.unit_price) updates.unit_price = parseFloat(updates.unit_price);
        updates.updated_at = new Date();

        const { data, error } = await supabase
            .from('inventories')
            .update(updates)
            .eq('id', req.params.id)
            .select('*, supplier:suppliers(*)')
            .single();

        if (error) throw error;

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
