const express = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// GET /users
router.get('/', isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, role, created_at')
            .order('name', { ascending: true });

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users', error: err.message });
    }
});

// POST /users
router.post('/', isAdmin, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(422).json({ message: 'Missing required fields' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('users')
            .insert({
                name,
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role
            })
            .select('id, name, email, role, created_at')
            .single();

        if (error) {
            if (error.code === '23505') return res.status(400).json({ message: 'Email already exists' });
            throw error;
        }

        res.status(201).json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create user', error: err.message });
    }
});

// PATCH /users/:id
router.patch('/:id', isAdmin, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const updates = {};
        
        if (name) updates.name = name;
        if (email) updates.email = email.toLowerCase().trim();
        if (role) updates.role = role;
        if (password) updates.password = await bcrypt.hash(password, 10);
        
        updates.updated_at = new Date();

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', req.params.id)
            .select('id, name, email, role, created_at')
            .single();

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update user', error: err.message });
    }
});

// DELETE /users/:id
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        // Prevent deleting self
        if (req.params.id == req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete user', error: err.message });
    }
});

module.exports = router;
