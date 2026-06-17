// --- AUTHENTICATION SYSTEM ---
// Check auth status on load
document.addEventListener('DOMContentLoaded', () => {
    // PREVIEW-BYPASS: Auto-unlock when running as a static file on port 3000 (no Vercel API)
    if (window.location.port === '3000' && !localStorage.getItem('erp_auth_token')) {
        localStorage.setItem('erp_auth_token', 'static-preview');
        window.location.reload();
        return;
    }

    const token = localStorage.getItem('erp_auth_token');
    if (token) {
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
    }
});

// The Login Function
async function attemptLogin() {
    const passwordInput = document.getElementById('erp-password').value;
    const errorText = document.getElementById('login-error');
    
    if (!passwordInput) return;

    try {
        // THIS IS THE MISSING LOGIN FETCH CODE
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: passwordInput })
        });

        const data = await response.json();

        if (data.success) {
            // Save token to browser
            localStorage.setItem('erp_auth_token', data.token);
            
            // Swap views
            document.getElementById('login-view').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            
            errorText.classList.add('hidden');
            showNotification("System Unlocked 🟢");
        } else {
            errorText.innerText = data.message || "Incorrect Password";
            errorText.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Login Error:", error);
        errorText.innerText = "Network Error. Try again.";
        errorText.classList.remove('hidden');
    }
}

let currentRefNumber = 1100;
let curDocType = 'Quotation';
let taxRate = 0;
let usdRate = 27; // ZMW per 1 USD — configurable in ERP Settings
let globalSignature = null;
let deletePendingId = null;

// --- SLEEK NOTIFICATION ENGINE ---
function showNotification(message) {
    const existing = document.getElementById('erp-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'erp-toast';
    toast.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-[999] font-black tracking-wider text-xs uppercase border border-slate-700 transition-all duration-300 translate-y-[-20px] opacity-0';
    toast.innerText = message.startsWith('Premium') ? message : `Premium • ${message}`;

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
    if (curDocType === 'Quotation') prefix = 'QT';
    if (curDocType === 'Delivery Note') prefix = 'DN';
    if (curDocType === 'Deal Recap') prefix = 'DR';
    if (curDocType === 'Local Purchase Order') prefix = 'PO';

    const finalRef = `VEL-${prefix}-${currentRefNumber}`;
    document.getElementById('docNum').value = finalRef;
    document.getElementById('pRef').innerText = "REF: " + finalRef;
}

// Add 'async' to the function so it can wait for the database
async function setDoc(type, btn, isEdit = false) {
    
    // ONLY wipe and auto-number if we are NOT editing
    if (!isEdit) {
        // WIPE THE SLATE CLEAN
        if (document.getElementById('clientName')) document.getElementById('clientName').value = '';
        if (document.getElementById('address')) document.getElementById('address').value = '';
        if (document.getElementById('clientTpin')) document.getElementById('clientTpin').value = '';
        if (document.getElementById('clientReg')) document.getElementById('clientReg').value = '';
        if (document.getElementById('delMethod')) document.getElementById('delMethod').value = '';
        if (document.getElementById('poDeliveryTerms')) document.getElementById('poDeliveryTerms').value = '';
        if (document.getElementById('poDeliveryDate')) document.getElementById('poDeliveryDate').value = '';
        if (document.getElementById('poDeliverTo')) document.getElementById('poDeliverTo').value = '';
        if (document.getElementById('poComments')) document.getElementById('poComments').value = '';
        
        // RESET ITEMS TO ONE BLANK ROW
        if (document.getElementById('itemList')) {
            document.getElementById('itemList').innerHTML = '';
            if (typeof addRow === 'function') addRow(); 
        }

        // RESET EDIT LOCK (Tell the app this is a brand new document)
        if (document.getElementById('docNum')) {
            document.getElementById('docNum').removeAttribute('data-editing');
        }

        // AUTOMATED NUMBER GENERATION
        const docNumInput = document.getElementById('docNum');
        if (docNumInput) {
            docNumInput.value = 'Syncing...'; // Show the user it's thinking
            
            try {
                // Ask the database for the next number for this specific document type
                const response = await fetch(`/api/documents?action=next-num&type=${encodeURIComponent(type)}`);
                const data = await response.json();
                
                if (data.success) {
                    currentRefNumber = data.nextNumber; // Update global state
                }
            } catch (error) {
                console.error("Failed to auto-generate number:", error);
            }
        }
    }

    curDocType = type;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    document.getElementById('pType').innerText = type.toUpperCase();
    document.getElementById('editTitle').innerText = type;
    
    if (!isEdit) {
        updateDocNumber(); // Format the new number using currentRefNumber
    }

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

    // --- PURCHASE ORDER SPECIFIC UI TOGGLES ---
    const isPO = (type === 'Local Purchase Order');
    const partyLabel = document.getElementById('partyLabel');
    const pPartyLabel = document.getElementById('pPartyLabel');
    const poExtraFields = document.getElementById('po-extra-fields');
    const poTermsBlock = document.getElementById('poDeliveryTermsBlock');
    const poDateBlock = document.getElementById('poDeliveryDateBlock');
    const poDeliverToBlock = document.getElementById('poDeliverToBlock');
    const poCommentsBlock = document.getElementById('p-po-comments-block');

    // Form label swaps
    if (partyLabel) partyLabel.innerText = isPO ? 'Vendor / Supplier' : 'Client / Buyer';
    if (pPartyLabel) pPartyLabel.innerText = isPO ? 'Vendor / Supplier' : 'Attention To';
    if (poExtraFields) poExtraFields.classList.toggle('hidden', !isPO);
    if (poTermsBlock) poTermsBlock.classList.toggle('hidden', !isPO);
    if (poDateBlock) poDateBlock.classList.toggle('hidden', !isPO);
    if (poDeliverToBlock) poDeliverToBlock.classList.toggle('hidden', !isPO);
    if (poCommentsBlock) poCommentsBlock.classList.toggle('hidden', !isPO);

    if (window.innerWidth < 1024) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('open');
    }

    sync();
}

