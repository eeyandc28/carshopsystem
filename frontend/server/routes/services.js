const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// GET /services
router.get('/', async (req, res) => {
    try {
        let query = supabase
            .from('services')
            .select('*')
            .is('deleted_at', null)
            .order('name', { ascending: true });

        if (req.query.active_only === 'true') {
            query = query.eq('is_active', true);
        }

        if (req.query.type) {
            query = query.eq('type', req.query.type);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ data: data || [] });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch services', error: err.message });
    }
});

// POST /services
router.post('/', async (req, res) => {
    try {
        const { name, code, type, keyword, price, description, inclusions, is_active } = req.body;

        if (!name || !name.trim()) {
            return res.status(422).json({ message: 'Service name is required' });
        }

        const { data, error } = await supabase
            .from('services')
            .insert({
                name: name.trim(),
                code: code ? code.trim() : null,
                type: type ? type.trim() : null,
                keyword: keyword ? keyword.trim() : null,
                description: description ? description.trim() : null,
                inclusions: Array.isArray(inclusions) ? inclusions : [],
                price: parseFloat(price) || 0.00,
                is_active: is_active !== undefined ? Boolean(is_active) : true
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create service', error: err.message });
    }
});

// PUT /services/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, code, type, keyword, price, description, inclusions, is_active } = req.body;
        const updates = { updated_at: new Date() };

        if (name !== undefined) updates.name = name.trim();
        if (code !== undefined) updates.code = code ? code.trim() : null;
        if (type !== undefined) updates.type = type ? type.trim() : null;
        if (keyword !== undefined) updates.keyword = keyword ? keyword.trim() : null;
        if (description !== undefined) updates.description = description ? description.trim() : null;
        if (inclusions !== undefined) updates.inclusions = Array.isArray(inclusions) ? inclusions : [];
        if (price !== undefined) updates.price = parseFloat(price) || 0.00;
        if (is_active !== undefined) updates.is_active = Boolean(is_active);

        const { data, error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update service', error: err.message });
    }
});

// DELETE /services/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('services')
            .update({ deleted_at: new Date() })
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete service', error: err.message });
    }
});

module.exports = router;
