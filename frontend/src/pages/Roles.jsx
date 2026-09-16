import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import usePermission from '../hooks/usePermission';
import { 
    ShieldCheckIcon, 
    PlusIcon, 
    PencilSquareIcon, 
    TrashIcon, 
    XMarkIcon,
    MagnifyingGlassIcon,
    CheckIcon,
    UsersIcon,
    KeyIcon,
    CheckCircleIcon,
    LockClosedIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

const MODULE_ORDER = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'users', label: 'Users Management', icon: '👤' },
    { key: 'roles', label: 'Roles & Permissions', icon: '🛡️' },
    { key: 'customers', label: 'Customers', icon: '👥' },
    { key: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { key: 'appointments', label: 'Appointments', icon: '📅' },
    { key: 'job_orders', label: 'Job Orders & Repairs', icon: '🔧' },
    { key: 'quotations', label: 'Quotations', icon: '📝' },
    { key: 'inventory', label: 'Parts & Inventory', icon: '📦' },
    { key: 'suppliers', label: 'Suppliers', icon: '🏭' },
    { key: 'invoices', label: 'Invoices & Billing', icon: '🧾' },
    { key: 'payments', label: 'Payments & Cashier', icon: '💳' },
    { key: 'expenses', label: 'Expenses', icon: '💰' },
    { key: 'reports', label: 'Reports & Analytics', icon: '📈' },
    { key: 'settings', label: 'System Settings', icon: '⚙️' },
    { key: 'audit_logs', label: 'Audit Trail', icon: '📜' }
];

