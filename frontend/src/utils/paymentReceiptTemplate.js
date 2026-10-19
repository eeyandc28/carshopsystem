// ==============================================================================
// Winjen Printing - Official "SERVICE INVOICE" Payment Receipt Template
// Modeled directly on the official paper receipt form:
// - Cash Sales / Charge Sales checkboxes
// - S.I. No. / Date / P.O. No.
// - SOLD TO box (Customer, Terms, TIN, Address, Vehicle)
// - Item grid (Description, Qty, Unit Cost, Amount) + padded rows
// - VATable Sales, VAT, Zero-Rated, VAT-Exempt
// - Total Sales, Less VAT, Net of VAT, Less Discount, Total Amount Due
// - Received the amount of / Received By
// - SC/PWD/NAAC/MOV/SP ID No. & Signature
// - WINJEN PRINTING footer
// ==============================================================================

export const VAT_RATE = 0.12;
const MIN_ROWS = 14;

export const fmtMoney = (n) =>
    (parseFloat(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtQty = (q) => {
    const n = parseFloat(q);
    if (isNaN(n)) return '';
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
};

export const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const PAYMENT_RECEIPT_CSS = `
    @page {
        size: A4 portrait;
        margin: 8mm 12mm;
    }
    * {
        box-sizing: border-box;
    }
    body {
        font-family: Arial, Helvetica, sans-serif;
        color: #000;
        margin: 0;
        padding: 0;
        font-size: 11px;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .si {
        position: relative;
        width: 100%;
        max-width: 780px;
        margin: 0 auto;
        padding: 6px;
    }
    .si-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2px;
    }
    .si-checks {
        padding-top: 10px;
    }
    .chk {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13.5px;
        font-weight: 700;
        margin: 6px 0;
    }
    .chk .box {
        width: 18px;
        height: 18px;
        border: 1.5px solid #000;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        line-height: 1;
        font-weight: 900;
    }
    .si-title-block {
        text-align: right;
    }
    .si-title-block .t1 {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: 0.5px;
        line-height: 1.05;
    }
    .si-title-block .t2 {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 1px;
        line-height: 1.05;
        margin-bottom: 8px;
    }
    .si-nums {
        width: 270px;
        margin-left: auto;
    }
    .num-row {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        font-size: 13.5px;
        font-weight: 700;
        margin: 3px 0;
    }
    .num-row .lbl, .recv .lbl {
        white-space: nowrap;
    }
    .line {
        flex: 1;
        border-bottom: 1.5px solid #000;
        min-height: 17px;
        font-weight: 600;
        font-size: 12px;
        padding: 0 4px;
    }
    .sold-to {
        border: 1.5px solid #000;
        margin: 8px 0 6px 0;
    }
    .sold-title {
        font-size: 14px;
        font-weight: 800;
        padding: 2px 6px;
        border-bottom: 1.5px solid #000;
        letter-spacing: 0.5px;
    }
    .sold-grid {
        display: grid;
        grid-template-columns: 1.6fr 1fr;
        gap: 8px;
        padding: 4px 6px;
    }
    .f {
        font-size: 11.5px;
        margin: 2px 0;
        line-height: 1.35;
    }
    .f .v {
        font-weight: 700;
        margin-left: 4px;
    }
    table {
        border-collapse: collapse;
    }
    .si-items {
        width: 100%;
        border: 1.5px solid #000;
        margin-top: 4px;
    }
    .si-items th {
        font-size: 12px;
        font-weight: 800;
        padding: 6px 4px;
        border: 1px solid #000;
        text-align: center;
        background: #fff;
    }
    .si-items td {
        border: 1px solid #000;
        height: 20px;
        padding: 2px 6px;
        font-size: 11px;
        vertical-align: middle;
    }
    .c { text-align: center; }
    .r { text-align: right; }
    .child { padding-left: 18px !important; color: #333; }
    .tag {
        display: inline-block;
        font-size: 7.5px;
        font-weight: 700;
        border: 1px solid #000;
        padding: 0 3px;
        border-radius: 3px;
        margin-left: 5px;
        vertical-align: middle;
    }
    .si-bottom {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 6px;
    }
    .si-left {
        width: 48%;
    }
    .si-right {
        width: 50%;
        position: relative;
    }
    .vat-tbl, .tot-tbl {
        width: 100%;
        border: 1.5px solid #000;
    }
    .vat-tbl td, .tot-tbl td {
        border: 1px solid #000;
        font-size: 11px;
        padding: 2px 6px;
        height: 19px;
    }
    .vat-tbl td:first-child {
        text-align: right;
        width: 58%;
        font-weight: 600;
    }
    .vat-tbl td:last-child, .tot-tbl td:last-child {
        text-align: right;
        width: 38%;
        font-weight: 600;
    }
    .tot-tbl td:first-child {
        text-align: right;
    }
    .tot-tbl .small {
        font-size: 7px;
    }
    .tot-tbl .grand td {
        font-weight: 800;
        font-size: 12px;
        border-top: 1.5px solid #000;
    }
    .recv {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        font-size: 11.5px;
        font-weight: 700;
        margin-top: 8px;
    }
    .recv .line {
        font-weight: 600;
    }
    .si-sc {
        margin: 6px 0 0 auto;
        width: 58%;
    }
    .si-sc .recv {
        margin-top: 4px;
        font-size: 11px;
    }
    .si-stamp {
        position: absolute;
        right: 30px;
        top: -45px;
        transform: rotate(-12deg);
        z-index: 2;
        border: 3px solid #059669;
        color: #059669;
        font-weight: 900;
        font-size: 22px;
        padding: 2px 14px;
        letter-spacing: 2px;
        border-radius: 6px;
        opacity: 0.85;
        background: rgba(255, 255, 255, 0.7);
    }
    .si-footer {
        text-align: center;
        margin-top: 14px;
        font-size: 11.5px;
        font-weight: 800;
        color: #c45b34;
        letter-spacing: 1px;
        text-transform: uppercase;
    }
    @media print {
        body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .no-print {
            display: none !important;
        }
    }
`;

/**
 * Builds the official "SERVICE INVOICE" payment receipt HTML string.
 */
export function buildPaymentReceiptHtml(params) {
    const {
        siNo = '',
        date = new Date().toLocaleDateString(),
        poNo = '',
        paymentMethod = 'Cash',
        customer = {},
        vehicle = {},
        terms = '',
        items = [],
        totalBill = 0,
        discount = 0,
        withholding = 0,
        amountPaid = 0,
        amountPaidNow = 0,
        remainingBalance = 0,
        receivedBy = 'Cashier'
    } = params;

    const isCash = (paymentMethod || '').toLowerCase() !== 'charge' && (paymentMethod || '').toLowerCase() !== 'credit';
    const isCharge = !isCash;

    // Items list + padding rows
    const lines = items.length > 0 ? items : [
        {
            description: `Automotive Service & Repair - Job Order #${poNo || siNo}`,
            quantity: 1,
            unitPrice: totalBill,
            amount: totalBill,
            included: false
        }
    ];

    const itemRows = lines.map((l) => {
        const isInc = !!l.included || (parseFloat(l.unitPrice || 0) === 0 && (l.description || '').toLowerCase().includes('included'));
        const unit = isInc ? 'INCLUDED' : fmtMoney(l.unitPrice);
        const amt = isInc ? '0.00' : fmtMoney(l.amount || (l.quantity * l.unitPrice));
        return `
            <tr>
                <td class="${l.child ? 'child' : ''}">
                    ${l.child ? '&#8627; ' : ''}${esc(l.description)}
                    ${isInc ? '<span class="tag">INCLUDED</span>' : ''}
                </td>
                <td class="c">${fmtQty(l.quantity || 1)}</td>
                <td class="r">${unit}</td>
                <td class="r">${amt}</td>
            </tr>`;
    }).join('');

    const blankCount = Math.max(0, MIN_ROWS - lines.length);
    const blankRows = Array.from({ length: blankCount })
        .map(() => '<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>')
        .join('');

    // Totals & VAT calculations (Prices treated as VAT-inclusive 12%)
    const grossTotal = parseFloat(totalBill) || 0;
    const discVal = parseFloat(discount) || 0;
    const withVal = parseFloat(withholding) || 0;
    const netTotal = Math.max(0, grossTotal - discVal - withVal);

    const lessVat = (grossTotal * VAT_RATE) / (1 + VAT_RATE);
    const vatableSales = grossTotal - lessVat;

    const totalDue = netTotal;
    const isFullySettled = remainingBalance <= 0 || (amountPaid >= netTotal && netTotal > 0);

    const receivedDisplay = amountPaidNow > 0
        ? `Php ${fmtMoney(amountPaidNow)} (${esc(paymentMethod)})`
        : amountPaid > 0
            ? `Php ${fmtMoney(amountPaid)} (${esc(paymentMethod)})`
            : `Php ${fmtMoney(totalDue)} (${esc(paymentMethod)})`;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Payment_Receipt_${esc(siNo || poNo)}</title>
            <style>${PAYMENT_RECEIPT_CSS}</style>
        </head>
        <body>
            <div class="si">
                <div class="si-top">
                    <div class="si-checks">
                        <div class="chk">
                            <span class="box">${isCash ? '&#10003;' : ''}</span> Cash Sales
                        </div>
                        <div class="chk">
                            <span class="box">${isCharge ? '&#10003;' : ''}</span> Charge Sales
                        </div>
                    </div>
                    <div class="si-title-block">
                        <div class="t1">SERVICE</div>
                        <div class="t2">INVOICE</div>
                        <div class="si-nums">
                            <div class="num-row">
                                <span class="lbl">S.I. No.:</span>
                                <span class="line">${esc(siNo)}</span>
                            </div>
                            <div class="num-row">
                                <span class="lbl">Date:</span>
                                <span class="line">${esc(date)}</span>
                            </div>
                            <div class="num-row">
                                <span class="lbl">P.O. No.:</span>
                                <span class="line">${esc(poNo)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sold-to">
                    <div class="sold-title">SOLD TO:</div>
                    <div class="sold-grid">
                        <div>
                            <div class="f">Customer:<span class="v">${esc(customer.name || customer.full_name || 'Walk-in Customer')}</span></div>
                            <div class="f">TIN:<span class="v">${esc(customer.tin || 'N/A')}</span></div>
                            <div class="f">Address:<span class="v">${esc(customer.address || 'N/A')}</span></div>
                        </div>
                        <div>
                            <div class="f">Terms:<span class="v">${esc(terms || paymentMethod || 'Cash')}</span></div>
                            <div class="f">Vehicle:<span class="v">${esc(vehicle.label || (vehicle.brand ? `${vehicle.brand} ${vehicle.model || ''}` : 'N/A'))}</span></div>
                            <div class="f">Plate No.:<span class="v">${esc(vehicle.plate || vehicle.plate_number || 'N/A')}</span></div>
                        </div>
                    </div>
                </div>

                <table class="si-items">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Item Description/Nature of Service</th>
                            <th style="width: 14%;">Qty.</th>
                            <th style="width: 16%;">Unit Cost</th>
                            <th style="width: 20%;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                        ${blankRows}
                    </tbody>
                </table>

                <div class="si-bottom">
                    <div class="si-left">
                        <table class="vat-tbl">
                            <tr>
                                <td>VATable Sales</td>
                                <td>${fmtMoney(vatableSales)}</td>
                            </tr>
                            <tr>
                                <td>VAT</td>
                                <td>${fmtMoney(lessVat)}</td>
                            </tr>
                            <tr>
                                <td>Zero-Rated Sales</td>
                                <td>0.00</td>
                            </tr>
                            <tr>
                                <td>VAT-Exempt Sales</td>
                                <td>0.00</td>
                            </tr>
                        </table>
                        <div class="recv">
                            <span class="lbl">Received the amount of:</span>
                            <span class="line">${receivedDisplay}</span>
                        </div>
                        <div class="recv">
                            <span class="lbl">Received By:</span>
                            <span class="line">${esc(receivedBy)}</span>
                        </div>
                    </div>

                    <div class="si-right">
                        ${isFullySettled ? '<div class="si-stamp">PAID</div>' : ''}
                        <table class="tot-tbl">
                            <tr>
                                <td>Total Sales (VAT Inclusive)</td>
                                <td>${fmtMoney(grossTotal)}</td>
                            </tr>
                            <tr>
                                <td>Less VAT</td>
                                <td>${fmtMoney(lessVat)}</td>
                            </tr>
                            <tr>
                                <td>Amount Net of VAT</td>
                                <td>${fmtMoney(vatableSales)}</td>
                            </tr>
                            <tr>
                                <td><span class="small">(SC/PWD/NAAC/MOV/SP)</span> Less Discount</td>
                                <td>${fmtMoney(discVal)}</td>
                            </tr>
                            <tr>
                                <td>Add VAT</td>
                                <td>${fmtMoney(lessVat)}</td>
                            </tr>
                            <tr>
                                <td>Less Withholding Tax</td>
                                <td>${fmtMoney(withVal)}</td>
                            </tr>
                            <tr class="grand">
                                <td>TOTAL AMOUNT DUE</td>
                                <td>Php ${fmtMoney(totalDue)}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="si-sc">
                    <div class="recv">
                        <span class="lbl">SC/PWD/NAAC/MOV/SP ID No.:</span>
                        <span class="line"></span>
                    </div>
                    <div class="recv">
                        <span class="lbl">SC/PWD/NAAC/MOV/SP Signature:</span>
                        <span class="line"></span>
                    </div>
                </div>

                <div class="si-footer">
                    WINJEN PRINTING
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Opens a print dialog / preview tab for the payment receipt.
 */
export function openPaymentReceipt(html, title = 'Payment_Receipt') {
    // Open in a new tab/window for immediate preview & print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            try {
                printWindow.print();
            } catch {
                // browser blocked auto print, user can print manually
            }
        }, 350);
        return;
    }

    // Fallback if popups blocked: print via hidden iframe
    let iframe = document.getElementById('payment-receipt-print-iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'payment-receipt-print-iframe';
        Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
        document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 350);
}
