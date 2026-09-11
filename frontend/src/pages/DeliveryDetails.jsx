import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    ArrowLeftIcon,
    DocumentArrowDownIcon,
    TruckIcon,
    CheckCircleIcon,
    ClockIcon,
    CubeIcon,
    CurrencyDollarIcon,
    UserIcon,
    CalendarIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';

const DeliveryDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/deliveries/' + id);
                setDelivery(res.data);
            } catch {
                navigate('/deliveries');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const generatePDF = () => {
        if (!delivery) return;
        const doc = new jsPDF();
        const L = 14;

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.text('DELIVERY RECEIPT', L, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Delivery No: ' + delivery.delivery_number, L, 28);
        doc.text('Date: ' + new Date(delivery.received_date).toLocaleDateString(), L, 34);
        doc.text('DR / Ref No: ' + (delivery.reference_number || 'N/A'), L, 40);
        doc.text('Supplier: ' + (delivery.supplier?.name || 'N/A'), L, 46);
        doc.text('Received By: ' + (delivery.receiver?.name || 'N/A'), L, 52);
        doc.text('Status: ' + delivery.status.toUpperCase(), L, 58);

        if (delivery.notes) {
            doc.text('Notes: ' + delivery.notes, L, 64);
        }

        const startY = delivery.notes ? 72 : 66;

        const rows = delivery.items.map((item, i) => [
            String(i + 1),
            item.inventory?.name || 'N/A',
            item.inventory?.part_number || '-',
            item.inventory?.brand || '-',
            String(item.quantity_received),
            'PHP ' + parseFloat(item.unit_cost).toLocaleString('en-US', { minimumFractionDigits: 2 }),
            'PHP ' + parseFloat(item.total_cost).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        ]);

        autoTable(doc, {
            startY,
            margin: { left: L, right: L },
            head: [['#', 'Item Name', 'Part No.', 'Brand', 'Qty', 'Unit Cost', 'Total']],
            body: rows,
            theme: 'grid',
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [30, 41, 59],
                cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
            },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { cellWidth: 8,  halign: 'center' },
                1: { cellWidth: 55 },
                2: { cellWidth: 28 },
                3: { cellWidth: 28 },
                4: { cellWidth: 14, halign: 'center' },
                5: { cellWidth: 30, halign: 'right' },
                6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
            },
            foot: [[
                '', '', '', '', '', 'GRAND TOTAL',
                'PHP ' + parseFloat(delivery.total_cost ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
            ]],
            footStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
                halign: 'right',
            },
        });

        doc.save('Delivery_' + delivery.delivery_number + '.pdf');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
            </div>
        );
    }

    if (!delivery) return null;

    const totalQty  = delivery.items.reduce((s, i) => s + i.quantity_received, 0);
    const totalCost = delivery.total_cost ?? delivery.items.reduce((s, i) => s + parseFloat(i.total_cost), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/deliveries')}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{delivery.delivery_number}</h1>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                delivery.status === 'received'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                                {delivery.status === 'received'
                                    ? <CheckCircleIcon className="h-3 w-3" />
                                    : <ClockIcon className="h-3 w-3" />}
                                {delivery.status}
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-0.5">Delivery Receipt Details</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link to={'/deliveries/' + id + '/edit'}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 text-sm font-semibold">
                        <PencilSquareIcon className="h-5 w-5" />
                        Edit
                    </Link>
                    <button onClick={generatePDF}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm font-semibold">
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Supplier',     value: delivery.supplier?.name || 'N/A', icon: TruckIcon,           color: 'blue'    },
                    { label: 'Received By',  value: delivery.receiver?.name  || 'N/A', icon: UserIcon,           color: 'purple'  },
                    { label: 'Date',         value: new Date(delivery.received_date).toLocaleDateString(), icon: CalendarIcon, color: 'slate' },
                    { label: 'DR / Ref No.', value: delivery.reference_number || 'N/A', icon: CubeIcon,          color: 'amber'   },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-start gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-${color}-600/20 text-${color}-400`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-slate-500 text-xs">{label}</p>
                            <p className="text-white text-sm font-semibold truncate">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                    <div className="h-11 w-11 bg-blue-600/20 rounded-xl flex items-center justify-center">
                        <CubeIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">Total Line Items</p>
                        <p className="text-2xl font-bold text-white">{delivery.items.length}</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                    <div className="h-11 w-11 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                        <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">Total Qty Received</p>
                        <p className="text-2xl font-bold text-white">{totalQty} <span className="text-slate-500 text-sm font-normal">pcs</span></p>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                    <div className="h-11 w-11 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                        <CurrencyDollarIcon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">Total Delivery Cost</p>
                        <p className="text-2xl font-bold text-emerald-400">
                            &#8369;{parseFloat(totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {delivery.notes && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Notes</p>
                    <p className="text-slate-300 text-sm">{delivery.notes}</p>
                </div>
            )}

            {/* Items Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800">
                    <h2 className="text-base font-bold text-white">Items Received</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-5 py-4 font-semibold">#</th>
                                <th className="px-5 py-4 font-semibold">Item Name</th>
                                <th className="px-5 py-4 font-semibold">Part No.</th>
                                <th className="px-5 py-4 font-semibold">Brand</th>
                                <th className="px-5 py-4 font-semibold">Current Stock</th>
                                <th className="px-5 py-4 font-semibold text-right">Qty Received</th>
                                <th className="px-5 py-4 font-semibold text-right">Unit Cost</th>
                                <th className="px-5 py-4 font-semibold text-right">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {delivery.items.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-5 py-4 text-slate-500 text-sm">{idx + 1}</td>
                                    <td className="px-5 py-4">
                                        <Link to={'/inventory'} className="text-sm font-semibold text-white hover:text-blue-400 transition-colors">
                                            {item.inventory?.name}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-400">{item.inventory?.part_number || '—'}</td>
                                    <td className="px-5 py-4 text-sm text-slate-400">{item.inventory?.brand || '—'}</td>
                                    <td className="px-5 py-4">
                                        <span className={`text-sm font-semibold ${
                                            (item.inventory?.stock_quantity ?? 0) <= 0 ? 'text-red-400' :
                                            (item.inventory?.stock_quantity ?? 0) <= 5 ? 'text-amber-400' : 'text-slate-300'
                                        }`}>
                                            {item.inventory?.stock_quantity ?? 0} pcs
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className="text-sm font-bold text-blue-400">+{item.quantity_received}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right text-sm text-slate-300">
                                        &#8369;{parseFloat(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className="text-sm font-bold text-emerald-400">
                                            &#8369;{parseFloat(item.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-800/40 border-t-2 border-slate-700">
                                <td colSpan="5" className="px-5 py-4 text-slate-400 text-sm font-semibold">
                                    {delivery.items.length} line items
                                </td>
                                <td className="px-5 py-4 text-right font-bold text-blue-400">
                                    +{totalQty}
                                </td>
                                <td className="px-5 py-4 text-right text-slate-400 text-sm font-semibold">Grand Total</td>
                                <td className="px-5 py-4 text-right font-bold text-emerald-400">
                                    &#8369;{parseFloat(totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeliveryDetails;
