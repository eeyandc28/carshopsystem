import { useState, useEffect, useRef, Fragment } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { buildInvoiceHtml, printInvoice, fmtMoney, esc } from '../utils/invoiceTemplate';
import {
    ArrowLeftIcon,
    ClipboardDocumentListIcon,
    TruckIcon,
    UserIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    ClockIcon,
    WrenchIcon,
    DocumentTextIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    PrinterIcon,
    XCircleIcon,
    ChevronUpDownIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
    CheckCircleIcon,
    BanknotesIcon,
    LockClosedIcon
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
    const [orderItems, setOrderItems] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReasonCategory, setCancelReasonCategory] = useState('Customer Request / Decided Not to Proceed');
    const [cancelReason, setCancelReason] = useState('Customer Request / Decided Not to Proceed');
    const [cancelling, setCancelling] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deletingItem, setDeletingItem] = useState(false);
    const [newItem, setNewItem] = useState({
        item_type: '',
        inventory_id: '',
        service_id: '',
        description: '',
        quantity: 1,
        unit_price: 0
    });
    const [descSearch, setDescSearch] = useState('');
    const [isDescOpen, setIsDescOpen] = useState(false);
    const [selectedServiceInclusions, setSelectedServiceInclusions] = useState([]);
    const [includePackageItems, setIncludePackageItems] = useState(true);
    const descDropdownRef = useRef(null);
    const isOrderPaid = order?.payment_status === 'paid';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (descDropdownRef.current && !descDropdownRef.current.contains(event.target)) {
                setIsDescOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchOrderDetails();
        fetchOrderItems();
        fetchInventory();
        fetchItemTypes();
        fetchServices();
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

    const fetchOrderItems = async () => {
        try {
            const response = await api.get(`/job-orders/${id}/items`);
            setOrderItems(response.data.data);
        } catch (error) {
            console.error('Failed to fetch items', error);
        }
    };

    const fetchInventory = async () => {
        try {
            const response = await api.get('/inventory');
            setInventory(response.data.data);
        } catch (error) {
            console.error('Failed to fetch inventory', error);
        }
    };

    const fetchItemTypes = async () => {
        try {
            const res = await api.get('/inventory-types');
            setItemTypes(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch item types', error);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/services?active_only=true');
            setServicesList(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch services', error);
        }
    };

    const selectItem = (kind, item) => {
        if (kind === 'inv') {
            const cost = parseFloat(item.unit_price) || 0;
            const markup = parseFloat(item.markup_rate) || 0;
            const sellingPrice = item.selling_price !== undefined && item.selling_price !== null
                ? parseFloat(item.selling_price)
                : Number((cost * (1 + markup / 100)).toFixed(2));

            let incs = [];
            if (Array.isArray(item.inclusions)) {
                incs = item.inclusions;
            } else if (typeof item.inclusions === 'string') {
                try {
                    incs = JSON.parse(item.inclusions);
                } catch {
                    incs = [];
                }
            }

            setSelectedServiceInclusions(incs);
            setIncludePackageItems(incs.length > 0);

            setNewItem(prev => ({
                ...prev,
                inventory_id: item.id,
                service_id: '',
                description: item.name,
                unit_price: sellingPrice
            }));
            setDescSearch(item.name);
        } else if (kind === 'srv') {
            let incs = [];
            if (Array.isArray(item.inclusions)) {
                incs = item.inclusions;
            } else if (typeof item.inclusions === 'string') {
                try {
                    incs = JSON.parse(item.inclusions);
                } catch {
                    incs = [];
                }
            }

            setSelectedServiceInclusions(incs);
            setIncludePackageItems(incs.length > 0);

            setNewItem(prev => ({
                ...prev,
                inventory_id: '',
                service_id: item.id,
                description: item.name,
                unit_price: parseFloat(item.price) || 0
            }));
            setDescSearch(item.name);
        }
        setIsDescOpen(false);
    };

    const addItem = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (isOrderPaid) {
            alert('Cannot add items to a paid job order.');
            return;
        }
        if (updating || !newItem.description) return;
        setUpdating(true);
        try {
            await api.post(`/job-orders/${id}/items`, newItem);

            // If service inclusions are selected, automatically append them as line items (covered by service price, ₱0.00 charge)
            if (includePackageItems && selectedServiceInclusions.length > 0) {
                for (const inc of selectedServiceInclusions) {
                    await api.post(`/job-orders/${id}/items`, {
                        item_type: inc.item_type || 'part',
                        inventory_id: inc.inventory_id || null,
                        service_id: newItem.service_id || null,
                        description: `${inc.name} (Included with ${newItem.description})`,
                        quantity: parseFloat(inc.quantity) || 1,
                        unit_price: 0
                    });
                }
            }

            setNewItem({
                item_type: '',
                inventory_id: '',
                service_id: '',
                description: '',
                quantity: 1,
                unit_price: 0
            });
            setSelectedServiceInclusions([]);
            setIncludePackageItems(true);
            setDescSearch('');
            setIsDescOpen(false);
            fetchOrderItems();
            fetchOrderDetails();
        } catch (error) {
            alert('Failed to add item');
        } finally {
            setUpdating(false);
        }
    };

    const deleteItem = (item) => {
        if (isOrderPaid) {
            alert('Cannot remove items from a paid job order.');
            return;
        }
        setItemToDelete(item);
    };

    const confirmDeleteItem = async () => {
        if (!itemToDelete) return;
        setDeletingItem(true);
        try {
            await api.delete(`/job-orders/items/${itemToDelete.id}`);
            setItemToDelete(null);
            fetchOrderItems();
            fetchOrderDetails();
            fetchInventory();
        } catch (error) {
            console.error('Failed to delete item', error);
            alert(error.response?.data?.message || 'Failed to delete item');
        } finally {
            setDeletingItem(false);
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

    const handleCancelInvoice = async (e) => {
        e.preventDefault();
        if (order?.status !== 'pending') {
            alert('Only pending job orders can be cancelled.');
            return;
        }
        setCancelling(true);
        try {
            await api.post(`/job-orders/${id}/cancel`, {
                reason: cancelReason || cancelReasonCategory
            });
            setShowCancelModal(false);
            fetchOrderDetails();
            fetchOrderItems();
            fetchInventory();
        } catch (error) {
            console.error('Failed to cancel invoice', error);
            alert('Failed to cancel invoice');
        } finally {
            setCancelling(false);
        }
    };

    const handleReopenOrder = async () => {
        if (!window.confirm('Reopen this cancelled job order and invoice?')) return;
        setUpdating(true);
        try {
            await api.patch(`/job-orders/${id}`, { status: 'in_progress' });
            fetchOrderDetails();
            fetchOrderItems();
            fetchInventory();
        } catch (error) {
            console.error('Failed to reopen order', error);
            alert('Failed to reopen order');
        } finally {
            setUpdating(false);
        }
    };

    // Helper to determine if an order item is a package inclusion (Php 0.00 charge)
    const isItemInclusion = (item) => {
        if (!item) return false;
        const price = parseFloat(item.unit_price) || 0;
        const desc = (item.description || '').toLowerCase();
        return price === 0 || desc.includes('(included') || desc.includes('[included]');
    };

    // Helper to get inclusions for a service or inventory package line item
    const getServiceInclusionsForItem = (item) => {
        if (!item || !item.description || isItemInclusion(item)) return [];

        let matchInclusions = null;

        // 1. Check services
        const sMatch = (servicesList || []).find(
            s => s.name?.toLowerCase().trim() === item.description?.toLowerCase().trim()
        );
        if (sMatch && sMatch.inclusions) {
            matchInclusions = sMatch.inclusions;
        }

        // 2. Check inventory
        if (!matchInclusions) {
            const iMatch = (inventory || []).find(
                inv => (item.inventory_id && String(inv.id) === String(item.inventory_id)) ||
                       inv.name?.toLowerCase().trim() === item.description?.toLowerCase().trim() ||
                       (inv.part_number && inv.part_number.toLowerCase().trim() === item.description?.toLowerCase().trim())
            );
            if (iMatch && iMatch.inclusions) {
                matchInclusions = iMatch.inclusions;
            }
        }

        if (!matchInclusions) return [];

        let incs = [];
        if (Array.isArray(matchInclusions)) {
            incs = matchInclusions;
        } else if (typeof matchInclusions === 'string') {
            try {
                incs = JSON.parse(matchInclusions);
            } catch {
                incs = [];
            }
        }

        // Filter out any inclusions that are already recorded as separate line items in orderItems to prevent duplicates
        const existingDescs = (orderItems || []).map(o => (o.description || '').toLowerCase());
        return incs.filter(inc => {
            const incName = (inc.name || '').toLowerCase();
            return !existingDescs.some(d => d.includes(incName) && (d.includes('included') || d.includes('[included]')));
        });
    };

    // ---- Invoice printing (all formats share the standard SERVICE INVOICE layout) ----
    const buildInvoiceLines = () => {
        const lines = [];
        orderItems.forEach((item) => {
            const included = isItemInclusion(item);
            lines.push({
                description: item.description || 'N/A',
                quantity: item.quantity || 1,
                unitPrice: item.unit_price || 0,
                amount: item.total_price || (item.quantity * item.unit_price) || 0,
                included
            });
            getServiceInclusionsForItem(item).forEach((inc) => {
                lines.push({ description: inc.name, quantity: inc.quantity || 1, included: true, child: true });
            });
        });
        return lines;
    };

    const getBillableTotal = () => orderItems.reduce((sum, item) => {
        if (isItemInclusion(item)) return sum;
        return sum + parseFloat(item.total_price || (item.quantity * item.unit_price) || 0);
    }, 0);

    const getInvoiceBase = () => ({
        date: new Date().toLocaleDateString(),
        poNo: order.order_number,
        customer: {
            name: order.customer?.full_name || 'Walk-in Customer',
            tin: order.customer?.tin || '',
            address: order.customer?.address || ''
        },
        vehicle: {
            label: `${order.vehicle?.brand || ''} ${order.vehicle?.model || ''}${order.vehicle?.year ? ` (${order.vehicle.year})` : ''}`.trim(),
            plate: order.vehicle?.plate_number || ''
        },
        lines: buildInvoiceLines()
    });

    const generateInvoice = () => {
        const invNum = `INV-${(order.order_number || '').split('-')[1] || order.order_number}`;
        const finalTotal = getBillableTotal();
        const isPaid = order.payment_status === 'paid';
        const discountAmount = parseFloat(order.discount || 0);
        const paidAmount = parseFloat(order.amount_paid || 0);
        const netTotal = Math.max(0, finalTotal - discountAmount);
        const balanceDue = isPaid ? 0 : Math.max(0, netTotal - paidAmount);
        const payment = order.payments && order.payments.length > 0 ? order.payments[0] : null;
        const receivedAmt = isPaid ? (paidAmount > 0 ? paidAmount : netTotal) : paidAmount;

        let notesHtml = '';
        if (isPaid) {
            notesHtml = `<strong>&#10003; PAYMENT COMPLETED &amp; SETTLED</strong> &mdash; ${payment
                ? `Method: ${esc(payment.payment_method || 'Cash')}${payment.reference_number ? ` | Ref: ${esc(payment.reference_number)}` : ''} | Date: ${new Date(payment.payment_date || payment.created_at).toLocaleDateString()}`
                : 'Payment officially received and recorded in system.'}`;
        } else if (paidAmount > 0) {
            notesHtml = `<strong>PARTIAL PAYMENT:</strong> Amount Paid: Php ${fmtMoney(paidAmount)} | <strong>Balance Due: Php ${fmtMoney(balanceDue)}</strong>`;
        }

        const html = buildInvoiceHtml({
            ...getInvoiceBase(),
            titleTop: 'SERVICE',
            titleMain: 'INVOICE',
            siNo: invNum,
            saleType: isPaid ? 'cash' : 'charge',
            terms: isPaid ? `Paid${payment?.payment_method ? ` - ${payment.payment_method}` : ''}` : (paidAmount > 0 ? 'Partial Payment' : 'Charge / Unpaid'),
            totals: { totalSales: finalTotal, discount: discountAmount, totalDue: netTotal },
            receivedAmount: receivedAmt > 0 ? `Php ${fmtMoney(receivedAmt)}` : '',
            notesHtml,
            stamp: isPaid ? { text: 'PAID', color: '#059669' } : null,
            footerNote: 'Thank you for your business! Please keep this invoice for your warranty records.'
        });

        printInvoice(`Invoice_${order.order_number}`, html);
    };

    const printTemporaryInvoice = () => {
        const tempInvNum = `TINV-${(order.order_number || '').replace(/^JO-/, '')}`;
        const finalTotal = getBillableTotal();

        const html = buildInvoiceHtml({
            ...getInvoiceBase(),
            titleTop: 'TEMPORARY',
            titleMain: 'INVOICE',
            subtitle: '[ DRAFT / ESTIMATE BILLING ]',
            siNo: tempInvNum,
            saleType: null,
            terms: 'Estimate / For Review',
            totals: { totalSales: finalTotal, totalDue: finalTotal },
            notesHtml: `<strong>NOTICE:</strong> This is a Temporary Invoice for estimation and billing review. Amounts may vary upon final vehicle release. Not an official receipt. | Status: <strong>${esc((order.status || 'pending').toUpperCase())}</strong> | Prepared by: ${esc(order.advisor?.name || 'Service Advisor')}`,
            watermark: { text: 'DRAFT', color: '#d97706' },
            footerNote: 'Temporary Invoice - Not valid as an official receipt.'
        });

        printInvoice(`Temporary_Invoice_${order.order_number}`, html);
    };

    const printServiceInvoice = () => {
        const srvInvNum = `SRV-${(order.order_number || '').replace(/^JO-/, '')}`;
        const partsCount = orderItems.filter(i => (i.item_type || 'part') === 'part').length;
        const laborCount = orderItems.filter(i => (i.item_type || 'part') !== 'part').length;

        const notesHtml = [
            order.description ? `<strong>Service Scope:</strong> ${esc(order.description)}` : '',
            order.diagnosis ? `<strong>Diagnosis / Action:</strong> ${esc(order.diagnosis)}` : '',
            `<strong>Work Order Summary:</strong> Parts: ${partsCount} item(s) | Labor: ${laborCount} service(s) | Status: ${esc((order.status || '').toUpperCase())}`,
            `<strong>Technician:</strong> ${esc(order.mechanic?.name || '________________')} &nbsp;|&nbsp; <strong>Service Advisor:</strong> ${esc(order.advisor?.name || '________________')}`
        ].filter(Boolean).join('<br>');

        const html = buildInvoiceHtml({
            ...getInvoiceBase(),
            titleTop: 'SERVICE',
            titleMain: 'INVOICE',
            subtitle: '[ WORK ORDER & SERVICE RECORD ]',
            siNo: srvInvNum,
            saleType: null,
            terms: '',
            showAmounts: false,
            notesHtml,
            footerNote: 'This Service Invoice is an official technical record of services rendered and parts installed. No monetary amounts are stated.'
        });

        printInvoice(`Service_Invoice_${order.order_number}`, html);
    };

    const printCancelledInvoice = () => {
        const voidInvNum = `INV-${(order.order_number || '').replace(/^JO-/, '')} (VOID)`;
        const originalTotal = parseFloat(order.actual_cost || order.estimated_cost || getBillableTotal() || 0);

        const html = buildInvoiceHtml({
            ...getInvoiceBase(),
            titleTop: 'CANCELLED',
            titleMain: 'INVOICE',
            subtitle: '[ VOIDED - NO PAYMENT DUE ]',
            siNo: voidInvNum,
            saleType: null,
            terms: 'VOID',
            voided: true,
            totals: { totalSales: originalTotal, totalDue: 0 },
            notesHtml: `<strong>NOTICE OF INVOICE CANCELLATION:</strong> ${order.cancellation_reason ? `Reason: ${esc(order.cancellation_reason)}` : 'Reason: Order cancelled by authorized user.'}${order.cancelled_at ? ` | Cancelled on: ${new Date(order.cancelled_at).toLocaleString()}` : ''}`,
            watermark: { text: 'VOID', color: '#dc2626' },
            stamp: { text: 'CANCELLED', color: '#dc2626' },
            footerNote: 'VOID TRANSACTION: This invoice is formally cancelled and invalidated. No liabilities or balances are outstanding.'
        });

        printInvoice(`Cancelled_Invoice_${order.order_number}`, html);
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
                    <h1 className="text-2xl font-bold text-white flex items-center flex-wrap gap-2.5">
                        {order.order_number}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                            order.status === 'cancelled'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                            {order.status.replace('_', ' ')}
                        </span>
                        {order.payment_status === 'paid' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm">
                                <CheckCircleIcon className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                                Paid
                            </span>
                        ) : order.payment_status === 'partial' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase border bg-amber-500/15 text-amber-400 border-amber-500/30">
                                Partial Payment
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase border bg-slate-800 text-slate-400 border-slate-700">
                                Unpaid
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-400">Created on {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                        onClick={generateInvoice}
                        className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-all text-sm font-semibold shadow-sm"
                        title="Generate Standard Invoice"
                    >
                        <DocumentTextIcon className="h-4 w-4 mr-2 text-slate-400" />
                        Generate Invoice
                    </button>
                    <button
                        onClick={printTemporaryInvoice}
                        className="flex items-center px-4 py-2 bg-slate-800 text-amber-300 rounded-xl border border-slate-700 hover:bg-slate-700 hover:border-amber-500/30 transition-all text-sm font-semibold shadow-sm"
                        title="Print Temporary Invoice (with prices and total amount)"
                    >
                        <PrinterIcon className="h-4 w-4 mr-2 text-amber-400" />
                        Temporary Invoice
                    </button>
                    <button
                        onClick={printServiceInvoice}
                        className="flex items-center px-4 py-2 bg-slate-800 text-blue-300 rounded-xl border border-slate-700 hover:bg-slate-700 hover:border-blue-500/30 transition-all text-sm font-semibold shadow-sm"
                        title="Print Service Invoice (work order record with no amounts)"
                    >
                        <DocumentTextIcon className="h-4 w-4 mr-2 text-blue-400" />
                        Service Invoice (No Amount)
                    </button>
                    {order.status === 'cancelled' && (
                        <button
                            onClick={printCancelledInvoice}
                            className="flex items-center px-4 py-2 rounded-xl border transition-all text-sm font-semibold shadow-sm bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
                            title="Print Cancelled / Voided Invoice"
                        >
                            <XCircleIcon className="h-4 w-4 mr-2 text-red-400" />
                            Cancelled Invoice
                        </button>
                    )}
                    {order.status === 'pending' && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all text-sm font-semibold shadow-sm cursor-pointer"
                            title="Cancel this pending job order and invoice"
                        >
                            <XCircleIcon className="h-4 w-4 mr-1.5" />
                            Cancel Invoice
                        </button>
                    )}
                    {order.status === 'cancelled' && (
                        <button
                            onClick={handleReopenOrder}
                            disabled={updating}
                            className="flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-sm font-semibold shadow-sm cursor-pointer"
                            title="Reopen cancelled invoice"
                        >
                            <CheckCircleIcon className="h-4 w-4 mr-1.5 text-emerald-400" />
                            Reopen Order
                        </button>
                    )}
                    <button
                        onClick={() => navigate(`/job-orders/edit/${id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold shadow-lg shadow-blue-500/20"
                    >
                        Edit Order
                    </button>
                </div>
            </div>

            {/* Cancelled Banner */}
            {order.status === 'cancelled' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-300 shadow-lg">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-500/20 rounded-xl text-red-400">
                            <XCircleIcon className="h-6 w-6 flex-shrink-0" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">This Invoice & Job Order has been CANCELLED</p>
                            <p className="text-xs text-red-300/80 mt-0.5">
                                Reason: <span className="font-semibold text-white">{order.cancellation_reason || 'Not specified'}</span>
                                {order.cancelled_at && ` • Cancelled on ${new Date(order.cancelled_at).toLocaleDateString()}`}
                                {' '}• Parts have been returned to inventory.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={printCancelledInvoice}
                        className="px-3.5 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded-lg text-xs font-semibold border border-red-500/40 transition-all self-start sm:self-auto flex items-center"
                    >
                        <PrinterIcon className="h-3.5 w-3.5 mr-1.5" />
                        Print Cancelled Document
                    </button>
                </div>
            )}

            {/* Payment Completed Banner */}
            {order.payment_status === 'paid' && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-300 shadow-lg">
                    <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                            <CheckCircleIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-base">Payment Completed</h4>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    Fully Settled
                                </span>
                            </div>
                            <p className="text-xs text-emerald-300/90 mt-1">
                                Amount Paid: <span className="font-bold text-white">₱{parseFloat(order.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                {parseFloat(order.discount || 0) > 0 && (
                                    <span> • Discount: <span className="font-bold text-white">₱{parseFloat(order.discount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                                )}
                                {order.payments && order.payments.length > 0 && (
                                    <span>
                                        {' • Method: '}
                                        <span className="font-semibold text-white">
                                            {order.payments[order.payments.length - 1].payment_method || 'Cash'}
                                        </span>
                                        {order.payments[order.payments.length - 1].reference_number && (
                                            <span> (Ref: {order.payments[order.payments.length - 1].reference_number})</span>
                                        )}
                                        {order.payments[order.payments.length - 1].payment_date && (
                                            <span> on {new Date(order.payments[order.payments.length - 1].payment_date).toLocaleDateString()}</span>
                                        )}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded-lg">
                            Balance Due: ₱0.00
                        </span>
                    </div>
                </div>
            )}

            {/* Status Progress Bar */}
            <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-lg overflow-x-auto">
                <div className="flex items-center min-w-[800px]">
                    {statusSteps.map((step, index) => {
                        const isCurrent = order.status === step.id;
                        const isPast = statusSteps.findIndex(s => s.id === order.status) >= index;

                        return (
                            <div key={step.id} className="flex-1 flex flex-col items-center relative">
                                {index !== 0 && (
                                    <div className={`absolute left-0 right-1/2 top-4 h-0.5 -translate-y-1/2 ${isPast ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
                                )}
                                {index !== statusSteps.length - 1 && (
                                    <div className={`absolute right-0 left-1/2 top-4 h-0.5 -translate-y-1/2 ${isPast && order.status !== step.id ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
                                )}
                                <button
                                    disabled={updating}
                                    onClick={() => updateStatus(step.id)}
                                    className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center transition-all ${isCurrent ? 'bg-blue-600 ring-4 ring-blue-500/20 scale-110' :
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    {/* Work Description */}
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

                    {/* Parts & Services Table */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold flex items-center">
                                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-400" />
                                Parts & Services
                            </h3>
                        </div>

                        <div className="overflow-x-auto min-h-[340px] pb-40">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800 bg-slate-800/20">
                                        <th className="px-4 py-3 font-semibold w-36">Type</th>
                                        <th className="px-4 py-3 font-semibold">Description / Part</th>
                                        <th className="px-4 py-3 font-semibold text-center w-24">Qty</th>
                                        <th className="px-4 py-3 font-semibold text-right w-32">Price</th>
                                        <th className="px-4 py-3 font-semibold text-right w-32">Total</th>
                                        <th className="px-4 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {orderItems.map((item) => {
                                        const isIncluded = isItemInclusion(item);
                                        const catalogInclusions = getServiceInclusionsForItem(item);

                                        return (
                                            <Fragment key={item.id}>
                                                <tr className="group hover:bg-slate-800/10">
                                                    <td className="px-4 py-3 text-slate-400 text-xs uppercase tracking-wider">{item.item_type}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-white text-sm font-medium flex items-center gap-2">
                                                            <span>{item.description}</span>
                                                            {isIncluded && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                                    Included
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-slate-300 text-sm">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-sm">
                                                        {isIncluded ? (
                                                            <span className="text-emerald-400 font-semibold text-xs">INCLUDED</span>
                                                        ) : (
                                                            <span className="text-slate-300">₱{parseFloat(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-semibold">
                                                        {isIncluded ? (
                                                            <span className="text-emerald-400 text-xs font-semibold">₱0.00</span>
                                                        ) : (
                                                            <span className="text-white">₱{parseFloat(item.total_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {!isOrderPaid ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteItem(item)}
                                                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                                                title="Remove item"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        ) : (
                                                            <span
                                                                className="p-1.5 text-slate-600 inline-block cursor-not-allowed"
                                                                title="Items cannot be removed once the job order is paid"
                                                            >
                                                                <LockClosedIcon className="h-4 w-4" />
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {/* Inclusions under this service */}
                                                {catalogInclusions.map((inc, iIdx) => (
                                                    <tr key={`inc_${item.id}_${iIdx}`} className="bg-slate-900/40 text-xs border-b border-slate-800/50">
                                                        <td className="px-4 py-2 text-slate-500 text-[11px] uppercase tracking-wider pl-8 flex items-center gap-1">
                                                            <span className="text-slate-600">↳</span>
                                                            <span>{inc.item_type || 'Inclusion'}</span>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-300 font-medium">{inc.name}</span>
                                                                <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                    Package Inclusion
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-center text-slate-400">{inc.quantity}</td>
                                                        <td className="px-4 py-2 text-right text-emerald-400/90 font-medium text-xs">INCLUDED</td>
                                                        <td className="px-4 py-2 text-right text-emerald-400/90 font-semibold text-xs">₱0.00</td>
                                                        <td className="px-4 py-2"></td>
                                                    </tr>
                                                ))}
                                            </Fragment>
                                        );
                                    })}

                                    {/* Inline Add Item Row */}
                                    {!isOrderPaid ? (
                                        <tr className="bg-slate-800/30">
                                        <td className="px-4 py-3">
                                            <select
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={newItem.item_type}
                                                onChange={(e) => {
                                                    setNewItem({
                                                        ...newItem,
                                                        item_type: e.target.value,
                                                        inventory_id: '',
                                                        service_id: '',
                                                        description: '',
                                                        unit_price: 0
                                                    });
                                                    setDescSearch('');
                                                    setIsDescOpen(false);
                                                }}
                                            >
                                                <option value="">-- Select Type --</option>
                                                {itemTypes.map(t => (
                                                    <option key={t.id} value={t.name}>{t.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 relative">
                                            {newItem.item_type ? (() => {
                                                const filteredInv = inventory.filter(i =>
                                                    i.type && i.type.toLowerCase() === newItem.item_type.toLowerCase()
                                                );
                                                const filteredSrv = servicesList.filter(s =>
                                                    s.type && s.type.toLowerCase() === newItem.item_type.toLowerCase()
                                                );
                                                const hasOptions = filteredInv.length > 0 || filteredSrv.length > 0;

                                                if (!hasOptions) {
                                                    return (
                                                        <input
                                                            type="text"
                                                            placeholder={`No items or services tagged as "${newItem.item_type}" — type manually`}
                                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-600"
                                                            value={newItem.description}
                                                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                                            onKeyDown={(e) => e.key === 'Enter' && addItem(e)}
                                                        />
                                                    );
                                                }

                                                const query = (descSearch || '').trim().toLowerCase();

                                                const searchFilteredSrv = filteredSrv.filter(s => {
                                                    if (!query) return true;
                                                    const nameMatch = s.name && s.name.toLowerCase().includes(query);
                                                    const keyMatch = s.keyword && s.keyword.toLowerCase().includes(query);
                                                    const codeMatch = s.code && s.code.toLowerCase().includes(query);
                                                    return nameMatch || keyMatch || codeMatch;
                                                });

                                                const searchFilteredInv = filteredInv.filter(i => {
                                                    if (!query) return true;
                                                    const nameMatch = i.name && i.name.toLowerCase().includes(query);
                                                    const keyMatch = i.keyword && i.keyword.toLowerCase().includes(query);
                                                    const partMatch = i.part_number && i.part_number.toLowerCase().includes(query);
                                                    return nameMatch || keyMatch || partMatch;
                                                });

                                                const totalResults = searchFilteredSrv.length + searchFilteredInv.length;

                                                return (
                                                    <div className="relative" ref={descDropdownRef}>
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="text"
                                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-16 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                                                                placeholder={`Search ${newItem.item_type} by keyword or description...`}
                                                                value={descSearch !== '' ? descSearch : (newItem.description || '')}
                                                                onFocus={() => setIsDescOpen(true)}
                                                                onClick={() => setIsDescOpen(true)}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setDescSearch(val);
                                                                    setNewItem(prev => ({
                                                                        ...prev,
                                                                        description: val,
                                                                        inventory_id: '',
                                                                        service_id: ''
                                                                    }));
                                                                    setIsDescOpen(true);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        if (isDescOpen && totalResults === 1) {
                                                                            e.preventDefault();
                                                                            if (searchFilteredSrv.length === 1) {
                                                                                selectItem('srv', searchFilteredSrv[0]);
                                                                            } else {
                                                                                selectItem('inv', searchFilteredInv[0]);
                                                                            }
                                                                        } else if (!isDescOpen && newItem.description) {
                                                                            addItem(e);
                                                                        }
                                                                    } else if (e.key === 'Escape') {
                                                                        setIsDescOpen(false);
                                                                    }
                                                                }}
                                                            />
                                                            <div className="absolute right-2 flex items-center gap-1">
                                                                {(descSearch || newItem.description) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setDescSearch('');
                                                                            setNewItem(prev => ({
                                                                                ...prev,
                                                                                inventory_id: '',
                                                                                service_id: '',
                                                                                description: '',
                                                                                unit_price: 0
                                                                            }));
                                                                            setIsDescOpen(true);
                                                                        }}
                                                                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                                                                        title="Clear"
                                                                    >
                                                                        <XMarkIcon className="h-3.5 w-3.5" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setIsDescOpen(!isDescOpen)}
                                                                    className="p-1 text-slate-400 hover:text-white transition-colors"
                                                                >
                                                                    <ChevronUpDownIcon className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {isDescOpen && (
                                                            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                                                                {totalResults === 0 ? (
                                                                    <div className="p-3 text-xs text-slate-400 text-center">
                                                                        No items matching &quot;{descSearch}&quot;.
                                                                        <div className="text-[11px] text-slate-500 mt-1">Press Enter or click Add to use manual text.</div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="py-1 divide-y divide-slate-800">
                                                                        {searchFilteredSrv.length > 0 && (
                                                                            <div>
                                                                                <div className="px-3 py-1.5 bg-slate-800/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                                    Services / Labor Operations
                                                                                </div>
                                                                                {searchFilteredSrv.map(s => {
                                                                                    const isSelected = newItem.service_id && String(newItem.service_id) === String(s.id);
                                                                                    return (
                                                                                        <div
                                                                                            key={`srv_${s.id}`}
                                                                                            onClick={() => selectItem('srv', s)}
                                                                                            className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                                                                                                isSelected ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-slate-800 text-white'
                                                                                            }`}
                                                                                        >
                                                                                            <div className="flex items-center gap-2 overflow-hidden pr-2">
                                                                                                <span className="text-sm font-medium truncate">{s.name}</span>
                                                                                                {s.keyword && (
                                                                                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-mono flex-shrink-0">
                                                                                                        [{s.keyword}]
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <span className="text-xs font-semibold text-slate-300 flex-shrink-0">
                                                                                                ₱{parseFloat(s.price).toLocaleString()}
                                                                                            </span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}

                                                                        {searchFilteredInv.length > 0 && (
                                                                            <div>
                                                                                <div className="px-3 py-1.5 bg-slate-800/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                                    Inventory Items
                                                                                </div>
                                                                                {searchFilteredInv.map(i => {
                                                                                    const isSelected = newItem.inventory_id && String(newItem.inventory_id) === String(i.id);
                                                                                    const cost = parseFloat(i.unit_price) || 0;
                                                                                    const markup = parseFloat(i.markup_rate) || 0;
                                                                                    const sellPrice = i.selling_price !== undefined && i.selling_price !== null
                                                                                        ? parseFloat(i.selling_price)
                                                                                        : (cost * (1 + markup / 100));
                                                                                    return (
                                                                                        <div
                                                                                            key={`inv_${i.id}`}
                                                                                            onClick={() => selectItem('inv', i)}
                                                                                            className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                                                                                                isSelected ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-slate-800 text-white'
                                                                                            }`}
                                                                                        >
                                                                                            <div className="flex items-center gap-2 overflow-hidden pr-2">
                                                                                                <span className="text-sm font-medium truncate">{i.name}</span>
                                                                                                {i.keyword && (
                                                                                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-mono flex-shrink-0">
                                                                                                        [{i.keyword}]
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="text-right flex-shrink-0 ml-2">
                                                                                                <span className="text-xs font-semibold text-white block">
                                                                                                    ₱{sellPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                                </span>
                                                                                                {markup > 0 && (
                                                                                                    <span className="text-[10px] text-emerald-400 block font-medium">
                                                                                                        +{markup}%
                                                                                                    </span>
                                                                                                )}
                                                                                                <span className="text-[10px] text-slate-400 block">
                                                                                                    Stock: {i.stock_quantity}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })() : (
                                                <input
                                                    type="text"
                                                    placeholder="Select a type first"
                                                    disabled
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-600 text-sm outline-none cursor-not-allowed"
                                                />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={newItem.quantity}
                                                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                                onKeyDown={(e) => e.key === 'Enter' && addItem(e)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₱</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full pl-6 pr-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={newItem.unit_price}
                                                    onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && addItem(e)}
                                                    disabled={!!newItem.inventory_id}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-emerald-400 font-bold text-sm">
                                            ₱{((parseFloat(newItem.unit_price) || 0) * (parseInt(newItem.quantity) || 1)).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={addItem}
                                                disabled={updating || !newItem.description}
                                                className="p-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded-lg transition-all disabled:opacity-50"
                                                title="Add Item (Enter)"
                                            >
                                                <PlusIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                    ) : (
                                        <tr className="bg-slate-900/40 border-t border-slate-800/60">
                                            <td colSpan="6" className="px-4 py-3 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                                                    <LockClosedIcon className="h-3.5 w-3.5" />
                                                    <span>Job Order is fully paid. Items cannot be added or removed.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Package Inclusions Notification Banner */}
                        {selectedServiceInclusions.length > 0 && (
                            <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-200">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <SparklesIcon className="h-4 w-4 text-blue-400" />
                                        <span className="font-bold text-white">Service Package Inclusions Detected:</span>
                                        <span className="px-2 py-0.5 bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded font-semibold text-[11px]">
                                            {selectedServiceInclusions.length} items
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-[11px] mt-1">
                                        Covered by service price (Php 0.00 extra charge): {selectedServiceInclusions.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    </p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer font-semibold text-white flex-shrink-0 bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded-lg border border-blue-500/40 transition-colors text-xs">
                                    <input
                                        type="checkbox"
                                        checked={includePackageItems}
                                        onChange={(e) => setIncludePackageItems(e.target.checked)}
                                        className="h-4 w-4 rounded bg-slate-800 border-slate-700 text-blue-600 cursor-pointer"
                                    />
                                    <span>Add included items to invoice</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
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
                                ₱{order.estimated_cost?.toLocaleString() || '0.00'}
                            </span>
                        </div>
                        {order.actual_cost > 0 && (
                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                <span className="flex items-center text-slate-300 text-sm">
                                    <CurrencyDollarIcon className="h-4 w-4 mr-2 text-slate-400" />
                                    Actual Cost
                                </span>
                                <span className="text-white text-sm font-bold">
                                    ₱{parseFloat(order.actual_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}

                        {/* Payment Information */}
                        <div className="pt-4 border-t border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center text-slate-400 text-sm">
                                    <BanknotesIcon className="h-4 w-4 mr-2" />
                                    Payment Status
                                </span>
                                {order.payment_status === 'paid' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                                        Paid
                                    </span>
                                ) : order.payment_status === 'partial' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                        Partial
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                                        Unpaid
                                    </span>
                                )}
                            </div>

                            {parseFloat(order.discount || 0) > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Discount Applied</span>
                                    <span className="text-emerald-400 font-semibold">
                                        -₱{parseFloat(order.discount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Amount Paid</span>
                                <span className="text-emerald-400 font-bold text-sm">
                                    ₱{parseFloat(order.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-800/80">
                                <span className="text-slate-400 font-medium">Balance Due</span>
                                <span className={`font-bold text-sm ${order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {order.payment_status === 'paid'
                                        ? '₱0.00 (Settled)'
                                        : `₱${Math.max(0, (parseFloat(order.actual_cost || 0) - parseFloat(order.discount || 0) - parseFloat(order.amount_paid || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </span>
                            </div>
                        </div>

                        {/* Payment Transactions Breakdown */}
                        {order.payments && order.payments.length > 0 && (
                            <div className="pt-4 border-t border-slate-800">
                                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                                    Payment History
                                </p>
                                <div className="space-y-2">
                                    {order.payments.map((p, idx) => (
                                        <div key={p.id || idx} className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60 text-xs">
                                            <div className="flex items-center justify-between font-semibold text-white">
                                                <span>{p.payment_method || 'Cash'}</span>
                                                <span className="text-emerald-400">₱{parseFloat(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                                                <span>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'Recorded'}</span>
                                                {p.reference_number && <span>Ref: {p.reference_number}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cancel Invoice Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-red-500/5">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                                    <XCircleIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Cancel Invoice</h3>
                                    <p className="text-xs text-slate-400">Order: {order.order_number}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCancelModal(false)} className="text-slate-500 hover:text-white">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCancelInvoice} className="p-6 space-y-4">
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 space-y-1">
                                <p className="font-semibold text-white">⚠️ Cancellation Notice:</p>
                                <p>Cancelling will mark this invoice as CANCELLED/VOID. Any parts allocated will be automatically returned to inventory stock.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Cancellation Reason <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={cancelReasonCategory}
                                    onChange={(e) => {
                                        setCancelReasonCategory(e.target.value);
                                        if (e.target.value !== 'Other') {
                                            setCancelReason(e.target.value);
                                        } else {
                                            setCancelReason('');
                                        }
                                    }}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                                >
                                    <option value="Customer Request / Decided Not to Proceed">Customer Request / Decided Not to Proceed</option>
                                    <option value="Duplicate or Incorrect Job Order">Duplicate or Incorrect Job Order</option>
                                    <option value="Parts Unavailable / Supplier Delay">Parts Unavailable / Supplier Delay</option>
                                    <option value="Quotation Rejected by Customer">Quotation Rejected by Customer</option>
                                    <option value="Vehicle Transferred / Work Rescheduled">Vehicle Transferred / Work Rescheduled</option>
                                    <option value="Other">Other (Specify below)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Reason Notes / Details
                                </label>
                                <textarea
                                    rows="3"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Explain why this invoice is being cancelled..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                                    required
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCancelModal(false)}
                                    className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    Keep Active
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelling}
                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                                >
                                    {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Item Confirmation Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center space-x-3 text-red-400">
                            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <TrashIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Remove Item</h3>
                                <p className="text-xs text-slate-400">Confirm removal from Job Order</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-sm">
                            <div className="flex justify-between items-center text-slate-300">
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Item</span>
                                <span className="font-semibold text-white">{itemToDelete.description}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Type</span>
                                <span className="capitalize text-slate-300">{itemToDelete.item_type}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Qty & Price</span>
                                <span className="font-medium text-slate-200">
                                    {itemToDelete.quantity} × ₱{parseFloat(itemToDelete.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="border-t border-slate-800 pt-2 flex justify-between items-center font-bold">
                                <span className="text-slate-400 text-xs uppercase tracking-wider">Total</span>
                                <span className="text-emerald-400">
                                    ₱{parseFloat(itemToDelete.total_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-400">
                            Removing this item will automatically restore associated stock back to inventory and recalculate the job order total.
                        </p>

                        <div className="pt-2 flex justify-end space-x-3">
                            <button
                                type="button"
                                disabled={deletingItem}
                                onClick={() => setItemToDelete(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deletingItem}
                                onClick={confirmDeleteItem}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                            >
                                {deletingItem ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Removing...</span>
                                    </>
                                ) : (
                                    'Remove Item'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobOrderDetails;
