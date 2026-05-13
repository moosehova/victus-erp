let currentRefNumber = 1100;
let curDocType = 'Quotation';
let taxRate = 0.16;
let globalSignature = null; // Holds signature before syncing

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

// --- DOCUMENT LOGIC ---
function updateDocNumber() {
    const prefix = curDocType === 'Quotation' ? 'QT' : curDocType === 'Delivery Note' ? 'DN' : 'INV';
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
    
    // Safely force-close the menu on mobile
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
        globalSignature = reader.result; // Hold in memory
        showNotification("Signature Ready. Click Save to Sync.");
    };
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function saveSettings() {
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
    
    fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    })
    .then(async (res) => {
        const data = await res.json();
        if(data.success) {
            showNotification("ERP Settings Cloud Synced ☁️");
            applySettings(); 
        } else {
            showNotification("Cloud Sync Failed 🔴");
        }
    })
    .catch(() => showNotification("Network Error 🔴"));
}

function applySettings() {
    fetch('/api/settings')
    .then(res => res.json())
    .then(data => {
        if(data.success && data.data) {
            const config = data.data;
            taxRate = (parseFloat(config.tax_rate) || 16) / 100;
            
            // Populate Inputs
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
            
            // Populate Display on Paper
            document.getElementById('pVatRate').innerText = config.tax_rate || 16;
            document.getElementById('pHeaderDetails').innerHTML = `TPIN: ${config.tpin || ''} <br> #256, 2341/M/1 MUSIKILI ROAD, LUSAKA, ZAMBIA`;
            
            // Build the professional two-line Bank String
            const bankLine1 = `<span class="font-bold text-slate-700">Bank:</span> ${config.bank_name || ''} &nbsp;|&nbsp; <span class="font-bold text-slate-700">Acc Name:</span> ${config.account_name || ''} &nbsp;|&nbsp; <span class="font-bold text-slate-700">Acc No:</span> ${config.account_number || ''}`;
            const bankLine2 = `<span class="font-bold text-slate-700">Branch:</span> ${config.branch_name || ''} (${config.branch_code || ''}) &nbsp;|&nbsp; <span class="font-bold text-slate-700">Swift:</span> ${config.swift_code || ''} &nbsp;|&nbsp; <span class="font-bold text-slate-700">Sort:</span> ${config.sort_code || ''} &nbsp;|&nbsp; <span class="font-bold text-slate-700">Curr:</span> ${config.currency || ''}`;
            
            document.getElementById('pFooterInfo').innerHTML = `${bankLine1}<br>${bankLine2}`;
            
            if (config.signature && config.signature !== 'null') {
                globalSignature = config.signature;
                const sigImg = document.getElementById('pSignature');
                sigImg.src = config.signature;
                sigImg.classList.remove('hidden');
            }
            sync(); 
        }
    })
    .catch(err => console.log("Could not load cloud settings yet."));
}

// --- CLOUD SYNC: ARCHIVE DOCUMENT ---
function saveToNeon() {
    showNotification("Syncing to Neon Database...");

    const itemsArray = [];
    document.querySelectorAll('.item-row').forEach(row => {
        itemsArray.push({
            description: row.querySelector('.i-desc').value,
            qty: row.querySelector('.i-qty').value,
            price: row.querySelector('.i-price').value
        });
    });

    const docData = {
        ref_no: document.getElementById('docNum').value,
        doc_type: curDocType,
        client_name: document.getElementById('clientName').value || 'Unknown',
        address: document.getElementById('address').value || 'None',
        representative: document.getElementById('salesRep').value || 'Lungowe Lutangu',
        items: itemsArray,
        total_amount: document.getElementById('pTotal').innerText.replace('ZMW ', '')
    };

    fetch('/api/save-to-neon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
    })
    .then(async (res) => {
        const response = await res.json();
        if (res.ok && response.success) {
            showNotification("Document Archived to Neon 🟢");
            currentRefNumber++;
            updateDocNumber();
        } else {
            console.error(response.error);
            showNotification("Archive Failed 🔴");
        }
    })
    .catch(() => showNotification("Network Error 🔴"));
}

// --- BUILDER ENGINE ---
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
    document.getElementById('pName').innerText = document.getElementById('clientName').value || 'Client Name';
    document.getElementById('pAddr').innerText = document.getElementById('address').value;
    document.getElementById('pDate').innerText = document.getElementById('docDate').value || new Date().toLocaleDateString('en-ZM');
    document.getElementById('pSales').innerText = document.getElementById('salesRep').value;

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
    if (view === 'settings') {
        editor.classList.add('hidden');
        settings.classList.remove('hidden');
    } else {
        settings.classList.add('hidden');
        editor.classList.remove('hidden');
    }
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    // Safely force-close the menu on mobile
    if(window.innerWidth < 1024) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('open');
    }
}

window.onload = () => {
    applySettings();
    updateDocNumber();
    addRow();
    setTimeout(adjustMobileScale, 100); 
};

window.onresize = adjustMobileScale;