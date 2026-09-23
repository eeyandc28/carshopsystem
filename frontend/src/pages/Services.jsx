import { useState, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';

const Services = () => {
    const [services, setServices] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');

    const initialFormData = {
        name: '',
        code: '',
        type: '',
        keyword: '',
        price: '',
        description: '',
        is_active: true,
    };
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        fetchServices();
        fetchItemTypes();
    }, []);

    const fetchItemTypes = async () => {
        try {
            const res = await api.get('/inventory-types');
            setItemTypes(res.data.data || []);
        } catch {
            console.error('Failed to load types');
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

    const openCreateModal = () => {
        setEditingService(null);
        setFormData(initialFormData);
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (service) => {
        setEditingService(service);
        setFormData({
            name: service.name || '',
            code: service.code || '',
            type: service.type || '',
            keyword: service.keyword || '',
            price: service.price ?? '',
            description: service.description || '',
            is_active: Boolean(service.is_active),
        });
        setError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
        setFormData(initialFormData);
        setError('');
    };

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

        const payload = {
            name: formData.name.trim(),
            code: formData.code.trim() || null,
            type: formData.type.trim() || null,
            keyword: formData.keyword.trim() || null,
            price: parseFloat(formData.price),
            description: formData.description.trim() || null,
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
                        Master catalog of shop services, labor rates, and repair operations.
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
                        placeholder="Search services, codes..."
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
                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                                Standard Rate (₱)
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
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                    Loading services...
                                </td>
                            </tr>
                        ) : filteredServices.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-14 text-center text-slate-500">
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
                            filteredServices.map((service) => (
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

                                    {/* Standard Price */}
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
                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 flex items-center justify-center transition-all"
                                                title="Edit Service"
                                            >
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service)}
                                                disabled={deletingId === service.id}
                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-all disabled:opacity-40"
                                                title="Delete Service"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
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

            {/* Modal for Add / Edit Service */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                                <WrenchScrewdriverIcon className="h-5 w-5 text-blue-400" />
                                {editingService ? 'Edit Service' : 'Add New Service'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Service Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Engine Tune-Up, Brake Cleaning"
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

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Keyword
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. oil change, PMS, tune-up, brake, inspection"
                                    value={formData.keyword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, keyword: e.target.value })
                                    }
                                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Standard Rate / Fee (₱) <span className="text-red-400">*</span>
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

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Description / Inclusions
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Scope of work, inclusions, or notes..."
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

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
