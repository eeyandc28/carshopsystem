import { useState, useEffect, useRef } from 'react';
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
    DocumentTextIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    PrinterIcon,
    XCircleIcon,
    ChevronUpDownIcon,
    MagnifyingGlassIcon
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
    const descDropdownRef = useRef(null);

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

            setNewItem(prev => ({
                ...prev,
                inventory_id: item.id,
                service_id: '',
                description: item.name,
                unit_price: sellingPrice
            }));
            setDescSearch(item.name);
        } else if (kind === 'srv') {
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
        if (updating || !newItem.description) return;
        setUpdating(true);
        try {
            await api.post(`/job-orders/${id}/items`, newItem);
            setNewItem({
                item_type: '',
                inventory_id: '',
                service_id: '',
                description: '',
                quantity: 1,
                unit_price: 0
            });
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

    const deleteItem = async (itemId) => {
        if (!window.confirm('Remove this item?')) return;
        setUpdating(true);
        try {
            await api.delete(`/job-orders/items/${itemId}`);
            fetchOrderItems();
            fetchOrderDetails();
        } catch (error) {
            alert('Failed to delete item');
        } finally {
            setUpdating(false);
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

    const printHtmlInvoice = (title, contentHtml) => {
        let iframe = document.getElementById('carshop-print-iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'carshop-print-iframe';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
        }

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${title}</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 12mm 15mm;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        color: #1e293b;
                        margin: 0;
                        padding: 0;
                        font-size: 12px;
                        line-height: 1.4;
                        background: #fff;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 12px;
                        margin-bottom: 16px;
                    }
                    .brand-logo {
                        max-height: 42px;
                        width: auto;
                        object-fit: contain;
                        margin-bottom: 4px;
                    }
                    .brand-title {
                        font-size: 20px;
                        font-weight: 800;
                        color: #0f172a;
                        margin: 0 0 4px 0;
                    }
                    .brand-sub {
                        font-size: 10px;
                        color: #64748b;
                        margin: 0;
                    }
                    .doc-meta {
                        text-align: right;
                    }
                    .doc-badge {
                        font-size: 16px;
                        font-weight: 800;
                        margin: 0 0 4px 0;
                    }
                    .doc-number {
                        font-size: 11px;
                        color: #475569;
                        margin: 2px 0;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                        margin-bottom: 16px;
                    }
                    .info-card {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 10px 14px;
                    }
                    .info-card h4 {
                        margin: 0 0 6px 0;
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #475569;
                        border-bottom: 1px solid #cbd5e1;
                        padding-bottom: 4px;
                    }
                    .info-card p {
                        margin: 3px 0;
                        font-size: 11px;
                        color: #334155;
                    }
                    .banner-box {
                        padding: 8px 12px;
                        border-radius: 8px;
                        margin-bottom: 16px;
                        font-size: 11px;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 16px;
                    }
                    .items-table th {
                        background: #1e293b;
                        color: #ffffff;
                        text-align: left;
                        padding: 8px 10px;
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .items-table td {
                        padding: 8px 10px;
                        border-bottom: 1px solid #e2e8f0;
                        font-size: 11px;
                    }
                    .items-table tr:nth-child(even) td {
                        background: #f8fafc;
                    }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .totals-box {
                        margin-left: auto;
                        width: 280px;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 10px 14px;
                        margin-bottom: 20px;
                    }
                    .total-line {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 4px;
                        font-size: 11px;
                    }
                    .grand-total {
                        font-size: 14px;
                        font-weight: 800;
                        color: #0f172a;
                        border-top: 1px solid #cbd5e1;
                        padding-top: 6px;
                        margin-top: 6px;
                    }
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 30px;
                        margin-bottom: 20px;
                    }
                    .signature-box {
                        width: 200px;
                        text-align: center;
                        border-top: 1px solid #94a3b8;
                        padding-top: 6px;
                        font-size: 10px;
                        color: #64748b;
                    }
                    .footer-text {
                        text-align: center;
                        font-size: 9px;
                        color: #94a3b8;
                        border-top: 1px dashed #cbd5e1;
                        padding-top: 10px;
                        margin-top: 16px;
                    }
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                ${contentHtml}
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }, 200);
    };

    const generateInvoice = () => {
        const now = new Date().toLocaleDateString();
        const invNum = `INV-${(order.order_number || '').split('-')[1] || order.order_number}`;
        const calculatedItemsTotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price || (item.quantity * item.unit_price) || 0), 0);
        const finalTotal = parseFloat(order.actual_cost || order.estimated_cost || calculatedItemsTotal || 0);

        const rows = orderItems.length > 0 ? orderItems.map((item, idx) => `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${item.description || 'N/A'}</strong></td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">Php ${parseFloat(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="text-right font-bold">Php ${parseFloat(item.total_price || (item.quantity * item.unit_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('') : `<tr><td colspan="5" class="text-center">No parts or services recorded.</td></tr>`;

        const html = `
            <div class="invoice-header">
                <div>
                    <img src="/logo.png" class="brand-logo" alt="RADI8" />
                    <h1 class="brand-title">RADI8</h1>
                    <p class="brand-sub">Precision. Reliability. Service.</p>
                </div>
                <div class="doc-meta">
                    <div class="doc-badge" style="color: #0f172a;">INVOICE</div>
                    <div class="doc-number"><strong>Invoice #:</strong> ${invNum}</div>
                    <div class="doc-number"><strong>Date:</strong> ${now}</div>
                    <div class="doc-number"><strong>Order #:</strong> ${order.order_number}</div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-card">
                    <h4>Customer Details</h4>
                    <p><strong>Name:</strong> ${order.customer?.full_name || 'Walk-in Customer'}</p>
                    <p><strong>Contact:</strong> ${order.customer?.contact_number || 'N/A'}</p>
                    <p><strong>Address:</strong> ${order.customer?.address || 'N/A'}</p>
                </div>
                <div class="info-card">
                    <h4>Vehicle Details</h4>
                    <p><strong>Plate No:</strong> ${order.vehicle?.plate_number || 'N/A'}</p>
                    <p><strong>Unit:</strong> ${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} (${order.vehicle?.year || 'N/A'})</p>
                    <p><strong>VIN:</strong> ${order.vehicle?.vin || 'N/A'}</p>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 30px;" class="text-center">#</th>
                        <th>Description</th>
                        <th style="width: 50px;" class="text-center">Qty</th>
                        <th style="width: 100px;" class="text-right">Unit Price</th>
                        <th style="width: 110px;" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="totals-box">
                <div class="total-line">
                    <span>Subtotal:</span>
                    <span>Php ${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="total-line grand-total">
                    <span>TOTAL DUE:</span>
                    <span style="color: #2563eb;">Php ${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>

            <div class="signatures">
                <div class="signature-box">Service Advisor Signature</div>
                <div class="signature-box">Customer Conforme / Signature</div>
            </div>

            <div class="footer-text">
                Thank you for your business! Please keep this invoice for your warranty records.<br>
                RADI8 System Generated Document
            </div>
        `;

        printHtmlInvoice(`Invoice_${order.order_number}`, html);
    };

    const printTemporaryInvoice = () => {
        const now = new Date().toLocaleDateString();
        const tempInvNum = `TINV-${(order.order_number || '').replace(/^JO-/, '')}`;
        const calculatedItemsTotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price || (item.quantity * item.unit_price) || 0), 0);
        const finalTotal = parseFloat(order.actual_cost || order.estimated_cost || calculatedItemsTotal || 0);

        const rows = orderItems.length > 0 ? orderItems.map((item, idx) => `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${item.description || 'N/A'}</strong></td>
                <td class="text-center">${(item.item_type || 'part').toUpperCase()}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">Php ${parseFloat(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="text-right font-bold">Php ${parseFloat(item.total_price || (item.quantity * item.unit_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('') : `<tr><td colspan="6" class="text-center">No parts or services recorded.</td></tr>`;

        const html = `
            <div class="invoice-header">
                <div>
                    <img src="/logo.png" class="brand-logo" alt="RADI8" />
                    <h1 class="brand-title">RADI8</h1>
                    <p class="brand-sub">Precision. Reliability. Service.</p>
                </div>
                <div class="doc-meta">
                    <div class="doc-badge" style="color: #d97706;">TEMPORARY INVOICE</div>
                    <div style="font-size: 9px; font-weight: bold; color: #b45309; margin-bottom: 4px;">[ DRAFT / ESTIMATE BILLING ]</div>
                    <div class="doc-number"><strong>Temp Inv #:</strong> ${tempInvNum}</div>
                    <div class="doc-number"><strong>Date:</strong> ${now}</div>
                    <div class="doc-number"><strong>JO #:</strong> ${order.order_number}</div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-card">
                    <h4>Bill To / Customer</h4>
                    <p><strong>Name:</strong> ${order.customer?.full_name || 'Walk-in Customer'}</p>
                    <p><strong>Contact:</strong> ${order.customer?.contact_number || 'N/A'}</p>
                    <p><strong>Address:</strong> ${order.customer?.address || 'N/A'}</p>
                </div>
                <div class="info-card">
                    <h4>Vehicle Information</h4>
                    <p><strong>Plate No:</strong> ${order.vehicle?.plate_number || 'N/A'}</p>
                    <p><strong>Model:</strong> ${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} (${order.vehicle?.year || 'N/A'})</p>
                    <p><strong>VIN:</strong> ${order.vehicle?.vin || 'N/A'}</p>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 30px;" class="text-center">#</th>
                        <th>Item / Service Description</th>
                        <th style="width: 70px;" class="text-center">Type</th>
                        <th style="width: 50px;" class="text-center">Qty</th>
                        <th style="width: 100px;" class="text-right">Unit Price</th>
                        <th style="width: 110px;" class="text-right">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="totals-box">
                <div class="total-line">
                    <span>Status:</span>
                    <span style="font-weight: bold;">${(order.status || 'PENDING').toUpperCase()}</span>
                </div>
                <div class="total-line grand-total">
                    <span style="color: #d97706;">TOTAL DUE:</span>
                    <span style="color: #d97706;">Php ${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>

            <div class="signatures">
                <div class="signature-box">Prepared by: ${order.advisor?.name || 'Service Advisor'}</div>
                <div class="signature-box">Customer Conforme / Signature</div>
            </div>

            <div class="footer-text">
                * NOTICE: This is a Temporary Invoice for estimation and billing review. Amounts may vary upon final vehicle release. Not an official receipt.<br>
                RADI8 System Generated Document
            </div>
        `;

        printHtmlInvoice(`Temporary_Invoice_${order.order_number}`, html);
    };

    const printServiceInvoice = () => {
        const now = new Date().toLocaleDateString();
        const srvInvNum = `SRV-${(order.order_number || '').replace(/^JO-/, '')}`;
        const partsCount = orderItems.filter(i => (i.item_type || 'part') === 'part').length;
        const laborCount = orderItems.filter(i => (i.item_type || 'part') !== 'part').length;

        const rows = orderItems.length > 0 ? orderItems.map((item, idx) => `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${item.description || 'N/A'}</strong></td>
                <td class="text-center">${(item.item_type || 'part').toUpperCase()}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-center" style="color: #16a34a; font-weight: 600;">Verified / Installed</td>
            </tr>
        `).join('') : `<tr><td colspan="5" class="text-center">No parts or services recorded.</td></tr>`;

        const html = `
            <div class="invoice-header">
                <div>
                    <img src="/logo.png" class="brand-logo" alt="RADI8" />
                    <h1 class="brand-title">RADI8</h1>
                    <p class="brand-sub">Precision. Reliability. Service.</p>
                </div>
                <div class="doc-meta">
                    <div class="doc-badge" style="color: #2563eb;">SERVICE INVOICE</div>
                    <div style="font-size: 9px; font-weight: bold; color: #1d4ed8; margin-bottom: 4px;">[ WORK ORDER & SERVICE RECORD ]</div>
                    <div class="doc-number"><strong>Service Inv #:</strong> ${srvInvNum}</div>
                    <div class="doc-number"><strong>Date:</strong> ${now}</div>
                    <div class="doc-number"><strong>JO #:</strong> ${order.order_number}</div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-card">
                    <h4>Customer Details</h4>
                    <p><strong>Name:</strong> ${order.customer?.full_name || 'Walk-in Customer'}</p>
                    <p><strong>Contact:</strong> ${order.customer?.contact_number || 'N/A'}</p>
                    <p><strong>Address:</strong> ${order.customer?.address || 'N/A'}</p>
                </div>
                <div class="info-card">
                    <h4>Vehicle Details</h4>
                    <p><strong>Plate No:</strong> ${order.vehicle?.plate_number || 'N/A'}</p>
                    <p><strong>Model:</strong> ${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} (${order.vehicle?.year || 'N/A'})</p>
                    <p><strong>VIN:</strong> ${order.vehicle?.vin || 'N/A'}</p>
                </div>
            </div>

            ${(order.description || order.diagnosis) ? `
                <div class="banner-box" style="background: #f8fafc; border: 1px solid #e2e8f0;">
                    <p style="margin: 2px 0;"><strong>Service Scope:</strong> ${order.description || 'General inspection & repair'}</p>
                    ${order.diagnosis ? `<p style="margin: 2px 0;"><strong>Diagnosis / Action:</strong> ${order.diagnosis}</p>` : ''}
                </div>
            ` : ''}

            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 30px;" class="text-center">#</th>
                        <th>Part / Service Description</th>
                        <th style="width: 80px;" class="text-center">Type</th>
                        <th style="width: 50px;" class="text-center">Qty</th>
                        <th style="width: 140px;" class="text-center">Verification Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="banner-box" style="background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 25px;">
                <strong>WORK ORDER SUMMARY:</strong> Total Parts: ${partsCount} item(s) | Labor Operations: ${laborCount} service(s) | Status: ${(order.status || '').toUpperCase()}
            </div>

            <div class="signatures">
                <div class="signature-box">Technician: ${order.mechanic?.name || '___________________'}</div>
                <div class="signature-box">Service Advisor: ${order.advisor?.name || '___________________'}</div>
                <div class="signature-box">Customer Vehicle Acceptance</div>
            </div>

            <div class="footer-text">
                * NOTE: This Service Invoice is an official technical record of services rendered and parts installed. No monetary amounts are stated.<br>
                RADI8 System Generated Document
            </div>
        `;

        printHtmlInvoice(`Service_Invoice_${order.order_number}`, html);
    };

    const printCancelledInvoice = () => {
        const now = new Date().toLocaleDateString();
        const voidInvNum = `INV-${(order.order_number || '').replace(/^JO-/, '')} (VOID)`;
        const calculatedItemsTotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price || (item.quantity * item.unit_price) || 0), 0);
        const originalTotal = parseFloat(order.actual_cost || order.estimated_cost || calculatedItemsTotal || 0);

        const rows = orderItems.length > 0 ? orderItems.map((item, idx) => `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${item.description || 'N/A'} [VOID]</strong></td>
                <td class="text-center">${(item.item_type || 'part').toUpperCase()}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right" style="color: #64748b; text-decoration: line-through;">Php ${parseFloat(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="text-right font-bold" style="color: #dc2626;">Php 0.00</td>
            </tr>
        `).join('') : `<tr><td colspan="6" class="text-center">No items recorded on this cancelled invoice.</td></tr>`;

        const html = `
            <div class="invoice-header" style="border-bottom: 2px solid #fecaca; background: #fff5f5; padding: 12px; border-radius: 8px;">
                <div>
                    <img src="/logo.png" class="brand-logo" alt="RADI8" />
                    <h1 class="brand-title" style="color: #991b1b;">RADI8</h1>
                    <p class="brand-sub">Precision. Reliability. Service.</p>
                </div>
                <div class="doc-meta">
                    <div class="doc-badge" style="color: #dc2626;">CANCELLED INVOICE</div>
                    <div style="font-size: 9px; font-weight: bold; color: #b91c1c; margin-bottom: 4px;">[ VOIDED - NO PAYMENT DUE ]</div>
                    <div class="doc-number"><strong>Invoice #:</strong> ${voidInvNum}</div>
                    <div class="doc-number"><strong>Date:</strong> ${now}</div>
                    <div class="doc-number"><strong>JO #:</strong> ${order.order_number}</div>
                </div>
            </div>

            <div class="banner-box" style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; margin-top: 14px;">
                <p style="margin: 0; font-weight: bold;">NOTICE OF INVOICE CANCELLATION:</p>
                <p style="margin: 3px 0 0 0; font-size: 10px;">
                    ${order.cancellation_reason ? `Reason: ${order.cancellation_reason}` : 'Reason: Order cancelled by authorized user.'}
                    ${order.cancelled_at ? ` | Cancelled on: ${new Date(order.cancelled_at).toLocaleString()}` : ''}
                </p>
            </div>

            <div class="info-grid">
                <div class="info-card">
                    <h4>Customer Details</h4>
                    <p><strong>Name:</strong> ${order.customer?.full_name || 'Walk-in Customer'}</p>
                    <p><strong>Contact:</strong> ${order.customer?.contact_number || 'N/A'}</p>
                    <p><strong>Address:</strong> ${order.customer?.address || 'N/A'}</p>
                </div>
                <div class="info-card">
                    <h4>Vehicle Details</h4>
                    <p><strong>Plate No:</strong> ${order.vehicle?.plate_number || 'N/A'}</p>
                    <p><strong>Model:</strong> ${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} (${order.vehicle?.year || 'N/A'})</p>
                    <p><strong>VIN:</strong> ${order.vehicle?.vin || 'N/A'}</p>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr style="background: #475569;">
                        <th style="width: 30px;" class="text-center">#</th>
                        <th>Item / Service Description</th>
                        <th style="width: 70px;" class="text-center">Type</th>
                        <th style="width: 50px;" class="text-center">Qty</th>
                        <th style="width: 110px;" class="text-right">Original Unit Price</th>
                        <th style="width: 100px;" class="text-right">Amount Due</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="totals-box" style="background: #fef2f2; border: 1px solid #fecaca;">
                <div class="total-line" style="color: #991b1b;">
                    <span>ORIGINAL AMOUNT:</span>
                    <span>Php ${originalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="total-line" style="color: #991b1b; font-weight: bold;">
                    <span>STATUS:</span>
                    <span>CANCELLED / VOID</span>
                </div>
                <div class="total-line grand-total" style="color: #dc2626;">
                    <span>AMOUNT DUE:</span>
                    <span>Php 0.00</span>
                </div>
            </div>

            <div class="signatures">
                <div class="signature-box">Authorized Cancellation / Supervisor</div>
                <div class="signature-box">Customer Notification / Conforme</div>
            </div>

            <div class="footer-text">
                * VOID TRANSACTION: This invoice is formally cancelled and invalidated. No liabilities or balances are outstanding.<br>
                RADI8 System Generated Void Record
            </div>
        `;

        printHtmlInvoice(`Cancelled_Invoice_${order.order_number}`, html);
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
                        <span className={`ml-4 px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                            order.status === 'cancelled'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                            {order.status.replace('_', ' ')}
                        </span>
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
                    {order.status !== 'cancelled' ? (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all text-sm font-semibold shadow-sm"
                            title="Cancel this invoice and restore inventory stock"
                        >
                            <XCircleIcon className="h-4 w-4 mr-1.5" />
                            Cancel Invoice
                        </button>
                    ) : (
                        <button
                            onClick={handleReopenOrder}
                            disabled={updating}
                            className="flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-sm font-semibold shadow-sm"
                            title="Reopen cancelled invoice"
                        >
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
                                    {orderItems.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-800/10">
                                            <td className="px-4 py-3 text-slate-400 text-xs uppercase tracking-wider">{item.item_type}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-white text-sm font-medium">{item.description}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-300 text-sm">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-slate-300 text-sm">₱{parseFloat(item.unit_price).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-white font-semibold text-sm">₱{parseFloat(item.total_price).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Inline Add Item Row */}
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
                                </tbody>
                            </table>
                        </div>
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
                                <span className="flex items-center text-emerald-400 text-sm">
                                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                                    Actual Cost
                                </span>
                                <span className="text-emerald-400 text-sm font-bold">
                                    ₱{order.actual_cost?.toLocaleString()}
                                </span>
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
        </div>
    );
};

export default JobOrderDetails;
