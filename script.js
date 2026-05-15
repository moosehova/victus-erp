if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(() => {
        console.log("Service Worker Registered");
    });
}

let currentRefNumber = 1100;
let curDocType = 'Quotation';
let taxRate = 0;
let globalSignature = null; 

// --- SLEEK NOTIFICATION ENGINE ---
function showNotification(message) {
    const existing = document.getElementById('erp-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'erp-toast';
    toast.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-[999] font-black tracking-wider text-xs uppercase border border-slate-700 transition-all duration-300 translate-y-[-20px] opacity-0';
    toast.innerText = message;
    
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-[-20px]', 'opacity-0'), 10);

    setTimeout(() => {
        toast.classList.add('translate-y-[-20px]', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- RESPONSIVE MATH ENGINE ---
function adjustMobileScale() {
    const pdfArea = document.getElementById('pdfArea');
    const wrapper = document.getElementById('scale-wrapper');
    const previewPanel = document.getElementById('previewPanel');
    
    const paperWidth = 800; 
    const paperHeight = 1131;
    
    if (window.innerWidth < 1024) {
        const availableWidth = window.innerWidth - 32;
        let scale = availableWidth / paperWidth;
        
        pdfArea.style.transform = `scale(${scale})`;
        wrapper.style.width = `${paperWidth * scale}px`;
        wrapper.style.height = `${paperHeight * scale}px`;
    } else {
        const availableDesktopWidth = previewPanel.clientWidth - 96; 
        let scale = availableDesktopWidth / paperWidth;
        
        if (scale > 0.8) scale = 0.8; 
        
        pdfArea.style.transform = `scale(${scale})`;
        wrapper.style.width = `${paperWidth * scale}px`;
        wrapper.style.height = `${paperHeight * scale}px`;
    }
}

// --- DOCUMENT LOGIC & TOGGLES ---
function updateDocNumber() {
    let prefix = 'INV';
    if(curDocType === 'Quotation') prefix = 'QT';
    if(curDocType === 'Delivery Note') prefix = 'DN';
    if(curDocType === 'Deal Recap') prefix = 'DR';

    const finalRef = `VEL-${prefix}-${currentRefNumber}`;
    document.getElementById('docNum').value = finalRef;
    document.getElementById('pRef').innerText = "REF: " + finalRef;
}

function setDoc(type, btn) {
    curDocType = type;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    document.getElementById('pType').innerText = type.toUpperCase();
    document.getElementById('editTitle').innerText = type;
    updateDocNumber();
    
    // UI RESET: Handle visibility switching between Standard and Deal Recap
    const stdBuilder = document.getElementById('standard-builder');
    const stdPaper = document.getElementById('standard-paper');
    const authBlock = document.getElementById('authByBlock');
    const recapBuilder = document.getElementById('recap-builder');
    const recapPaper = document.getElementById('recap-paper');
    const drSubtitle = document.getElementById('dr-subtitle');
    const buyerSig = document.getElementById('buyer-sig-block');

    if (type === 'Deal Recap') {
        stdBuilder.classList.add('hidden');
        stdPaper.classList.add('hidden');
        authBlock.classList.add('hidden');
        
        recapBuilder.classList.remove('hidden');
        recapPaper.classList.remove('hidden');
        drSubtitle.classList.remove('hidden');
        buyerSig.classList.remove('hidden');
    } else {
        stdBuilder.classList.remove('hidden');
        stdPaper.classList.remove('hidden');
        authBlock.classList.remove('hidden');
        
        recapBuilder.classList.add('hidden');
        recapPaper.classList.add('hidden');
        drSubtitle.classList.add('hidden');
        buyerSig.classList.add('hidden');
    }

    if(window.innerWidth < 1024) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('open');
    }
    
    sync();
}

// --- CLOUD SYNC: SETTINGS & SIGNATURE ---
function handleSignature(event) {
    const reader = new FileReader();
    const sigImg = document.getElementById('pSignature');
    reader.onload = function() {
        sigImg.src = reader.result;
        sigImg.classList.remove('hidden');
        globalSignature = reader.result; 
        showNotification("Signature Ready. Click Save to Sync.");
    };
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

async function saveSettings() {
    showNotification("Syncing Settings to Cloud...");
    
    const config = {
        tpin: document.getElementById('set-tpin').value,
        tax_rate: document.getElementById('set-tax').value,
        account_name: document.getElementById('set-acc-name').value,
        bank_name: document.getElementById('set-bank').value,
        account_number: document.getElementById('set-account').value,
        branch_name: document.getElementById('set-branch').value,
        branch_code: document.getElementById('set-branch-code').value,
        swift_code: document.getElementById('set-swift').value,
        sort_code: document.getElementById('set-sort').value,
        currency: document.getElementById('set-currency').value,
        signature: globalSignature 
    };
    
    try {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        
        const data = await res.json();
        
        if(data.success) {
            showNotification("ERP Settings Cloud Synced ☁️");
            applySettings(); 
        } else {
            showNotification("Cloud Sync Failed: " + (data.message || "Server Error") + " 🔴");
        }
    } catch (err) {
        showNotification("Network Error: Cannot reach API 🔴");
    }
}

// --- DYNAMIC SETTINGS SYNC ---
function applySettings() {
    fetch('/api/settings')
    .then(res => res.json())
    .then(data => {
        if(data.success && data.data) {
            const config = data.data;
            const savedTax = (config.tax_rate !== undefined && config.tax_rate !== null && config.tax_rate !== '') ? parseFloat(config.tax_rate) : 0;
            taxRate = savedTax / 100;
            
            // Fill Settings Form
            document.getElementById('set-tpin').value = config.tpin || '';
            document.getElementById('set-tax').value = config.tax_rate || '';
            document.getElementById('set-acc-name').value = config.account_name || '';
            document.getElementById('set-bank').value = config.bank_name || '';
            document.getElementById('set-account').value = config.account_number || '';
            document.getElementById('set-branch').value = config.branch_name || '';
            document.getElementById('set-branch-code').value = config.branch_code || '';
            document.getElementById('set-swift').value = config.swift_code || '';
            document.getElementById('set-sort').value = config.sort_code || '';
            document.getElementById('set-currency').value = config.currency || '';
            
            // Update Preview Header & Footer dynamically (No hardcoding)
            document.getElementById('pVatRate').innerText = savedTax;
            document.getElementById('p-set-tpin').innerText = config.tpin || '-';
            document.getElementById('p-set-acc-name').innerText = config.account_name || '-';
            document.getElementById('p-set-bank').innerText = config.bank_name || '-';
            document.getElementById('p-set-account').innerText = config.account_number || '-';
            
            // Signature handling
            if (config.signature && config.signature !== 'null') {
                globalSignature = config.signature;
                const sigImg = document.getElementById('pSignature');
                sigImg.src = config.signature;
                sigImg.classList.remove('hidden');
            }
            sync(); 
        }
    })
    .catch(err => console.log("Waiting for cloud sync..."));
}

// --- CLEAN NEON ARCHIVE ---
async function saveToNeon() {
    showNotification("Syncing to Neon Database...");
    let itemsArray = [];
    let contractDetails = null;

    if (curDocType === 'Deal Recap') {
        const fields = ['product', 'qty', 'price', 'vat', 'storage', 'marking', 'srf', 'erb', 'window', 'delivery', 'quality', 'qtydet', 'transfer', 'payment', 'laytime', 'inspection', 'others'];
        contractDetails = {};
        fields.forEach(f => {
            const el = document.getElementById(`dr-${f}`);
            contractDetails[f] = el ? el.value : '';
        });
    } else {
        document.querySelectorAll('.item-row').forEach(row => {
            itemsArray.push({
                description: row.querySelector('.i-desc').value,
                qty: row.querySelector('.i-qty').value,
                price: row.querySelector('.i-price').value
            });
        });
    }

    // Clean total amount: Remove 'ZMW' and commas for DB numeric safety
    const rawTotal = document.getElementById('pTotal').innerText
        .replace('ZMW ', '')
        .replace(/,/g, '');

    const docData = {
        ref_no: document.getElementById('docNum').value,
        doc_type: curDocType,
        client_name: document.getElementById('clientName').value || 'Unknown',
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
        showNotification("Network Error: Check Connection 🔴");
    }
}

function addRow() {
    const rowId = Date.now();
    const row = document.createElement('div');
    row.className = "item-row p-4 bg-slate-50 rounded-xl border mb-3 relative";
    row.id = `row-${rowId}`;
    row.innerHTML = `<button onclick="document.getElementById('row-${rowId}').remove(); sync()" class="absolute top-2 right-2 text-red-500 font-bold">×</button>
        <input type="text" oninput="sync()" placeholder="Description" class="input-box mb-2 i-desc">
        <div class="flex gap-2">
            <input type="number" oninput="sync()" placeholder="Qty" class="input-box i-qty w-20" value="1">
            <input type="number" oninput="sync()" placeholder="Price" class="input-box i-price flex-1" value="0">
        </div>`;
    document.getElementById('itemList').appendChild(row);
    sync();
}

function sync() {
    const clientName = document.getElementById('clientName').value || 'Client Name';
    document.getElementById('pName').innerText = clientName;
    document.getElementById('pAddr').innerText = document.getElementById('address').value;
    document.getElementById('pDate').innerText = document.getElementById('docDate').value || new Date().toLocaleDateString('en-ZM');
    document.getElementById('pSales').innerText = document.getElementById('salesRep').value;

    if (curDocType !== 'Deal Recap') {
        const rows = document.querySelectorAll('.item-row');
        const tableBody = document.getElementById('pTable');
        tableBody.innerHTML = '';
        let sub = 0;

        rows.forEach(r => {
            const d = r.querySelector('.i-desc').value;
            const q = parseFloat(r.querySelector('.i-qty').value) || 0;
            const p = parseFloat(r.querySelector('.i-price').value) || 0;
            const total = q * p;
            sub += total;
            if(d) tableBody.innerHTML += `<tr><td class="py-4 px-6 uppercase">${d}</td><td class="text-center font-bold text-slate-600">${q}</td><td class="text-right">ZMW ${p.toLocaleString()}</td><td class="text-right font-black">ZMW ${total.toLocaleString()}</td></tr>`;
        });

        const vat = sub * taxRate;
        document.getElementById('pSub').innerText = "ZMW " + sub.toLocaleString(undefined, {minimumFractionDigits: 2});
        document.getElementById('pVat').innerText = "ZMW " + vat.toLocaleString(undefined, {minimumFractionDigits: 2});
        document.getElementById('pTotal').innerText = "ZMW " + (sub + vat).toLocaleString(undefined, {minimumFractionDigits: 2});
    } else {
        const product = document.getElementById('dr-product').value || '_______';
        const qty = document.getElementById('dr-qty').value || '_______';
        document.getElementById('dr-subtitle').innerText = `Deal Recap for Sale of ${qty} litres of ${product} to ${clientName}`;
        const drFields = ['product', 'qty', 'price', 'vat', 'storage', 'marking', 'srf', 'erb', 'window', 'delivery', 'quality', 'qtydet', 'transfer', 'payment', 'laytime', 'inspection', 'others'];
        drFields.forEach(field => {
            const val = document.getElementById(`dr-${field}`).value;
            document.getElementById(`p-dr-${field}`).innerText = val ? val : '-';
        });
        document.getElementById('p-dr-buyer').innerText = clientName;
    }
}

function finalSave() {
    showNotification("Generating PDF...");
    const el = document.getElementById('pdfArea');
    const oldTransform = el.style.transform;
    el.style.transform = 'scale(1)'; 

    html2pdf().from(el).set({ 
        margin: 0, 
        filename: `Victus_${curDocType}_${document.getElementById('docNum').value}.pdf`, 
        html2canvas: { scale: 3, useCORS: true, scrollY: 0 }, 
        jsPDF: { unit: 'px', format: [800, 1131], orientation: 'portrait' } 
    }).toPdf().get('pdf').then(pdf => {
        const pages = pdf.internal.getNumberOfPages();
        for (let i = pages; i > 1; i--) { pdf.deletePage(i); }
    }).save().then(() => {
        el.style.transform = oldTransform;
        adjustMobileScale();
        showNotification("Download Complete!");
    });
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('open');
}

function switchView(view, btn) {
    const editor = document.getElementById('editor-view');
    const settings = document.getElementById('settings-view');
    const preview = document.getElementById('previewPanel');
    const dashboard = document.getElementById('dashboard-view');
    const expenses = document.getElementById('expenses-view');
    
    // Hide all views first
    [editor, settings, preview, dashboard, expenses].forEach(el => {
        if(el) el.classList.add('hidden');
    });

    if (view === 'dashboard') {
        dashboard.classList.remove('hidden');
        loadDashboard(); 
    } else if (view === 'expenses') {
        expenses.classList.remove('hidden');
        loadExpenses();
    } else if (view === 'settings') {
        settings.classList.remove('hidden');
        preview.classList.remove('hidden');
        loadProductSettings();
        setTimeout(adjustMobileScale, 50); 
    } else {
        editor.classList.remove('hidden');
        preview.classList.remove('hidden');
        setTimeout(adjustMobileScale, 50); 
    }

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    if(window.innerWidth < 1024) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('open');
    }
}

function saveExpense() {
    const data = {
        date: document.getElementById('exp-date').value || new Date().toISOString().split('T')[0],
        category: document.getElementById('exp-cat').value,
        description: document.getElementById('exp-desc').value,
        amount: document.getElementById('exp-amt').value
    };

    if(!data.amount) return showNotification("Please enter an amount 🔴");

    fetch('/api/save-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()).then(res => {
        if(res.success) {
            showNotification("Expense Recorded 🔴");
            loadExpenses();
            document.getElementById('exp-desc').value = '';
            document.getElementById('exp-amt').value = '';
        }
    });
}

function loadExpenses() {
    fetch('/api/get-expenses')
    .then(res => res.json())
    .then(data => {
        const body = document.getElementById('expense-table-body');
        body.innerHTML = '';
        data.data.forEach(exp => {
            body.innerHTML += `<tr>
                <td class="py-4 px-6 text-slate-500">${new Date(exp.date).toLocaleDateString()}</td>
                <td class="py-4 px-6 font-bold text-slate-700">${exp.category}</td>
                <td class="py-4 px-6 text-right font-black text-red-600">ZMW ${parseFloat(exp.amount).toLocaleString()}</td>
            </tr>`;
        });
    });
}

let dashboardDocs = [];
let revChart = null;

function loadDashboard() {
    const tableBody = document.getElementById('dash-table-body');
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 font-bold text-slate-500">Loading live data from Neon... ⏳</td></tr>';

    fetch('/api/get-documents')
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            dashboardDocs = data.data;
            renderDashboardTable(dashboardDocs);
            renderChart(dashboardDocs);
        }
    })
    .catch(() => {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 font-bold text-red-500">Network Error. 🔴</td></tr>';
    });
}

