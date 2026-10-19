const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

const INCLUSIONS_TAG_REGEX = /\n?<!--INCLUSIONS:(.*?)-->/s;

function packInclusionsIntoDescription(description, inclusions) {
    const cleanDesc = (description || '').replace(INCLUSIONS_TAG_REGEX, '').trim();
    if (Array.isArray(inclusions) && inclusions.length > 0) {
        return cleanDesc ? `${cleanDesc}\n<!--INCLUSIONS:${JSON.stringify(inclusions)}-->` : `<!--INCLUSIONS:${JSON.stringify(inclusions)}-->`;
    }
    return cleanDesc || null;
}

function unpackServiceInclusions(service) {
    if (!service) return service;
    let inclusions = service.inclusions;
    let description = service.description || '';

    if (inclusions && typeof inclusions === 'string') {
        try {
            inclusions = JSON.parse(inclusions);
        } catch {
            inclusions = [];
        }
    }

    if (!Array.isArray(inclusions) || inclusions.length === 0) {
        const match = description.match(INCLUSIONS_TAG_REGEX);
        if (match && match[1]) {
            try {
                inclusions = JSON.parse(match[1]);
            } catch {
                inclusions = [];
            }
        }
    }

    description = description.replace(INCLUSIONS_TAG_REGEX, '').trim();

    return {
        ...service,
        description,
        inclusions: Array.isArray(inclusions) ? inclusions : []
    };
}

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

        const formatted = (data || []).map(unpackServiceInclusions);

        res.json({ data: formatted });
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

        const cleanInclusions = Array.isArray(inclusions) ? inclusions : [];

        const basePayload = {
            name: name.trim(),
            code: code ? code.trim() : null,
            type: type ? type.trim() : null,
            keyword: keyword ? keyword.trim() : null,
            description: packInclusionsIntoDescription(description, cleanInclusions),
            price: parseFloat(price) || 0.00,
            is_active: is_active !== undefined ? Boolean(is_active) : true
        };

        // Try inserting with native inclusions column first
        let result = await supabase
            .from('services')
            .insert({
                ...basePayload,
                inclusions: cleanInclusions
            })
            .select()
            .single();

        // If the 'inclusions' column is not yet present in the Supabase schema cache, retry without it (inclusions are preserved in description metadata)
        if (result.error && (result.error.code === 'PGRST204' || result.error.code === '42703' || result.error.message?.includes('inclusions'))) {
            result = await supabase
                .from('services')
                .insert(basePayload)
                .select()
                .single();
        }

        if (result.error) throw result.error;

        res.status(201).json({ data: unpackServiceInclusions(result.data) });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create service', error: err.message });
    }
});

// PUT /services/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, code, type, keyword, price, description, inclusions, is_active } = req.body;
        const updates = { updated_at: new Date() };

        const cleanInclusions = inclusions !== undefined && Array.isArray(inclusions) ? inclusions : [];

        if (name !== undefined) updates.name = name.trim();
        if (code !== undefined) updates.code = code ? code.trim() : null;
        if (type !== undefined) updates.type = type ? type.trim() : null;
        if (keyword !== undefined) updates.keyword = keyword ? keyword.trim() : null;
        if (description !== undefined || inclusions !== undefined) {
            updates.description = packInclusionsIntoDescription(description, cleanInclusions);
        }
        if (price !== undefined) updates.price = parseFloat(price) || 0.00;
        if (is_active !== undefined) updates.is_active = Boolean(is_active);

        let result = await supabase
            .from('services')
            .update({
                ...updates,
                ...(inclusions !== undefined ? { inclusions: cleanInclusions } : {})
            })
            .eq('id', req.params.id)
            .select()
            .single();

        // If 'inclusions' column is not yet present in Supabase schema cache, retry update without it
        if (result.error && (result.error.code === 'PGRST204' || result.error.code === '42703' || result.error.message?.includes('inclusions'))) {
            result = await supabase
                .from('services')
                .update(updates)
                .eq('id', req.params.id)
                .select()
                .single();
        }

        if (result.error) throw result.error;

        res.json({ data: unpackServiceInclusions(result.data) });
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
