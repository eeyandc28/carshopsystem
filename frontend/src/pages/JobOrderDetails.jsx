import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    ArrowLeftIcon, 
    ClipboardDocumentListIcon, 
    TruckIcon, 
    UserIcon, 
    CalendarIcon,
    CurrencyDollarIcon,
    ClockIcon,
    WrenchIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

const statusSteps = [
    { id: 'pending', label: 'Pending' },
    { id: 'diagnosing', label: 'Diagnosing' },
    { id: 'waiting_for_parts', label: 'Waiting for Parts' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'released', label: 'Released' }
];

const JobOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const response = await api.get(`/job-orders/${id}`);
            setOrder(response.data.data);
        } catch (error) {
            console.error('Failed to fetch job order details', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            await api.patch(`/job-orders/${id}`, { status: newStatus });
            fetchOrderDetails();
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const generateInvoice = () => {
        const doc = new jsPDF();
        const now = new Date();
        const dateStr = now.toLocaleDateString();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text('SERVICE INVOICE', 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Car Shop Management System', 14, 28);
        doc.text('123 Service Road, Auto City', 14, 33);
        
        // Invoice Info
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(`Invoice #: INV-${order.order_number.split('-')[1]}`, 140, 22);
        doc.text(`Date: ${dateStr}`, 140, 28);
        doc.text(`Order #: ${order.order_number}`, 140, 34);

        // Horizontal Line
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 40, 196, 40);

        // Bill To / Vehicle Info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('CUSTOMER DETAILS', 14, 50);
        doc.text('VEHICLE DETAILS', 110, 50);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(order.customer?.full_name || 'N/A', 14, 57);
        doc.text(order.customer?.contact_number || 'N/A', 14, 62);
        doc.text(order.customer?.address || 'N/A', 14, 67, { maxWidth: 80 });

        doc.text(`Plate: ${order.vehicle?.plate_number}`, 110, 57);
        doc.text(`Unit: ${order.vehicle?.brand} ${order.vehicle?.model} (${order.vehicle?.year})`, 110, 62);
        doc.text(`VIN: ${order.vehicle?.vin || 'N/A'}`, 110, 67);

        // Service Table
        autoTable(doc, {
            startY: 80,
            head: [['Service Description', 'Status', 'Total']],
            body: [
                [
                    { content: `LABOR: ${order.description}\n\nDiagnosis:\n${order.diagnosis || 'Pending diagnosis'}`, styles: { minCellHeight: 40 } },
                    order.status.toUpperCase().replace('_', ' '),
                    `$${(order.actual_cost || order.estimated_cost || 0).toLocaleString()}`
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 120 },
                1: { halign: 'center' },
                2: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // Summary
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL DUE:', 140, finalY);
        doc.text(`$${(order.actual_cost || order.estimated_cost || 0).toLocaleString()}`, 196, finalY, { align: 'right' });

        // Notes
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('Thank you for your business! Please keep this invoice for your warranty records.', 14, finalY + 20);

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('System Generated Invoice', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

        doc.save(`Invoice_${order.order_number}.pdf`);
    };

    if (loading) return <div className="p-8 text-white text-center">Loading job order...</div>;
    if (!order) return <div className="p-8 text-white text-center">Job order not found.</div>;

    return (
        <div className="space-y-6">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Job Orders
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center">
                        {order.order_number}
                        <span className="ml-4 px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {order.status.replace('_', ' ')}
                        </span>
                    </h1>
                    <p className="text-slate-400">Created on {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-3">
                    <button 
                        onClick={generateInvoice}
                        className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-all text-sm font-semibold"
                    >
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Generate Invoice
                    </button>
                    <button 
                        onClick={() => navigate(`/job-orders/edit/${id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold shadow-lg shadow-blue-500/20"
                    >
                        Edit Order
                    </button>
                </div>
            </div>

            {/* Status Progress Bar */}
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
                <div className="flex items-center min-w-[800px]">
                    {statusSteps.map((step, index) => {
                        const isCurrent = order.status === step.id;
                        const isPast = statusSteps.findIndex(s => s.id === order.status) >= index;
                        
                        return (
                            <div key={step.id} className="flex-1 flex flex-col items-center relative">
                                {/* Line */}
                                {index !== 0 && (
                                    <div className={`absolute left-0 right-1/2 top-4 h-0.5 -translate-y-1/2 ${isPast ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
                                )}
                                {index !== statusSteps.length - 1 && (
                                    <div className={`absolute right-0 left-1/2 top-4 h-0.5 -translate-y-1/2 ${isPast && order.status !== step.id ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
                                )}
                                
                                {/* Node */}
                                <button 
                                    disabled={updating}
                                    onClick={() => updateStatus(step.id)}
                                    className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                                        isCurrent ? 'bg-blue-600 ring-4 ring-blue-500/20 scale-110' : 
                                        isPast ? 'bg-blue-500' : 'bg-slate-800 border border-slate-700'
                                    }`}
                                >
                                    {isPast && !isCurrent ? (
                                        <div className="h-2 w-2 bg-white rounded-full"></div>
                                    ) : (
                                        <div className={`h-2 w-2 rounded-full ${isCurrent ? 'bg-white' : 'bg-slate-600'}`}></div>
                                    )}
                                </button>
                                <span className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-blue-400' : 'text-slate-500'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
                        <h3 className="text-white font-bold mb-6 flex items-center">
                            <WrenchIcon className="h-5 w-5 mr-2 text-blue-400" />
                            Work Description
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Customer Complaint</p>
                                <p className="text-white">{order.description}</p>
                            </div>
                            {order.diagnosis && (
                                <div className="bg-blue-600/5 p-4 rounded-xl border border-blue-500/10">
                                    <p className="text-blue-400 text-xs font-bold uppercase mb-2 tracking-wider">Technical Diagnosis</p>
                                    <p className="text-slate-200">{order.diagnosis}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
                        <h3 className="text-white font-bold mb-6 flex items-center">
                            <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-400" />
                            Used Parts & Labor (Future Implementation)
                        </h3>
                        <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center">
                            <p className="text-slate-500">Add parts from inventory to this job order.</p>
                            <button className="mt-4 text-blue-400 font-semibold hover:text-blue-300">+ Add Parts</button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Vehicle & Customer Info */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Vehicle</p>
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                                    <TruckIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">{order.vehicle?.plate_number}</p>
                                    <p className="text-slate-400 text-xs">{order.vehicle?.brand} {order.vehicle?.model}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Customer</p>
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">{order.customer?.full_name}</p>
                                    <p className="text-slate-400 text-xs">{order.customer?.contact_number}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center text-slate-400 text-sm">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                Promised
                            </span>
                            <span className="text-white text-sm font-medium">
                                {order.promised_at ? new Date(order.promised_at).toLocaleDateString() : 'No date set'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center text-slate-400 text-sm">
                                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                                Estimated
                            </span>
                            <span className="text-white text-sm font-bold">
                                ${order.estimated_cost?.toLocaleString() || '0.00'}
                            </span>
                        </div>
                        {order.actual_cost > 0 && (
                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                <span className="flex items-center text-emerald-400 text-sm">
                                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                                    Actual Cost
                                </span>
                                <span className="text-emerald-400 text-sm font-bold">
                                    ${order.actual_cost?.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobOrderDetails;
