import { useState, useEffect } from 'react';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    CalendarIcon, 
    DocumentArrowDownIcon,
    BanknotesIcon,
    ClipboardDocumentCheckIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const SalesReport = () => {
    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState({ total_sales: 0, total_orders: 0, average_order_value: 0 });
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchSalesReport();
    }, [startDate, endDate]);

    const fetchSalesReport = async () => {
        setLoading(true);
        try {
            const params = { start_date: startDate, end_date: endDate };
            const response = await api.get('/reports/sales', { params });
            setSales(response.data.data);
            setSummary(response.data.summary);
        } catch (error) {
            console.error('Failed to fetch sales report', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text('SALES INCOME REPORT', 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

        // Summary Boxes in PDF
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, 45, 182, 25, 3, 3, 'FD');
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('TOTAL REVENUE', 20, 55);
        doc.text('TOTAL ORDERS', 80, 55);
        doc.text('AVG. ORDER VALUE', 140, 55);
        
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${summary.total_sales.toLocaleString()}`, 20, 62);
        doc.text(`${summary.total_orders}`, 80, 62);
        doc.text(`$${summary.average_order_value.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 140, 62);

        // Sales Table
        const tableData = sales.map(s => [
            new Date(s.created_at).toLocaleDateString(),
            s.job_order_number,
            s.vehicle?.customer?.full_name || 'N/A',
            s.vehicle?.plate_number || 'N/A',
            `$${parseFloat(s.actual_cost).toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 80,
            head: [['Date', 'Job Order #', 'Customer', 'Vehicle', 'Income']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
            columnStyles: {
                4: { halign: 'right', fontStyle: 'bold' }
            }
        });

        doc.save(`SalesReport_${startDate}_to_${endDate}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Sales Income Monitoring</h1>
                    <p className="text-slate-400">Track your revenue and service performance.</p>
                </div>
                <button 
                    onClick={generatePDF}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    Export PDF Report
                </button>
            </div>

            {/* Date Filters */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">From Date</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input 
                                type="date"
                                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">To Date</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input 
                                type="date"
                                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-400">
                        <BanknotesIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Revenue</p>
                        <p className="text-2xl font-bold text-white">${summary.total_sales.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                        <ClipboardDocumentCheckIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Job Orders</p>
                        <p className="text-2xl font-bold text-white">{summary.total_orders}</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 bg-purple-600/20 rounded-xl flex items-center justify-center text-purple-400">
                        <ArrowTrendingUpIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Avg. Ticket Size</p>
                        <p className="text-2xl font-bold text-white">${summary.average_order_value.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Order Number</th>
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold text-right">Income</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {sales.length > 0 ? (
                                sales.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-300">
                                            {new Date(s.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-white">{s.job_order_number}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-white">{s.vehicle?.customer?.full_name}</p>
                                            <p className="text-xs text-slate-500">{s.vehicle?.plate_number}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold text-emerald-400">
                                                ${parseFloat(s.actual_cost).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        {loading ? 'Generating report...' : 'No sales found for the selected range.'}
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

export default SalesReport;
