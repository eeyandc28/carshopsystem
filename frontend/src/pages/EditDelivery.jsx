import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import {
    PlusIcon,
    TrashIcon,
    TruckIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';

const EditDelivery = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Header fields
    const [supplierId, setSupplierId]           = useState('');
    const [receivedDate, setReceivedDate]       = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes]                     = useState('');
    const [status, setStatus]                   = useState('received');
    const [deliveryNumber, setDeliveryNumber]   = useState('');

    // Line items
    const [items, setItems] = useState([]);

    // Lookup data
    const [suppliers, setSuppliers]     = useState([]);
    const [inventories, setInventories] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [submitting, setSubmitting]   = useState(false);
    const [errors, setErrors]           = useState({});

    useEffect(() => {
        const init = async () => {
            try {
                const [suppRes, invRes, delivRes] = await Promise.all([
                    api.get('/suppliers?per_page=200'),
                    api.get('/inventory?per_page=500'),
                    api.get('/deliveries/' + id),
                ]);

                setSuppliers(suppRes.data.data ?? suppRes.data);
                setInventories(invRes.data.data ?? invRes.data);

                const d = delivRes.data;
                setDeliveryNumber(d.delivery_number ?? '');
                setSupplierId(d.supplier_id ? String(d.supplier_id) : '');
                setReceivedDate(d.received_date ? d.received_date.split('T')[0] : '');
                setReferenceNumber(d.reference_number ?? '');
                setNotes(d.notes ?? '');
                setStatus(d.status ?? 'received');

                setItems(
                    (d.items ?? []).map(item => ({
                        inventory_id:      String(item.inventory_id),
                        quantity_received: String(item.quantity_received),
                        unit_cost:         String(item.unit_cost),
                        total_cost:        parseFloat(item.unit_cost) * parseInt(item.quantity_received),
                    }))
                );
            } catch (e) {
                console.error('Failed to load delivery', e);
                navigate('/deliveries');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id]);

    const addRow = () => {
        setItems(prev => [...prev, { inventory_id: '', quantity_received: '', unit_cost: '', total_cost: 0 }]);
    };

    const removeRow = (idx) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    const updateRow = (idx, field, value) => {
        setItems(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            const qty  = parseFloat(next[idx].quantity_received) || 0;
            const cost = parseFloat(next[idx].unit_cost) || 0;
            next[idx].total_cost = qty * cost;

            if (field === 'inventory_id') {
                const inv = inventories.find(i => String(i.id) === String(value));
                if (inv && !next[idx].unit_cost) {
                    next[idx].unit_cost  = inv.unit_price ?? '';
                    next[idx].total_cost = qty * (parseFloat(inv.unit_price) || 0);
                }
            }
            return next;
        });
    };

    const grandTotal = items.reduce((s, r) => s + (parseFloat(r.total_cost) || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        const errs = {};
        if (!receivedDate) errs.received_date = 'Date is required.';
        items.forEach((item, i) => {
            if (!item.inventory_id)          errs[`items.${i}.inventory_id`]      = 'Select an item.';
            if (!item.quantity_received || item.quantity_received < 1) errs[`items.${i}.quantity_received`] = 'Min 1.';
            if (item.unit_cost === '')       errs[`items.${i}.unit_cost`]         = 'Enter cost.';
        });
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSubmitting(true);
        try {
            const payload = {
                supplier_id:      supplierId || null,
                received_date:    receivedDate,
                reference_number: referenceNumber || null,
                notes:            notes || null,
                status,
                items: items.map(r => ({
                    inventory_id:       parseInt(r.inventory_id),
                    quantity_received:  parseInt(r.quantity_received),
                    unit_cost:          parseFloat(r.unit_cost),
                })),
            };
            await api.put('/deliveries/' + id, payload);
            navigate('/deliveries/' + id);
        } catch (e) {
            if (e.response?.data?.errors) {
                setErrors(e.response.data.errors);
            } else {
                alert('Failed to update delivery. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all";
    const labelClass = "block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1";

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <svg className="animate-spin h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/deliveries/' + id)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">Edit Delivery</h1>
                        <span className="text-sm font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg">
                            {deliveryNumber}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-0.5">
                        Stock will be reversed from old values and re-applied with the new quantities on save.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Delivery Header Card */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-9 w-9 bg-amber-600/20 rounded-xl flex items-center justify-center">
                            <PencilSquareIcon className="h-5 w-5 text-amber-400" />
                        </div>
                        <h2 className="text-base font-bold text-white">Delivery Information</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <label className={labelClass}>Supplier</label>
                            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={inputClass}>
                                <option value="">— No supplier —</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Received Date <span className="text-red-400">*</span></label>
                            <input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} className={inputClass} />
                            {errors.received_date && <p className="text-red-400 text-xs mt-1 ml-1">{errors.received_date}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Reference / DR No.</label>
                            <input type="text" placeholder="e.g. DR-2026-001" value={referenceNumber}
                                onChange={e => setReferenceNumber(e.target.value)} className={inputClass} />
                        </div>

                        <div>
                            <label className={labelClass}>Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                                <option value="received">Received (updates stock)</option>
                                <option value="draft">Draft (no stock update)</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label className={labelClass}>Notes</label>
                            <input type="text" placeholder="Optional notes..." value={notes}
                                onChange={e => setNotes(e.target.value)} className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* Line Items Card */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                        <h2 className="text-base font-bold text-white">Items Received</h2>
                        <button type="button" onClick={addRow}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-all text-sm font-semibold">
                            <PlusIcon className="h-4 w-4" /> Add Item
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/40 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3 font-semibold">#</th>
                                    <th className="px-4 py-3 font-semibold w-64">Inventory Item</th>
                                    <th className="px-4 py-3 font-semibold">Part No.</th>
                                    <th className="px-4 py-3 font-semibold w-28">Qty Received</th>
                                    <th className="px-4 py-3 font-semibold w-32">Unit Cost</th>
                                    <th className="px-4 py-3 font-semibold text-right w-32">Total</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {items.map((row, idx) => {
                                    const selectedInv = inventories.find(i => String(i.id) === String(row.inventory_id));
                                    return (
                                        <tr key={idx} className="hover:bg-slate-800/20">
                                            <td className="px-4 py-3 text-slate-500 text-sm">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={row.inventory_id}
                                                    onChange={e => updateRow(idx, 'inventory_id', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                >
                                                    <option value="">— Select item —</option>
                                                    {inventories.map(inv => (
                                                        <option key={inv.id} value={String(inv.id)}>{inv.name}</option>
                                                    ))}
                                                </select>
                                                {errors[`items.${idx}.inventory_id`] && (
                                                    <p className="text-red-400 text-xs mt-1">{errors[`items.${idx}.inventory_id`]}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-sm">
                                                {selectedInv?.part_number || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number" min="1" placeholder="0"
                                                    value={row.quantity_received}
                                                    onChange={e => updateRow(idx, 'quantity_received', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right"
                                                />
                                                {errors[`items.${idx}.quantity_received`] && (
                                                    <p className="text-red-400 text-xs mt-1">{errors[`items.${idx}.quantity_received`]}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">&#8369;</span>
                                                    <input
                                                        type="number" min="0" step="0.01" placeholder="0.00"
                                                        value={row.unit_cost}
                                                        onChange={e => updateRow(idx, 'unit_cost', e.target.value)}
                                                        className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right"
                                                    />
                                                </div>
                                                {errors[`items.${idx}.unit_cost`] && (
                                                    <p className="text-red-400 text-xs mt-1">{errors[`items.${idx}.unit_cost`]}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-sm font-bold text-emerald-400">
                                                    &#8369;{(parseFloat(row.total_cost) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {items.length > 1 && (
                                                    <button type="button" onClick={() => removeRow(idx)}
                                                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Grand Total */}
                    <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                            {items.length} item{items.length !== 1 ? 's' : ''} &middot;&nbsp;
                            {items.reduce((s, r) => s + (parseInt(r.quantity_received) || 0), 0)} pcs total
                        </span>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-bold">Grand Total</p>
                            <p className="text-xl font-bold text-emerald-400">
                                &#8369;{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stock warning */}
                <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <PencilSquareIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-300 text-sm">
                        <strong>Saving will reverse previous stock changes</strong> and apply the new quantities. Make sure all items and quantities are correct before saving.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => navigate('/deliveries/' + id)}
                        className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all text-sm font-semibold">
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 text-sm font-semibold disabled:opacity-50">
                        {submitting ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                        ) : <CheckCircleIcon className="h-4 w-4" />}
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditDelivery;
