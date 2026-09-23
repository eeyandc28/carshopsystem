import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
    TagIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

const InventoryTypes = () => {
    const [types, setTypes]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [adding, setAdding]     = useState(false);
    const [editId, setEditId]     = useState(null);
    const [saving, setSaving]     = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [error, setError]       = useState('');

    const [newForm, setNewForm]   = useState({ name: '', description: '' });
    const [editForm, setEditForm] = useState({ name: '', description: '' });

    const newNameRef  = useRef(null);
    const editNameRef = useRef(null);

    useEffect(() => { fetchTypes(); }, []);

    useEffect(() => {
        if (adding && newNameRef.current) newNameRef.current.focus();
    }, [adding]);

    useEffect(() => {
        if (editId && editNameRef.current) editNameRef.current.focus();
    }, [editId]);

    const fetchTypes = async () => {
        try {
            const res = await api.get('/inventory-types');
            setTypes(res.data.data || []);
        } catch {
            setError('Failed to load inventory types.');
        } finally {
            setLoading(false);
        }
    };

    /* ── ADD ── */
    const handleAdd = async () => {
        if (!newForm.name.trim()) return;
        setSaving(true);
        setError('');
        try {
            await api.post('/inventory-types', newForm);
            setNewForm({ name: '', description: '' });
            setAdding(false);
            fetchTypes();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to create type.');
        } finally {
            setSaving(false);
        }
    };

    /* ── EDIT ── */
    const startEdit = (type) => {
        setEditId(type.id);
        setEditForm({ name: type.name, description: type.description || '' });
        setError('');
    };

    const handleUpdate = async () => {
        if (!editForm.name.trim()) return;
        setSaving(true);
        setError('');
        try {
            await api.put(`/inventory-types/${editId}`, editForm);
            setEditId(null);
            fetchTypes();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to update type.');
        } finally {
            setSaving(false);
        }
    };

    /* ── DELETE ── */
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this type? Existing inventory items will keep their type label.')) return;
        setDeleting(id);
        try {
            await api.delete(`/inventory-types/${id}`);
            fetchTypes();
        } catch {
            setError('Failed to delete type.');
        } finally {
            setDeleting(null);
        }
    };

    /* ── KEY HANDLERS ── */
    const onNewKeyDown  = (e) => { if (e.key === 'Enter') handleAdd();    if (e.key === 'Escape') { setAdding(false); setNewForm({ name: '', description: '' }); } };
    const onEditKeyDown = (e) => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') setEditId(null); };

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                            <TagIcon className="h-5 w-5 text-indigo-400" />
                        </span>
                        Inventory Types
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 ml-12">
                        Manage grouping types for inventory items.
                    </p>
                </div>
                {!adding && (
                    <button
                        onClick={() => { setAdding(true); setEditId(null); setError(''); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm font-semibold"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Type
                    </button>
                )}
            </div>

            {/* Error banner */}
            {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between">
                    {error}
                    <button onClick={() => setError('')}><XMarkIcon className="h-4 w-4" /></button>
                </div>
            )}

            {/* Main card */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">

                {/* Add Row */}
                {adding && (
                    <div className="px-6 py-4 bg-indigo-500/5 border-b border-indigo-500/20 flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <input
                                    ref={newNameRef}
                                    value={newForm.name}
                                    onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                                    onKeyDown={onNewKeyDown}
                                    placeholder="Type name (e.g. Gaskets)"
                                    className="w-full px-3 py-2 bg-slate-800 border border-indigo-500/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <input
                                    value={newForm.description}
                                    onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
                                    onKeyDown={onNewKeyDown}
                                    placeholder="Short description (optional)"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-0.5">
                            <button
                                onClick={handleAdd}
                                disabled={saving || !newForm.name.trim()}
                                className="h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-all disabled:opacity-50"
                                title="Save"
                            >
                                <CheckIcon className="h-4 w-4 text-white" />
                            </button>
                            <button
                                onClick={() => { setAdding(false); setNewForm({ name: '', description: '' }); setError(''); }}
                                className="h-9 w-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all"
                                title="Cancel"
                            >
                                <XMarkIcon className="h-4 w-4 text-slate-300" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-800">
                            <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type Name</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Items</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                                    Loading types...
                                </td>
                            </tr>
                        ) : types.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <TagIcon className="h-10 w-10 text-slate-700" />
                                        <p>No types yet. Click <strong>Add Type</strong> to create one.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            types.map((type) => (
                                <tr
                                    key={type.id}
                                    className={`transition-colors ${editId === type.id ? 'bg-indigo-500/5' : 'hover:bg-slate-800/30'}`}
                                >
                                    {/* NAME cell */}
                                    <td className="px-6 py-4">
                                        {editId === type.id ? (
                                            <input
                                                ref={editNameRef}
                                                value={editForm.name}
                                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                onKeyDown={onEditKeyDown}
                                                className="w-full px-3 py-1.5 bg-slate-800 border border-indigo-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <span className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                                    <TagIcon className="h-4 w-4 text-indigo-400" />
                                                </span>
                                                <span className="font-medium text-white">{type.name}</span>
                                            </div>
                                        )}
                                    </td>

                                    {/* DESCRIPTION cell */}
                                    <td className="px-6 py-4">
                                        {editId === type.id ? (
                                            <input
                                                value={editForm.description}
                                                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                                onKeyDown={onEditKeyDown}
                                                placeholder="Short description"
                                                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <span className="text-sm text-slate-400">{type.description || '—'}</span>
                                        )}
                                    </td>

                                    {/* ITEMS COUNT */}
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-full text-xs text-slate-400">
                                            <ArchiveBoxIcon className="h-3 w-3" />
                                            {type.inventories_count ?? '—'}
                                        </span>
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            {editId === type.id ? (
                                                <>
                                                    <button
                                                        onClick={handleUpdate}
                                                        disabled={saving || !editForm.name.trim()}
                                                        className="h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-all disabled:opacity-50"
                                                        title="Save"
                                                    >
                                                        <CheckIcon className="h-4 w-4 text-white" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditId(null); setError(''); }}
                                                        className="h-8 w-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all"
                                                        title="Cancel"
                                                    >
                                                        <XMarkIcon className="h-4 w-4 text-slate-300" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(type)}
                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 flex items-center justify-center transition-all"
                                                        title="Edit"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(type.id)}
                                                        disabled={deleting === type.id}
                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-all disabled:opacity-40"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Footer count */}
                {!loading && types.length > 0 && (
                    <div className="px-6 py-3 bg-slate-800/30 border-t border-slate-800 text-xs text-slate-500">
                        {types.length} type{types.length !== 1 ? 's' : ''} total
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryTypes;