// --- CLOUD SYNC: SETTINGS & SIGNATURE ---
function handleSignature(event) {
    const reader = new FileReader();
    const sigImg = document.getElementById('pSignature');
    reader.onload = function () {
        sigImg.src = reader.result;
        sigImg.classList.remove('hidden');
        globalSignature = reader.result;
        showNotification("Signature Ready. Click Save to Sync.");
    };
    if (event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

async function saveSettings() {
    showNotification("Syncing Settings to Cloud...");

    const getValue = id => document.getElementById(id)?.value || '';
    const config = {
        tpin: getValue('set-tpin'),
        reg_no: getValue('set-reg-no'),
        tax_rate: getValue('set-tax'),
        account_name: getValue('set-acc-name'),
        bank_name: getValue('set-bank'),
        account_number: getValue('set-account'),
        branch_name: getValue('set-branch'),
        branch_code: getValue('set-branch-code'),
        swift_code: getValue('set-swift'),
        sort_code: getValue('set-sort'),
        currency: getValue('set-currency'),
        usd_rate: getValue('set-usd-rate'),
        signature: globalSignature
    };

    console.log('Sending config:', config);

    try {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        console.log('Response status:', res.status);
        console.log('Response ok:', res.ok);

        const data = await res.json();
        console.log('Response data:', data);

        if (res.ok && data.success) {
            showNotification("ERP Settings Cloud Synced ☁️");
            applySettings();
        } else {
            const message = data.error || data.message || res.statusText || 'Server Error';
            showNotification("Cloud Sync Failed: " + message + " 🔴");
        }
    } catch (err) {
        console.error('Settings save failed:', err);
        showNotification("Network Error: Cannot reach API 🔴");
    }
}

// --- DYNAMIC SETTINGS SYNC ---
function applySettings() {
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data) {
                const config = data.data;
                const savedTax = (config.tax_rate !== undefined && config.tax_rate !== null && config.tax_rate !== '') ? parseFloat(config.tax_rate) : 0;
                taxRate = savedTax / 100;

                // Load USD exchange rate
                const savedUsdRate = (config.usd_rate !== undefined && config.usd_rate !== null && config.usd_rate !== '') ? parseFloat(config.usd_rate) : 27;
                usdRate = savedUsdRate > 0 ? savedUsdRate : 27;
                const usdRateInput = document.getElementById('set-usd-rate');
                if (usdRateInput) usdRateInput.value = usdRate;

                const setInput = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.value = value || '';
                };
                const setText = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = value;
                };

                // Fill Settings Form
                setInput('set-tpin', config.tpin);
                setInput('set-reg-no', config.reg_no);
                setInput('set-tax', config.tax_rate);
                setInput('set-acc-name', config.account_name);
                setInput('set-bank', config.bank_name);
                setInput('set-account', config.account_number);
                setInput('set-branch', config.branch_name);
                setInput('set-branch-code', config.branch_code);
                setInput('set-swift', config.swift_code);
                setInput('set-sort', config.sort_code);
                setInput('set-currency', config.currency);

                // Update Preview Header & Footer dynamically (No hardcoding)
                setText('pVatRate', savedTax);
                setText('p-set-tpin', config.tpin || '-');
                setText('p-set-reg-no', config.reg_no || '-');
                setText('p-set-acc-name', config.account_name || '-');
                setText('p-set-bank', config.bank_name || '-');
                setText('p-set-account', config.account_number || '-');
                setText('p-set-branch', config.branch_name || '-');
                setText('p-set-branch-code', config.branch_code || '-');
                setText('p-set-swift', config.swift_code || '-');
                setText('p-set-sort', config.sort_code || '-');
                setText('p-set-currency', config.currency || '-');
                setText('p-set-acc-name', config.account_name || '-');
                setText('p-set-bank', config.bank_name || '-');
                setText('p-set-account', config.account_number || '-');
                setText('p-set-branch', config.branch_name || '-');
                setText('p-set-branch-code', config.branch_code || '-');
                setText('p-set-swift', config.swift_code || '-');
                setText('p-set-sort', config.sort_code || '-');
                setText('p-set-currency', config.currency || '-');

                // Signature handling
                if (config.signature && config.signature !== 'null') {
                    globalSignature = config.signature;
                    const sigImg = document.getElementById('pSignature');
                    if (sigImg) {
                        sigImg.src = config.signature;
                        sigImg.classList.remove('hidden');
                    }
                }
                sync();
            }
        })
        .catch(err => console.log("Waiting for cloud sync..."));
}

