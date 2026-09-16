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
    DocumentTextIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    PrinterIcon,
    XCircleIcon
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
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReasonCategory, setCancelReasonCategory] = useState('Customer Request / Decided Not to Proceed');
    const [cancelReason, setCancelReason] = useState('Customer Request / Decided Not to Proceed');
    const [cancelling, setCancelling] = useState(false);
    const [newItem, setNewItem] = useState({
        item_type: 'part',
        inventory_id: '',
        description: '',
        quantity: 1,
        unit_price: 0
    });

    useEffect(() => {
        fetchOrderDetails();
        fetchOrderItems();
        fetchInventory();
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

    const addItem = async (e) => {
        e.preventDefault();
        if (updating || !newItem.description) return;
        setUpdating(true);
        try {
            await api.post(`/job-orders/${id}/items`, newItem);
            setNewItem({
                item_type: 'part',
                inventory_id: '',
                description: '',
                quantity: 1,
                unit_price: 0
            });
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

    const generateInvoice = () => {
        const doc = new jsPDF();
        const now = new Date();
        const dateStr = now.toLocaleDateString();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text('INVOICE', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Car Shop Management System', 14, 28);
        doc.text('123 Service Road, Auto City', 14, 33);

        // Invoice Info
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(`Invoice #: INV-${(order.order_number || '').split('-')[1] || order.order_number}`, 140, 22);
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

        doc.text(`Plate: ${order.vehicle?.plate_number || 'N/A'}`, 110, 57);
        doc.text(`Unit: ${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} (${order.vehicle?.year || 'N/A'})`, 110, 62);
        doc.text(`VIN: ${order.vehicle?.vin || 'N/A'}`, 110, 67);

        // Service Table
        const tableBody = orderItems.map(item => [
            item.description || 'N/A',
            item.quantity,
            `Php ${parseFloat(item.unit_price || 0).toLocaleString()}`,
            `Php ${parseFloat(item.total_price || (item.quantity * item.unit_price) || 0).toLocaleString()}`
        ]);

        if (tableBody.length === 0) {
            tableBody.push([{ content: 'No parts or services recorded.', colSpan: 4, styles: { halign: 'center' } }]);
        }

        autoTable(doc, {
            startY: 80,
            head: [['Description', 'Qty', 'Unit Price', 'Total']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 90 },
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // Summary
        const calculatedItemsTotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price || (item.quantity * item.unit_price) || 0), 0);
        const finalTotal = parseFloat(order.actual_cost || order.estimated_cost || calculatedItemsTotal || 0);
        const finalY = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL DUE:', 140, finalY);
        doc.text(`Php ${finalTotal.toLocaleString()}`, 196, finalY, { align: 'right' });

        // Notes
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('Thank you for your business! Please keep this invoice for your warranty records.', 14, finalY + 20);

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('System Generated Invoice', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

        doc.autoPrint();
        const blobUrl = URL.createObjectURL(doc.output('blob'));
        window.open(blobUrl, '_blank');
    };

    const printTemporaryInvoice = () => {
        const doc = new jsPDF();
        const now = new Date();
        const dateStr = now.toLocaleDateString();

        // Header Background Banner
        doc.setFillColor(248, 250, 252);
        doc.rect(14, 12, 182, 28, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, 12, 182, 28, 'S');

        // Company Branding
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('CarShop ERP', 20, 22);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Car Shop Management & Repair System', 20, 28);
        doc.text('123 Service Road, Auto City | Tel: (02) 8123-4567', 20, 34);

        // Document Title Badge
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(217, 119, 6); // Amber-600
        doc.text('TEMPORARY INVOICE', 190, 21, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text('[ DRAFT / ESTIMATE BILLING ]', 190, 26, { align: 'right' });

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Temp Inv #: TINV-${(order.order_number || '').replace(/^JO-/, '')}`, 190, 31, { align: 'right' });
        doc.text(`Date: ${dateStr} | JO #: ${order.order_number}`, 190, 36, { align: 'right' });

        // Info Cards (Customer & Vehicle)
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, 44, 88, 32, 2, 2, 'F');
        doc.roundedRect(108, 44, 88, 32, 2, 2, 'F');

        // Customer Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('BILL TO / CUSTOMER', 18, 51);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(order.customer?.full_name || 'Walk-in Customer', 18, 57);
        doc.text(`Contact: ${order.customer?.contact_number || 'N/A'}`, 18, 63);
        doc.text(`Address: ${order.customer?.address || 'N/A'}`, 18, 69, { maxWidth: 80 });

        // Vehicle Info
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text('VEHICLE INFORMATION', 112, 51);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`Plate No: ${order.vehicle?.plate_number || 'N/A'}`, 112, 57);
        doc.text(`Model: ${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} (${order.vehicle?.year || 'N/A'})`, 112, 63);
        doc.text(`VIN: ${order.vehicle?.vin || 'N/A'}`, 112, 69);

        // Service Table with Amounts
        const tableBody = orderItems.map((item, idx) => [
            idx + 1,
            item.description || 'N/A',
            (item.item_type || 'part').toUpperCase(),
            item.quantity,
            `Php ${parseFloat(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `Php ${parseFloat(item.total_price || (item.quantity * item.unit_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);

        if (tableBody.length === 0) {
            tableBody.push([{ content: 'No parts or services recorded.', colSpan: 6, styles: { halign: 'center' } }]);
        }

        autoTable(doc, {
            startY: 81,
            head: [['#', 'Item / Service Description', 'Type', 'Qty', 'Unit Price', 'Total Amount']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold', fontSize: 9 },
            styles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 78 },
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 16, halign: 'center' },
                4: { cellWidth: 28, halign: 'right' },
                5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
            }
        });

        // Totals & Summary
        const calculatedItemsTotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price || (item.quantity * item.unit_price) || 0), 0);
        const finalTotal = parseFloat(order.actual_cost || order.estimated_cost || calculatedItemsTotal || 0);
        const finalY = doc.lastAutoTable.finalY + 8;

        doc.setFillColor(248, 250, 252);
        doc.rect(116, finalY, 80, 22, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(116, finalY, 80, 22, 'S');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('STATUS:', 120, finalY + 7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text((order.status || 'PENDING').toUpperCase(), 190, finalY + 7, { align: 'right' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(217, 119, 6);
        doc.text('TOTAL DUE:', 120, finalY + 16);
        doc.text(`Php ${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, finalY + 16, { align: 'right' });

        // Signatures
        const signY = finalY + 36;
        doc.setDrawColor(148, 163, 184);
        doc.line(20, signY, 80, signY);
        doc.line(120, signY, 180, signY);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Prepared by: ${order.advisor?.name || 'Service Advisor'}`, 20, signY + 5);
        doc.text('Customer Conforme / Signature', 120, signY + 5);

        // Disclaimer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.text(
            '* NOTICE: This is a Temporary Invoice for estimation and billing review. Amounts may vary upon final vehicle release. Not an official receipt.',
            14,
            signY + 16
        );

        // Footer
        doc.setFont('helvetica', 'normal');
        doc.text('CarShop ERP System Generated Document', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });

        // Print Only
        doc.autoPrint();
        const blobUrl = URL.createObjectURL(doc.output('blob'));
        window.open(blobUrl, '_blank');
    };

    const printServiceInvoice = () => {
        const doc = new jsPDF();
        const now = new Date();
        const dateStr = now.toLocaleDateString();

        // Header Background Banner
        doc.setFillColor(248, 250, 252);
        doc.rect(14, 12, 182, 28, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, 12, 182, 28, 'S');

        // Company Branding
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('CarShop ERP', 20, 22);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Car Shop Management & Repair System', 20, 28);
        doc.text('123 Service Road, Auto City | Tel: (02) 8123-4567', 20, 34);

        // Document Title Badge
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // Blue-600
        doc.text('SERVICE INVOICE', 190, 21, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('[ WORK ORDER & SERVICE RECORD ]', 190, 26, { align: 'right' });

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Service Inv #: SRV-${(order.order_number || '').replace(/^JO-/, '')}`, 190, 31, { align: 'right' });
        doc.text(`Date: ${dateStr} | JO #: ${order.order_number}`, 190, 36, { align: 'right' });

        // Info Cards (Customer & Vehicle)
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, 44, 88, 32, 2, 2, 'F');
        doc.roundedRect(108, 44, 88, 32, 2, 2, 'F');

        // Customer Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('CUSTOMER DETAILS', 18, 51);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(order.customer?.full_name || 'Walk-in Customer', 18, 57);
        doc.text(`Contact: ${order.customer?.contact_number || 'N/A'}`, 18, 63);
        doc.text(`Address: ${order.customer?.address || 'N/A'}`, 18, 69, { maxWidth: 80 });

        // Vehicle Info
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text('VEHICLE DETAILS', 112, 51);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`Plate No: ${order.vehicle?.plate_number || 'N/A'}`, 112, 57);
        doc.text(`Model: ${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} (${order.vehicle?.year || 'N/A'})`, 112, 63);
        doc.text(`VIN: ${order.vehicle?.vin || 'N/A'}`, 112, 69);

        // Complaint & Diagnosis section if present
        let tableStartY = 81;
        if (order.description || order.diagnosis) {
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, 80, 182, 16, 2, 2, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(14, 80, 182, 16, 2, 2, 'S');

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text('Service Scope / Complaint:', 18, 86);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(order.description || 'General inspection & repair', 64, 86, { maxWidth: 126 });

            if (order.diagnosis) {
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(51, 65, 85);
                doc.text('Diagnosis / Action:', 18, 92);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text(order.diagnosis, 54, 92, { maxWidth: 136 });
            }

            tableStartY = 101;
        }

        // Service Table (NO AMOUNT)
        const tableBody = orderItems.map((item, idx) => [
            idx + 1,
            item.description || 'N/A',
            (item.item_type || 'part').toUpperCase(),
            item.quantity,
            'Verified / Installed'
        ]);

        if (tableBody.length === 0) {
            tableBody.push([{ content: 'No parts or services recorded.', colSpan: 5, styles: { halign: 'center' } }]);
        }

        autoTable(doc, {
            startY: tableStartY,
            head: [['#', 'Part / Service Description', 'Type', 'Qty', 'Verification Status']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold', fontSize: 9 },
            styles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: 2.8 },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                1: { cellWidth: 95 },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 18, halign: 'center' },
                4: { cellWidth: 32, halign: 'center' }
            }
        });

        // Operational Summary (NO AMOUNT / NO MONETARY VALUE)
        const finalY = doc.lastAutoTable.finalY + 8;
        doc.setFillColor(248, 250, 252);
        doc.rect(14, finalY, 182, 16, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, finalY, 182, 16, 'S');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text('WORK ORDER SUMMARY:', 18, finalY + 6);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const partsCount = orderItems.filter(i => (i.item_type || 'part') === 'part').length;
        const laborCount = orderItems.filter(i => (i.item_type || 'part') !== 'part').length;
        doc.text(`Total Parts Used: ${partsCount} item(s)  |  Labor Operations: ${laborCount} service(s)  |  Order Status: ${(order.status || '').toUpperCase()}`, 18, finalY + 11);

        // Signatures (Technician, Advisor, Customer)
        const signY = finalY + 34;
        doc.setDrawColor(148, 163, 184);
        doc.line(14, signY, 64, signY);
        doc.line(76, signY, 126, signY);
        doc.line(136, signY, 196, signY);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Technician: ${order.mechanic?.name || '___________________'}`, 14, signY + 5);
        doc.text(`Service Advisor: ${order.advisor?.name || '___________________'}`, 76, signY + 5);
        doc.text('Customer Vehicle Acceptance', 136, signY + 5);

        // Disclaimer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.text(
            '* NOTE: This Service Invoice is an official technical record of services rendered and parts installed. No monetary amounts are stated.',
            14,
            signY + 16
        );

        // Footer
        doc.setFont('helvetica', 'normal');
        doc.text('CarShop ERP System Generated Document', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });

        // Print Only
        doc.autoPrint();
        const blobUrl = URL.createObjectURL(doc.output('blob'));
        window.open(blobUrl, '_blank');
    };

    const printCancelledInvoice = () => {
        const doc = new jsPDF();
        const now = new Date();
        const dateStr = now.toLocaleDateString();

        // Red Header Banner
        doc.setFillColor(254, 242, 242);
        doc.rect(14, 12, 182, 30, 'F');
        doc.setDrawColor(239, 68, 68);
        doc.rect(14, 12, 182, 30, 'S');

        // Company Branding
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('CarShop ERP', 20, 22);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Car Shop Management & Repair System', 20, 28);
        doc.text('123 Service Road, Auto City | Tel: (02) 8123-4567', 20, 34);

        // Document Title Badge
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38); // Red-600
        doc.text('CANCELLED INVOICE', 190, 21, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28);
        doc.text('[ VOIDED - NO PAYMENT DUE ]', 190, 26, { align: 'right' });

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Invoice #: INV-${(order.order_number || '').replace(/^JO-/, '')} (VOID)`, 190, 31, { align: 'right' });
        doc.text(`Date: ${dateStr} | JO #: ${order.order_number}`, 190, 36, { align: 'right' });

        // Red Cancellation Notice Box
        doc.setFillColor(254, 226, 226);
        doc.roundedRect(14, 46, 182, 18, 2, 2, 'F');
        doc.setDrawColor(248, 113, 113);
        doc.roundedRect(14, 46, 182, 18, 2, 2, 'S');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28);
        doc.text('NOTICE OF INVOICE CANCELLATION:', 18, 52);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(153, 27, 27);
        const reasonText = order.cancellation_reason ? `Reason: ${order.cancellation_reason}` : 'Reason: Order cancelled by authorized user.';
        const cancelDateText = order.cancelled_at ? `Cancelled on: ${new Date(order.cancelled_at).toLocaleString()}` : `Cancelled on: ${dateStr}`;
        doc.text(`${reasonText} | ${cancelDateText}`, 18, 58, { maxWidth: 174 });

        // Info Cards (Customer & Vehicle)
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, 68, 88, 30, 2, 2, 'F');
        doc.roundedRect(108, 68, 88, 30, 2, 2, 'F');

        // Customer Info
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('CUSTOMER DETAILS', 18, 74);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(order.customer?.full_name || 'Walk-in Customer', 18, 80);
        doc.text(`Contact: ${order.customer?.contact_number || 'N/A'}`, 18, 85);
        doc.text(`Address: ${order.customer?.address || 'N/A'}`, 18, 90, { maxWidth: 80 });

        // Vehicle Info
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text('VEHICLE DETAILS', 112, 74);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Plate No: ${order.vehicle?.plate_number || 'N/A'}`, 112, 80);
        doc.text(`Model: ${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} (${order.vehicle?.year || 'N/A'})`, 112, 85);
        doc.text(`VIN: ${order.vehicle?.vin || 'N/A'}`, 112, 90);

        // Service Table
        const tableBody = orderItems.map((item, idx) => [
            idx + 1,
            `${item.description || 'N/A'} [VOID]`,
            (item.item_type || 'part').toUpperCase(),
            item.quantity,
            `Php ${parseFloat(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            'Php 0.00'
        ]);

        if (tableBody.length === 0) {
            tableBody.push([{ content: 'No items recorded on this cancelled invoice.', colSpan: 6, styles: { halign: 'center' } }]);
        }

        autoTable(doc, {
            startY: 102,
            head: [['#', 'Item / Service Description', 'Type', 'Qty', 'Original Unit Price', 'Amount Due']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105], fontStyle: 'bold', fontSize: 9 },
            styles: { fontSize: 8.5, textColor: [100, 116, 139], cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 78 },
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 16, halign: 'center' },
                4: { cellWidth: 28, halign: 'right' },
                5: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] }
            }
        });

        // Totals & Summary
        const calculatedItemsTotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price || (item.quantity * item.unit_price) || 0), 0);
        const originalTotal = parseFloat(order.actual_cost || order.estimated_cost || calculatedItemsTotal || 0);
        const finalY = doc.lastAutoTable.finalY + 8;

        doc.setFillColor(254, 242, 242);
        doc.rect(116, finalY, 80, 24, 'F');
        doc.setDrawColor(252, 165, 165);
        doc.rect(116, finalY, 80, 24, 'S');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(153, 27, 27);
        doc.text('ORIGINAL AMOUNT:', 120, finalY + 6);
        doc.text(`Php ${originalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 190, finalY + 6, { align: 'right' });

        doc.text('STATUS:', 120, finalY + 12);
        doc.setFont('helvetica', 'bold');
        doc.text('CANCELLED / VOID', 190, finalY + 12, { align: 'right' });

        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text('AMOUNT DUE:', 120, finalY + 20);
        doc.text('Php 0.00', 190, finalY + 20, { align: 'right' });

        // Signatures
        const signY = finalY + 36;
        doc.setDrawColor(148, 163, 184);
        doc.line(20, signY, 80, signY);
        doc.line(120, signY, 180, signY);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Authorized Cancellation / Supervisor', 20, signY + 5);
        doc.text('Customer Notification / Conforme', 120, signY + 5);

        // Disclaimer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(185, 28, 28);
        doc.text(
            '* VOID TRANSACTION: This invoice is formally cancelled and invalidated. No liabilities or balances are outstanding.',
            14,
            signY + 16
        );

        // Footer
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('CarShop ERP System Generated Void Record', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });

        // Print Only
        doc.autoPrint();
        const blobUrl = URL.createObjectURL(doc.output('blob'));
        window.open(blobUrl, '_blank');
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

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800 bg-slate-800/20">
                                        <th className="px-4 py-3 font-semibold w-32">Type</th>
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
                                                onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value, inventory_id: '', description: '', unit_price: 0 })}
                                            >
                                                <option value="part">Part</option>
                                                <option value="labor">Labor</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            {newItem.item_type === 'part' ? (
                                                <select
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={newItem.inventory_id}
                                                    onChange={(e) => {
                                                        const item = inventory.find(i => String(i.id) === String(e.target.value));
                                                        setNewItem({
                                                            ...newItem,
                                                            inventory_id: e.target.value,
                                                            description: item ? item.name : '',
                                                            unit_price: item ? item.unit_price : 0
                                                        });
                                                    }}
                                                >
                                                    <option value="">-- Select Inventory --</option>
                                                    {inventory.map(i => (
                                                        <option key={i.id} value={i.id}>{i.name} (₱{i.unit_price}) - Stock: {i.stock_quantity}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Description (Press Enter to save)"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={newItem.description}
                                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && addItem(e)}
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
                                                    disabled={newItem.item_type === 'part'}
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