function renderDashboardTable(docs) {
    const tableBody = document.getElementById('dash-table-body');
    tableBody.innerHTML = '';
    let totalRevenue = 0;

    if(docs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 font-bold text-slate-400">No documents found.</td></tr>';
        document.getElementById('dash-total-rev').innerText = 'ZMW 0.00';
        document.getElementById('dash-total-docs').innerText = '0';
        return;
    }

    docs.forEach(doc => {
        const amt = parseFloat(String(doc.total_amount).replace(/,/g, '')) || 0;
        totalRevenue += amt;

        let statusBadge = `<span class="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-black tracking-wider cursor-pointer" onclick="toggleStatus(${doc.id}, '${doc.status || 'DRAFT'}')">${doc.status || 'DRAFT'}</span>`;
        if(doc.status === 'PAID') statusBadge = `<span class="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black tracking-wider cursor-pointer" onclick="toggleStatus(${doc.id}, 'PAID')">PAID</span>`;
        if(doc.status === 'SENT') statusBadge = `<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-[10px] font-black tracking-wider cursor-pointer" onclick="toggleStatus(${doc.id}, 'SENT')">SENT</span>`;

        const docJson = encodeURIComponent(JSON.stringify(doc));

        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-all">
                <td class="py-4 px-6 font-bold text-slate-900">${doc.ref_no}</td>
                <td class="py-4 px-6 text-slate-500 uppercase text-xs font-black tracking-wider">${doc.doc_type}</td>
                <td class="py-4 px-6 font-medium text-slate-700">${doc.client_name}</td>
                <td class="py-4 px-6">${statusBadge}</td>
                <td class="py-4 px-6 text-right font-black text-blue-700">ZMW ${amt.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="py-4 px-6 text-center">
                    <button onclick="cloneDoc('${docJson}')" class="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-600 transition-colors">Clone</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('dash-total-rev').innerText = `ZMW ${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('dash-total-docs').innerText = docs.length;
}

function filterDashboard() {
    const term = document.getElementById('dashSearch').value.toLowerCase();
    const filtered = dashboardDocs.filter(d => 
        (d.ref_no && d.ref_no.toLowerCase().includes(term)) ||
        (d.client_name && d.client_name.toLowerCase().includes(term)) ||
        (d.doc_type && d.doc_type.toLowerCase().includes(term))
    );
    renderDashboardTable(filtered);
}

function cloneDoc(encodedJson) {
    const doc = JSON.parse(decodeURIComponent(encodedJson));
    const editorBtn = document.querySelector(`button[onclick*="setDoc('${doc.doc_type}'"]`) || document.querySelector('.nav-btn');
    switchView('editor', editorBtn);
    setDoc(doc.doc_type, editorBtn);

    document.getElementById('clientName').value = doc.client_name;
    document.getElementById('address').value = doc.address;
    document.getElementById('itemList').innerHTML = '';
    
    if(doc.items && Array.isArray(doc.items)) {
        doc.items.forEach(item => {
            addRow();
            const rows = document.querySelectorAll('.item-row');
            const lastRow = rows[rows.length - 1];
            lastRow.querySelector('.i-desc').value = item.description || '';
            lastRow.querySelector('.i-qty').value = item.qty || 0;
            lastRow.querySelector('.i-price').value = item.price || 0;
        });
    }

    if(doc.doc_type === 'Deal Recap' && doc.contract_details) {
        Object.keys(doc.contract_details).forEach(key => {
            const el = document.getElementById(`dr-${key}`);
            if(el) el.value = doc.contract_details[key];
        });
    }

    document.getElementById('docDate').value = new Date().toISOString().split('T')[0];
    showNotification(`Cloned ${doc.doc_type} for ${doc.client_name}`);
    sync();
}

function renderChart(docs) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if(revChart) revChart.destroy();
    const recentDocs = [...docs].reverse().slice(-10);
    const labels = recentDocs.map(d => d.ref_no.split('-')[2] || d.ref_no);
    const data = recentDocs.map(d => parseFloat(String(d.total_amount).replace(/,/g, '')) || 0);

    revChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue (ZMW)',
                data: data,
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { beginAtZero: true } }
        }
    });
}

function toggleStatus(id, currentStatus) {
    let nextStatus = 'SENT';
    if (currentStatus === 'SENT') nextStatus = 'PAID';
    if (currentStatus === 'PAID') nextStatus = 'DRAFT';

    showNotification(`Updating status to ${nextStatus}...`);
    fetch('/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, newStatus: nextStatus })
    })
    .then(async (res) => {
        const response = await res.json();
        if (res.ok && response.success) {
            showNotification(`Status updated 🟢`);
            loadDashboard(); 
        } else {
            showNotification("Status Update Failed 🔴");
        }
    })
    .catch(() => showNotification("Network Error 🔴"));
}

let clientDatabase = {}; 
function loadClients() {
    fetch('/api/get-clients')
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            const datalist = document.getElementById('clientData');
            datalist.innerHTML = '';
            data.data.forEach(client => {
                clientDatabase[client.name] = client.address;
                datalist.innerHTML += `<option value="${client.name}">`;
            });
        }
    });
}

let productDatabase = {}; 
function loadProducts() {
    fetch('/api/get-products')
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            const datalist = document.getElementById('productData');
            datalist.innerHTML = '';
            data.data.forEach(prod => {
                productDatabase[prod.name] = prod;
                datalist.innerHTML += `<option value="${prod.name}">`; 
            });
        }
    });
}

function autoFillProduct() {
    const selectedName = document.getElementById('dr-product').value;
    const prod = productDatabase[selectedName];
    if(prod) {
        document.getElementById('dr-price').value = prod.base_price || '';
        document.getElementById('dr-storage').value = prod.storage_cost || '';
        document.getElementById('dr-marking').value = prod.marking_fee || '';
        document.getElementById('dr-srf').value = prod.srf || '';
        document.getElementById('dr-erb').value = prod.erb || '';
        sync();
    }
}

function loadProductSettings() {
    const container = document.getElementById('settings-products-list');
    container.innerHTML = '<p class="text-xs text-slate-500 font-bold text-center py-4">Loading catalog...</p>';
    fetch('/api/get-products')
    .then(res => res.json())
    .then(data => {
        if(data.success && data.data.length > 0) {
            container.innerHTML = '';
            data.data.forEach((prod, index) => {
                container.innerHTML += `
                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative mb-4">
                        <h4 class="font-black text-sm text-slate-800 mb-3 uppercase">${prod.name}</h4>
                        <div class="grid grid-cols-3 gap-2 mb-3">
                            <div><label class="text-[9px] font-bold text-slate-500 uppercase">Base Price</label><input type="text" id="edit-price-${index}" value="${prod.base_price || ''}" class="input-box text-xs py-2 px-3"></div>
                            <div><label class="text-[9px] font-bold text-slate-500 uppercase">ERB Fee</label><input type="text" id="edit-erb-${index}" value="${prod.erb || ''}" class="input-box text-xs py-2 px-3"></div>
                            <div><label class="text-[9px] font-bold text-slate-500 uppercase">Storage</label><input type="text" id="edit-storage-${index}" value="${prod.storage_cost || ''}" class="input-box text-xs py-2 px-3"></div>
                            <div><label class="text-[9px] font-bold text-slate-500 uppercase">Marking</label><input type="text" id="edit-marking-${index}" value="${prod.marking_fee || ''}" class="input-box text-xs py-2 px-3"></div>
                            <div><label class="text-[9px] font-bold text-slate-500 uppercase">SRF</label><input type="text" id="edit-srf-${index}" value="${prod.srf || ''}" class="input-box text-xs py-2 px-3"></div>
                        </div>
                        <button onclick="saveProductPrice('${prod.name}', ${index})" class="w-full bg-white border-2 border-orange-200 hover:border-orange-500 text-orange-600 font-black text-xs py-2 rounded-xl transition-colors tracking-widest uppercase shadow-sm">Update Rates</button>
                    </div>
                `;
            });
        }
    });
}

function saveProductPrice(name, index) {
    const updatedData = {
        name: name,
        base_price: document.getElementById(`edit-price-${index}`).value,
        erb: document.getElementById(`edit-erb-${index}`).value,
        storage_cost: document.getElementById(`edit-storage-${index}`).value,
        marking_fee: document.getElementById(`edit-marking-${index}`).value,
        srf: document.getElementById(`edit-srf-${index}`).value
    };
    fetch('/api/update-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
    })
    .then(async (res) => {
        const response = await res.json();
        if (res.ok && response.success) {
            showNotification(`${name} Pricing Updated 🟢`);
            loadProducts();
        } else {
            showNotification("Pricing Update Failed 🔴");
        }
    });
}

function autoFillClient() {
    const selectedName = document.getElementById('clientName').value;
    if(clientDatabase[selectedName]) {
        document.getElementById('address').value = clientDatabase[selectedName];
        sync();
    }
}

window.onload = () => {
    applySettings();
    updateDocNumber();
    addRow();
    loadClients(); 
    loadProducts(); 
    setTimeout(adjustMobileScale, 100); 
    const dashBtn = document.querySelector('button[onclick*="dashboard"]');
    switchView('dashboard', dashBtn);
};

window.onresize = adjustMobileScale;