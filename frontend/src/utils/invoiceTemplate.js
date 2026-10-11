// Shared printable invoice layout, modeled on the standard "SERVICE INVOICE" form:
// Cash/Charge Sales boxes, S.I. No./Date/P.O. No., SOLD TO box, item grid,
// VAT breakdown, totals box, Received By and SC/PWD/NAAC/MOV/SP lines.

export const VAT_RATE = 0.12; // Prices are treated as VAT-inclusive (12%)
const MIN_ROWS = 14; // Minimum number of item rows (blank rows pad the grid like the paper form)

export const fmtMoney = (n) =>
    (parseFloat(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtQty = (q) => {
    const n = parseFloat(q);
    if (isNaN(n)) return '';
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
};

export const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const INVOICE_CSS = `
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; }
    body {
        font-family: Arial, Helvetica, sans-serif;
        color: #000;
        margin: 0;
        font-size: 11.5px;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .si { position: relative; width: 100%; }
    .si-watermark {
        position: fixed; top: 45%; left: 50%;
        transform: translate(-50%, -50%) rotate(-28deg);
        font-size: 120px; font-weight: 900; letter-spacing: 10px;
        white-space: nowrap; pointer-events: none; z-index: 0; opacity: 0.12;
    }
    .si-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .si-brand img { max-height: 50px; width: auto; object-fit: contain; }
    .si-title { text-align: right; line-height: 1.05; }
    .si-title .t1 { font-size: 21px; font-weight: 800; letter-spacing: 0.5px; }
    .si-title .t2 { font-size: 30px; font-weight: 800; letter-spacing: 1px; }
    .si-title .sub { font-size: 9px; font-weight: 700; margin-top: 3px; letter-spacing: 0.5px; }
    .si-head { display: flex; justify-content: space-between; align-items: flex-end; margin: 10px 0 6px; }
    .si-checks { padding-left: 30px; }
    .chk { display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 700; margin: 4px 0; }
    .chk .box {
        width: 17px; height: 17px; border: 1.5px solid #000;
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 14px; line-height: 1; font-weight: 900;
    }
    .si-nums { width: 270px; }
    .num-row { display: flex; align-items: flex-end; gap: 6px; font-size: 14px; font-weight: 700; margin: 4px 0; }
    .num-row .lbl, .recv .lbl { white-space: nowrap; }
    .line {
        flex: 1; border-bottom: 1.5px solid #000; min-height: 17px;
        font-weight: 400; font-size: 12px; padding: 0 4px;
    }
    .sold-to { border: 1.5px solid #000; margin-bottom: 8px; }
    .sold-title { font-size: 15px; font-weight: 800; padding: 1px 4px; border-bottom: 1.5px solid #000; }
    .sold-grid { display: grid; grid-template-columns: 1.55fr 1fr; gap: 10px; padding: 2px 4px 4px; }
    .f { font-size: 12px; margin: 2px 0; }
    .f .v { font-weight: 700; margin-left: 4px; }
    .si-notes { border: 1px solid #000; padding: 4px 6px; font-size: 10.5px; margin-bottom: 8px; line-height: 1.45; }
    table { border-collapse: collapse; }
    .si-items { width: 100%; border: 1.5px solid #000; position: relative; z-index: 1; }
    .si-items th { font-size: 13px; font-weight: 800; padding: 9px 6px; border: 1px solid #000; }
    .si-items td { border: 1px solid #000; height: 22px; padding: 2px 6px; font-size: 11px; vertical-align: middle; }
    .c { text-align: center; }
    .r { text-align: right; }
    .child { padding-left: 20px !important; color: #333; }
    .tag {
        display: inline-block; font-size: 7.5px; font-weight: 700; border: 1px solid #000;
        padding: 0 4px; border-radius: 3px; margin-left: 5px; vertical-align: middle;
    }
    .inc { font-size: 9.5px; font-style: italic; }
    .void-amt { text-decoration: line-through; color: #555; }
    .si-bottom { display: flex; justify-content: space-between; gap: 14px; margin-top: 8px; }
    .si-left { width: 48%; }
    .si-right { width: 50%; position: relative; }
    .vat-tbl, .tot-tbl { width: 100%; border: 1.5px solid #000; }
    .vat-tbl td, .tot-tbl td { border: 1px solid #000; font-size: 12px; padding: 2px 6px; height: 21px; }
    .vat-tbl td:first-child { text-align: right; width: 58%; font-size: 13px; }
    .vat-tbl td:last-child, .tot-tbl td:last-child { text-align: right; width: 38%; font-weight: 600; }
    .tot-tbl td:first-child { text-align: right; }
    .tot-tbl .small { font-size: 6.5px; }
    .tot-tbl .grand td { font-weight: 800; font-size: 12.5px; }
    .recv { display: flex; align-items: flex-end; gap: 6px; font-size: 13px; margin-top: 12px; }
    .recv .line { font-weight: 700; }
    .si-sc { margin: 10px 0 0 auto; width: 62%; }
    .si-sc .recv { margin-top: 6px; font-size: 12.5px; }
    .si-stamp {
        position: absolute; right: 40px; top: -70px; transform: rotate(-12deg); z-index: 2;
        border: 3px solid currentColor; font-weight: 900; font-size: 24px;
        padding: 2px 14px; letter-spacing: 3px; border-radius: 6px; opacity: 0.85;
        background: rgba(255, 255, 255, 0.6);
    }
    .si-footer { text-align: center; margin-top: 16px; font-size: 10.5px; font-weight: 800; color: #ea580c; letter-spacing: 0.5px; }
    .si-footer .sub { color: #555; font-weight: 400; font-size: 9px; margin-top: 3px; letter-spacing: 0; }
`;

/**
 * Builds the invoice body HTML.
 * @param {object} o
 *  - titleTop, titleMain, subtitle
 *  - siNo, date, poNo
 *  - saleType: 'cash' | 'charge' | null
 *  - customer: { name, tin, address }, vehicle: { label, plate }, terms
 *  - lines: [{ description, quantity, unitPrice, amount, included, child }]
 *  - showAmounts (default true), voided
 *  - totals: { totalSales, discount, withholding, totalDue }
 *  - receivedAmount, receivedBy
 *  - notesHtml, watermark: { text, color }, stamp: { text, color }, footerNote
 */
export function buildInvoiceHtml(o) {
    const show = o.showAmounts !== false;
    const voided = !!o.voided;
    const money = (n) => (voided ? `<span class="void-amt">${fmtMoney(n)}</span>` : fmtMoney(n));
    const val = (n) => (show ? money(n) : '');

    const lines = o.lines || [];
    const itemRows = lines.map((l) => {
        const unit = !show ? '' : l.included ? '<span class="inc">Included</span>' : money(l.unitPrice);
        const amt = !show ? '' : l.included ? '&ndash;' : money(l.amount);
        return `
            <tr>
                <td class="${l.child ? 'child' : ''}">${l.child ? '&#8627; ' : ''}${esc(l.description)}${l.included ? '<span class="tag">INCLUDED</span>' : ''}</td>
                <td class="c">${fmtQty(l.quantity)}</td>
                <td class="r">${unit}</td>
                <td class="r">${amt}</td>
            </tr>`;
    }).join('');
    const blankRows = Array.from({ length: Math.max(0, MIN_ROWS - lines.length) })
        .map(() => '<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>')
        .join('');

    const t = o.totals || {};
    const totalSales = parseFloat(t.totalSales) || 0;
    const lessVat = (totalSales * VAT_RATE) / (1 + VAT_RATE);
    const netOfVat = totalSales - lessVat;
    const discount = parseFloat(t.discount) || 0;
    const withholding = parseFloat(t.withholding) || 0;
    const totalDue = t.totalDue ?? Math.max(0, totalSales - discount - withholding);
    const dueCell = !show ? '' : voided ? '0.00' : fmtMoney(totalDue);

    const c = o.customer || {};
    const veh = o.vehicle || {};

    return `
        <div class="si">
            ${o.watermark ? `<div class="si-watermark" style="color: ${o.watermark.color || '#dc2626'};">${esc(o.watermark.text)}</div>` : ''}

            <div class="si-top">
                <div class="si-brand"></div>
                <div class="si-title">
                    <div class="t1">${esc(o.titleTop || 'SERVICE')}</div>
                    <div class="t2">${esc(o.titleMain || 'INVOICE')}</div>
                    ${o.subtitle ? `<div class="sub">${esc(o.subtitle)}</div>` : ''}
                </div>
            </div>

            <div class="si-head">
                <div class="si-checks">
                    <div class="chk"><span class="box">${o.saleType === 'cash' ? '&#10003;' : ''}</span> Cash Sales</div>
                    <div class="chk"><span class="box">${o.saleType === 'charge' ? '&#10003;' : ''}</span> Charge Sales</div>
                </div>
                <div class="si-nums">
                    <div class="num-row"><span class="lbl">S.I. No.:</span><span class="line">${esc(o.siNo)}</span></div>
                    <div class="num-row"><span class="lbl">Date:</span><span class="line">${esc(o.date)}</span></div>
                    <div class="num-row"><span class="lbl">P.O. No.:</span><span class="line">${esc(o.poNo)}</span></div>
                </div>
            </div>

            <div class="sold-to">
                <div class="sold-title">SOLD TO:</div>
                <div class="sold-grid">
                    <div>
                        <div class="f">Customer:<span class="v">${esc(c.name)}</span></div>
                        <div class="f">TIN:<span class="v">${esc(c.tin)}</span></div>
                        <div class="f">Address:<span class="v">${esc(c.address)}</span></div>
                    </div>
                    <div>
                        <div class="f">Terms:<span class="v">${esc(o.terms)}</span></div>
                        <div class="f">Vehicle:<span class="v">${esc(veh.label)}</span></div>
                        <div class="f">Plate No.:<span class="v">${esc(veh.plate)}</span></div>
                    </div>
                </div>
            </div>

            ${o.notesHtml ? `<div class="si-notes">${o.notesHtml}</div>` : ''}

            <table class="si-items">
                <thead>
                    <tr>
                        <th>Item Description/Nature of Service</th>
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
                        <tr><td>VATable Sales</td><td>${val(netOfVat)}</td></tr>
                        <tr><td>VAT</td><td>${val(lessVat)}</td></tr>
                        <tr><td>Zero-Rated Sales</td><td>${val(0)}</td></tr>
                        <tr><td>VAT-Exempt Sales</td><td>${val(0)}</td></tr>
                    </table>
                    <div class="recv"><span class="lbl">Received the amount of:</span><span class="line">${esc(o.receivedAmount)}</span></div>
                    <div class="recv"><span class="lbl">Received By:</span><span class="line">${esc(o.receivedBy)}</span></div>
                </div>
                <div class="si-right">
                    ${o.stamp ? `<div class="si-stamp" style="color: ${o.stamp.color || '#059669'};">${esc(o.stamp.text)}</div>` : ''}
                    <table class="tot-tbl">
                        <tr><td>Total Sales (VAT Inclusive)</td><td>${val(totalSales)}</td></tr>
                        <tr><td>Less VAT</td><td>${val(lessVat)}</td></tr>
                        <tr><td>Amount Net of VAT</td><td>${val(netOfVat)}</td></tr>
                        <tr><td><span class="small">(SC/PWD/NAAC/MOV/SP)</span> Less Discount</td><td>${val(discount)}</td></tr>
                        <tr><td>Add VAT</td><td>${val(lessVat)}</td></tr>
                        <tr><td>Less Withholding Tax</td><td>${val(withholding)}</td></tr>
                        <tr class="grand"><td>TOTAL AMOUNT DUE</td><td>${dueCell}</td></tr>
                    </table>
                </div>
            </div>

            <div class="si-sc">
                <div class="recv"><span class="lbl">SC/PWD/NAAC/MOV/SP ID No.:</span><span class="line"></span></div>
                <div class="recv"><span class="lbl">SC/PWD/NAAC/MOV/SP Signature:</span><span class="line"></span></div>
            </div>

            <div class="si-footer">
                RADI8 SYSTEM GENERATED DOCUMENT
                ${o.footerNote ? `<div class="sub">${esc(o.footerNote)}</div>` : ''}
            </div>
        </div>
    `;
}

/** Prints the given invoice body HTML through a hidden iframe. */
export function printInvoice(title, bodyHtml) {
    let iframe = document.getElementById('carshop-print-iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'carshop-print-iframe';
        Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
        document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${INVOICE_CSS}</style></head><body>${bodyHtml}</body></html>`);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 300);
}
