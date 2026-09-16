const express = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');
const logAudit = require('../lib/audit');
const { requirePermission, fetchUserPermissions } = require('../middleware/permission');

const router = express.Router();

// Helper to fetch user with attached roles and permissions
const formatUserWithRoles = async (users) => {
    if (!users || users.length === 0) return [];

    const userIds = users.map(u => u.id);

    // Fetch user_roles
    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role_id, role:roles(*)')
        .in('user_id', userIds);

    const userRolesMap = {};
    (userRoles || []).forEach(ur => {
        if (!userRolesMap[ur.user_id]) userRolesMap[ur.user_id] = [];
        if (ur.role) userRolesMap[ur.user_id].push(ur.role);
    });

    return Promise.all(users.map(async (u) => {
        const assignedRoles = userRolesMap[u.id] || [];
        const perms = await fetchUserPermissions(u.id, u.role);

        return {
            ...u,
            status: u.status || 'active',
            roles: assignedRoles,
            role_names: assignedRoles.map(r => r.name),
            role_ids: assignedRoles.map(r => r.id),
            permissions: perms,
        };
    }));
};

// GET /api/v1/users - List users with search and filtering
router.get('/', requirePermission('users.view'), async (req, res) => {
    try {
        const { search, status, role } = req.query;

        let query = supabase
            .from('users')
            .select('id, name, username, email, contact_number, avatar, role, status, last_login_at, created_at, updated_at, created_by')
            .order('name', { ascending: true });

        if (status) {
            query = query.eq('status', status);
        }
        if (role) {
            query = query.eq('role', role);
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%,contact_number.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const formatted = await formatUserWithRoles(data);
        res.json({ data: formatted });
    } catch (err) {
        console.error('Fetch users error:', err);
        res.status(500).json({ message: 'Failed to fetch users', error: err.message });
    }
});

// GET /api/v1/users/:id - Get single user
router.get('/:id', requirePermission('users.view'), async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, username, email, contact_number, avatar, role, status, last_login_at, created_at, updated_at, created_by')
            .eq('id', req.params.id)
            .single();

        if (error || !user) return res.status(404).json({ message: 'User not found' });

        const [formatted] = await formatUserWithRoles([user]);
        res.json({ data: formatted });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user', error: err.message });
    }
});

// POST /api/v1/users - Create new user
router.post('/', requirePermission('users.create'), async (req, res) => {
    try {
        const { name, username, email, contact_number, password, role, role_ids, status } = req.body;

        if (!name || !email || !password) {
            return res.status(422).json({ message: 'Name, email, and password are required.' });
        }

        const primaryRole = role || 'service_advisor';
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                name,
                username: username ? username.trim() : null,
                email: email.toLowerCase().trim(),
                contact_number: contact_number || null,
                password: hashedPassword,
                role: primaryRole,
                status: status || 'active',
                created_by: req.user?.id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select('id, name, username, email, contact_number, avatar, role, status, created_at')
            .single();

        if (insertError) {
            if (insertError.code === '23505') {
                return res.status(400).json({ message: 'Email or username already exists' });
            }
            throw insertError;
        }

        // Attach roles in user_roles junction table
        let targetRoleIds = Array.isArray(role_ids) && role_ids.length > 0 ? role_ids : [];

        // If no explicit role_ids, find the role ID by primaryRole slug
        if (targetRoleIds.length === 0 && primaryRole) {
            const { data: matchedRole } = await supabase
                .from('roles')
                .select('id')
                .eq('slug', primaryRole)
                .single();
            if (matchedRole) targetRoleIds.push(matchedRole.id);
        }

        if (targetRoleIds.length > 0) {
            const userRolesEntries = targetRoleIds.map(rid => ({
                user_id: newUser.id,
                role_id: rid
            }));
            await supabase.from('user_roles').insert(userRolesEntries);
        }

        await logAudit(req, {
            action: 'create',
            module: 'users',
            record_id: newUser.id,
            description: `Created user "${newUser.name}" (${newUser.email}) with role: ${primaryRole}`
        });

        const [formatted] = await formatUserWithRoles([newUser]);
        res.status(201).json({ data: formatted });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ message: 'Failed to create user', error: err.message });
    }
});