// --- CLEAN NEON ARCHIVE ---
async function saveToNeon() {
    showNotification("Syncing to Neon Database...");
    
    // 🚨 SAFETY CHECK: Prevent accidental overwrites of new documents
    // If the reference number already exists in the dashboard AND we're not editing, STOP
    const currentDocNum = document.getElementById('docNum').value;
    const dashboardTable = document.getElementById('dashboardTableBody');
    
    // Count how many rows in the dashboard have this ref number
    let existingCount = 0;
    if (dashboardTable) {
        const rows = dashboardTable.querySelectorAll('tr');
        rows.forEach(row => {
            const refCell = row.querySelector('td:first-child');
            if (refCell && refCell.innerText.trim() === currentDocNum) {
                existingCount++;
            }
        });
    }
    
    // If this number exists AND we didn't just click Edit (no locked ref), block it
    if (existingCount > 0 && !document.getElementById('docNum').hasAttribute('data-editing')) {
        alert(`🚨 STOP! Document number ${currentDocNum} already exists in your database.\n\nThis is likely a NEW document with a duplicate number.\n\nPlease click "Generate New Number" or change the number to avoid overwriting your previous document!`);
        showNotification("Save Cancelled - Duplicate Ref Number 🔴");
        return;
    }

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
        client_tpin: document.getElementById('clientTpin') ? document.getElementById('clientTpin').value : '',
        client_reg_no: document.getElementById('clientReg') ? document.getElementById('clientReg').value : '',
        address: document.getElementById('address').value || '',
        representative: document.getElementById('salesRep').value || '',
        items: itemsArray,
        total_amount: parseFloat(rawTotal) || 0,
        contract_details: contractDetails
    };

    try {
        showNotification("Archiving to Neon...");
        const btn = document.querySelector('button[onclick="saveToNeon()"]');
        if (btn) btn.disabled = true;

        const res = await fetch('/api/documents?action=save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(docData)
        });
        const response = await res.json();
        
        if (btn) btn.disabled = false;
        if (res.ok && response.success) {
            showNotification("Document Archived to Neon 🟢");
            if (!document.getElementById('docNum').hasAttribute('data-editing')) {
                currentRefNumber++;
                updateDocNumber();
            }
        } else {
            const message = response.error || response.message || res.statusText || 'Unknown Error';
            console.error('Archive failed:', message);
            showNotification("Archive Failed: " + message + " 🔴");
        }
    } catch (err) {
        console.error('Network error during archive:', err);
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
    
    // Sync the delivery method input to the document
    if (document.getElementById('pMethod')) {
        document.getElementById('pMethod').innerText = document.getElementById('delMethod').value || '-';
    }

    // Sync PO-specific fields
    const isPO = (curDocType === 'Local Purchase Order');
    const poTermsEl = document.getElementById('poDeliveryTerms');
    const poDateEl = document.getElementById('poDeliveryDate');
    const poDeliverToEl = document.getElementById('poDeliverTo');
    const poCommentsEl = document.getElementById('poComments');

    if (isPO) {
        if (document.getElementById('pPoDeliveryTerms') && poTermsEl)
            document.getElementById('pPoDeliveryTerms').innerText = poTermsEl.value || '-';
        if (document.getElementById('pPoDeliveryDate') && poDateEl)
            document.getElementById('pPoDeliveryDate').innerText = poDateEl.value || '-';
        if (document.getElementById('pPoDeliverTo') && poDeliverToEl)
            document.getElementById('pPoDeliverTo').innerText = poDeliverToEl.value || '-';
        if (document.getElementById('p-po-comments') && poCommentsEl)
            document.getElementById('p-po-comments').innerText = poCommentsEl.value || '-';
    }

    // NEW: Sync Client TPIN and Reg No
    const cTpin = document.getElementById('clientTpin') ? document.getElementById('clientTpin').value : '';
    const cReg = document.getElementById('clientReg') ? document.getElementById('clientReg').value : '';
    const metaContainer = document.getElementById('pClientMeta');
    
    if (metaContainer) {
        if (cTpin || cReg) {
            metaContainer.classList.remove('hidden');
            
            const tpinWrap = document.getElementById('pClientTpinWrapper');
            if (cTpin) { tpinWrap.classList.remove('hidden'); document.getElementById('pClientTpin').innerText = cTpin; } 
            else { tpinWrap.classList.add('hidden'); }

            const regWrap = document.getElementById('pClientRegWrapper');
            if (cReg) { regWrap.classList.remove('hidden'); document.getElementById('pClientReg').innerText = cReg; } 
            else { regWrap.classList.add('hidden'); }
        } else {
            metaContainer.classList.add('hidden');
        }
    }

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
            if (d) tableBody.innerHTML += `<tr><td class="py-4 px-6 uppercase">${d}</td><td class="text-center font-bold text-slate-600">${q}</td><td class="text-right">ZMW ${p.toLocaleString()}</td><td class="text-right font-black">ZMW ${total.toLocaleString()}</td></tr>`;
        });

        const vat = sub * taxRate;
        const grandTotal = sub + vat;
        document.getElementById('pSub').innerText = "ZMW " + sub.toLocaleString(undefined, { minimumFractionDigits: 2 });
        document.getElementById('pVat').innerText = "ZMW " + vat.toLocaleString(undefined, { minimumFractionDigits: 2 });
        document.getElementById('pTotal').innerText = grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 });
        // USD equivalent
        const usdEl = document.getElementById('pTotalUsd');
        if (usdEl) usdEl.innerText = (grandTotal / usdRate).toLocaleString(undefined, { minimumFractionDigits: 2 });
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
    showNotification("Preparing PDF...");

    // Force the window to the top to prevent scroll offset bugs
    window.scrollTo(0, 0);

    const el = document.getElementById('pdfArea');
    const main = document.querySelector('main');
    const body = document.body;

    const oldTransform = el.style.transform;
    const oldPosition = el.style.position;
    const oldBodyOverflow = body.style.overflow;
    const oldMainOverflow = main.style.overflow;

    // Remove absolute positioning and hidden overflows
    el.style.transform = 'scale(1)';
    el.style.position = 'relative'; 
    body.style.overflow = 'visible';
    main.style.overflow = 'visible';

    setTimeout(() => {
        // NEW FIX: Measure the exact height of the document down to the pixel
        const trueHeight = Math.max(el.scrollHeight, 1131);

        const opt = {
            margin: 0,
            filename: `Victus_${curDocType}_${document.getElementById('docNum').value}.pdf`,
            image: { type: 'jpeg', quality: 1.0 }, // Maximum factory quality
            html2canvas: { 
                scale: 4, // Retina-level precision
                useCORS: true,
                scrollY: 0,
                scrollX: 0,
                letterRendering: true // Crisper text boundaries
            },
            // Tell the PDF to make ONE rigid page that exactly matches the true height
            jsPDF: { unit: 'px', format: [800, trueHeight], orientation: 'portrait' }
        };

        // Notice we removed the "deletePage" loop completely! Just save directly.
        html2pdf().set(opt).from(el).save().then(() => {
            // Restore original constraints immediately after saving
            el.style.transform = oldTransform;
            el.style.position = oldPosition || 'absolute';
            body.style.overflow = oldBodyOverflow || '';
            main.style.overflow = oldMainOverflow || '';
            if (typeof adjustMobileScale === 'function') adjustMobileScale();
            showNotification("Download Complete! 🟢");
        }).catch(err => {
            console.error("PDF Engine Error:", err);
            // Ensure UI is restored even if an error occurs
            el.style.transform = oldTransform;
            el.style.position = oldPosition || 'absolute';
            body.style.overflow = oldBodyOverflow || '';
            main.style.overflow = oldMainOverflow || '';
            if (typeof adjustMobileScale === 'function') adjustMobileScale();
            showNotification("Download Failed. 🔴");
        });
    }, 300); 
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
        if (el) el.classList.add('hidden');
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
    } else if (view === 'preview-only') {
        editor.classList.add('hidden');
        settings.classList.add('hidden');
        dashboard.classList.add('hidden');
        expenses.classList.add('hidden');
        preview.classList.remove('hidden');
        setTimeout(adjustMobileScale, 50);
    } else {
        editor.classList.remove('hidden');
        preview.classList.remove('hidden');
        setTimeout(adjustMobileScale, 50);
    }

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (window.innerWidth < 1024) {
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

    if (!data.amount) return showNotification("Please enter an amount 🔴");

    fetch('/api/expenses?action=save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()).then(res => {
        if (res.success) {
            showNotification("Expense Recorded 🔴");
            loadExpenses();
            document.getElementById('exp-desc').value = '';
            document.getElementById('exp-amt').value = '';
        }
    });
}

