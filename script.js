let curDocType = 'Quotation';
let currentRefNumber = 1100;
let taxRate = 0.16;

// VIEW SWITCHER
function switchView(view, btn) {
    const editor = document.getElementById('editor-view');
    const settings = document.getElementById('settings-view');
    if (view === 'settings') {
        editor.classList.add('hidden');
        settings.classList.remove('hidden');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if(btn) btn.classList.add('active');
    } else {
        settings.classList.add('hidden');
        editor.classList.remove('hidden');
    }
}

// HANDLE E-SIGNATURE (Moved to Settings logic basically)
function handleSignature(event) {
    const reader = new FileReader();
    const sigImg = document.getElementById('pSignature');
    reader.onload = function() {
        const base64 = reader.result;
        sigImg.src = base64;
        sigImg.classList.remove('hidden');
        localStorage.setItem('victus_signature', base64);
    }
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

// SETTINGS PERSISTENCE
function saveSettings() {
    const config = {
        tpin: document.getElementById('set-tpin').value,
        tax: document.getElementById('set-tax').value,
        bank: document.getElementById('set-bank').value,
        account: document.getElementById('set-account').value
    };
    localStorage.setItem('victus_config', JSON.stringify(config));
    applySettings();
    alert("ERP Configuration Saved.");
}

function applySettings() {
    const saved = localStorage.getItem('victus_config');
    const savedSig = localStorage.getItem('victus_signature');

    if (savedSig) {
        const sigImg = document.getElementById('pSignature');
        sigImg.src = savedSig;
        sigImg.classList.remove('hidden');
    }

    if (saved) {
        const config = JSON.parse(saved);
        document.getElementById('set-tpin').value = config.tpin;
        document.getElementById('set-tax').value = config.tax;
        document.getElementById('set-bank').value = config.bank;
        document.getElementById('set-account').value = config.account;

        taxRate = parseFloat(config.tax) / 100;
        document.getElementById('pVatRate').innerText = config.tax;
        document.getElementById('pHeaderDetails').innerHTML = `TPIN: ${config.tpin} <br> #256, 2341/M/1 Musikili Road, Lusaka`;
        document.getElementById('pFooterInfo').innerText = `Bank Details: ${config.bank} | Account: ${config.account} | TPIN: ${config.tpin}`;
    }
    sync();
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('open');
}

function setDoc(type, btn) {
    curDocType = type;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('editTitle').innerText = type;
    document.getElementById('pType').innerText = type;
    
    const isLPO = type === 'Local Purchase Order';
    document.getElementById('partyLabel').innerText = isLPO ? 'Vendor Name' : 'Attention To';
    document.getElementById('pLabel').innerText = isLPO ? 'Supplier Info' : 'Attention To';
    
    const prefix = type === 'Quotation' ? 'QT' : type === 'Delivery Note' ? 'DN' : 'INV';
    document.getElementById('docNum').value = `VEL-${prefix}-${currentRefNumber}`;
    
    if(window.innerWidth < 1024) toggleMenu();
    sync();
}

function addRow() {
    const list = document.getElementById('itemList');
    const rowId = Date.now();
    const row = document.createElement('div');
    row.className = "item-row p-4 bg-slate-50 rounded-xl border border-slate-200 mb-3 relative";
    row.id = `row-${rowId}`;
    row.innerHTML = `
        <button onclick="document.getElementById('row-${rowId}').remove(); sync()" class="absolute top-2 right-2 text-red-500 font-bold">×</button>
        <input type="text" oninput="sync()" placeholder="Description" class="input-box mb-2 i-desc">
        <div class="flex gap-2">
            <input type="text" oninput="sync()" placeholder="Code" class="input-box i-code w-24">
            <input type="number" oninput="sync()" placeholder="Qty" class="input-box i-qty w-20" value="1">
            <input type="number" oninput="sync()" placeholder="Price" class="input-box i-price flex-1" value="0">
        </div>`;
    list.appendChild(row);
    sync();
}

function sync() {
    document.getElementById('pName').innerText = document.getElementById('clientName').value || 'Client Name';
    document.getElementById('pAddr').innerText = document.getElementById('address').value;
    document.getElementById('pDate').innerText = document.getElementById('docDate').value || new Date().toLocaleDateString('en-ZM');
    document.getElementById('pRef').innerText = "REF: " + document.getElementById('docNum').value;
    document.getElementById('pSales').innerText = document.getElementById('salesRep').value;

    const rows = document.querySelectorAll('.item-row');
    const tableBody = document.getElementById('pTable');
    tableBody.innerHTML = '';
    let sub = 0;

    rows.forEach(r => {
        const d = r.querySelector('.i-desc').value;
        const c = r.querySelector('.i-code').value;
        const q = parseFloat(r.querySelector('.i-qty').value) || 0;
        const p = parseFloat(r.querySelector('.i-price').value) || 0;
        const total = q * p;
        sub += total;
        if(d) tableBody.innerHTML += `<tr><td class="py-5 px-6 uppercase text-slate-800 tracking-tight"><b>${d}</b><br><span class="text-[9px] text-slate-400 font-mono">CODE: ${c}</span></td><td class="py-5 px-6 text-center font-bold text-slate-600">${q}</td><td class="py-5 px-6 text-right text-slate-500">ZMW ${p.toLocaleString()}</td><td class="py-5 px-6 text-right font-black text-slate-900 font-bold">ZMW ${total.toLocaleString()}</td></tr>`;
    });

    const vat = sub * taxRate;
    document.getElementById('pSub').innerText = "ZMW " + sub.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('pVat').innerText = "ZMW " + vat.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('pTotal').innerText = "ZMW " + (sub + vat).toLocaleString(undefined, {minimumFractionDigits: 2});
}

function finalSave() {
    const el = document.getElementById('pdfArea');
    const oldTransform = el.style.transform;
    el.style.transform = 'scale(1)';
    html2pdf().from(el).set({ margin: 0, filename: `VICTUS_${curDocType}.pdf`, html2canvas: { scale: 3, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).save().then(() => el.style.transform = oldTransform);
}

aasync function saveToNeon() {
    const btn = event.target;
    btn.innerText = "Archiving...";
    btn.disabled = true;

    const payload = {
        ref_no: document.getElementById('docNum').value,
        doc_type: curDocType,
        client_name: document.getElementById('clientName').value,
        address: document.getElementById('address').value,
        representative: document.getElementById('salesRep').value,
        total_amount: parseFloat(document.getElementById('pTotal').innerText.replace(/[^0-9.]/g, '')),
        items: []
    };

    document.querySelectorAll('.item-row').forEach(row => {
        payload.items.push({
            desc: row.querySelector('.i-desc').value,
            qty: row.querySelector('.i-qty').value,
            price: row.querySelector('.i-price').value
        });
    });

    try {
        // This path must match your file name in the api folder
        const response = await fetch('/api/save-to-neon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ Successfully Archived to Neon Database!");
            currentRefNumber++;
            setDoc(curDocType, document.querySelector('.nav-btn.active'));
        } else {
            alert("❌ Database Error: " + result.error);
        }
    } catch (err) {
        alert("❌ Connection Failed. Make sure you are running on Vercel.");
    } finally {
        btn.innerText = "Archive to Neon";
        btn.disabled = false;
    }
}

window.onload = () => { 
    applySettings();
    addRow(); 
};