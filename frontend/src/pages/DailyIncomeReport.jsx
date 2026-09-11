import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    ChartBarIcon, 
    CalendarIcon,
    CurrencyDollarIcon,
    PrinterIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DailyIncomeReport() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [date]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/reports/daily-income?date=${date}`);
            setReportData(res.data.data);
        } catch (error) {
            console.error('Failed to fetch daily income report:', error);
        } finally {
            setLoading(false);
        }
    };

    const printReport = () => {
        if (!reportData) return;

        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text('DAILY INCOME REPORT', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${reportData.date}`, 15, 30);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 30);

        // Summary Table
        const summaryBody = Object.entries(reportData.summary || {}).map(([method, amount]) => [
            method, 
            `PHP ${parseFloat(amount).toLocaleString()}`
        ]);
        summaryBody.push([{ content: 'TOTAL COLLECTION', styles: { fontStyle: 'bold' } }, { content: `PHP ${parseFloat(reportData.total).toLocaleString()}`, styles: { fontStyle: 'bold' } }]);

        doc.autoTable({
            startY: 40,
            head: [['Payment Method', 'Total Amount']],
            body: summaryBody,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        // Transactions Table
        const txBody = (reportData.payments || []).map(p => [
            p.time,
            p.job_order_number,
            p.customer,
            p.payment_method,
            p.reference_number || '-',
            `PHP ${parseFloat(p.amount).toLocaleString()}`
        ]);

        if (txBody.length > 0) {
            doc.text('Transaction Details', 15, doc.lastAutoTable.finalY + 15);
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Time', 'Job Order', 'Customer', 'Method', 'Reference', 'Amount']],
                body: txBody,
                theme: 'striped',
                headStyles: { fillColor: [52, 73, 94], textColor: 255 },
                styles: { fontSize: 9, cellPadding: 4 }
            });
        }

        window.open(doc.output('bloburl'), '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center">
                        <ChartBarIcon className="h-8 w-8 mr-3 text-emerald-400" />
                        Daily Income Report
                    </h1>
                    <p className="text-slate-400">View revenue collections for a specific day</p>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CalendarIcon className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        />
                    </div>
                    <button
                        onClick={printReport}
                        disabled={!reportData || reportData.payments?.length === 0}
                        className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50 font-semibold"
                    >
                        <PrinterIcon className="h-5 w-5 mr-2" />
                        Print
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
            ) : reportData ? (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-2">Total Collection</p>
                                <p className="text-3xl font-black text-white">
                                    ₱{parseFloat(reportData.total).toLocaleString()}
                                </p>
                            </div>
                            <CurrencyDollarIcon className="h-24 w-24 text-emerald-500/10 absolute -right-4 -bottom-4 z-0" />
                        </div>

                        {Object.entries(reportData.summary || {}).map(([method, amount]) => (
                            <div key={method} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-center">
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">{method}</p>
                                <p className="text-2xl font-bold text-slate-200">
                                    ₱{parseFloat(amount).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                Transaction Details
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-800">
                                <thead className="bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Job Order</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Method</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Reference</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-slate-900 divide-y divide-slate-800">
                                    {reportData.payments?.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                                No collections recorded for this date.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportData.payments.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{p.time}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{p.job_order_number}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{p.customer}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                                        {p.payment_method}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{p.reference_number || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400 text-right">
                                                    ₱{parseFloat(p.amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