function loadExpenses() {
    fetch('/api/expenses?action=list')
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

    fetch('/api/documents?action=list')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
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

    if (docs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 font-bold text-slate-400">No documents found.</td></tr>';
        document.getElementById('dash-total-rev').innerText = 'ZMW 0.00';
        document.getElementById('dash-total-docs').innerText = '0';
        return;
    }

    docs.forEach(doc => {
        const amt = parseFloat(String(doc.total_amount).replace(/,/g, '')) || 0;

        // REVENUE LOGIC GATE: Only count PAID documents that are NOT Quotes/Proformas
        if (doc.status === 'PAID' && doc.doc_type !== 'Quotation' && doc.doc_type !== 'Proforma Invoice') {
            totalRevenue += amt;
        }

        let statusBadge = `<span class="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-black tracking-wider cursor-pointer" onclick="toggleStatus(${doc.id}, '${doc.status || 'DRAFT'}')">${doc.status || 'DRAFT'}</span>`;
        if (doc.status === 'PAID') statusBadge = `<span class="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black tracking-wider cursor-pointer" onclick="toggleStatus(${doc.id}, 'PAID')">PAID</span>`;
        if (doc.status === 'SENT') statusBadge = `<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-[10px] font-black tracking-wider cursor-pointer" onclick="toggleStatus(${doc.id}, 'SENT')">SENT</span>`;

        const docJson = encodeURIComponent(JSON.stringify(doc));

        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-all">
                <td class="py-4 px-6 font-bold text-slate-900">${doc.ref_no}</td>
                <td class="py-4 px-6 text-slate-500 uppercase text-xs font-black tracking-wider">${doc.doc_type}</td>
                <td class="py-4 px-6 font-medium text-slate-700">${doc.client_name}</td>
                <td class="py-4 px-6">${statusBadge}</td>
                <td class="py-4 px-6 text-right font-black text-blue-700">ZMW ${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}<br><span class="text-green-600 text-xs font-bold">$ ${(amt / usdRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></td>
                <td class="py-4 px-6 text-center flex justify-center gap-2">
                    <button onclick="viewDocument('${docJson}')" class="text-[10px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors uppercase tracking-wider border border-slate-200">Preview</button>
                    <button onclick="editDocument('${docJson}')" class="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-500 transition-colors uppercase tracking-wider">Edit</button>
                    <button onclick="cloneDoc('${docJson}')" class="text-[10px] bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 transition-colors uppercase tracking-wider">Clone</button>
                    <button onclick="deleteDocument(${doc.id})" class="text-[10px] bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100 transition-colors uppercase tracking-wider border border-red-200">Del</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('dash-total-rev').innerText = `ZMW ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    document.getElementById('dash-total-docs').innerText = docs.length;
}

function cloneDoc(encodedJson) {
    const doc = JSON.parse(decodeURIComponent(encodedJson));
    const editorBtn = document.querySelector(`button[onclick*="setDoc('${doc.doc_type}'"]`) || document.querySelector('.nav-btn');
    switchView('editor', editorBtn);
    setDoc(doc.doc_type, editorBtn);

    document.getElementById('clientName').value = doc.client_name;
    document.getElementById('address').value = doc.address;
    document.getElementById('itemList').innerHTML = '';

    if (doc.items && Array.isArray(doc.items)) {
        doc.items.forEach(item => {
            addRow();
            const rows = document.querySelectorAll('.item-row');
            const lastRow = rows[rows.length - 1];
            lastRow.querySelector('.i-desc').value = item.description || '';
            lastRow.querySelector('.i-qty').value = item.qty || 0;
            lastRow.querySelector('.i-price').value = item.price || 0;
        });
    }

    if (doc.doc_type === 'Deal Recap' && doc.contract_details) {
        Object.keys(doc.contract_details).forEach(key => {
            const el = document.getElementById(`dr-${key}`);
            if (el) el.value = doc.contract_details[key];
        });
    }

    document.getElementById('docDate').value = new Date().toISOString().split('T')[0];
    showNotification(`Cloned ${doc.doc_type} for ${doc.client_name}`);
    sync();
}

function editDocument(encodedJson) {
    const doc = JSON.parse(decodeURIComponent(encodedJson));
    const editorBtn = document.querySelector(`button[onclick*="setDoc('${doc.doc_type}'"`) || document.querySelector('.nav-btn');
    
    // 1. Switch to editor view
    switchView('editor', editorBtn);
    setDoc(doc.doc_type, editorBtn, true); // Pass true for isEdit so it doesn't wipe the form

    // 2. Load the client data
    document.getElementById('clientName').value = doc.client_name || '';
    document.getElementById('address').value = doc.address || '';
    document.getElementById('salesRep').value = doc.representative || '';
    
    // 3. CRITICAL: Lock in the original Reference Number so it overwrites in the database
    document.getElementById('docNum').value = doc.ref_no;
    document.getElementById('docNum').setAttribute('data-editing', 'true'); // Mark as being edited
    document.getElementById('pRef').innerText = "REF: " + doc.ref_no;
    
    // 4. Load the items
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

    // 5. Load Contract Details if it's a Deal Recap
    if(doc.doc_type === 'Deal Recap' && doc.contract_details) {
        Object.keys(doc.contract_details).forEach(key => {
            const el = document.getElementById(`dr-${key}`);
            if(el) el.value = doc.contract_details[key];
        });
    }

    sync();
    showNotification(`Editing Document: ${doc.ref_no}`);
}

function viewDocument(encodedJson) {
    const doc = JSON.parse(decodeURIComponent(encodedJson));

    if (doc.doc_type === 'Deal Recap') {
        setDoc('Deal Recap', null, true);
        if (doc.contract_details) {
            Object.keys(doc.contract_details).forEach(key => {
                const el = document.getElementById(`dr-${key}`);
                if (el) el.value = doc.contract_details[key] || '';
            });
        }
    } else {
        setDoc(doc.doc_type, null, true);
        if (doc.items && Array.isArray(doc.items) && doc.items.length > 0) {
            doc.items.forEach(item => {
                addRow();
                const rows = document.querySelectorAll('.item-row');
                const lastRow = rows[rows.length - 1];
                lastRow.querySelector('.i-desc').value = item.description || '';
                lastRow.querySelector('.i-qty').value = item.qty || 0;
                lastRow.querySelector('.i-price').value = item.price || 0;
            });
        } else {
            addRow();
        }
    }

    document.getElementById('clientName').value = doc.client_name || '';
    if (document.getElementById('clientTpin')) document.getElementById('clientTpin').value = doc.client_tpin || '';
    if (document.getElementById('clientReg')) document.getElementById('clientReg').value = doc.client_reg_no || '';
    document.getElementById('address').value = doc.address || '';
    document.getElementById('salesRep').value = doc.representative || '';
    document.getElementById('pRef').innerText = "REF: " + doc.ref_no;

    document.getElementById('docDate').value = doc.created_at ? new Date(doc.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    switchView('preview-only', null);
    showNotification('Document preview opened');
    sync();
}

function closePreview() {
    const dashBtn = document.querySelector('button[onclick*="dashboard"]');
    switchView('dashboard', dashBtn);
    showNotification('Preview closed');
}

function deleteDocument(id) {
    deletePendingId = id;
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeDeleteModal() {
    deletePendingId = null;
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function confirmDelete() {
    if (!deletePendingId) return;
    showNotification('Deleting document...');
    fetch('/api/documents?action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletePendingId })
    })
        .then(async res => {
            const data = await res.json();
            closeDeleteModal();
            if (res.ok && data.success) {
                showNotification('Premium • Document deleted successfully');
                loadDashboard();
            } else {
                showNotification('Premium • Delete failed: ' + (data.error || data.message || 'Server Error'));
            }
        })
        .catch(() => {
            closeDeleteModal();
            showNotification('Premium • Network Error: Could not delete document');
        });
}

function renderChart(docs) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (revChart) revChart.destroy();
    
    // Generate labels for the last 7 days
    const labels = [];
    const invoices = [0, 0, 0, 0, 0, 0, 0];
    const quotes = [0, 0, 0, 0, 0, 0, 0];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    docs.forEach(d => {
        if (!d.created_at) return;
        
        const docDate = new Date(d.created_at);
        const diffTime = today - docDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < 7) {
            const idx = 6 - diffDays;
            if (d.doc_type === 'Quotation') {
                quotes[idx]++;
            } else if (d.doc_type === 'Invoice' || d.doc_type === 'Proforma Invoice') {
                invoices[idx]++;
            }
        }
    });

    revChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Quotations',
                    data: quotes,
                    backgroundColor: '#94A3B8',
                    borderRadius: 4
                },
                {
                    label: 'Invoices',
                    data: invoices,
                    backgroundColor: '#2563EB',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: true, position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: { 
                x: { grid: { display: false } }, 
                y: { beginAtZero: true, ticks: { stepSize: 1 } } 
            }
        }
    });
}

function toggleStatus(id, currentStatus) {
    let nextStatus = 'SENT';
    if (currentStatus === 'SENT') nextStatus = 'PAID';
    if (currentStatus === 'PAID') nextStatus = 'DRAFT';

    showNotification(`Updating status to ${nextStatus}...`);
    fetch('/api/documents?action=update-status', {
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
    fetch('/api/clients?action=list')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
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
    fetch('/api/products?action=list')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
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
    if (prod) {
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
    fetch('/api/products?action=list')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data.length > 0) {
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
    fetch('/api/products?action=update', {
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
    if (clientDatabase[selectedName]) {
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