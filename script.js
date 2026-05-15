// Victus Energy Executive ERP Logic
let currentRefNumber = 1100;
let curDocType = 'Quotation';
let taxRate = 0.16;
let globalSignature = null;

// --- NOTIFICATION ENGINE ---
function showNotification(message) {
    const existing = document.getElementById('erp-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'erp-toast';
    toast.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-[999] font-black tracking-wider text-xs uppercase border border-slate-700 transition-all duration-300';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- CLOUD ARCHIVE ENGINE ---
async function saveToNeon() {
    showNotification("Syncing to Neon Database...");
    let itemsArray = [];
    let contractDetails = null;

    if (curDocType === 'Deal Recap') {
        const fields = ['product', 'qty', 'price', 'vat', 'storage', 'marking', 'srf', 'erb', 'window', 'delivery', 'quality', 'qtydet', 'transfer', 'payment', 'laytime', 'inspection', 'others'];
        contractDetails = {};
        fields.forEach(f => contractDetails[f] = document.getElementById(`dr-${f}`).value);
    } else {
        document.querySelectorAll('.item-row').forEach(row => {
            itemsArray.push({
                description: row.querySelector('.i-desc').value,
                qty: row.querySelector('.i-qty').value,
                price: row.querySelector('.i-price').value
            });
        });
    }

    const rawTotal = document.getElementById('pTotal').innerText.replace('ZMW ', '').replace(/,/g, '');

    const docData = {
        ref_no: document.getElementById('docNum').value,
        doc_type: curDocType,
        client_name: document.getElementById('clientName').value || 'Unknown',
        address: document.getElementById('address').value || 'None',
        representative: document.getElementById('salesRep').value,
        items: itemsArray,
        total_amount: parseFloat(rawTotal) || 0,
        contract_details: contractDetails
    };

    try {
        const res = await fetch('/api/save-to-neon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(docData)
        });
        const response = await res.json();
        if (response.success) {
            showNotification("Document Archived to Neon 🟢");
            currentRefNumber++;
            updateDocNumber();
        } else {
            showNotification("Archive Failed 🔴");
        }
    } catch (err) {
        showNotification("Network Error: Check API Connection 🔴");
    }
}

// --- SETTINGS ENGINE (ABSA DEFAULTS) ---
function applySettings() {
    fetch('/api/settings')
    .then(res => res.json())
    .then(data => {
        if(data.success && data.data) {
            const config = data.data;
            const savedTax = config.tax_rate ? parseFloat(config.tax_rate) : 16;
            taxRate = savedTax / 100;
            
            // Map to Footer
            const bName = config.bank_name || 'Absa Bank';
            const accName = config.account_name || 'Victus Energy Limited';
            const accNum = config.account_number || '2219308';
            
            document.getElementById('pFooterInfo').innerHTML = `
                <p class="text-slate-900 mb-1 font-black">Banking Information:</p>
                <p>Bank: ${bName} | Acc Name: ${accName} | Acc No: ${accNum}</p>
                <p>Swift: ${config.swift_code || 'BARCZMLX'} | Sort: ${config.sort_code || '020016'}</p>
                <p class="mt-2 italic font-medium text-slate-400">Shortages notified within 72 hrs. Complaints in writing within 30 days.</p>
            `;
            
            if (config.signature) {
                document.getElementById('pSignature').src = config.signature;
                document.getElementById('pSignature').classList.remove('hidden');
            }
            sync();
        }
    });
}

// --- CORE UTILS ---
function sync() {
    const client = document.getElementById('clientName').value || 'Client Name';
    document.getElementById('pName').innerText = client;
    document.getElementById('pAddr').innerText = document.getElementById('address').value;
    document.getElementById('pDate').innerText = document.getElementById('docDate').value || new Date().toLocaleDateString();

    if (curDocType !== 'Deal Recap') {
        const table = document.getElementById('pTable');
        table.innerHTML = '';
        let sub = 0;
        document.querySelectorAll('.item-row').forEach(r => {
            const d = r.querySelector('.i-desc').value;
            const q = parseFloat(r.querySelector('.i-qty').value) || 0;
            const p = parseFloat(r.querySelector('.i-price').value) || 0;
            const total = q * p;
            sub += total;
            if(d) table.innerHTML += `<tr><td class="py-4 px-6 uppercase">${d}</td><td class="text-center">${q}</td><td class="text-right">${p.toLocaleString()}</td><td class="text-right font-black">ZMW ${total.toLocaleString()}</td></tr>`;
        });
        const vat = sub * taxRate;
        document.getElementById('pSub').innerText = "ZMW " + sub.toLocaleString();
        document.getElementById('pVat').innerText = "ZMW " + vat.toLocaleString();
        document.getElementById('pTotal').innerText = "ZMW " + (sub + vat).toLocaleString();
    } else {
        const product = document.getElementById('dr-product').value || 'Product';
        document.getElementById('dr-subtitle').innerText = `Deal Recap for Sale of ${product} to ${client}`;
        const drBody = document.getElementById('dr-table-body');
        drBody.innerHTML = '';
        const fields = ['product', 'qty', 'price', 'vat', 'storage', 'marking', 'srf', 'erb', 'window', 'delivery', 'payment'];
        fields.forEach(f => {
            const val = document.getElementById(`dr-${f}`).value || '-';
            drBody.innerHTML += `<tr><td class="p-3 bg-slate-100 font-bold uppercase w-1/3">${f}</td><td class="p-3">${val}</td></tr>`;
        });
    }
}

function updateDocNumber() {
    const prefixes = { 'Quotation': 'QT', 'Delivery Note': 'DN', 'Deal Recap': 'DR', 'Proforma Invoice': 'PI' };
    const finalRef = `VEL-${prefixes[curDocType] || 'INV'}-${currentRefNumber}`;
    document.getElementById('docNum').value = finalRef;
    document.getElementById('pRef').innerText = "REF: " + finalRef;
}

function addRow() {
    const row = document.createElement('div');
    row.className = "item-row p-4 bg-slate-50 rounded-xl border mb-3 relative";
    row.innerHTML = `<input type="text" oninput="sync()" placeholder="Description" class="input-box mb-2 i-desc"><div class="flex gap-2"><input type="number" oninput="sync()" placeholder="Qty" class="input-box i-qty w-20" value="1"><input type="number" oninput="sync()" placeholder="Price" class="input-box i-price flex-1" value="0"></div>`;
    document.getElementById('itemList').appendChild(row);
}

window.onload = () => { applySettings(); updateDocNumber(); addRow(); };