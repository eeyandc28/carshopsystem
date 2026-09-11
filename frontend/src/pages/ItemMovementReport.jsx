import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    CalendarIcon,
    DocumentArrowDownIcon,
    BoltIcon,
    ClockIcon,
    MinusCircleIcon,
    CubeIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';

const TABS = [
    { key: 'all',    label: 'All Items',     color: 'blue'   },
    { key: 'fast',   label: 'Fast Moving',   color: 'emerald'},
    { key: 'normal', label: 'Normal Moving', color: 'amber'  },
    { key: 'slow',   label: 'Slow Moving',   color: 'red'    },
];

const badgeClass = {
    fast:   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    normal: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    slow:   'bg-red-500/15 text-red-400 border border-red-500/30',
};

const tabActiveClass = {
    all:    'bg-blue-600 text-white shadow-lg shadow-blue-500/20',
    fast:   'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
    normal: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
    slow:   'bg-red-600 text-white shadow-lg shadow-red-500/20',
};

const ItemMovementReport = () => {
    const [data, setData]       = useState([]);
    const [summary, setSummary] = useState({ total_items: 0, fast_moving_count: 0, slow_moving_count: 0, normal_count: 0, total_value_moved: 0, total_qty_moved: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab]     = useState('all');
    const [search, setSearch]           = useState('');
    const [startDate, setStartDate]     = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate]         = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => { fetchReport(); }, [startDate, endDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/item-movement', { params: { start_date: startDate, end_date: endDate } });
            setData(res.data.data);
            setSummary(res.data.summary);
        } catch (e) {
            console.error('Failed to load item movement report', e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        let rows = activeTab === 'all' ? data : data.filter(d => d.classification === activeTab);
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(r =>
                r.name.toLowerCase().includes(q) ||
                r.part_number?.toLowerCase().includes(q) ||
                r.brand?.toLowerCase().includes(q)
            );
        }
        return rows;
    }, [data, activeTab, search]);

    const generatePDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const L = 14; // left margin

        // ---- TITLE ----
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(30, 41, 59);
        doc.text('ITEM MOVEMENT REPORT', L, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Period: ' + startDate + ' to ' + endDate, L, 28);
        doc.text('Generated: ' + new Date().toLocaleString(), L, 34);

        // ---- SUMMARY BANNER ----
        const bw = pageW - L * 2;
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(L, 38, bw, 22, 2, 2, 'FD');

        const summaryItems = [
            ['TOTAL ITEMS', String(summary.total_items)],
            ['FAST MOVING', String(summary.fast_moving_count)],
            ['NORMAL',      String(summary.normal_count)],
            ['SLOW MOVING', String(summary.slow_moving_count)],
        ];
        const colW = bw / 4;
        summaryItems.forEach(([label, val], i) => {
            const x = L + colW * i + 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text(label, x, 47);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(30, 41, 59);
            doc.text(val, x, 55);
        });

        // ---- TABLE ----
        const source = activeTab === 'all' ? data : data.filter(d => d.classification === activeTab);

        const rows = source.map(r => [
            r.name,
            r.part_number || '-',
            r.brand || '-',
            r.classification.toUpperCase(),
            r.total_quantity.toFixed(2),
            String(r.usage_count),
            'PHP ' + r.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            String(r.stock_quantity),
        ]);

        autoTable(doc, {
            startY: 65,
            margin: { left: L, right: L },
            tableWidth: pageW - L * 2,
            head: [['Item Name', 'Part No.', 'Brand', 'Class', 'Qty Used', 'Times Used', 'Value (PHP)', 'Stock']],
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
                0: { cellWidth: 70 },
                1: { cellWidth: 30 },
                2: { cellWidth: 28 },
                3: { cellWidth: 22, halign: 'center' },
                4: { cellWidth: 22, halign: 'right' },
                5: { cellWidth: 22, halign: 'center' },
                6: { cellWidth: 46, halign: 'right', fontStyle: 'bold' },
                7: { cellWidth: 29, halign: 'center' },
            },
            didDrawPage: (hookData) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    'Page ' + hookData.pageNumber + ' of ' + pageCount,
                    pageW - L,
                    doc.internal.pageSize.getHeight() - 8,
                    { align: 'right' }
                );
            },
        });

        doc.save('ItemMovementReport_' + startDate + '_to_' + endDate + '.pdf');
    };



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Item Movement Report</h1>
                    <p className="text-slate-400 text-sm mt-1">Identify fast-moving and slow-moving inventory items.</p>
                </div>
                <button
                    onClick={generatePDF}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm font-semibold"
                >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                    Export PDF
                </button>
            </div>

            {/* Date Range */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">From Date</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">To Date</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Search</label>
                        <MagnifyingGlassIcon className="absolute left-3 top-[calc(50%+6px)] -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Name, part no., brand…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Items',   value: summary.total_items,         icon: CubeIcon,         color: 'blue'   },
                    { label: 'Fast Moving',   value: summary.fast_moving_count,   icon: BoltIcon,         color: 'emerald'},
                    { label: 'Normal Moving', value: summary.normal_count,         icon: MinusCircleIcon,  color: 'amber'  },
                    { label: 'Slow Moving',   value: summary.slow_moving_count,   icon: ClockIcon,        color: 'red'    },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-${color}-600/20 text-${color}-400`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">{label}</p>
                            <p className="text-2xl font-bold text-white">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === t.key ? tabActiveClass[t.key] : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'}`}
                    >
                        <FunnelIcon className="h-4 w-4" />
                        {t.label}
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === t.key ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {t.key === 'all' ? data.length :
                             t.key === 'fast' ? summary.fast_moving_count :
                             t.key === 'slow' ? summary.slow_moving_count :
                             summary.normal_count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-5 py-4 font-semibold">Item / Part No.</th>
                                <th className="px-5 py-4 font-semibold">Brand</th>
                                <th className="px-5 py-4 font-semibold">Supplier</th>
                                <th className="px-5 py-4 font-semibold text-center">Classification</th>
                                <th className="px-5 py-4 font-semibold text-right">Qty Used</th>
                                <th className="px-5 py-4 font-semibold text-center">Times Used</th>
                                <th className="px-5 py-4 font-semibold text-right">Value Moved</th>
                                <th className="px-5 py-4 font-semibold text-right">Stock Left</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-500">
                                            <svg className="animate-spin h-7 w-7 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-sm">Analysing item movement…</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center text-slate-500 text-sm">
                                        No items found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{item.name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{item.part_number || '—'}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-300">{item.brand || '—'}</td>
                                        <td className="px-5 py-4 text-sm text-slate-300">{item.supplier}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${badgeClass[item.classification]}`}>
                                                {item.classification === 'fast'   && <BoltIcon className="h-3 w-3" />}
                                                {item.classification === 'slow'   && <ClockIcon className="h-3 w-3" />}
                                                {item.classification === 'normal' && <MinusCircleIcon className="h-3 w-3" />}
                                                {item.classification}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right text-sm font-semibold text-white">
                                            {item.total_quantity > 0 ? item.total_quantity.toFixed(2) : <span className="text-slate-600">—</span>}
                                        </td>
                                        <td className="px-5 py-4 text-center text-sm text-slate-300">{item.usage_count || <span className="text-slate-600">0</span>}</td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`text-sm font-bold ${item.total_value > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                {item.total_value > 0 ? `₱${item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`text-sm font-semibold ${item.stock_quantity <= 0 ? 'text-red-400' : item.stock_quantity <= 5 ? 'text-amber-400' : 'text-slate-300'}`}>
                                                {item.stock_quantity}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer summary */}
                {!loading && filtered.length > 0 && (
                    <div className="px-5 py-3 bg-slate-800/40 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-slate-400">
                        <span>Showing <strong className="text-white">{filtered.length}</strong> items</span>
                        <span>·</span>
                        <span>Total qty moved: <strong className="text-white">{filtered.reduce((s, r) => s + r.total_quantity, 0).toFixed(2)}</strong></span>
                        <span>·</span>
                        <span>Total value: <strong className="text-emerald-400">₱{filtered.reduce((s, r) => s + r.total_value, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemMovementReport;
