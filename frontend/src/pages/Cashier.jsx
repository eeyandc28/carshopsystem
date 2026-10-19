import { useState, useEffect } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { 
    BanknotesIcon, 
    CheckCircleIcon, 
    XMarkIcon,
    MagnifyingGlassIcon,
    CurrencyDollarIcon,
    TagIcon,
    PrinterIcon
} from '@heroicons/react/24/outline';
import { buildPaymentReceiptHtml, openPaymentReceipt } from '../utils/paymentReceiptTemplate';

export default function Cashier() {
    const { user } = useAuthStore();
    const [jobOrders, setJobOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'paid'
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // Payment form state
    const [discount, setDiscount] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [reference, setReference] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchUnpaidOrders();
    }, []);

    const fetchUnpaidOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/payments/unpaid');
            setJobOrders(res.data.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPayment = (order) => {
        setSelectedOrder(order);
        setDiscount('');
        
        const total = parseFloat(order.actual_cost) || 0;
        const prevDisc = parseFloat(order.discount) || 0;
        const paid = parseFloat(order.amount_paid) || 0;
        const remBalance = Math.max(0, total - prevDisc - paid);
        
        setPaymentAmount(remBalance.toString());
        setPaymentMethod('Cash');
        setReference('');
        setShowPaymentModal(true);
    };

    const handleDiscountChange = (val) => {
        setDiscount(val);
        const discVal = parseFloat(val) || 0;
        if (selectedOrder) {
            const total = parseFloat(selectedOrder.actual_cost) || 0;
            const prevDisc = parseFloat(selectedOrder.discount) || 0;
            const paid = parseFloat(selectedOrder.amount_paid) || 0;
            const remBalance = Math.max(0, total - prevDisc - discVal - paid);
            setPaymentAmount(remBalance.toString());
        }
    };

    const applyPercentageDiscount = (percent) => {
        if (!selectedOrder) return;
        const total = parseFloat(selectedOrder.actual_cost) || 0;
        const calculatedDisc = (total * (percent / 100)).toFixed(2);
        handleDiscountChange(calculatedDisc);
    };

    const processPayment = async (e) => {
        e.preventDefault();
        
        const amount = parseFloat(paymentAmount) || 0;
        const discVal = parseFloat(discount) || 0;

        if (amount <= 0 && discVal <= 0) {
            alert('Please enter a valid payment amount or discount.');
            return;
        }

        try {
            setProcessing(true);
            await api.post('/payments', {
                job_order_id: selectedOrder.id,
                amount: amount,
                discount: discVal,
                payment_method: paymentMethod,
                reference_number: reference,
                payment_date: new Date().toISOString()
            });

            // Auto print receipt
            await printReceipt(selectedOrder, amount, paymentMethod, discVal, reference);

            setShowPaymentModal(false);
            fetchUnpaidOrders(); // refresh list
        } catch (error) {
            console.error('Payment failed:', error);
            alert(error.response?.data?.message || 'Failed to process payment');
        } finally {
            setProcessing(false);
        }
    };

    const printReceipt = async (order, amountPaid = 0, method = 'Cash', appliedDiscount = 0, refNo = '') => {
        let items = [];
        try {
            const itemsRes = await api.get(`/job-orders/${order.id}/items`);
            if (itemsRes.data?.data && Array.isArray(itemsRes.data.data)) {
                items = itemsRes.data.data.map(item => ({
                    description: item.description || 'Service / Part item',
                    quantity: parseFloat(item.quantity) || 1,
                    unitPrice: parseFloat(item.unit_price) || 0,
                    amount: parseFloat(item.total_price || (item.quantity * item.unit_price)) || 0,
                    included: (parseFloat(item.unit_price || 0) === 0) && (item.description || '').toLowerCase().includes('included')
                }));
            }
        } catch (err) {
            console.warn('Could not load order items for receipt, fallback to summary', err);
        }

        const total = parseFloat(order.actual_cost || order.estimated_cost) || 0;
        const prevDisc = parseFloat(order.discount) || 0;
        const totalDisc = prevDisc + (parseFloat(appliedDiscount) || 0);
        const prevPaid = parseFloat(order.amount_paid) || 0;
        const paidNow = parseFloat(amountPaid) || 0;
        const netTotal = Math.max(0, total - totalDisc);
        const remaining = Math.max(0, netTotal - (prevPaid + paidNow));

        const cleanJoNumber = (order.job_order_number || '').replace(/^JO-/, '');
        const siNum = `SI-${cleanJoNumber}`;
        const poNum = order.job_order_number || '';

        const receiptHtml = buildPaymentReceiptHtml({
            siNo: siNum,
            date: new Date().toLocaleDateString(),
            poNo: poNum,
            paymentMethod: method || 'Cash',
            customer: order.vehicle?.customer || order.customer || {},
            vehicle: order.vehicle || {},
            terms: method || 'Cash',
            items: items,
            totalBill: total,
            discount: totalDisc,
            withholding: 0,
            amountPaid: prevPaid + paidNow,
            amountPaidNow: paidNow,
            remainingBalance: remaining,
            receivedBy: user?.name || 'Cashier'
        });

        openPaymentReceipt(receiptHtml, `Payment_Receipt_${siNum}`);
    };

    const pendingCount = jobOrders.filter(o => o.payment_status !== 'paid').length;
    const paidCount = jobOrders.filter(o => o.payment_status === 'paid').length;

    const filteredOrders = jobOrders.filter(order => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (order.job_order_number || '').toLowerCase().includes(term) ||
                              (order.vehicle?.customer?.full_name || '').toLowerCase().includes(term) ||
                              (order.vehicle?.plate_number || '').toLowerCase().includes(term);

        if (!matchesSearch) return false;

        if (activeTab === 'pending') return order.payment_status !== 'paid';
        if (activeTab === 'paid') return order.payment_status === 'paid';
        return true; // 'all'
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center">
                        <BanknotesIcon className="h-8 w-8 mr-3 text-emerald-400" />
                        Cashier Dashboard
                    </h1>
                    <p className="text-slate-400">Process payments and apply discounts for completed job orders</p>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === 'all'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            All ({jobOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === 'pending'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Pending ({pendingCount})
                        </button>
                        <button
                            onClick={() => setActiveTab('paid')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === 'paid'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Paid ({paidCount})
                        </button>
                    </div>

                    <div className="relative w-full sm:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search JO, customer, plate..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Job Order</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer / Vehicle</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Bill</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Balance / Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-900 divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
                                            Loading job orders...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <CheckCircleIcon className="h-12 w-12 text-emerald-500/50 mb-3" />
                                            <p className="text-lg font-medium text-slate-300">No job orders found</p>
                                            <p>No records match the current filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const total = parseFloat(order.actual_cost) || 0;
                                    const disc = parseFloat(order.discount) || 0;
                                    const paid = parseFloat(order.amount_paid) || 0;
                                    const netTotal = Math.max(0, total - disc);
                                    const balance = Math.max(0, netTotal - paid);
                                    const isPaid = order.payment_status === 'paid' || balance === 0;
                                    
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-white">{order.job_order_number}</div>
                                                <div className="text-xs text-slate-500 mt-1 uppercase flex items-center gap-1">
                                                    Status: <span className="text-blue-400 font-semibold">{(order.status || '').replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-300">
                                                    {order.vehicle?.customer?.full_name || 'Walk-in Customer'}
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    {order.vehicle?.plate_number} • {order.vehicle?.make} {order.vehicle?.model}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-medium text-slate-300">
                                                    ₱{total.toLocaleString()}
                                                </div>
                                                {disc > 0 && (
                                                    <div className="text-xs text-purple-400 font-medium">
                                                        Disc: -₱{disc.toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {isPaid ? (
                                                    <div>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                                                            Fully Paid
                                                        </span>
                                                        <div className="text-xs text-slate-500 mt-1">
                                                            Paid: ₱{paid.toLocaleString()}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="text-sm font-bold text-amber-400">
                                                            ₱{balance.toLocaleString()}
                                                        </div>
                                                        {paid > 0 && (
                                                            <div className="text-xs text-emerald-400 mt-1">
                                                                Paid: ₱{paid.toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {isPaid ? (
                                                    <button
                                                        onClick={() => printReceipt(order, 0, order.payments?.[order.payments.length - 1]?.payment_method || 'Cash', 0)}
                                                        className="inline-flex items-center px-3.5 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-colors"
                                                    >
                                                        <PrinterIcon className="h-4 w-4 mr-1.5" />
                                                        Receipt
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenPayment(order)}
                                                        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                                                    >
                                                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                                                        Pay
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedOrder && (() => {
                const total = parseFloat(selectedOrder.actual_cost) || 0;
                const prevDisc = parseFloat(selectedOrder.discount) || 0;
                const paid = parseFloat(selectedOrder.amount_paid) || 0;
                const currDisc = parseFloat(discount) || 0;
                const netBalance = Math.max(0, total - prevDisc - currDisc - paid);

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <BanknotesIcon className="h-5 w-5 mr-2 text-emerald-400" />
                                    Process Payment
                                </h3>
                                <button onClick={() => setShowPaymentModal(false)} className="text-slate-500 hover:text-white">
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <form onSubmit={processPayment} className="p-6 space-y-4">
                                <div className="flex justify-between items-center bg-slate-800/30 p-3 rounded-xl border border-slate-800">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-medium">Job Order</p>
                                        <p className="text-base font-bold text-white">{selectedOrder.job_order_number}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 uppercase font-medium">Total Bill</p>
                                        <p className="text-base font-bold text-slate-200">₱{total.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Discount Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-sm font-medium text-purple-400 flex items-center">
                                            <TagIcon className="h-4 w-4 mr-1 text-purple-400" />
                                            Apply Discount
                                        </label>
                                        <div className="flex space-x-1">
                                            {[5, 10, 15, 20].map(pct => (
                                                <button
                                                    key={pct}
                                                    type="button"
                                                    onClick={() => applyPercentageDiscount(pct)}
                                                    className="px-2 py-0.5 text-xs bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/60 rounded-md transition-colors font-medium"
                                                >
                                                    {pct}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold">₱</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={discount}
                                            onChange={(e) => handleDiscountChange(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-purple-800/60 rounded-xl text-purple-200 font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>
                                
                                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Remaining Payable</span>
                                    <span className="text-xl font-bold text-amber-400">
                                        ₱{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Amount to Pay</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₱</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            max={netBalance + (parseFloat(paymentAmount) || 0)}
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Debit Card">Debit Card</option>
                                        <option value="GCash">GCash</option>
                                        <option value="Maya">Maya</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                </div>

                                {paymentMethod !== 'Cash' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Reference Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="e.g. Transaction ID / Ref #"
                                        />
                                    </div>
                                )}

                                <div className="pt-3 flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50"
                                    >
                                        {processing ? 'Processing...' : 'Confirm Payment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
