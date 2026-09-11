import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    CalendarIcon,
    TruckIcon,
    EyeIcon,
    TrashIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

const statusBadge = {
    received: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    draft:    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
};

const Deliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [meta, setMeta]             = useState({ total: 0, last_page: 1 });
    const [page, setPage]             = useState(1);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [startDate, setStartDate]   = useState('');
    const [endDate, setEndDate]       = useState('');
    const [deleting, setDeleting]     = useState(null);

    useEffect(() => { fetchDeliveries(); }, [page, search, startDate, endDate]);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const params = { page, search, start_date: startDate, end_date: endDate };
            const res = await api.get('/deliveries', { params });
            setDeliveries(res.data.data);
            setMeta({ total: res.data.total, last_page: res.data.last_page });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this delivery? Stock quantities will be reversed.')) return;
        setDeleting(id);
        try {
            await api.delete('/deliveries/' + id);
            fetchDeliveries();
        } catch (e) {
            alert('Failed to delete delivery.');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Receiving of Deliveries</h1>
                    <p className="text-slate-400 text-sm mt-1">Record supplier deliveries and track stock replenishment.</p>
                </div>
                <Link
                    to="/deliveries/add"
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm font-semibold"
                >
                    <PlusIcon className="h-5 w-5" />
                    New Delivery
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text" placeholder="Search delivery #, DR#, supplier..."
                            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                    </div>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
                            className="pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
                            className="pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-5 py-4 font-semibold">Delivery #</th>
                                <th className="px-5 py-4 font-semibold">Date</th>
                                <th className="px-5 py-4 font-semibold">Supplier</th>
                                <th className="px-5 py-4 font-semibold">DR / Ref #</th>
                                <th className="px-5 py-4 font-semibold text-center">Items</th>
                                <th className="px-5 py-4 font-semibold text-right">Total Cost</th>
                                <th className="px-5 py-4 font-semibold text-center">Status</th>
                                <th className="px-5 py-4 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="8" className="px-6 py-16 text-center">
                                    <div className="flex justify-center">
                                        <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                        </svg>
                                    </div>
                                </td></tr>
                            ) : deliveries.length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-16 text-center text-slate-500 text-sm">
                                    <TruckIcon className="h-10 w-10 mx-auto mb-3 text-slate-700" />
                                    No deliveries found.
                                </td></tr>
                            ) : deliveries.map(d => (
                                <tr key={d.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-5 py-4">
                                        <span className="text-sm font-bold text-blue-400">{d.delivery_number}</span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-300">
                                        {new Date(d.received_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-300">
                                        {d.supplier?.name ?? <span className="text-slate-600 italic">No supplier</span>}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-400">
                                        {d.reference_number || <span className="text-slate-600">—</span>}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="text-sm font-semibold text-white">{d.total_items ?? d.items?.length ?? 0}</span>
                                        <span className="text-slate-500 text-xs ml-1">pcs</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className="text-sm font-bold text-emerald-400">
                                            &#8369;{parseFloat(d.total_cost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${statusBadge[d.status]}`}>
                                            {d.status === 'received'
                                                ? <CheckCircleIcon className="h-3 w-3" />
                                                : <ClockIcon className="h-3 w-3" />}
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={'/deliveries/' + d.id}
                                                className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="View">
                                                <EyeIcon className="h-4 w-4" />
                                            </Link>
                                            <Link to={'/deliveries/' + d.id + '/edit'}
                                                className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" title="Edit">
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(d.id)}
                                                disabled={deleting === d.id}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-40">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between text-sm text-slate-400">
                        <span>Total: <strong className="text-white">{meta.total}</strong> deliveries</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40 transition-all">Prev</button>
                            <span className="px-3 py-1.5">Page {page} / {meta.last_page}</span>
                            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
                                className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40 transition-all">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Deliveries;
