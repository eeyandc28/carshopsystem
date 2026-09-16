const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const logAudit = require('../lib/audit');
const { fetchUserPermissions } = require('../middleware/permission');

const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(422).json({ message: 'Email and password are required' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email.toLowerCase().trim())
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (user.status === 'inactive') {
            return res.status(403).json({
                message: 'Your account has been deactivated. Please contact the system administrator.'
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login timestamp
        const now = new Date().toISOString();
        await supabase
            .from('users')
            .update({ last_login_at: now })
            .eq('id', user.id);

        // Fetch user roles and permissions
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role:roles(*)')
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

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: primaryRole || 'user',
                roles: roles.map(r => r.slug),
                permissions
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = user;
        userWithoutPassword.role = primaryRole || 'user';
        userWithoutPassword.last_login_at = now;
        userWithoutPassword.roles = roles;
        userWithoutPassword.role_names = roles.map(r => r.name);
        userWithoutPassword.permissions = permissions;

        const reqWithUser = { ...req, user: { id: user.id, name: user.name, email: user.email } };
        await logAudit(reqWithUser, {
            action: 'login',
            module: 'auth',
            record_id: user.id,
            description: `User "${user.name}" logged into the system`
        });

        res.json({
            access_token: token,
            token_type: 'Bearer',
            user: userWithoutPassword
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /auth/logout
router.post('/logout', auth, async (req, res) => {
    try {
        await logAudit(req, {
            action: 'logout',
            module: 'auth',
            record_id: req.user?.id,
            description: `User "${req.user?.name || req.user?.email}" logged out`
        });
    } catch (e) {
        // ignore
    }
    res.json({ message: 'Logged out successfully' });
});

// GET /user
router.get('/user', auth, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, username, email, contact_number, avatar, role, status, last_login_at, created_at, updated_at')
            .eq('id', req.user.id)
            .single();

        if (error || !user) return res.status(404).json({ message: 'User not found' });

        if (user.status === 'inactive') {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Fetch assigned roles and permissions
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role:roles(*)')
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
            ...user,
            role: primaryRole || 'user',
            roles,
            role_names: roles.map(r => r.name),
            permissions
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
