let currentRefNumber = 1100;
let curDocType = 'Quotation';
let taxRate = 0.16;

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
    if(window.innerWidth < 1024) toggleMenu();
    sync();
}

function handleSignature(event) {
    const reader = new FileReader();
    const sigImg = document.getElementById('pSignature');
    reader.onload = function() {
        sigImg.src = reader.result;
        sigImg.classList.remove('hidden');
        localStorage.setItem('victus_signature', reader.result);
    };
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function saveSettings() {
    const config = {
        tpin: document.getElementById('set-tpin').value,
        tax: document.getElementById('set-tax').value,
        bank: document.getElementById('set-bank').value,
        account: document.getElementById('set-account').value
    };
    localStorage.setItem('victus_config', JSON.stringify(config));
    applySettings();
    alert("Victus ERP Configuration Saved.");
}

function applySettings() {
    const saved = localStorage.getItem('victus_config');
    const savedSig = localStorage.getItem('victus_signature');
    if (savedSig) {
        document.getElementById('pSignature').src = savedSig;
        document.getElementById('pSignature').classList.remove('hidden');
    }
    if (saved) {
        const config = JSON.parse(saved);
        taxRate = (parseFloat(config.tax) || 16) / 100;
        document.getElementById('pVatRate').innerText = config.tax;
        document.getElementById('pHeaderDetails').innerHTML = `TPIN: ${config.tpin} <br> #256, 2341/M/1 MUSIKILI ROAD, LUSAKA, ZAMBIA`;
        document.getElementById('pFooterInfo').innerText = `Bank Details: ${config.bank} | Account: ${config.account}`;
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
    const el = document.getElementById('pdfArea');
    const oldTransform = el.style.transform;
    el.style.transform = 'scale(1)'; 
    el.style.height = '296mm'; // Single page lock

    html2pdf().from(el).set({ 
        margin: 0, 
        filename: `Victus_${curDocType}_${Date.now()}.pdf`, 
        html2canvas: { scale: 3, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    }).toPdf().get('pdf').then(pdf => {
        const pages = pdf.internal.getNumberOfPages();
        for (let i = pages; i > 1; i--) { pdf.deletePage(i); }
    }).save().then(() => {
        el.style.transform = oldTransform;
        el.style.height = 'auto';
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
}

window.onload = () => {
    applySettings();
    updateDocNumber();
    addRow();
};