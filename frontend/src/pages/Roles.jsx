import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import usePermission from '../hooks/usePermission';
import { 
    ShieldCheckIcon, 
    XMarkIcon,
    MagnifyingGlassIcon,
    CheckIcon,
    UsersIcon,
    KeyIcon,
    CheckCircleIcon,
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
    
    // Modal states (View Only)
    const [showModal, setShowModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [permissionSearch, setPermissionSearch] = useState('');
    const [openModules, setOpenModules] = useState({});

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

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

    const handleViewRole = (role) => {
        setSelectedRole(role);
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

    const filteredRoles = roles.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                        <ShieldCheckIcon className="h-7 w-7 text-blue-500" />
                        Roles & Permissions
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        System roles and their configured action permissions.
                    </p>
                </div>
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
                                <th className="px-6 py-4 font-semibold text-right">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredRoles.length > 0 ? (
                                filteredRoles.map((role) => {
                                    const isSuper = role.slug === 'super_admin' || role.slug === 'admin';
                                    return (
                                        <tr 
                                            key={role.id} 
                                            onClick={() => handleViewRole(role)}
                                            className="hover:bg-slate-800/30 transition-colors cursor-pointer"
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
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewRole(role);
                                                    }}
                                                    title="View Role Permissions"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-blue-400 bg-slate-800/80 hover:bg-blue-500/10 border border-slate-700 hover:border-blue-500/30 rounded-xl transition-all"
                                                >
                                                    <EyeIcon className="h-4 w-4 text-blue-400" />
                                                    <span>View</span>
                                                </button>
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

            {/* Modal: View Role & Permissions (Read Only) */}
            {showModal && selectedRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                    <ShieldCheckIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-white">
                                            {selectedRole.name}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                            selectedRole.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                            {selectedRole.status || 'active'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                                        Slug: {selectedRole.slug}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Role Summary Card */}
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</p>
                                <p className="text-sm text-slate-300">
                                    {selectedRole.description || 'No description provided for this role.'}
                                </p>
                            </div>

                            {/* Permissions Header & Search */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                                    <div>
                                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                                            <KeyIcon className="h-5 w-5 text-blue-400" />
                                            Assigned Permissions
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            Granted: <span className="text-blue-400 font-bold">
                                                {(selectedRole.slug === 'super_admin' || selectedRole.slug === 'admin') 
                                                    ? allPermissions.length 
                                                    : (selectedRole.permission_ids?.length || 0)}
                                            </span> of {allPermissions.length} permissions
                                        </p>
                                    </div>
                                </div>

                                {/* Permission Real-time Search */}
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Filter permissions by keyword (e.g. 'delete', 'create', 'view')..."
                                        value={permissionSearch}
                                        onChange={(e) => setPermissionSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

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

                                    const isSuperRole = selectedRole.slug === 'super_admin' || selectedRole.slug === 'admin';
                                    const grantedInMod = isSuperRole 
                                        ? modPerms.length 
                                        : modPerms.filter(p => (selectedRole.permission_ids || []).includes(p.id)).length;
                                    const isOpen = openModules[modKey] !== false;

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
                                                        grantedInMod > 0 
                                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                                            : 'bg-slate-800 text-slate-500'
                                                    }`}>
                                                        {grantedInMod} / {modPerms.length} granted
                                                    </span>
                                                </div>

                                                <span className="text-slate-500 text-xs">
                                                    {isOpen ? '▲' : '▼'}
                                                </span>
                                            </div>

                                            {/* Module Permissions Grid */}
                                            {isOpen && (
                                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                                    {visiblePerms.map(perm => {
                                                        const isGranted = isSuperRole || (selectedRole.permission_ids || []).includes(perm.id);
                                                        return (
                                                            <div
                                                                key={perm.id}
                                                                className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                                                                    isGranted
                                                                        ? 'bg-blue-950/20 border-blue-500/30 text-white'
                                                                        : 'bg-slate-900/30 border-slate-800/50 text-slate-500 opacity-50'
                                                                }`}
                                                            >
                                                                <div className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${
                                                                    isGranted
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'border border-slate-700 bg-slate-800'
                                                                }`}>
                                                                    {isGranted && <CheckIcon className="h-3 w-3 stroke-[3]" />}
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className={`text-xs font-semibold leading-tight ${isGranted ? 'text-white' : 'text-slate-500 line-through'}`}>
                                                                        {perm.name}
                                                                    </p>
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
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-800 flex justify-end sticky bottom-0 bg-slate-900">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;
