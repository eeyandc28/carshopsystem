const express = require('express');
const supabase = require('../lib/supabase');
const logAudit = require('../lib/audit');
const { requirePermission } = require('../middleware/permission');

const router = express.Router();

// GET /api/v1/roles - List all roles with user counts and permission details
router.get('/', requirePermission('roles.view'), async (req, res) => {
    try {
        const { data: roles, error: rolesError } = await supabase
            .from('roles')
            .select('*')
            .order('id', { ascending: true });

        if (rolesError) throw rolesError;

        // Fetch user counts per role
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role_id');

        const userCounts = (userRoles || []).reduce((acc, ur) => {
            acc[ur.role_id] = (acc[ur.role_id] || 0) + 1;
            return acc;
        }, {});

        // Fetch role permissions
        const { data: rolePerms } = await supabase
            .from('role_permissions')
            .select('role_id, permission_id, permission:permissions(id, name, slug, module)');

        const permissionsByRole = (rolePerms || []).reduce((acc, rp) => {
            if (!acc[rp.role_id]) acc[rp.role_id] = [];
            if (rp.permission) acc[rp.role_id].push(rp.permission);
            return acc;
        }, {});

        const formattedRoles = (roles || []).map(r => ({
            ...r,
            users_count: userCounts[r.id] || 0,
            permissions: permissionsByRole[r.id] || [],
            permission_ids: (permissionsByRole[r.id] || []).map(p => p.id),
            permission_slugs: (permissionsByRole[r.id] || []).map(p => p.slug)
        }));

        res.json({ data: formattedRoles });
    } catch (err) {
        console.error('Fetch roles error:', err);
        res.status(500).json({ message: 'Failed to fetch roles', error: err.message });
    }
});

// GET /api/v1/roles/:id - Get single role with full permissions list
router.get('/:id', requirePermission('roles.view'), async (req, res) => {
    try {
        const { data: role, error } = await supabase
            .from('roles')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !role) return res.status(404).json({ message: 'Role not found' });

        const { data: rolePerms } = await supabase
            .from('role_permissions')
            .select('permission_id, permission:permissions(id, name, slug, module)')
            .eq('role_id', role.id);

        const permissions = (rolePerms || []).map(rp => rp.permission).filter(Boolean);

        res.json({
            data: {
                ...role,
                permissions,
                permission_ids: permissions.map(p => p.id),
                permission_slugs: permissions.map(p => p.slug)
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch role', error: err.message });
    }
});

// POST /api/v1/roles - Create new role
router.post('/', requirePermission('roles.create'), async (req, res) => {
    try {
        const { name, slug, description, status, permission_ids } = req.body;

        if (!name) {
            return res.status(422).json({ message: 'Role name is required' });
        }

        const generatedSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')).trim();

        // Check if slug exists
        const { data: existing } = await supabase
            .from('roles')
            .select('id')
            .eq('slug', generatedSlug)
            .single();

        if (existing) {
            return res.status(400).json({ message: `Role with slug '${generatedSlug}' already exists.` });
        }

        // Insert role
        const { data: role, error: insertError } = await supabase
            .from('roles')
            .insert({
                name,
                slug: generatedSlug,
                description: description || null,
                is_system: false,
                status: status || 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Insert permissions if provided
        if (Array.isArray(permission_ids) && permission_ids.length > 0) {
            const rolePerms = permission_ids.map(pid => ({
                role_id: role.id,
                permission_id: pid
            }));
            await supabase.from('role_permissions').insert(rolePerms);
        }

        await logAudit(req, {
            action: 'create',
            module: 'roles',
            record_id: role.id,
            description: `Created role "${role.name}" (${role.slug}) with ${permission_ids?.length || 0} permissions`
        });

        res.status(201).json({ data: role });
    } catch (err) {
        console.error('Create role error:', err);
        res.status(500).json({ message: 'Failed to create role', error: err.message });
    }
});

// PUT /api/v1/roles/:id - Update role and its permissions
router.put('/:id', requirePermission('roles.edit'), async (req, res) => {
    try {
        const roleId = req.params.id;
        const { name, description, status, permission_ids } = req.body;

        const { data: currentRole, error: fetchErr } = await supabase
            .from('roles')
            .select('*')
            .eq('id', roleId)
            .single();

        if (fetchErr || !currentRole) return res.status(404).json({ message: 'Role not found' });

        const updates = { updated_at: new Date().toISOString() };
        if (name) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (status) updates.status = status;

        // Super Administrator / System role protection
        if (currentRole.is_system && currentRole.slug === 'super_admin' && status === 'inactive') {
            return res.status(400).json({ message: 'Super Administrator role cannot be deactivated.' });
        }

        const { data: updatedRole, error: updateError } = await supabase
            .from('roles')
            .update(updates)
            .eq('id', roleId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Sync permissions if provided (and user has assign permission)
        if (Array.isArray(permission_ids)) {
            // Delete existing role permissions
            await supabase
                .from('role_permissions')
                .delete()
                .eq('role_id', roleId);

            if (permission_ids.length > 0) {
                const newPerms = permission_ids.map(pid => ({
                    role_id: roleId,
                    permission_id: pid
                }));
                await supabase.from('role_permissions').insert(newPerms);
            }
        }

        await logAudit(req, {
            action: 'update',
            module: 'roles',
            record_id: roleId,
            description: `Updated role "${updatedRole.name}" (Assigned ${permission_ids?.length || 0} permissions)`
        });

        res.json({ data: updatedRole });
    } catch (err) {
        console.error('Update role error:', err);
        res.status(500).json({ message: 'Failed to update role', error: err.message });
    }
});

// DELETE /api/v1/roles/:id - Delete custom role
router.delete('/:id', requirePermission('roles.delete'), async (req, res) => {
    try {
        const roleId = req.params.id;

        const { data: role, error: fetchErr } = await supabase
            .from('roles')
            .select('*')
            .eq('id', roleId)
            .single();

        if (fetchErr || !role) return res.status(404).json({ message: 'Role not found' });

        if (role.is_system) {
            return res.status(400).json({ message: 'System default roles cannot be deleted.' });
        }

        // Check if any users are assigned this role
        const { count, error: countError } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', roleId);

        if (count && count > 0) {
            return res.status(400).json({
                message: `Cannot delete role '${role.name}'. It is currently assigned to ${count} user(s). Reassign them first.`
            });
        }

        // Delete role permissions and role
        await supabase.from('role_permissions').delete().eq('role_id', roleId);
        const { error: deleteError } = await supabase.from('roles').delete().eq('id', roleId);

        if (deleteError) throw deleteError;

        await logAudit(req, {
            action: 'delete',
            module: 'roles',
            record_id: roleId,
            description: `Deleted role "${role.name}" (${role.slug})`
        });

        res.status(204).send();
    } catch (err) {
        console.error('Delete role error:', err);
        res.status(500).json({ message: 'Failed to delete role', error: err.message });
    }
});

module.exports = router;
