let curDocType = 'Quotation';
let currentRefNumber = 1100;
let taxRate = 0.16;

/**
 * BALANCED MOBILE VIEW
 * Keeps the document large and readable while preventing edge-cutting.
 */
function adjustMobileScale() {
    const pdfArea = document.getElementById('pdfArea');
    const viewport = document.querySelector('.preview-viewport');
    
    if (window.innerWidth < 1024) {
        // We want the paper to feel "Big" but not wider than a comfortable swipe
        const a4Width = 840; 
        const availableWidth = window.innerWidth;
        
        // Target a 70% scale for readability
        let scale = 0.68; 
        
        // If screen is tiny (iPhone SE), shrink a bit more
        if(availableWidth < 380) scale = 0.62;

        pdfArea.style.transform = `scale(${scale})`;
        
        // Set the height of the container to match scaled height + margin
        const a4HeightPx = 1123; 
        viewport.style.height = (a4HeightPx * scale) + 100 + "px";
    } else {
        pdfArea.style.transform = `scale(0.85)`;
        viewport.style.height = "auto";
    }
}

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

function handleSignature(event) {
    const reader = new FileReader();
    const sigImg = document.getElementById('pSignature');
    reader.onload = function() {
        const base64 = reader.result;
        sigImg.src = base64;
        sigImg.classList.remove('hidden');
        localStorage.setItem('victus_signature', base64);
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
    alert("Victus ERP Config Updated.");
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
        document.getElementById('pVatRate').innerText = config.tax || "16.0";
        document.getElementById('pHeaderDetails').innerHTML = `TPIN: ${config.tpin} <br> #256, 2341/M/1 MUSIKILI ROAD, LUSAKA, ZAMBIA`;
        document.getElementById('pFooterInfo').innerText = `Bank: ${config.bank} | Acc: ${config.account} | TPIN: ${config.tpin}`;
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
    if(btn) btn.classList.add('active');
    document.getElementById('editTitle').innerText = type;
    document.getElementById('pType').innerText = type;
    const prefix = type === 'Quotation' ? 'QT' : type === 'Delivery Note' ? 'DN' : 'INV';
    document.getElementById('docNum').value = `VEL-${prefix}-${currentRefNumber}`;
    if(window.innerWidth < 1024) toggleMenu();
    sync();
}

function addRow() {
    const rowId = Date.now();
    const row = document.createElement('div');
    row.className = "item-row p-4 bg-slate-50 rounded-xl border mb-3 relative";
    row.id = `row-${rowId}`;
    row.innerHTML = `<button onclick="document.getElementById('row-${rowId}').remove(); sync()" class="absolute top-2 right-2 text-red-500">×</button>
        <input type="text" oninput="sync()" placeholder="Description (e.g. Gas Oil 50ppm)" class="input-box mb-2 i-desc">
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
    document.getElementById('pRef').innerText = "REF: " + document.getElementById('docNum').value;
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
        if(d) tableBody.innerHTML += `<tr><td class="py-5 px-6 uppercase font-bold text-slate-800">${d}</td><td class="text-center font-bold">${q}</td><td class="text-right">ZMW ${p.toLocaleString()}</td><td class="text-right font-black text-slate-900">ZMW ${total.toLocaleString()}</td></tr>`;
    });

    const vat = sub * taxRate;
    document.getElementById('pSub').innerText = "ZMW " + sub.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('pVat').innerText = "ZMW " + vat.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('pTotal').innerText = "ZMW " + (sub + vat).toLocaleString(undefined, {minimumFractionDigits: 2});
}

function finalSave() {
    const el = document.getElementById('pdfArea');
    const viewport = document.querySelector('.preview-viewport');
    const oldTransform = el.style.transform;
    const oldViewHeight = viewport.style.height;

    // Reset to full size for high-quality capture
    el.style.transform = 'scale(1)';
    viewport.style.height = 'auto';

    html2pdf().from(el).set({ 
        margin: 0, 
        filename: `VICTUS_${curDocType}_${Date.now()}.pdf`, 
        html2canvas: { scale: 3, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    }).save().then(() => {
        // Restore mobile balance
        el.style.transform = oldTransform;
        viewport.style.height = oldViewHeight;
    });
}

async function saveToNeon() {
    alert("Archiving to Victus Central Database...");
    currentRefNumber++;
}

window.onload = () => { 
    applySettings();
    addRow(); 
    adjustMobileScale();
};
window.onresize = adjustMobileScale;