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
const supplierRoutes = require('../server/routes/suppliers');
const deliveryRoutes = require('../server/routes/deliveries');
const paymentRoutes = require('../server/routes/payments');
const roleRoutes = require('../server/routes/roles');
const permissionRoutes = require('../server/routes/permissions');
const auditLogRoutes = require('../server/routes/auditLogs');
const inventoryTypeRoutes = require('../server/routes/inventoryTypes');
const serviceRoutes = require('../server/routes/services');

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
app.use('/api/v1/inventory-types', auth, inventoryTypeRoutes);
app.use('/api/v1/services', auth, serviceRoutes);
app.use('/api/v1/job-orders', auth, jobOrderRoutes);
app.use('/api/v1/reports', auth, reportRoutes);
app.use('/api/v1/users', auth, userRoutes);
app.use('/api/v1/suppliers', auth, supplierRoutes);
app.use('/api/v1/deliveries', auth, deliveryRoutes);
app.use('/api/v1/payments', auth, paymentRoutes);
app.use('/api/v1/roles', auth, roleRoutes);
app.use('/api/v1/permissions', auth, permissionRoutes);
app.use('/api/v1/audit-logs', auth, auditLogRoutes);

// GET /api/v1/user
app.get('/api/v1/user', auth, async (req, res) => {
    const supabase = require('../server/lib/supabase');
    const { fetchUserPermissions } = require('../server/middleware/permission');
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();
        if (error || !user) return res.status(404).json({ message: 'User not found' });

        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role_id, role:roles(id, name, slug, status)')
            .eq('user_id', user.id);

        const roles = (userRoles || []).map(ur => ur.role).filter(Boolean);
        
        let primaryRole = user.role;
        if (!primaryRole && roles.length > 0) {
            primaryRole = roles[0].slug;
        }
        if (!primaryRole && user.email) {
            const prefix = user.email.split('@')[0].toLowerCase();
            if (['cashier', 'admin', 'mechanic', 'service_advisor', 'inventory_staff'].includes(prefix)) {
                primaryRole = prefix;
            }
        }

        const permissions = await fetchUserPermissions(user.id, primaryRole);

        res.json({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            contact_number: user.contact_number,
            avatar: user.avatar,
            role: primaryRole || 'user',
            status: user.status || 'active',
            roles: roles,
            role_names: roles.map(r => r.name),
            permissions: permissions,
            last_login_at: user.last_login_at,
            created_at: user.created_at
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
