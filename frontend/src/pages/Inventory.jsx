import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    PlusIcon, 
    MagnifyingGlassIcon, 
    ArchiveBoxIcon, 
    ExclamationTriangleIcon,
    PencilSquareIcon,
    TrashIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const Inventory = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await api.get('/inventory');
            setItems(response.data.data);
        } catch (error) {
            console.error('Failed to fetch inventory', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const deleteItem = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await api.delete(`/inventory/${id}`);
            setItems(items.filter(i => i.id !== id));
        } catch (error) {
            alert('Failed to delete item.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
                    <p className="text-slate-400">Track spare parts, stock levels, and pricing.</p>
                </div>
                <button 
                    onClick={() => navigate('/inventory/add')}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add New Item
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                        <ArchiveBoxIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Items</p>
                        <p className="text-2xl font-bold text-white">{items.length}</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 bg-amber-600/20 rounded-xl flex items-center justify-center text-amber-400">
                        <ExclamationTriangleIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Low Stock Alert</p>
                        <p className="text-2xl font-bold text-white">
                            {items.filter(i => i.stock_quantity <= i.reorder_level).length}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <div className="relative max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="Search parts, numbers or brands..."
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
                                <th className="px-6 py-4 font-semibold">Part Details</th>
                                <th className="px-6 py-4 font-semibold">Brand</th>
                                <th className="px-6 py-4 font-semibold">Stock</th>
                                <th className="px-6 py-4 font-semibold">Unit Price</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-8 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.part_number}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-300">{item.brand}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-medium ${item.stock_quantity <= item.reorder_level ? 'text-amber-400' : 'text-slate-300'}`}>
                                                {item.stock_quantity} units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-white font-semibold">${item.unit_price.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.stock_quantity <= item.reorder_level ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    In Stock
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-1">
                                                <button 
                                                    onClick={() => navigate(`/inventory/stock-card/${item.id}`)}
                                                    title="View Stock Card"
                                                    className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                                >
                                                    <ClipboardDocumentListIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/inventory/edit/${item.id}`)}
                                                    title="Edit"
                                                    className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteItem(item.id, item.name)}
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
                                        No inventory items found.
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

export default Inventory;
