import { useState, useEffect } from 'react';
import api from '../services/api';
import usePermission from '../hooks/usePermission';
import Can from '../components/common/Can';
import { 
    UserPlusIcon, 
    PencilSquareIcon, 
    TrashIcon,
    ShieldCheckIcon,
    XMarkIcon,
    EnvelopeIcon,
    UserIcon,
    LockClosedIcon,
    PhoneIcon,
    KeyIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

const Users = () => {
    const { hasPermission, isSuperAdmin } = usePermission();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        contact_number: '',
        password: '',
        role: 'service_advisor',
        role_ids: [],
        status: 'active'
    });
    const [submitting, setSubmitting] = useState(false);

    // Password Reset Modal
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUser, setResetUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    // Permission Preview Drawer/Modal
    const [previewUser, setPreviewUser] = useState(null);

    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch roles', err);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                username: user.username || '',
                email: user.email,
                contact_number: user.contact_number || '',
                password: '',
                role: user.role || 'service_advisor',
                role_ids: user.role_ids || [],
                status: user.status || 'active'
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                username: '',
                email: '',
                contact_number: '',
                password: '',
                role: 'service_advisor',
                role_ids: [],
                status: 'active'
            });
        }
        setShowModal(true);
    };

    const toggleRoleSelection = (roleId) => {
        setFormData(prev => {
            const current = prev.role_ids || [];
            const exists = current.includes(roleId);
            const next = exists ? current.filter(id => id !== roleId) : [...current, roleId];
            
            // Sync primary role slug if possible
            const matchedRole = roles.find(r => r.id === (next[0] || roleId));
            return {
                ...prev,
                role_ids: next,
                role: matchedRole ? matchedRole.slug : prev.role
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingUser) {
                await api.patch(`/users/${editingUser.id}`, formData);
                showToast(`User "${formData.name}" updated successfully!`);
            } else {
                await api.post('/users', formData);
                showToast(`User "${formData.name}" created successfully!`);
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusToggle = async (user) => {
        const nextStatus = user.status === 'active' ? 'inactive' : 'active';
        if (!window.confirm(`Are you sure you want to change status of "${user.name}" to ${nextStatus.toUpperCase()}?`)) return;

        try {
            await api.patch(`/users/${user.id}/status`, { status: nextStatus });
            showToast(`User "${user.name}" is now ${nextStatus.toUpperCase()}.`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update user status');
        }
    };

    const handleOpenResetPassword = (user) => {
        setResetUser(user);
        setNewPassword('');
        setShowResetModal(true);
    };

    const handlePasswordResetSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters.');
            return;
        }
        setResetting(true);
        try {
            await api.post(`/users/${resetUser.id}/reset-password`, { password: newPassword });
            showToast(`Password for "${resetUser.name}" reset successfully.`);
            setShowResetModal(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setResetting(false);
        }
    };

    const deleteUser = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) return;
        try {
            await api.delete(`/users/${id}`);
            showToast(`User "${name}" deleted.`);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.contact_number && u.contact_number.includes(searchQuery));
        const matchesStatus = !statusFilter || u.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                        <UserIcon className="h-7 w-7 text-blue-500" />
                        System Users Management
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Manage employee user accounts, assign roles, and control access permissions.
                    </p>
                </div>
                <Can do="users.create">
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold text-sm shadow-lg shadow-blue-500/20"
                    >
                        <UserPlusIcon className="h-5 w-5 mr-2" />
                        Create New User
                    </button>
                </Can>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="relative flex-1 w-full sm:max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name, email, username, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                    <div className="text-xs text-slate-400 font-medium whitespace-nowrap">
                        Showing <span className="text-white font-bold">{filteredUsers.length}</span> of {users.length}
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">User Details</th>
                                <th className="px-6 py-4 font-semibold">Assigned Role(s)</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold">Last Login</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3.5">
                                                <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-white">{user.name}</p>
                                                        {user.username && (
                                                            <span className="text-xs text-slate-500 font-mono">@{user.username}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400">{user.email}</p>
                                                    {user.contact_number && (
                                                        <p className="text-[11px] text-slate-500">{user.contact_number}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map(r => (
                                                        <span 
                                                            key={r.id} 
                                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                                r.slug === 'super_admin' || r.slug === 'admin'
                                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            }`}
                                                        >
                                                            {r.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                                        {(user.role || 'user').replace('_', ' ')}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setPreviewUser(user)}
                                                    title="View effective permissions"
                                                    className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                                                >
                                                    <EyeIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Can do="users.status" fallback={
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    user.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
                                                    {user.status || 'active'}
                                                </span>
                                            }>
                                                <button
                                                    onClick={() => handleStatusToggle(user)}
                                                    title="Click to toggle status"
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all hover:scale-105 ${
                                                        user.status === 'active'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                                                    }`}
                                                >
                                                    {user.status || 'active'}
                                                </button>
                                            </Can>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                                            {user.last_login_at ? (
                                                <div>
                                                    <p className="text-white font-medium">{new Date(user.last_login_at).toLocaleDateString()}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono">{new Date(user.last_login_at).toLocaleTimeString()}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-600">Never</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-1">
                                                <Can do="users.reset_password">
                                                    <button 
                                                        onClick={() => handleOpenResetPassword(user)}
                                                        title="Reset Password"
                                                        className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                                    >
                                                        <KeyIcon className="h-4 w-4" />
                                                    </button>
                                                </Can>
                                                <Can do="users.edit">
                                                    <button 
                                                        onClick={() => handleOpenModal(user)}
                                                        title="Edit User"
                                                        className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                </Can>
                                                <Can do="users.delete">
                                                    <button 
                                                        onClick={() => deleteUser(user.id, user.name)}
                                                        title="Delete User"
                                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </Can>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                                        {loading ? 'Fetching users...' : 'No users found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Create / Edit User */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                    <UserPlusIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white">
                                    {editingUser ? 'Edit User Account' : 'Create User Account'}
                                </h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Full Name *</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <input 
                                            required
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Username</label>
                                    <input 
                                        type="text"
                                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="johndoe"
                                        value={formData.username}
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Contact Number</label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input 
                                            type="text"
                                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="0917-123-4567"
                                            value={formData.contact_number}
                                            onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email Address *</label>
                                <div className="relative">
                                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input 
                                        required
                                        type="email"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Password *</label>
                                    <div className="relative">
                                        <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <input 
                                            required
                                            type="password"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Account Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Multi-Role Assignment */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Assign Roles & Permissions
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                                    {roles.map(r => {
                                        const isSelected = formData.role_ids.includes(r.id) || formData.role === r.slug;
                                        return (
                                            <div
                                                key={r.id}
                                                onClick={() => toggleRoleSelection(r.id)}
                                                className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'bg-blue-950/40 border-blue-500/50 text-white'
                                                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`h-4 w-4 rounded flex items-center justify-center ${
                                                        isSelected ? 'bg-blue-600 text-white' : 'border border-slate-600 bg-slate-800'
                                                    }`}>
                                                        {isSelected && <CheckIcon className="h-3 w-3 stroke-[3]" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{r.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">{r.slug}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-500">
                                                    {r.is_system ? 'System' : 'Custom'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Password Reset */}
            {showResetModal && resetUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                    <KeyIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Reset User Password</h3>
                            </div>
                            <button onClick={() => setShowResetModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordResetSubmit} className="p-6 space-y-4">
                            <p className="text-xs text-slate-400">
                                Set a new password for <span className="text-white font-semibold">{resetUser.name}</span> ({resetUser.email}).
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">New Password *</label>
                                <div className="relative">
                                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input 
                                        required
                                        type="password"
                                        minLength={6}
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowResetModal(false)}
                                    className="px-6 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={resetting}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                >
                                    {resetting ? 'Resetting...' : 'Save New Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Permission Preview Drawer */}
            {previewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                    <ShieldCheckIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Assigned Permissions</h3>
                                    <p className="text-xs text-slate-400">{previewUser.name} &bull; {previewUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewUser(null)} className="text-slate-500 hover:text-white transition-colors">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                            <div className="text-xs text-slate-400 font-medium">
                                Effective action permissions ({previewUser.permissions?.length || 0}):
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {(previewUser.permissions || []).map((perm, idx) => (
                                    <span 
                                        key={idx} 
                                        className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 text-blue-400 border border-slate-800"
                                    >
                                        {perm}
                                    </span>
                                ))}
                                {(!previewUser.permissions || previewUser.permissions.length === 0) && (
                                    <p className="text-xs text-slate-500">No permissions assigned.</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
                            <button
                                onClick={() => setPreviewUser(null)}
                                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
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

export default Users;
