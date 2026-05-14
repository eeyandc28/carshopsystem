import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    PlusIcon, 
    MagnifyingGlassIcon, 
    ClipboardDocumentListIcon, 
    ClockIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    ChevronRightIcon,
    PencilSquareIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

const statusColors = {
    'pending': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    'in-progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'cancelled': 'bg-red-500/10 text-red-500 border-red-500/20',
};

const JobOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/job-orders');
            setOrders(response.data.data);
        } catch (error) {
            console.error('Failed to fetch job orders', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteOrder = async (id, orderNumber) => {
        if (!window.confirm(`Are you sure you want to delete job order "${orderNumber}"?`)) return;
        try {
            await api.delete(`/job-orders/${id}`);
            setOrders(orders.filter(o => o.id !== id));
        } catch (error) {
            alert('Failed to delete job order.');
        }
    };

    const filteredOrders = orders.filter(order => 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vehicle?.plate_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Job Orders</h1>
                    <p className="text-slate-400">Manage repair requests and track service progress.</p>
                </div>
                <button 
                    onClick={() => navigate('/job-orders/add')}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Job Order
                </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <div className="relative max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="Search by Order #, Customer or Plate..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Order Details</th>
                                <th className="px-6 py-4 font-semibold">Vehicle</th>
                                <th className="px-6 py-4 font-semibold">Service Type</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Cost</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-12 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{order.order_number}</p>
                                                <p className="text-xs text-slate-500">{order.customer?.full_name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-300 font-medium">{order.vehicle?.plate_number}</span>
                                                <span className="text-xs text-slate-500">{order.vehicle?.brand} {order.vehicle?.model}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-300">{order.service_type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[order.status] || statusColors.pending}`}>
                                                {order.status.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm text-white font-semibold">
                                                ${(order.actual_cost || order.estimated_cost || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-1">
                                                <button 
                                                    onClick={() => navigate(`/job-orders/${order.id}`)}
                                                    title="View Details"
                                                    className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                                >
                                                    <ChevronRightIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/job-orders/edit/${order.id}`)}
                                                    title="Edit"
                                                    className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteOrder(order.id, order.order_number)}
                                                    title="Delete"
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <ClipboardDocumentListIcon className="h-10 w-10 text-slate-700 mb-2" />
                                            <p>No job orders found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default JobOrders;
