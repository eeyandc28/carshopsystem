import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    ClockIcon, 
    MagnifyingGlassIcon, 
    ArrowDownTrayIcon, 
    FunnelIcon,
    CalendarIcon,
    UserCircleIcon,
    ComputerDesktopIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const MODULE_OPTIONS = [
    { value: '', label: 'All Modules' },
    { value: 'auth', label: 'Authentication' },
    { value: 'users', label: 'Users' },
    { value: 'roles', label: 'Roles & Permissions' },
    { value: 'customers', label: 'Customers' },
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'job_orders', label: 'Job Orders' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'deliveries', label: 'Deliveries' },
    { value: 'payments', label: 'Payments' },
    { value: 'suppliers', label: 'Suppliers' }
];

const ACTION_OPTIONS = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'reset_password', label: 'Reset Password' },
    { value: 'activate_user', label: 'Activate User' },
    { value: 'deactivate_user', label: 'Deactivate User' }
];

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    // Filters
    const [search, setSearch] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [page, selectedModule, selectedAction, startDate, endDate]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: search.trim() || undefined,
                module: selectedModule || undefined,
                action: selectedAction || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined
            };

            const res = await api.get('/audit-logs', { params });
            setLogs(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const handleReset = () => {
        setSearch('');
        setSelectedModule('');
        setSelectedAction('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const exportToCSV = async () => {
        try {
            const params = {
                all: 'true',
                search: search.trim() || undefined,
                module: selectedModule || undefined,
                action: selectedAction || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined
            };

            const res = await api.get('/audit-logs', { params });
            const allLogs = res.data.data || [];

            if (allLogs.length === 0) {
                alert('No records to export');
                return;
            }

            const headers = ['Timestamp', 'User Name', 'User Email', 'Action', 'Module', 'Record ID', 'Description', 'IP Address'];
            const rows = allLogs.map(l => [
                new Date(l.created_at).toLocaleString(),
                `"${l.user_name || 'System'}"`,
                `"${l.user_email || ''}"`,
                l.action,
                l.module,
                l.record_id || '',
                `"${(l.description || '').replace(/"/g, '""')}"`,
                l.ip_address || ''
            ]);

            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            alert('Failed to export audit logs');
        }
    };

    const getActionBadgeColor = (action) => {
        switch (action) {
            case 'create':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'update':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'delete':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'login':
                return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'logout':
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'reset_password':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default:
                return 'bg-slate-800 text-slate-300 border-slate-700';
        }
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                        <ClockIcon className="h-7 w-7 text-blue-500" />
                        System Audit Logs & Security Trail
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Track and audit all critical user activities, logins, and permission changes across the system.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchLogs}
                        className="flex items-center px-3.5 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Refresh
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="relative lg:col-span-2">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search description, user name, or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                        />
                    </div>
                    <div>
                        <select
                            value={selectedModule}
                            onChange={(e) => { setSelectedModule(e.target.value); setPage(1); }}
                            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {MODULE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={selectedAction}
                            onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
                            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {ACTION_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                        >
                            Filter
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-3 py-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </form>

                {/* Date Filters */}
                <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-slate-500">Date Range:</span>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-slate-500" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs outline-none"
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Timestamp</th>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Action</th>
                                <th className="px-6 py-4 font-semibold">Module</th>
                                <th className="px-6 py-4 font-semibold">Activity Description</th>
                                <th className="px-6 py-4 font-semibold text-right">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-xs font-semibold text-white">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-mono">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
                                                    {log.user_name?.[0] || 'U'}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-semibold text-white truncate max-w-[140px]">{log.user_name || 'System'}</p>
                                                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{log.user_email || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getActionBadgeColor(log.action)}`}>
                                                {log.action.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                                                {log.module}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-slate-300 font-medium max-w-md">
                                                {log.description}
                                            </p>
                                            {log.record_id && (
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    Target ID: #{log.record_id}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                                {log.ip_address || '—'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                                        {loading ? 'Fetching audit trail...' : 'No audit log entries found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
                    <div className="text-xs text-slate-400">
                        Total <span className="text-white font-bold">{total}</span> records &bull; Page <span className="text-white font-bold">{page}</span> of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 transition-all disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 transition-all disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