const Roles = () => {
    const { isSuperAdmin } = usePermission();
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit' | 'create'
    const [activeRole, setActiveRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        status: 'active',
        permission_ids: []
    });
    const [permissionSearch, setPermissionSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [openModules, setOpenModules] = useState({});
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await api.get('/roles');
            setRoles(res.data.data || []);
        } catch (err) {
            console.error('Failed to load roles:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const res = await api.get('/permissions');
            setAllPermissions(res.data.data || []);
        } catch (err) {
            console.error('Failed to load permissions:', err);
        }
    };

    const openCreateModal = () => {
        setActiveRole(null);
        setModalMode('create');
        setFormData({
            name: '',
            slug: '',
            description: '',
            status: 'active',
            permission_ids: []
        });
        setPermissionSearch('');
        const initialOpen = {};
        MODULE_ORDER.forEach(m => { initialOpen[m.key] = true; });
        setOpenModules(initialOpen);
        setShowModal(true);
    };

    const openEditModal = (role) => {
        setActiveRole(role);
        setModalMode('edit');
        setFormData({
            name: role.name,
            slug: role.slug,
            description: role.description || '',
            status: role.status || 'active',
            permission_ids: role.permission_ids || []
        });
        setPermissionSearch('');
        const initialOpen = {};
        MODULE_ORDER.forEach(m => { initialOpen[m.key] = true; });
        setOpenModules(initialOpen);
        setShowModal(true);
    };

    const openViewModal = (role) => {
        setActiveRole(role);
        setModalMode('view');
        setFormData({
            name: role.name,
            slug: role.slug,
            description: role.description || '',
            status: role.status || 'active',
            permission_ids: role.permission_ids || []
        });
        setPermissionSearch('');
        const initialOpen = {};
        MODULE_ORDER.forEach(m => { initialOpen[m.key] = true; });
        setOpenModules(initialOpen);
        setShowModal(true);
    };

    const toggleModuleAccordion = (modKey) => {
        setOpenModules(prev => ({ ...prev, [modKey]: !prev[modKey] }));
    };

    // Group permissions by module
    const groupedPermissions = useMemo(() => {
        const groups = {};
        allPermissions.forEach(perm => {
            const mod = perm.module || 'other';
            if (!groups[mod]) groups[mod] = [];
            groups[mod].push(perm);
        });
        return groups;
    }, [allPermissions]);

    const togglePermission = (id) => {
        if (modalMode === 'view' || !isSuperAdmin) return;
        if (activeRole?.is_system && (activeRole?.slug === 'super_admin' || activeRole?.slug === 'admin')) return;

        setFormData(prev => {
            const exists = prev.permission_ids.includes(id);
            return {
                ...prev,
                permission_ids: exists
                    ? prev.permission_ids.filter(pId => pId !== id)
                    : [...prev.permission_ids, id]
            };
        });
    };

    const toggleModuleAll = (modKey) => {
        if (modalMode === 'view' || !isSuperAdmin) return;
        if (activeRole?.is_system && (activeRole?.slug === 'super_admin' || activeRole?.slug === 'admin')) return;

        const modPerms = groupedPermissions[modKey] || [];
        const modPermIds = modPerms.map(p => p.id);
        const allSelected = modPermIds.every(id => formData.permission_ids.includes(id));

        setFormData(prev => ({
            ...prev,
            permission_ids: allSelected
                ? prev.permission_ids.filter(id => !modPermIds.includes(id))
                : Array.from(new Set([...prev.permission_ids, ...modPermIds]))
        }));
    };

    const selectAllPermissions = () => {
        if (modalMode === 'view' || !isSuperAdmin) return;
        if (activeRole?.is_system && (activeRole?.slug === 'super_admin' || activeRole?.slug === 'admin')) return;

        setFormData(prev => ({
            ...prev,
            permission_ids: allPermissions.map(p => p.id)
        }));
    };

    const deselectAllPermissions = () => {
        if (modalMode === 'view' || !isSuperAdmin) return;
        if (activeRole?.is_system && (activeRole?.slug === 'super_admin' || activeRole?.slug === 'admin')) return;

        setFormData(prev => ({
            ...prev,
            permission_ids: []
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isSuperAdmin) {
            alert('Only Super Administrators and Administrators can modify roles.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                name: formData.name,
                description: formData.description,
                status: formData.status,
                permission_ids: formData.permission_ids
            };

            if (modalMode === 'edit' && activeRole) {
                await api.put(`/roles/${activeRole.id}`, payload);
                showToast(`Role "${formData.name}" updated successfully!`);
            } else if (modalMode === 'create') {
                await api.post('/roles', {
                    ...payload,
                    slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
                });
                showToast(`Role "${formData.name}" created successfully!`);
            }

            setShowModal(false);
            fetchRoles();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save role');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (role) => {
        if (!isSuperAdmin) {
            alert('Only Super Administrators and Administrators can delete roles.');
            return;
        }
        if (role.is_system) {
            alert('System roles cannot be deleted.');
            return;
        }
        if (role.users_count > 0) {
            alert(`Cannot delete role "${role.name}" because it is assigned to ${role.users_count} user(s). Reassign them first.`);
            return;
        }
        if (!window.confirm(`Are you sure you want to permanently delete the role "${role.name}"?`)) return;

        try {
            await api.delete(`/roles/${role.id}`);
            showToast(`Role "${role.name}" deleted.`);
            fetchRoles();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete role');
        }
    };

    const filteredRoles = roles.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isEditMode = modalMode === 'edit' || modalMode === 'create';
    const isSuperRole = activeRole?.slug === 'super_admin' || activeRole?.slug === 'admin';

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-emerald-500/20 animate-in slide-in-from-top-3">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                        <ShieldCheckIcon className="h-7 w-7 text-blue-500" />
                        Roles & Permissions Management
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {isSuperAdmin 
                            ? 'Manage system roles, configure granular permissions, and assign access levels.' 
                            : 'View defined system roles and assigned module permissions.'}
                    </p>
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold text-sm shadow-lg shadow-blue-500/20"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create New Role
                    </button>
                )}
            </div>

            {/* Search Filter Toolbar */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 shadow-xl">
                <div className="relative flex-1 max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search roles by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="text-xs text-slate-400 font-medium">
                    Showing <span className="text-white font-bold">{filteredRoles.length}</span> of {roles.length} roles
                </div>
            </div>

            {/* Roles Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Role Name</th>
                                <th className="px-6 py-4 font-semibold">Description</th>
                                <th className="px-6 py-4 font-semibold text-center">Assigned Users</th>
                                <th className="px-6 py-4 font-semibold text-center">Permissions</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredRoles.length > 0 ? (
                                filteredRoles.map((role) => {
                                    const isSuper = role.slug === 'super_admin' || role.slug === 'admin';
                                    return (
                                        <tr 
                                            key={role.id} 
                                            className="hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                                        isSuper 
                                                            ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' 
                                                            : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                                    }`}>
                                                        <ShieldCheckIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-white">{role.name}</p>
                                                            {role.is_system && (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                                                                    System
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-mono text-slate-500">{role.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-slate-400 max-w-sm line-clamp-2">
                                                    {role.description || '—'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                                    <UsersIcon className="h-3.5 w-3.5 text-slate-400" />
                                                    {role.users_count || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    <KeyIcon className="h-3.5 w-3.5" />
                                                    {isSuper ? 'All (Full Access)' : `${role.permission_ids?.length || 0} actions`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    role.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
                                                    {role.status || 'active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-1.5">
                                                    {/* Edit Action - Only for Super Administrator & Administrator */}
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => openEditModal(role)}
                                                            title="Edit Role & Permissions"
                                                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    {/* View Action - For all users */}
                                                    <button
                                                        onClick={() => openViewModal(role)}
                                                        title="View Permissions"
                                                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>

                                                    {/* Delete Action - Only for Super Administrator & Administrator on custom roles */}
                                                    {isSuperAdmin && !role.is_system && (
                                                        <button
                                                            onClick={() => handleDelete(role)}
                                                            title="Delete Role"
                                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                                        {loading ? 'Loading roles...' : 'No roles found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: View / Edit / Create Role & Permissions */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                    <ShieldCheckIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {modalMode === 'create' 
                                            ? 'Create New Role' 
                                            : modalMode === 'edit'
                                                ? `Edit Role: ${activeRole?.name}`
                                                : `View Role: ${activeRole?.name}`}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {modalMode === 'create'
                                            ? 'Define a new system role and assign action permissions.'
                                            : modalMode === 'edit'
                                                ? 'Modify role information and granular module permissions.'
                                                : 'View assigned module permissions and role details.'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Read-Only Notice for non-superadmins in view mode */}
                            {modalMode === 'view' && !isSuperAdmin && (
                                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-xs">
                                    <LockClosedIcon className="h-5 w-5 flex-shrink-0 text-amber-400" />
                                    <span>
                                        <strong>Read-Only Mode:</strong> Only Super Administrators and Administrators can create, edit, or delete roles and permissions.
                                    </span>
                                </div>
                            )}

                            {/* Role Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Role Name *</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!isEditMode || !isSuperAdmin || (activeRole?.is_system && isSuperRole)}
                                        placeholder="e.g. Senior Cashier"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Slug</label>
                                    <input
                                        type="text"
                                        disabled={!isEditMode || !isSuperAdmin || modalMode === 'edit'}
                                        placeholder="auto-generated"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 font-mono disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        disabled={!isEditMode || !isSuperAdmin || (activeRole?.is_system && isSuperRole)}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                                    <input
                                        type="text"
                                        disabled={!isEditMode || !isSuperAdmin}
                                        placeholder="Brief description of role responsibilities..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Permission Interface Header & Fast Actions */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                                    <div>
                                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                                            <KeyIcon className="h-5 w-5 text-blue-400" />
                                            Module Permissions Matrix
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            Selected: <span className="text-blue-400 font-bold">
                                                {isSuperRole ? allPermissions.length : formData.permission_ids.length}
                                            </span> of {allPermissions.length} permissions
                                        </p>
                                    </div>
                                    
                                    {isEditMode && isSuperAdmin && !isSuperRole && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={selectAllPermissions}
                                                className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-all"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={deselectAllPermissions}
                                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-xs font-semibold transition-all"
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Permission Real-time Search */}
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Filter permissions by keyword (e.g. 'delete', 'create', 'export')..."
                                        value={permissionSearch}
                                        onChange={(e) => setPermissionSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Super Admin Notice */}
                            {isSuperRole && (
                                <div className="flex items-center gap-3 p-4 bg-blue-950/40 border border-blue-800/50 rounded-2xl text-blue-300 text-xs">
                                    <LockClosedIcon className="h-5 w-5 flex-shrink-0 text-blue-400" />
                                    <span>
                                        The Super Administrator role possesses permanent, unrestricted system-wide access to all current and future modules.
                                    </span>
                                </div>
                            )}

                            {/* Permission Modules List */}
                            <div className="space-y-4">
                                {MODULE_ORDER.map(({ key: modKey, label: modLabel, icon }) => {
                                    const modPerms = groupedPermissions[modKey] || [];
                                    if (modPerms.length === 0) return null;

                                    const visiblePerms = modPerms.filter(p => 
                                        !permissionSearch || 
                                        p.name.toLowerCase().includes(permissionSearch.toLowerCase()) || 
                                        p.slug.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                                        (p.description && p.description.toLowerCase().includes(permissionSearch.toLowerCase()))
                                    );

                                    if (visiblePerms.length === 0) return null;

                                    const selectedCountInMod = isSuperRole 
                                        ? modPerms.length 
                                        : modPerms.filter(p => formData.permission_ids.includes(p.id)).length;
                                    const allInModSelected = selectedCountInMod === modPerms.length;
                                    const isOpen = openModules[modKey] !== false;
                                    const isLocked = !isEditMode || !isSuperAdmin || isSuperRole;

                                    return (
                                        <div key={modKey} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden">
                                            {/* Module Accordion Header */}
                                            <div 
                                                className="flex items-center justify-between px-5 py-3.5 bg-slate-800/40 cursor-pointer select-none hover:bg-slate-800/60 transition-colors"
                                                onClick={() => toggleModuleAccordion(modKey)}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-base">{icon}</span>
                                                    <h5 className="text-sm font-bold text-white">{modLabel}</h5>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        selectedCountInMod > 0 
                                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                                            : 'bg-slate-800 text-slate-500'
                                                    }`}>
                                                        {selectedCountInMod} / {modPerms.length}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                                    {!isLocked && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleModuleAll(modKey)}
                                                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                                                        >
                                                            {allInModSelected ? 'Deselect Module' : 'Select Module'}
                                                        </button>
                                                    )}
                                                    <span className="text-slate-500 text-xs">
                                                        {isOpen ? '▲' : '▼'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Module Permissions Grid */}
                                            {isOpen && (
                                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                                    {visiblePerms.map(perm => {
                                                        const isChecked = isSuperRole || formData.permission_ids.includes(perm.id);
                                                        return (
                                                            <div
                                                                key={perm.id}
                                                                onClick={() => !isLocked && togglePermission(perm.id)}
                                                                className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                                                                    isLocked ? 'cursor-default opacity-90' : 'cursor-pointer'
                                                                } ${
                                                                    isChecked
                                                                        ? 'bg-blue-950/30 border-blue-500/40 text-white'
                                                                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                                                                }`}
                                                            >
                                                                <div className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                    isChecked
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'border border-slate-600 bg-slate-800'
                                                                }`}>
                                                                    {isChecked && <CheckIcon className="h-3 w-3 stroke-[3]" />}
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="text-xs font-semibold text-white leading-tight">{perm.name}</p>
                                                                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">{perm.slug}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Modal Footer Buttons */}
                            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3 sticky bottom-0 bg-slate-900 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    {isEditMode && isSuperAdmin ? 'Cancel' : 'Close'}
                                </button>
                                {isEditMode && isSuperAdmin && (
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving Role...' : modalMode === 'edit' ? 'Update Role & Permissions' : 'Create Role'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;