// PATCH /api/v1/users/:id - Update user details
router.patch('/:id', requirePermission('users.edit'), async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, username, email, contact_number, password, role, role_ids, status } = req.body;

        const { data: currentUser, error: fetchErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchErr || !currentUser) return res.status(404).json({ message: 'User not found' });

        // Guard: Prevent deactivating the last active super admin
        if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
            if (status === 'inactive') {
                const { count } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .in('role', ['admin', 'super_admin'])
                    .eq('status', 'active');
                if (count <= 1) {
                    return res.status(400).json({ message: 'Cannot deactivate the only active Super Administrator.' });
                }
            }
        }

        const updates = { updated_at: new Date().toISOString() };
        if (name) updates.name = name;
        if (username !== undefined) updates.username = username ? username.trim() : null;
        if (email) updates.email = email.toLowerCase().trim();
        if (contact_number !== undefined) updates.contact_number = contact_number;
        if (role) updates.role = role;
        if (status) updates.status = status;
        if (password) updates.password = await bcrypt.hash(password, 10);

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select('id, name, username, email, contact_number, avatar, role, status, last_login_at, created_at, updated_at')
            .single();

        if (updateError) throw updateError;

        // Sync user roles if provided
        if (Array.isArray(role_ids)) {
            await supabase.from('user_roles').delete().eq('user_id', userId);
            if (role_ids.length > 0) {
                const entries = role_ids.map(rid => ({ user_id: userId, role_id: rid }));
                await supabase.from('user_roles').insert(entries);
            }
        }

        await logAudit(req, {
            action: 'update',
            module: 'users',
            record_id: userId,
            description: `Updated user profile "${updatedUser.name}"`
        });

        const [formatted] = await formatUserWithRoles([updatedUser]);
        res.json({ data: formatted });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ message: 'Failed to update user', error: err.message });
    }
});

// POST /api/v1/users/:id/reset-password - Reset password
router.post('/:id/reset-password', requirePermission('users.reset_password'), async (req, res) => {
    try {
        const userId = req.params.id;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(422).json({ message: 'Password must be at least 6 characters long.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: user, error } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('id, name, email')
            .single();

        if (error || !user) return res.status(404).json({ message: 'User not found' });

        await logAudit(req, {
            action: 'reset_password',
            module: 'users',
            record_id: userId,
            description: `Password reset for user "${user.name}" (${user.email})`
        });

        res.json({ message: 'Password reset successfully.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Failed to reset password', error: err.message });
    }
});

// PATCH /api/v1/users/:id/status - Toggle active/inactive
router.patch('/:id/status', requirePermission('users.status'), async (req, res) => {
    try {
        const userId = req.params.id;
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(422).json({ message: "Status must be 'active' or 'inactive'." });
        }

        // Prevent deactivating self
        if (userId == req.user?.id && status === 'inactive') {
            return res.status(400).json({ message: 'You cannot deactivate your own account.' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select('id, name, email, status')
            .single();

        if (error || !user) return res.status(404).json({ message: 'User not found' });

        await logAudit(req, {
            action: status === 'active' ? 'activate_user' : 'deactivate_user',
            module: 'users',
            record_id: userId,
            description: `Set status of user "${user.name}" to ${status.toUpperCase()}`
        });

        res.json({ data: user });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update user status', error: err.message });
    }
});

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', requirePermission('users.delete'), async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent deleting self
        if (userId == req.user?.id) {
            return res.status(400).json({ message: 'Cannot delete your own account.' });
        }

        const { data: user, error: fetchErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchErr || !user) return res.status(404).json({ message: 'User not found' });

        // Guard: Prevent deleting the last Super Admin
        if (user.role === 'admin' || user.role === 'super_admin') {
            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .in('role', ['admin', 'super_admin']);
            if (count <= 1) {
                return res.status(400).json({ message: 'Cannot delete the only Super Administrator account.' });
            }
        }

        await supabase.from('user_roles').delete().eq('user_id', userId);
        const { error: deleteError } = await supabase.from('users').delete().eq('id', userId);

        if (deleteError) throw deleteError;

        await logAudit(req, {
            action: 'delete',
            module: 'users',
            record_id: userId,
            description: `Deleted user "${user.name}" (${user.email})`
        });

        res.status(204).send();
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ message: 'Failed to delete user', error: err.message });
    }
});

module.exports = router;
