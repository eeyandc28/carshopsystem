import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    ArrowLeftIcon,
    CalendarIcon,
    DocumentArrowDownIcon,
    ArchiveBoxIcon,
    ArrowUpCircleIcon,
    ArrowDownCircleIcon,
} from '@heroicons/react/24/outline';

const StockCard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem]         = useState(null);
    const [movements, setMovements] = useState([]);
    const [summary, setSummary]   = useState({ total_in: 0, total_out: 0 });
    const [loading, setLoading]   = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate]     = useState('');

    useEffect(() => {
        fetchItemDetails();
        fetchMovements();
    }, [id, startDate, endDate]);

    const fetchItemDetails = async () => {
        try {
            const res = await api.get('/inventory/' + id);
            setItem(res.data.data);
        } catch (err) {
            console.error('Failed to fetch item details', err);
        }
    };

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate)   params.end_date   = endDate;

            const res = await api.get('/inventory/' + id + '/movements', { params });
            setMovements(res.data.data ?? []);
            setSummary({
                total_in:  res.data.total_in  ?? 0,
                total_out: res.data.total_out ?? 0,
            });
        } catch (err) {
            console.error('Failed to fetch movements', err);
            setMovements([]);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = () => {
        if (!item) return;
        const doc = new jsPDF();
        const L = 14;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.text('STOCK CARD REPORT', L, 22);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Item: ' + item.name + ' (' + item.part_number + ')', L, 30);
        doc.text('Period: ' + (startDate || 'All Time') + ' to ' + (endDate || 'Present'), L, 36);
        doc.text('Generated: ' + new Date().toLocaleString(), L, 42);

        const rows = movements.map(m => [
            new Date(m.created_at).toLocaleDateString(),
            m.transaction_type,
            (m.reference_type || '') + '\n' + (m.reference_id || ''),
            m.transaction_type === 'IN' ? '+' + m.quantity : '-' + m.quantity,
            String(m.balance_after),
            m.notes || '-',
        ]);

        autoTable(doc, {
            startY: 50,
            margin: { left: L, right: L },
            head: [['Date', 'Type', 'Source / Ref', 'Qty', 'Balance', 'Notes']],
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
                0: { cellWidth: 26 },
                1: { cellWidth: 16, halign: 'center' },
                2: { cellWidth: 50 },
                3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
                4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
                5: { cellWidth: 'auto' },
            },
        });

        doc.save('StockCard_' + item.part_number + '_' + new Date().toISOString().split('T')[0] + '.pdf');
    };

    if (loading && !item) return (
        <div className="flex items-center justify-center py-32">
            <svg className="animate-spin h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
        </div>
    );
    if (!item) return <div className="p-8 text-white text-center">Item not found.</div>;

    return (
        <div className="space-y-6">

            {/* Top toolbar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/inventory')}
                    className="flex items-center text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Inventory
                </button>
                <button
                    onClick={generatePDF}
                    className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-all text-sm font-semibold"
                >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Export PDF
                </button>
            </div>

            {/* Item header card */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-blue-600/20 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                            <ArchiveBoxIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{item.name}</h1>
                            <p className="text-slate-400 font-mono text-sm">{item.part_number} &bull; {item.brand}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="text-right">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Current Stock</p>
                            <p className="text-3xl font-black text-white">{item.stock_quantity}</p>
                        </div>
                        <div className="h-12 w-px bg-slate-800"></div>
                        <div className="text-right">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Unit Price</p>
                            <p className="text-3xl font-black text-emerald-400">&#8369;{item.unit_price}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                    <div className="h-11 w-11 bg-blue-600/20 rounded-xl flex items-center justify-center">
                        <ArchiveBoxIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">Current Stock</p>
                        <p className="text-2xl font-bold text-white">{item.stock_quantity} <span className="text-slate-500 text-sm font-normal">pcs</span></p>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                    <div className="h-11 w-11 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                        <ArrowUpCircleIcon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">Total Received (IN)</p>
                        <p className="text-2xl font-bold text-emerald-400">+{summary.total_in} <span className="text-slate-500 text-sm font-normal">pcs</span></p>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                    <div className="h-11 w-11 bg-rose-600/20 rounded-xl flex items-center justify-center">
                        <ArrowDownCircleIcon className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">Total Used (OUT)</p>
                        <p className="text-2xl font-bold text-rose-400">-{summary.total_out} <span className="text-slate-500 text-sm font-normal">pcs</span></p>
                    </div>
                </div>
            </div>

            {/* Date Filters */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Start Date</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">End Date</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Movement History Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800">
                    <h2 className="text-base font-bold text-white">Stock Movement History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Date &amp; Time</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Source</th>
                                <th className="px-6 py-4 font-semibold text-center">Qty Change</th>
                                <th className="px-6 py-4 font-semibold text-center">Balance</th>
                                <th className="px-6 py-4 font-semibold">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {movements.length > 0 ? movements.map(m => (
                                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-white">{new Date(m.created_at).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-slate-500">{new Date(m.created_at).toLocaleTimeString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${m.transaction_type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {m.transaction_type === 'IN'
                                                ? <ArrowUpCircleIcon className="h-4 w-4" />
                                                : <ArrowDownCircleIcon className="h-4 w-4" />}
                                            {m.transaction_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium bg-slate-800 px-2 py-1 rounded-md text-slate-300">
                                            {m.reference_type}
                                        </span>
                                        {m.reference_id && (
                                            <p className="text-xs text-blue-400 font-semibold mt-1">{m.reference_id}</p>
                                        )}
                                        {m.reference_label && (
                                            <p className="text-[10px] text-slate-500 mt-0.5">{m.reference_label}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-sm font-bold ${m.transaction_type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {m.transaction_type === 'IN' ? '+' : '-'}{m.quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-black text-white">{m.balance_after}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-400 max-w-xs truncate" title={m.notes}>{m.notes || '—'}</p>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-500">
                                            <ArchiveBoxIcon className="h-10 w-10 text-slate-700" />
                                            <span className="text-sm">
                                                {loading ? 'Fetching history...' : 'No stock movements found for this period.'}
                                            </span>
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

export default StockCard;
