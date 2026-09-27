import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArchiveBoxIcon,
    ArrowLeftIcon,
    CubeIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    TrashIcon,
    PencilSquareIcon,
    TagIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

const schema = yup.object({
    name: yup.string().required('Part name is required'),
    type: yup.string().nullable(),
    keyword: yup.string().nullable(),
    part_number: yup.string().required('Part number is required'),
    brand: yup.string().required('Brand is required'),
    supplier_id: yup.string().nullable().transform((v) => v === "" ? null : v),
    stock_quantity: yup.number().typeError('Must be a number').required('Stock quantity is required'),
    reorder_level: yup.number().typeError('Must be a number').required('Reorder level is required'),
    unit_price: yup.number().typeError('Must be a number').required('Unit price is required'),
    markup_rate: yup.number().typeError('Must be a number').nullable().transform((v, o) => o === '' || isNaN(v) ? 0 : v),
}).required();

const EditInventory = () => {
    const { id } = useParams();
    const [loading, setLoading]                     = useState(false);
    const [fetching, setFetching]                   = useState(true);
    const [suppliers, setSuppliers]                 = useState([]);
    const [itemTypes, setItemTypes]                 = useState([]);
    const [existingInventory, setExistingInventory] = useState([]);
    const [services, setServices]                   = useState([]);
    const [inclusions, setInclusions]               = useState([]);
    const [quickSearchTerm, setQuickSearchTerm]     = useState('');
    const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
    const quickSearchRef                            = useRef(null);
    const navigate                                  = useNavigate();
    
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const unitPrice = watch('unit_price');
    const markupRate = watch('markup_rate');
    const estSellingPrice = (parseFloat(unitPrice) || 0) * (1 + (parseFloat(markupRate) || 0) / 100);

    useEffect(() => {
        fetchInitialData();
        fetchItemTypes();
        fetchInventoryAndServices();

        const handleClickOutside = (e) => {
            if (quickSearchRef.current && !quickSearchRef.current.contains(e.target)) {
                setIsQuickSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [id]);

    const fetchItemTypes = async () => {
        try {
            const res = await api.get('/inventory-types');
            setItemTypes(res.data.data || []);
        } catch {
            console.error('Failed to fetch inventory types');
        }
    };

    const fetchInventoryAndServices = async () => {
        try {
            const [invRes, srvRes] = await Promise.all([
                api.get('/inventory?per_page=500').catch(() => ({ data: { data: [] } })),
                api.get('/services').catch(() => ({ data: { data: [] } }))
            ]);
            setExistingInventory(invRes.data.data || []);
            setServices(srvRes.data.data || []);
        } catch (err) {
            console.error('Failed to load items for inclusions', err);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [itemRes, suppliersRes] = await Promise.all([
                api.get(`/inventory/${id}`),
                api.get('/suppliers').catch(() => ({ data: { data: [] } }))
            ]);
            
            const itemData = itemRes.data.data;
            reset(itemData);
            setSuppliers(suppliersRes.data.data || []);

            // Hydrate inclusions
            let parsedIncs = [];
            if (Array.isArray(itemData.inclusions)) {
                parsedIncs = itemData.inclusions;
            } else if (typeof itemData.inclusions === 'string') {
                try {
                    parsedIncs = JSON.parse(itemData.inclusions);
                } catch {
                    parsedIncs = [];
                }
            }
            setInclusions(parsedIncs);
        } catch (error) {
            console.error('Failed to fetch inventory data', error);
            alert('Failed to load inventory item');
            navigate('/inventory');
        } finally {
            setFetching(false);
        }
    };

    // Category options linked directly to itemTypes table
    const allInclusionTypes = [
        ...new Set([
            ...itemTypes.map((t) => t.name).filter(Boolean),
            ...inclusions.map((inc) => inc.item_type).filter(Boolean),
            ...existingInventory.map((i) => i.type).filter(Boolean),
            'Products',
            'Parts',
            'Tires',
            'Wheels',
            'Oils & Fluids',
            'Services',
            'Labor',
            'Charge / Fee'
        ])
    ];

    // Helper for category matching items (excluding the item itself)
    const getCategoryMatchingItems = (categoryName = '') => {
        const cat = (categoryName || '').trim().toLowerCase();
        if (!cat) return [];

        // 1. Matching from existing inventory (except current item)
        const matchingInventory = existingInventory
            .filter((item) => {
                if (String(item.id) === String(id)) return false;
                const itemType = (item.type || '').trim().toLowerCase();
                if (!itemType) return cat === 'products' || cat === 'parts' || cat === 'other';
                if (itemType === cat) return true;
                const singularItem = itemType.endsWith('s') ? itemType.slice(0, -1) : itemType;
                const singularCat = cat.endsWith('s') ? cat.slice(0, -1) : cat;
                if (singularItem === singularCat) return true;
                if (cat.includes(singularItem) || itemType.includes(singularCat)) return true;
                return false;
            })
            .map((item) => {
                const cost = parseFloat(item.unit_price) || 0;
                const markup = parseFloat(item.markup_rate) || 0;
                const sellingPrice =
                    item.selling_price !== undefined && item.selling_price !== null
                        ? parseFloat(item.selling_price)
                        : Number((cost * (1 + markup / 100)).toFixed(2));
                return {
                    key: 'inv_' + item.id,
                    id: item.id,
                    kind: 'inventory',
                    name: item.name,
                    type: item.type || 'Products',
                    price: sellingPrice || cost || 0,
                    stock_quantity: item.stock_quantity,
                    code: item.part_number || item.barcode_sku || null,
                    label: `${item.name} — ₱${(sellingPrice || cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${item.stock_quantity !== undefined ? ` (Stock: ${item.stock_quantity})` : ''}`,
                };
            });

        // 2. Matching from services
        const matchingServices = services
            .filter((srv) => {
                const srvType = (srv.type || '').trim().toLowerCase();
                if (cat === 'services' || cat === 'service' || cat === 'labor') return true;
                if (!srvType) return false;
                if (srvType === cat) return true;
                const singularSrv = srvType.endsWith('s') ? srvType.slice(0, -1) : srvType;
                const singularCat = cat.endsWith('s') ? cat.slice(0, -1) : cat;
                if (singularSrv === singularCat) return true;
                if (cat.includes(singularSrv) || srvType.includes(singularCat)) return true;
                return false;
            })
            .map((srv) => ({
                key: 'srv_' + srv.id,
                id: srv.id,
                kind: 'service',
                name: srv.name,
                type: srv.type || 'Services',
                price: parseFloat(srv.price || 0),
                stock_quantity: undefined,
                code: srv.code || null,
                label: `${srv.name} (Service) — ₱${parseFloat(srv.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            }));

        return [...matchingServices, ...matchingInventory];
    };

    // Filtered inventory & services for quick-search
    const filteredQuickSearchItems = [
        ...existingInventory
            .filter((inv) => String(inv.id) !== String(id))
            .map((inv) => ({
                ...inv,
                item_kind: 'inventory',
                display_type: inv.type || 'Products',
                selling_price:
                    inv.selling_price !== undefined && inv.selling_price !== null
                        ? parseFloat(inv.selling_price)
                        : Number(((parseFloat(inv.unit_price) || 0) * (1 + (parseFloat(inv.markup_rate) || 0) / 100)).toFixed(2)),
            })),
        ...services.map((srv) => ({
            id: srv.id,
            name: srv.name,
            keyword: srv.keyword,
            description: srv.description,
            type: srv.type || 'Services',
            display_type: srv.type || 'Services',
            part_number: srv.code,
            unit_price: parseFloat(srv.price || 0),
            selling_price: parseFloat(srv.price || 0),
            stock_quantity: undefined,
            item_kind: 'service',
        })),
    ].filter((item) => {
        if (!quickSearchTerm.trim()) return true;
        const words = quickSearchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const searchTarget = [
            item.name,
            item.keyword,
            item.description,
            item.part_number,
            item.brand,
            item.barcode_sku,
            item.type,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return words.every((word) => searchTarget.includes(word));
    });

    // Inclusions handlers
    const handleSelectQuickSearchItem = (item) => {
        if (!item) return;
        const isService = item.item_kind === 'service';
        const price = parseFloat(item.selling_price ?? item.unit_price) || 0;

        const newInc = {
            id: Date.now() + Math.random(),
            item_type: item.type || (isService ? 'Services' : 'Products'),
            inventory_id: isService ? null : item.id,
            service_id: isService ? item.id : null,
            name: item.name,
            quantity: 1,
            unit_price: price,
            is_custom: false,
        };

        setInclusions((prev) => [...prev, newInc]);
        setQuickSearchTerm('');
        setIsQuickSearchOpen(false);
    };

    const handleAddCustomInclusion = (type = 'Products', defaultName = '') => {
        const matches = getCategoryMatchingItems(type);
        const newInc = {
            id: Date.now() + Math.random(),
            item_type: type,
            inventory_id: null,
            service_id: null,
            name: defaultName,
            quantity: 1,
            unit_price: 0,
            is_custom: matches.length === 0,
        };
        setInclusions((prev) => [...prev, newInc]);
    };

    const handleCategoryChange = (index, newCategory) => {
        const matches = getCategoryMatchingItems(newCategory);
        setInclusions((prev) => {
            const next = [...prev];
            const current = next[index] || {};
            const currentItemStillMatches = matches.some((item) =>
                (current.service_id && item.kind === 'service' && String(item.id) === String(current.service_id)) ||
                (current.inventory_id && item.kind === 'inventory' && String(item.id) === String(current.inventory_id)) ||
                (current.name && item.name?.toLowerCase() === current.name?.toLowerCase())
            );

            if (currentItemStillMatches) {
                next[index] = { ...current, item_type: newCategory };
            } else if (matches.length > 0) {
                next[index] = {
                    ...current,
                    item_type: newCategory,
                    inventory_id: '',
                    service_id: '',
                    name: '',
                    unit_price: 0,
                    is_custom: false,
                };
            } else {
                next[index] = {
                    ...current,
                    item_type: newCategory,
                    inventory_id: null,
                    service_id: null,
                    is_custom: true,
                };
            }
            return next;
        });
    };

    const handleSelectInclusionItem = (index, selectedKey, matchingItems) => {
        if (selectedKey === '__custom__') {
            setInclusions((prev) => {
                const next = [...prev];
                next[index] = { ...next[index], inventory_id: null, service_id: null, is_custom: true };
                return next;
            });
            return;
        }

        const selectedItem = (matchingItems || []).find(
            (item) => String(item.key) === String(selectedKey) || String(item.id) === String(selectedKey)
        );

        if (!selectedItem) {
            setInclusions((prev) => {
                const next = [...prev];
                next[index] = { ...next[index], inventory_id: '', service_id: '', name: '', unit_price: 0 };
                return next;
            });
            return;
        }

        setInclusions((prev) => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                inventory_id: selectedItem.kind === 'inventory' ? selectedItem.id : null,
                service_id: selectedItem.kind === 'service' ? selectedItem.id : null,
                name: selectedItem.name,
                unit_price: selectedItem.price || 0,
                is_custom: false,
            };
            return next;
        });
    };

    const handleToggleCustomInclusion = (index, isCustom) => {
        setInclusions((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], is_custom: isCustom };
            return next;
        });
    };

    const handleUpdateInclusion = (index, field, value) => {
        setInclusions((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleRemoveInclusion = (index) => {
        setInclusions((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    };

    const inclusionsTotal = inclusions.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unit_price) || 0;
        return sum + qty * price;
    }, 0);

    const getTypeBtnStyle = (typeName = '') => {
        const t = (typeName || '').toLowerCase();
        if (t.includes('tire')) return 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300';
        if (t.includes('wheel') || t.includes('rim')) return 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/40 text-cyan-300';
        if (t.includes('oil') || t.includes('fluid') || t.includes('lube') || t.includes('material'))
            return 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
        if (t.includes('charge') || t.includes('fee')) return 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/40 text-purple-300';
        if (t.includes('battery')) return 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/40 text-yellow-300';
        if (t.includes('brake')) return 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/40 text-rose-300';
        if (t.includes('labor') || t.includes('service')) return 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/40 text-blue-300';
        return 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200';
    };

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

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const cleanedInclusions = inclusions
                .filter((inc) => (inc.name || '').trim())
                .map((inc) => ({
                    id: inc.id || Date.now(),
                    item_type: inc.item_type || 'Products',
                    inventory_id: inc.inventory_id || null,
                    service_id: inc.service_id || null,
                    name: (inc.name || '').trim(),
                    quantity: parseFloat(inc.quantity) || 1,
                    unit_price: parseFloat(inc.unit_price) || 0,
                    total_price: Number(((parseFloat(inc.quantity) || 1) * (parseFloat(inc.unit_price) || 0)).toFixed(2)),
                }));

            await api.put(`/inventory/${id}`, {
                ...data,
                inclusions: cleanedInclusions,
            });
            navigate('/inventory');
        } catch (error) {
            console.error('Failed to update inventory item', error);
            alert(error.response?.data?.message || 'Failed to update item');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-white text-center">Loading inventory data...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
            </button>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
                <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-slate-800">
                    <div className="h-12 w-12 bg-blue-600/20 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                        <ArchiveBoxIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Inventory Item</h1>
                        <p className="text-slate-400 text-sm">Update stock information, pricing, or bundled inclusions for this part.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Item Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Part / Package Name</label>
                            <input {...register('name')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Oil Filter / Oil Change Package" />
                            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Type / Category</label>
                            <div className="relative">
                                <select
                                    {...register('type')}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select Type (optional)</option>
                                    {itemTypes.map(t => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            {errors.type && <p className="mt-1 text-xs text-red-400">{errors.type.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Keyword / Search Tags</label>
                            <input
                                {...register('keyword')}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="e.g. filter, oil, engine, lubrication, kit"
                            />
                            {errors.keyword && <p className="mt-1 text-xs text-red-400">{errors.keyword.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Part Number / SKU</label>
                            <input {...register('part_number')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="FLT-12345" />
                            {errors.part_number && <p className="mt-1 text-xs text-red-400">{errors.part_number.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Brand</label>
                            <input {...register('brand')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Genuine / Bosch" />
                            {errors.brand && <p className="mt-1 text-xs text-red-400">{errors.brand.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Current Stock Quantity</label>
                            <input type="number" {...register('stock_quantity')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0" />
                            {errors.stock_quantity && <p className="mt-1 text-xs text-red-400">{errors.stock_quantity.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Reorder Level (Alert)</label>
                            <input type="number" {...register('reorder_level')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="5" />
                            {errors.reorder_level && <p className="mt-1 text-xs text-red-400">{errors.reorder_level.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Unit Price / Cost (₱)</label>
                            <input type="number" step="0.01" {...register('unit_price')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0.00" />
                            {errors.unit_price && <p className="mt-1 text-xs text-red-400">{errors.unit_price.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Markup Rate (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register('markup_rate')}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-8"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">%</span>
                            </div>
                            {errors.markup_rate && <p className="mt-1 text-xs text-red-400">{errors.markup_rate.message}</p>}
                            {parseFloat(markupRate) > 0 && parseFloat(unitPrice) > 0 && (
                                <p className="mt-1.5 text-xs text-emerald-400">
                                    Est. Selling Price: ₱{estSellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Supplier (Optional)</label>
                        <select {...register('supplier_id')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all">
                            <option value="">Select Supplier</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Section: Package Inclusions & Charges (Kits / Bundles) */}
                    <div className="space-y-4 bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                        <CubeIcon className="h-4 w-4 text-emerald-400" />
                                        Package Inclusions & Charges (Bundle / Kit)
                                    </h3>
                                    <Link
                                        to="/inventory-types"
                                        target="_blank"
                                        className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-1 font-medium transition-colors"
                                        title="Manage types in the Item Types table"
                                    >
                                        <TagIcon className="h-3 w-3" />
                                        <span>Item Types Table</span>
                                        <ArrowTopRightOnSquareIcon className="h-2.5 w-2.5 opacity-70" />
                                    </Link>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Attach bundled parts, fluids, tires, services, or extra items included in this inventory item.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {allInclusionTypes.map((typeName) => (
                                    <button
                                        key={typeName}
                                        type="button"
                                        onClick={() => handleAddCustomInclusion(typeName)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all shadow-xs cursor-pointer flex items-center gap-1 ${getTypeBtnStyle(typeName)}`}
                                        title={`Add ${typeName} inclusion`}
                                    >
                                        <span className="font-bold">+</span>
                                        <span>{typeName}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Searchable Quick-Picker */}
                        <div className="relative" ref={quickSearchRef}>
                            <div className="relative flex items-center bg-slate-900 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl transition-all shadow-sm">
                                <MagnifyingGlassIcon className="h-4 w-4 text-blue-400 absolute left-3 pointer-events-none" />
                                <input
                                    type="text"
                                    value={quickSearchTerm}
                                    onChange={(e) => {
                                        setQuickSearchTerm(e.target.value);
                                        setIsQuickSearchOpen(true);
                                    }}
                                    onFocus={() => setIsQuickSearchOpen(true)}
                                    placeholder="Search items by keyword or description (e.g. Synthetic Oil, PMS, Brake, 5W-30)..."
                                    className="w-full pl-9 pr-9 py-2 bg-transparent text-white text-xs placeholder:text-slate-400 focus:outline-none"
                                />
                                {quickSearchTerm ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuickSearchTerm('');
                                            setIsQuickSearchOpen(false);
                                        }}
                                        className="absolute right-2.5 p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 cursor-pointer"
                                        title="Clear search"
                                    >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                    </button>
                                ) : (
                                    <CubeIcon className="h-4 w-4 text-slate-500 absolute right-3 pointer-events-none" />
                                )}
                            </div>

                            {/* Dropdown Menu Results */}
                            {isQuickSearchOpen && (
                                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-800/80 backdrop-blur-md">
                                    {filteredQuickSearchItems.length === 0 ? (
                                        <div className="p-4 text-center">
                                            <p className="text-xs text-slate-300 font-medium">
                                                {quickSearchTerm ? `No items found matching "${quickSearchTerm}"` : 'No items available'}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-1">
                                                Try searching by keyword, brand, description, or part name.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="px-3 py-1.5 bg-slate-800/80 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex justify-between items-center sticky top-0 backdrop-blur-md">
                                                <span>{filteredQuickSearchItems.length} Available Items</span>
                                                <span className="text-blue-400 font-normal">Click item to add as inclusion</span>
                                            </div>
                                            {filteredQuickSearchItems.map((inv) => {
                                                const isService = inv.item_kind === 'service';
                                                const sellingPrice = inv.selling_price ?? inv.unit_price ?? 0;

                                                return (
                                                    <button
                                                        key={inv.key || `${inv.item_kind || 'inv'}_${inv.id}`}
                                                        type="button"
                                                        onClick={() => handleSelectQuickSearchItem(inv)}
                                                        className="w-full text-left px-3.5 py-2.5 hover:bg-blue-600/15 hover:border-l-2 hover:border-blue-500 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getItemTypeBadge(inv.type)}`}>
                                                                    {inv.type || (isService ? 'Service' : 'Product')}
                                                                </span>
                                                                <span className="font-semibold text-white text-xs group-hover:text-blue-300 truncate">
                                                                    {inv.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                                                                {inv.part_number && (
                                                                    <span className="text-slate-500 font-mono text-[10px]">#{inv.part_number}</span>
                                                                )}
                                                                {inv.brand && (
                                                                    <span className="text-slate-400 text-[11px]">Brand: {inv.brand}</span>
                                                                )}
                                                                {inv.keyword && (
                                                                    <span className="px-1.5 py-0.2 bg-slate-800 text-blue-300 rounded border border-slate-700/80 text-[10px]">
                                                                        Tags: {inv.keyword}
                                                                    </span>
                                                                )}
                                                                {inv.description && (
                                                                    <span className="text-slate-400 truncate max-w-xs italic text-[11px]">
                                                                        {inv.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="font-bold text-emerald-400 text-xs">
                                                                ₱{Number(sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                            {isService ? (
                                                                <div className="text-[10px] text-blue-400 font-medium">Service</div>
                                                            ) : (
                                                                <div className={`text-[10px] ${inv.stock_quantity > 0 ? 'text-slate-400' : 'text-red-400 font-semibold'}`}>
                                                                    Stock: {inv.stock_quantity ?? 0}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Inclusions List Table */}
                        {inclusions.length === 0 ? (
                            <div className="py-6 px-4 border border-dashed border-slate-800 rounded-xl text-center">
                                <CubeIcon className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-xs font-medium text-slate-400">
                                    No inclusions added yet (Standard single item).
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Use the search bar above or click the "+ Category" buttons if this item is a bundle or kit.
                                </p>
                            </div>
                        ) : (
                            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                                <div className="grid grid-cols-12 gap-2 bg-slate-900 px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                    <span className="col-span-3">Category</span>
                                    <span className="col-span-4">Item / Charge</span>
                                    <span className="col-span-2 text-center">Qty</span>
                                    <span className="col-span-2 text-right">Price (₱)</span>
                                    <span className="col-span-1 text-center"></span>
                                </div>

                                {inclusions.map((inc, idx) => {
                                    const matches = getCategoryMatchingItems(inc.item_type || '');
                                    const hasMatches = matches.length > 0;

                                    return (
                                        <div key={inc.id || idx} className="grid grid-cols-12 gap-2 items-center px-3 py-2 bg-slate-950/60 text-xs">
                                            {/* Category Selector */}
                                            <div className="col-span-3">
                                                <select
                                                    value={inc.item_type || (allInclusionTypes[0] || 'Products')}
                                                    onChange={(e) => handleCategoryChange(idx, e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
                                                >
                                                    {allInclusionTypes.map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Item / Charge Name */}
                                            <div className="col-span-4">
                                                {hasMatches && !inc.is_custom ? (
                                                    <div className="flex items-center gap-1">
                                                        <select
                                                            value={
                                                                inc.service_id
                                                                    ? `srv_${inc.service_id}`
                                                                    : inc.inventory_id
                                                                    ? `inv_${inc.inventory_id}`
                                                                    : (matches.find((m) => m.name?.toLowerCase() === inc.name?.toLowerCase())?.key || '')
                                                            }
                                                            onChange={(e) => handleSelectInclusionItem(idx, e.target.value, matches)}
                                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate cursor-pointer"
                                                        >
                                                            <option value="">
                                                                -- Select {inc.item_type || 'Item'} ({matches.length}) --
                                                            </option>
                                                            {matches.map((item) => (
                                                                <option key={item.key} value={item.key}>
                                                                    {item.label}
                                                                </option>
                                                            ))}
                                                            <option value="__custom__">✏️ Custom / Manual item name...</option>
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleCustomInclusion(idx, true)}
                                                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded shrink-0 cursor-pointer"
                                                            title="Switch to custom text input"
                                                        >
                                                            <PencilSquareIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Item or fee name..."
                                                            value={inc.name || ''}
                                                            onChange={(e) => handleUpdateInclusion(idx, 'name', e.target.value)}
                                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                        {hasMatches && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleCustomInclusion(idx, false)}
                                                                className="px-1.5 py-1 text-[10px] text-blue-400 hover:bg-blue-500/10 rounded shrink-0 font-medium cursor-pointer"
                                                                title="Switch back to catalog dropdown"
                                                            >
                                                                Catalog
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quantity */}
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="any"
                                                    value={inc.quantity}
                                                    onChange={(e) => handleUpdateInclusion(idx, 'quantity', e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>

                                            {/* Price */}
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    value={inc.unit_price}
                                                    onChange={(e) => handleUpdateInclusion(idx, 'unit_price', e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>

                                            {/* Remove Button */}
                                            <div className="col-span-1 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveInclusion(idx)}
                                                    className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                                                    title="Remove inclusion"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Inclusions Summary */}
                                <div className="p-3 bg-slate-900/90 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="text-slate-400">
                                        Total Included Items: <span className="text-white font-semibold">{inclusions.length}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-slate-400">
                                            Inclusions Value: <span className="text-blue-400 font-semibold">₱{inclusionsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-800 flex justify-end space-x-4">
                        <button 
                            type="button" 
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? 'Saving...' : 'Update Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditInventory;
