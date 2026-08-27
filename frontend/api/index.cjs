const express = require('express');
const cors = require('cors');

const auth = require('../server/middleware/auth');
const authRoutes = require('../server/routes/auth');
const customerRoutes = require('../server/routes/customers');
const vehicleRoutes = require('../server/routes/vehicles');
const inventoryRoutes = require('../server/routes/inventory');
const jobOrderRoutes = require('../server/routes/jobOrders');
const reportRoutes = require('../server/routes/reports');
const userRoutes = require('../server/routes/users');

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health check
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/v1/auth', authRoutes);

// Protected routes
app.use('/api/v1/customers', auth, customerRoutes);
app.use('/api/v1/vehicles', auth, vehicleRoutes);
app.use('/api/v1/inventory', auth, inventoryRoutes);
app.use('/api/v1/job-orders', auth, jobOrderRoutes);
app.use('/api/v1/reports', auth, reportRoutes);
app.use('/api/v1/users', auth, userRoutes);

// GET /api/v1/user
app.get('/api/v1/user', auth, async (req, res) => {
    const supabase = require('../server/lib/supabase');
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, created_at')
            .eq('id', req.user.id)
            .single();
        if (error) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
