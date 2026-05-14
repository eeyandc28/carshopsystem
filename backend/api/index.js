require('dotenv').config();
const express = require('express');
const cors = require('cors');

const auth = require('../src/middleware/auth');
const authRoutes = require('../src/routes/auth');
const customerRoutes = require('../src/routes/customers');
const vehicleRoutes = require('../src/routes/vehicles');
const inventoryRoutes = require('../src/routes/inventory');
const jobOrderRoutes = require('../src/routes/jobOrders');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
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

// Also mount /user under auth middleware
app.get('/api/v1/user', auth, async (req, res) => {
    const supabase = require('../src/lib/supabase');
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

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8001;
    app.listen(PORT, () => {
        console.log(`🚀 Backend API running at http://localhost:${PORT}/api/v1`);
    });
}

// Export for Vercel serverless
module.exports = app;
