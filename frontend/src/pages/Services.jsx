import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
    WrenchScrewdriverIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    TagIcon,
    CheckCircleIcon,
    XCircleIcon,
    CubeIcon,
    BanknotesIcon,
    ListBulletIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const Services = () => {
    const [services, setServices] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');

    // Modal state for viewing inclusions breakdown
    const [viewingInclusionsService, setViewingInclusionsService] = useState(null);

    // Searchable inventory quick-picker state
    const [quickSearchTerm, setQuickSearchTerm] = useState('');
    const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
    const quickSearchRef = useRef(null);

    const initialFormData = {
        name: '',
        code: '',
        type: '',
        keyword: '',
        price: '',
        description: '',
        inclusions: [],
        is_active: true,
    };
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        fetchServices();
        fetchItemTypes();
        fetchInventory();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (quickSearchRef.current && !quickSearchRef.current.contains(e.target)) {
                setIsQuickSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchItemTypes = async () => {
        try {
            const res = await api.get('/inventory-types');
            setItemTypes(res.data.data || []);
        } catch {
            console.error('Failed to load types');
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await api.get('/inventory?per_page=500');
            setInventoryItems(res.data.data || []);
        } catch {
            console.error('Failed to load inventory');
        }
    };

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/services');
            setServices(res.data.data || []);
        } catch {
            setError('Failed to load services master list.');
        } finally {
            setLoading(false);
        }
    };

    // Dynamically list all types from Item Types master list + inventory types + standard types
    const allInclusionTypes = [
        ...new Set([
            ...itemTypes.map((t) => t.name).filter(Boolean),
            ...inventoryItems.map((i) => i.type).filter(Boolean),
            'Products',
            'Parts',
            'Tires',
            'Wheels',
            'Oils & Fluids',
            'Charge / Fee'
        ])
    ];

    // Helper to get inventory items tagged with a specific category
    const getCategoryMatchingItems = (category) => {
        if (!category) return [];
        const cat = category.trim().toLowerCase();

        return inventoryItems.filter((item) => {
            const itemType = (item.type || '').trim().toLowerCase();
            if (!itemType) return false;

            // Direct match (case-insensitive)
            if (itemType === cat) return true;

            // Singular vs Plural match (e.g. "product" vs "products", "part" vs "parts", "tire" vs "tires", "wheel" vs "wheels")
            const singularItem = itemType.endsWith('s') ? itemType.slice(0, -1) : itemType;
            const singularCat = cat.endsWith('s') ? cat.slice(0, -1) : cat;
            if (singularItem === singularCat) return true;

            // Contains check (e.g. "oil" in "oils & fluids")
            if (cat.includes(singularItem) || itemType.includes(singularCat)) return true;

            return false;
        });
    };

    const openCreateModal = () => {
        setEditingService(null);
        setFormData(initialFormData);
        setQuickSearchTerm('');
        setIsQuickSearchOpen(false);
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (service) => {
        setEditingService(service);
        let parsedInclusions = [];
        if (Array.isArray(service.inclusions)) {
            parsedInclusions = service.inclusions;
        } else if (typeof service.inclusions === 'string') {
            try {
                parsedInclusions = JSON.parse(service.inclusions);
            } catch {
                parsedInclusions = [];
            }
        }

        // Hydrate inclusions: match with inventory if exists
        const hydratedInclusions = parsedInclusions.map((inc) => {
            const matches = getCategoryMatchingItems(inc.item_type || '');
            let matchedItem = null;
            if (inc.inventory_id) {
                matchedItem = inventoryItems.find((i) => String(i.id) === String(inc.inventory_id));
            } else if (inc.name) {
                matchedItem = matches.find(
                    (i) => i.name?.toLowerCase() === inc.name?.toLowerCase()
                );
            }

            return {
                ...inc,
                inventory_id: matchedItem ? matchedItem.id : (inc.inventory_id || null),
                is_custom: !matchedItem && matches.length > 0 ? true : (matches.length === 0),
            };
        });

        setFormData({
            name: service.name || '',
            code: service.code || '',
            type: service.type || '',
            keyword: service.keyword || '',
            price: service.price ?? '',
            description: service.description || '',
            inclusions: hydratedInclusions,
            is_active: Boolean(service.is_active),
        });
        setQuickSearchTerm('');
        setIsQuickSearchOpen(false);
        setError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
        setFormData(initialFormData);
        setQuickSearchTerm('');
        setIsQuickSearchOpen(false);
        setError('');
    };

    // Filtered inventory items for quick-add search bar (by keyword, description, name, part #, brand, type)
    const filteredQuickSearchItems = inventoryItems.filter((inv) => {
        if (!quickSearchTerm.trim()) return true;
        const words = quickSearchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const searchTarget = [
            inv.name,
            inv.keyword,
            inv.description,
            inv.part_number,
            inv.brand,
            inv.barcode_sku,
            inv.type,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return words.every((word) => searchTarget.includes(word));
    });

    // Inclusions management helpers: Select an item from Quick Search
    const handleSelectQuickSearchItem = (inv) => {
        if (!inv) return;

        const cost = parseFloat(inv.unit_price) || 0;
        const markup = parseFloat(inv.markup_rate) || 0;
        const sellingPrice =
            inv.selling_price !== undefined && inv.selling_price !== null
                ? parseFloat(inv.selling_price)
                : Number((cost * (1 + markup / 100)).toFixed(2));

        const newInc = {
            id: Date.now() + Math.random(),
            item_type: inv.type || 'Products',
            inventory_id: inv.id,
            name: inv.name,
            quantity: 1,
            unit_price: sellingPrice || cost || 0,
            is_custom: false,
        };

        setFormData((prev) => ({
            ...prev,
            inclusions: [...prev.inclusions, newInc],
        }));

        setQuickSearchTerm('');
        setIsQuickSearchOpen(false);
    };

    const handleAddCustomInclusion = (type = 'Products', defaultName = '') => {
        const matches = getCategoryMatchingItems(type);
        const newInc = {
            id: Date.now() + Math.random(),
            item_type: type,
            inventory_id: null,
            name: defaultName,
            quantity: 1,
            unit_price: 0,
            is_custom: matches.length === 0,
        };

        setFormData((prev) => ({
            ...prev,
            inclusions: [...prev.inclusions, newInc],
        }));
    };

    // When category changes on an inclusion row
    const handleCategoryChange = (index, newCategory) => {
        const matches = getCategoryMatchingItems(newCategory);
        setFormData((prev) => {
            const next = [...prev.inclusions];
            const current = next[index] || {};

            // Check if current item still belongs to this new category
            const currentItemStillMatches = matches.some((item) => String(item.id) === String(current.inventory_id));

            if (currentItemStillMatches) {
                next[index] = {
                    ...current,
                    item_type: newCategory,
                };
            } else if (matches.length > 0) {
                // Category has matching inventory items - reset to prompt selection
                next[index] = {
                    ...current,
                    item_type: newCategory,
                    inventory_id: '',
                    name: '',
                    unit_price: 0,
                    is_custom: false,
                };
            } else {
                // No inventory items for this category (e.g. Charge / Fee) -> switch to manual text input
                next[index] = {
                    ...current,
                    item_type: newCategory,
                    inventory_id: null,
                    is_custom: true,
                };
            }
            return { ...prev, inclusions: next };
        });
    };

    // When an inventory item is selected from the category's loaded items
    const handleSelectInclusionItem = (index, inventoryId, matchingItems) => {
        if (inventoryId === '__custom__') {
            setFormData((prev) => {
                const next = [...prev.inclusions];
                next[index] = {
                    ...next[index],
                    inventory_id: null,
                    is_custom: true,
                };
                return { ...prev, inclusions: next };
            });
            return;
        }

        const selectedItem = (matchingItems || inventoryItems).find(
            (item) => String(item.id) === String(inventoryId)
        );

        if (!selectedItem) {
            setFormData((prev) => {
                const next = [...prev.inclusions];
                next[index] = {
                    ...next[index],
                    inventory_id: '',
                    name: '',
                    unit_price: 0,
                };
                return { ...prev, inclusions: next };
            });
            return;
        }

        const cost = parseFloat(selectedItem.unit_price) || 0;
        const markup = parseFloat(selectedItem.markup_rate) || 0;
        const sellingPrice =
            selectedItem.selling_price !== undefined && selectedItem.selling_price !== null
                ? parseFloat(selectedItem.selling_price)
                : Number((cost * (1 + markup / 100)).toFixed(2));

        setFormData((prev) => {
            const next = [...prev.inclusions];
            next[index] = {
                ...next[index],
                inventory_id: selectedItem.id,
                name: selectedItem.name,
                unit_price: sellingPrice || cost || 0,
                is_custom: false,
            };
            return { ...prev, inclusions: next };
        });
    };

    // Toggle between loaded dropdown vs manual custom name entry
    const handleToggleCustomInclusion = (index, isCustom) => {
        setFormData((prev) => {
            const next = [...prev.inclusions];
            next[index] = {
                ...next[index],
                is_custom: isCustom,
            };
            return { ...prev, inclusions: next };
        });
    };

    const handleUpdateInclusion = (index, field, value) => {
        setFormData((prev) => {
            const next = [...prev.inclusions];
            next[index] = {
                ...next[index],
                [field]:
                    field === 'quantity'
                        ? Math.max(0.01, parseFloat(value) || 0)
                        : field === 'unit_price'
                        ? Math.max(0, parseFloat(value) || 0)
                        : value,
            };
            return { ...prev, inclusions: next };
        });
    };

    const handleRemoveInclusion = (index) => {
        setFormData((prev) => {
            const next = [...prev.inclusions];
            next.splice(index, 1);
            return { ...prev, inclusions: next };
        });
    };

    // Calculate totals for the modal
    const inclusionsTotal = (formData.inclusions || []).reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unit_price) || 0;
        return sum + qty * price;
    }, 0);

    const baseLaborPrice = parseFloat(formData.price) || 0;
    const totalPackagePrice = baseLaborPrice + inclusionsTotal;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Service name is required.');
            return;
        }
        if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
            setError('Please enter a valid price/labor rate (0 or higher).');
            return;
        }

        setSaving(true);
        setError('');

        const cleanedInclusions = (formData.inclusions || [])
            .filter((inc) => (inc.name || '').trim())
            .map((inc) => ({
                id: inc.id || Date.now(),
                item_type: inc.item_type || 'Products',
                inventory_id: inc.inventory_id || null,
                name: (inc.name || '').trim(),
                quantity: parseFloat(inc.quantity) || 1,
                unit_price: parseFloat(inc.unit_price) || 0,
                total_price: Number(((parseFloat(inc.quantity) || 1) * (parseFloat(inc.unit_price) || 0)).toFixed(2)),
            }));

        const payload = {
            name: formData.name.trim(),
            code: formData.code.trim() || null,
            type: formData.type.trim() || null,
            keyword: formData.keyword.trim() || null,
            price: parseFloat(formData.price),
            description: formData.description.trim() || null,
            inclusions: cleanedInclusions,
            is_active: formData.is_active,
        };

        try {
            if (editingService) {
                await api.put(`/services/${editingService.id}`, payload);
            } else {
                await api.post('/services', payload);
            }
            closeModal();
            fetchServices();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save service.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (service) => {
        if (!window.confirm(`Are you sure you want to delete service "${service.name}"?`)) return;

        setDeletingId(service.id);
        try {
            await api.delete(`/services/${service.id}`);
            fetchServices();
        } catch {
            alert('Failed to delete service.');
        } finally {
            setDeletingId(null);
        }
    };

    // Helper to calculate total inclusions for any service
    const getServiceInclusionsTotal = (service) => {
        const incs = Array.isArray(service.inclusions) ? service.inclusions : [];
        return incs.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            return sum + qty * price;
        }, 0);
    };

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

    // Helper for category badge styling
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

    // Filtered services
    const filteredServices = services.filter((srv) => {
        const matchesSearch =
            !search.trim() ||
            srv.name?.toLowerCase().includes(search.toLowerCase()) ||
            srv.code?.toLowerCase().includes(search.toLowerCase()) ||
            srv.keyword?.toLowerCase().includes(search.toLowerCase()) ||
            srv.description?.toLowerCase().includes(search.toLowerCase());

        const matchesType =
            !selectedTypeFilter ||
            srv.type?.toLowerCase() === selectedTypeFilter.toLowerCase();

        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <WrenchScrewdriverIcon className="h-6 w-6 text-blue-400" />
                        </span>
                        Services Build File
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 ml-13">
                        Master catalog of shop services, labor rates, package inclusions (parts, tires, wheels), and fees.
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm font-semibold cursor-pointer"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Service
                </button>
            </div>

            {/* Global Error Banner */}
            {error && !isModalOpen && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')}>
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Filters Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-80">
                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search services, codes, keywords..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <TagIcon className="h-4 w-4 text-slate-500 hidden sm:block" />
                        <select
                            value={selectedTypeFilter}
                            onChange={(e) => setSelectedTypeFilter(e.target.value)}
                            className="w-full sm:w-48 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            {itemTypes.map((t) => (
                                <option key={t.id} value={t.name}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Services Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-800">
                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Service / Operation
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Code
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Tagged Type
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Inclusions & Package
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                                Labor Rate (₱)
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                                Status
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                    Loading services...
                                </td>
                            </tr>
                        ) : filteredServices.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-14 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <WrenchScrewdriverIcon className="h-10 w-10 text-slate-700" />
                                        <p className="text-base text-slate-400">
                                            {services.length === 0
                                                ? 'No services built yet.'
                                                : 'No services match your search or filter.'}
                                        </p>
                                        {services.length === 0 && (
                                            <button
                                                onClick={openCreateModal}
                                                className="mt-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                                            >
                                                + Build your first service
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredServices.map((service) => {
                                const inclusionsCount = Array.isArray(service.inclusions)
                                    ? service.inclusions.length
                                    : 0;
                                const incTotal = getServiceInclusionsTotal(service);
                                const totalPkg = parseFloat(service.price || 0) + incTotal;

                                return (
                                    <tr
                                        key={service.id}
                                        className="hover:bg-slate-800/30 transition-colors group"
                                    >
                                        {/* Name & Description */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                                    <WrenchScrewdriverIcon className="h-4.5 w-4.5 text-blue-400" />
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-white text-sm">
                                                        {service.name}
                                                    </p>
                                                    {service.keyword && (
                                                        <p className="text-[11px] text-blue-400 font-mono mt-0.5">
                                                            Key: {service.keyword}
                                                        </p>
                                                    )}
                                                    {service.description && (
                                                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                                            {service.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Code */}
                                        <td className="px-6 py-4">
                                            {service.code ? (
                                                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-mono text-xs">
                                                    {service.code}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 text-xs">—</span>
                                            )}
                                        </td>

                                        {/* Tagged Type */}
                                        <td className="px-6 py-4">
                                            {service.type ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-medium text-indigo-400">
                                                    <TagIcon className="h-3 w-3" />
                                                    {service.type}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 text-xs">Untagged</span>
                                            )}
                                        </td>

                                        {/* Inclusions & Package */}
                                        <td className="px-6 py-4">
                                            {inclusionsCount > 0 ? (
                                                <div className="space-y-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingInclusionsService(service)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all cursor-pointer"
                                                        title="Click to view inclusions list"
                                                    >
                                                        <CubeIcon className="h-3.5 w-3.5" />
                                                        <span>{inclusionsCount} Inclusions</span>
                                                        <span className="text-blue-300 font-semibold">
                                                            (₱{incTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                                        </span>
                                                    </button>
                                                    <p className="text-[11px] text-slate-400">
                                                        Package: <strong className="text-emerald-400 font-semibold">₱{totalPkg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500 italic">Labor only</span>
                                            )}
                                        </td>

                                        {/* Standard Labor Price */}
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-white text-sm">
                                                ₱{parseFloat(service.price).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            {service.is_active ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                                    <XCircleIcon className="h-3.5 w-3.5" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(service)}
                                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 flex items-center justify-center transition-all cursor-pointer"
                                                    title="Edit Service & Inclusions"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(service)}
                                                    disabled={deletingId === service.id}
                                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
                                                    title="Delete Service"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Footer Count */}
                {!loading && filteredServices.length > 0 && (
                    <div className="px-6 py-3 bg-slate-800/30 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
                        <span>
                            Showing {filteredServices.length} of {services.length} services
                        </span>
                    </div>
                )}
            </div>

            {/* Quick Inclusions Breakdown Viewer Modal */}
            {viewingInclusionsService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/40">
                            <div>
                                <h3 className="font-bold text-white text-base flex items-center gap-2">
                                    <CubeIcon className="h-5 w-5 text-blue-400" />
                                    {viewingInclusionsService.name} — Inclusions
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Parts, tires, wheels, and charges included with this service.
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingInclusionsService(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                                {(viewingInclusionsService.inclusions || []).map((inc, idx) => {
                                    const qty = parseFloat(inc.quantity) || 1;
                                    const price = parseFloat(inc.unit_price) || 0;
                                    return (
                                        <div key={idx} className="p-3 bg-slate-950/40 flex items-center justify-between text-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getItemTypeBadge(inc.item_type)}`}>
                                                        {inc.item_type || 'part'}
                                                    </span>
                                                    <span className="font-semibold text-white text-sm">
                                                        {inc.name}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400">
                                                    Qty: <strong className="text-slate-200">{qty}</strong> &times; ₱{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-white text-sm">
                                                    ₱{(qty * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Totals Summary */}
                            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-300">
                                    <span>Labor / Service Rate:</span>
                                    <span className="font-medium text-white">
                                        ₱{parseFloat(viewingInclusionsService.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Inclusions Total:</span>
                                    <span className="font-medium text-white">
                                        ₱{getServiceInclusionsTotal(viewingInclusionsService).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-slate-700 flex justify-between text-sm font-bold text-white">
                                    <span className="text-blue-400">Total Service Package:</span>
                                    <span className="text-emerald-400">
                                        ₱{(parseFloat(viewingInclusionsService.price || 0) + getServiceInclusionsTotal(viewingInclusionsService)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex justify-end">
                            <button
                                onClick={() => setViewingInclusionsService(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Add / Edit Service with Inclusions */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/40">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                                    <WrenchScrewdriverIcon className="h-5 w-5 text-blue-400" />
                                    {editingService ? 'Edit Service & Inclusions' : 'Add New Service & Inclusions'}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Build service operations with required parts, tires, wheels, or extra charges.
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Section 1: Basic Service Info */}
                            <div className="space-y-4 bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <WrenchScrewdriverIcon className="h-4 w-4 text-blue-400" />
                                    Service Information
                                </h3>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                        Service Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Engine Tune-Up, Tire Mount & Balance, Brake Pad Replacement"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Service Code
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. SRV-001"
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({ ...formData, code: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Type / Category
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) =>
                                                setFormData({ ...formData, type: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Type (Optional)</option>
                                            {itemTypes.map((t) => (
                                                <option key={t.id} value={t.name}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Keyword Search Tags
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. PMS, oil, tire, brake, battery"
                                            value={formData.keyword}
                                            onChange={(e) =>
                                                setFormData({ ...formData, keyword: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Labor Rate / Base Fee (₱) <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                                ₱
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, price: e.target.value })
                                                }
                                                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                        Description & Notes
                                    </label>
                                    <textarea
                                        rows="2"
                                        placeholder="Scope of work, standard labor time, warranty notes..."
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Section 2: Inclusions & Possible Charges */}
                            <div className="space-y-4 bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                            <CubeIcon className="h-4 w-4 text-emerald-400" />
                                            Package Inclusions & Charges
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Attach parts, tires, wheels, consumables, or standard fees to this service.
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

                                {/* Searchable Inventory Quick-Picker (Search by keyword or description) */}
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
                                                        {quickSearchTerm ? `No items found matching "${quickSearchTerm}"` : 'No inventory items available'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-1">
                                                        Try searching by generic keyword, brand, description, or part name.
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="px-3 py-1.5 bg-slate-800/80 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex justify-between items-center sticky top-0 backdrop-blur-md">
                                                        <span>{filteredQuickSearchItems.length} Available Inventory Items</span>
                                                        <span className="text-blue-400 font-normal">Click item to add as inclusion</span>
                                                    </div>
                                                    {filteredQuickSearchItems.map((inv) => {
                                                        const sellingPrice =
                                                            inv.selling_price !== undefined && inv.selling_price !== null
                                                                 ? parseFloat(inv.selling_price)
                                                                 : Number(((parseFloat(inv.unit_price) || 0) * (1 + (parseFloat(inv.markup_rate) || 0) / 100)).toFixed(2));

                                                        return (
                                                            <button
                                                                key={inv.id}
                                                                type="button"
                                                                onClick={() => handleSelectQuickSearchItem(inv)}
                                                                className="w-full text-left px-3.5 py-2.5 hover:bg-blue-600/15 hover:border-l-2 hover:border-blue-500 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getItemTypeBadge(inv.type)}`}>
                                                                            {inv.type || 'Product'}
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
                                                                        ₱{sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </div>
                                                                    <div className={`text-[10px] ${inv.stock_quantity > 0 ? 'text-slate-400' : 'text-red-400 font-semibold'}`}>
                                                                        Stock: {inv.stock_quantity ?? 0}
                                                                    </div>
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
                                {formData.inclusions.length === 0 ? (
                                    <div className="py-6 px-4 border border-dashed border-slate-800 rounded-xl text-center">
                                        <CubeIcon className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-slate-400">
                                            No inclusions added yet (Labor Only service).
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            Use the dropdown above or click the "+ Part / Tire / Fee" buttons to add included items.
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

                                        {formData.inclusions.map((inc, idx) => {
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
                                                                    value={inc.inventory_id || ''}
                                                                    onChange={(e) => handleSelectInclusionItem(idx, e.target.value, matches)}
                                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate cursor-pointer"
                                                                >
                                                                    <option value="">
                                                                        -- Select {inc.item_type || 'Item'} ({matches.length}) --
                                                                    </option>
                                                                    {matches.map((item) => (
                                                                        <option key={item.id} value={item.id}>
                                                                            {item.name} — ₱{Number(item.selling_price || item.unit_price || 0).toLocaleString()} {item.stock_quantity !== undefined ? `(Stock: ${item.stock_quantity})` : ''}
                                                                        </option>
                                                                    ))}
                                                                    <option value="__custom__">✏️ Custom / Manual item name...</option>
                                                                </select>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleCustomInclusion(idx, true)}
                                                                    title="Type custom name manually"
                                                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 shrink-0 cursor-pointer"
                                                                >
                                                                    <PencilSquareIcon className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="text"
                                                                    placeholder={hasMatches ? `Custom ${inc.item_type} name...` : "Item or fee name..."}
                                                                    value={inc.name || ''}
                                                                    onChange={(e) => handleUpdateInclusion(idx, 'name', e.target.value)}
                                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                                {hasMatches && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleCustomInclusion(idx, false)}
                                                                        title={`Select from tagged ${inc.item_type} list`}
                                                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 shrink-0 cursor-pointer"
                                                                    >
                                                                        <ListBulletIcon className="h-3.5 w-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="col-span-2">
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="any"
                                                            value={inc.quantity}
                                                            onChange={(e) => handleUpdateInclusion(idx, 'quantity', e.target.value)}
                                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs text-center px-1.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                                        />
                                                    </div>

                                                    {/* Unit Price */}
                                                    <div className="col-span-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={inc.unit_price}
                                                            onChange={(e) => handleUpdateInclusion(idx, 'unit_price', e.target.value)}
                                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs text-right px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                                        />
                                                    </div>

                                                    {/* Remove */}
                                                    <div className="col-span-1 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveInclusion(idx)}
                                                            className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                                                            title="Remove inclusion"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Total Package Price Card */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Labor / Service Base Fee:</span>
                                        <span className="font-semibold text-slate-200">
                                            ₱{baseLaborPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Inclusions Total ({formData.inclusions.length} items):</span>
                                        <span className="font-semibold text-blue-400">
                                            ₱{inclusionsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                                        <span className="flex items-center gap-1.5 text-slate-200">
                                            <BanknotesIcon className="h-4 w-4 text-emerald-400" />
                                            Total Package Rate:
                                        </span>
                                        <span className="text-emerald-400">
                                            ₱{totalPackagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Active checkbox */}
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) =>
                                        setFormData({ ...formData, is_active: e.target.checked })
                                    }
                                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-slate-300 cursor-pointer">
                                    Active for Job Orders & Estimates
                                </label>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editingService
                                        ? 'Update Service'
                                        : 'Save Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Services;
