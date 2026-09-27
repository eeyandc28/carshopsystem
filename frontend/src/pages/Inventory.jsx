import { useState, useEffect, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
    PlusIcon, 
    MagnifyingGlassIcon, 
    ArchiveBoxIcon, 
    ExclamationTriangleIcon,
    PencilSquareIcon,
    TrashIcon,
    ClipboardDocumentListIcon,
    CubeIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    TagIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

const getItemTypeBadge = (type = '') => {
    const t = (type || '').toLowerCase();
    if (t.includes('tire')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (t.includes('wheel') || t.includes('rim')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    if (t.includes('oil') || t.includes('fluid') || t.includes('lube') || t.includes('material'))
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (t.includes('charge') || t.includes('fee')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    if (t.includes('battery')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    if (t.includes('brake')) return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    if (t.includes('labor') || t.includes('service')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
};

const Inventory = () => {
    const navigate = useNavigate();
    const [items, setItems]               = useState([]);
    const [itemTypes, setItemTypes]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [searchTerm, setSearchTerm]     = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [expandedInclusions, setExpandedInclusions] = useState({});

    useEffect(() => {
        fetchInventory();
        fetchItemTypes();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await api.get('/inventory?per_page=500');
            setItems(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch inventory', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchItemTypes = async () => {
        try {
            const res = await api.get('/inventory-types');
            setItemTypes(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch item types', error);
        }
    };

    const toggleExpandInclusions = (itemId) => {
        setExpandedInclusions((prev) => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    // Parse inclusions helper
    const getItemInclusions = (item) => {
        if (!item || !item.inclusions) return [];
        if (Array.isArray(item.inclusions)) return item.inclusions;
        if (typeof item.inclusions === 'string') {
            try {
                return JSON.parse(item.inclusions);
            } catch {
                return [];
            }
        }
        return [];
    };

    // Filter items based on Category Tab and Search Input
    const filteredItems = items.filter((item) => {
        const incs = getItemInclusions(item);
        const hasInclusions = incs.length > 0;

        // Category filter
        if (selectedCategory === 'BUNDLES') {
            if (!hasInclusions) return false;
        } else if (selectedCategory !== 'ALL') {
            const itemCat = (item.type || '').trim().toLowerCase();
            const filterCat = selectedCategory.trim().toLowerCase();
            if (itemCat !== filterCat && !itemCat.includes(filterCat)) {
                return false;
            }
        }

        // Search filter (keyword, name, part_number, brand, type, and inclusion item names)
        if (!searchTerm.trim()) return true;
        const words = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const inclusionNames = incs.map((i) => i.name).join(' ');
        const searchTarget = [
            item.name,
            item.part_number,
            item.brand,
            item.keyword,
            item.type,
            inclusionNames,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return words.every((word) => searchTarget.includes(word));
    });

    const deleteItem = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await api.delete(`/inventory/${id}`);
            setItems(items.filter(i => i.id !== id));
        } catch (error) {
            alert('Failed to delete item.');
        }
    };

    // Category options for tabs
    const distinctTypes = [
        ...new Set([
            ...itemTypes.map((t) => t.name).filter(Boolean),
            ...items.map((i) => i.type).filter(Boolean),
        ])
    ];

    const totalBundlesCount = items.filter((i) => getItemInclusions(i).length > 0).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
                    <p className="text-slate-400">Track spare parts, stock levels, bundled packages, and pricing.</p>
                </div>
                <button 
                    onClick={() => navigate('/inventory/add')}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 cursor-pointer font-medium"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add New Item
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                        <ArchiveBoxIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Inventory Items</p>
                        <p className="text-2xl font-bold text-white">{items.length}</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-400">
                        <CubeIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Kits & Bundles (With Inclusions)</p>
                        <p className="text-2xl font-bold text-white">{totalBundlesCount}</p>
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

            {/* Category / Type Tabs */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
                <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedCategory === 'ALL'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                    }`}
                >
                    All ({items.length})
                </button>

                {totalBundlesCount > 0 && (
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('BUNDLES')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'BUNDLES'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                : 'bg-slate-900 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50'
                        }`}
                    >
                        <CubeIcon className="h-3.5 w-3.5" />
                        <span>Kits / Bundles ({totalBundlesCount})</span>
                    </button>
                )}

                {distinctTypes.map((t) => {
                    const count = items.filter((i) => (i.type || '').toLowerCase() === t.toLowerCase()).length;
                    return (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedCategory(t)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                selectedCategory === t
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            {t} ({count})
                        </button>
                    );
                })}

                <Link
                    to="/inventory-types"
                    className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-1 font-medium transition-colors"
                    title="Manage types in the Item Types table"
                >
                    <TagIcon className="h-3.5 w-3.5" />
                    <span>Manage Item Types</span>
                    <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-70" />
                </Link>
            </div>

            {/* Table Container */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="Search parts, brands, SKU, tags or inclusions..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-xs text-slate-400">
                        Showing <span className="text-white font-semibold">{filteredItems.length}</span> of {items.length} items
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Part / Package Details</th>
                                <th className="px-6 py-4 font-semibold">Brand</th>
                                <th className="px-6 py-4 font-semibold">Stock</th>
                                <th className="px-6 py-4 font-semibold">Price</th>
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
                                filteredItems.map((item) => {
                                    const incs = getItemInclusions(item);
                                    const hasInclusions = incs.length > 0;
                                    const isExpanded = Boolean(expandedInclusions[item.id]);

                                    return (
                                        <Fragment key={item.id}>
                                            <tr className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-semibold text-white">{item.name}</p>
                                                            {item.type && (
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getItemTypeBadge(item.type)}`}>
                                                                    {item.type}
                                                                </span>
                                                            )}
                                                            {hasInclusions && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleExpandInclusions(item.id)}
                                                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 inline-flex items-center gap-1 transition-all cursor-pointer"
                                                                    title="Click to view bundled package inclusions"
                                                                >
                                                                    <CubeIcon className="h-3 w-3" />
                                                                    <span>{incs.length} Inclusions</span>
                                                                    {isExpanded ? <ChevronUpIcon className="h-2.5 w-2.5" /> : <ChevronDownIcon className="h-2.5 w-2.5" />}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-xs text-slate-500 font-mono">{item.part_number}</p>
                                                            {item.keyword && (
                                                                <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700/60">
                                                                    {item.keyword}
                                                                </span>
                                                            )}
                                                        </div>
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
                                                    <div>
                                                        <span className="text-sm text-emerald-400 font-semibold block">
                                                            ₱{(parseFloat(item.selling_price ?? item.unit_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        {parseFloat(item.markup_rate) > 0 ? (
                                                            <span className="text-xs text-slate-400 block">
                                                                Cost: ₱{parseFloat(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{parseFloat(item.markup_rate)}%)
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-500 block">
                                                                Cost: ₱{parseFloat(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        )}
                                                    </div>
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
                                                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all cursor-pointer"
                                                        >
                                                            <ClipboardDocumentListIcon className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => navigate(`/inventory/edit/${item.id}`)}
                                                            title="Edit"
                                                            className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all cursor-pointer"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteItem(item.id, item.name)}
                                                            title="Delete"
                                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expandable Package Inclusions Sub-rows */}
                                            {hasInclusions && isExpanded && (
                                                <tr className="bg-slate-950/70 border-b border-slate-800">
                                                    <td colSpan="6" className="px-8 py-3">
                                                        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                                                            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                                <CubeIcon className="h-3.5 w-3.5 text-emerald-400" />
                                                                <span>Package Inclusions for {item.name} (Included with item price — ₱0.00 charge on invoice):</span>
                                                            </p>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                                {incs.map((inc, iIdx) => (
                                                                    <div key={iIdx} className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs">
                                                                        <div className="flex items-center gap-1.5 truncate">
                                                                            <span className="text-slate-500">↳</span>
                                                                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${getItemTypeBadge(inc.item_type)}`}>
                                                                                {inc.item_type || 'Part'}
                                                                            </span>
                                                                            <span className="text-slate-200 font-medium truncate">{inc.name}</span>
                                                                        </div>
                                                                        <div className="text-right shrink-0 ml-2">
                                                                            <span className="text-slate-400 text-[11px]">Qty: {inc.quantity}</span>
                                                                            <span className="text-emerald-400 font-bold ml-2 text-[10px]">INCLUDED</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No inventory items found matching your filters.
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
