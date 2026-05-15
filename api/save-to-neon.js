async function saveToNeon() {
    showNotification("Syncing to Neon Database...");
    let itemsArray = [];
    let contractDetails = null;

    if (curDocType === 'Deal Recap') {
        contractDetails = {
            product: document.getElementById('dr-product').value,
            qty: document.getElementById('dr-qty').value,
            price: document.getElementById('dr-price').value,
            vat: document.getElementById('dr-vat').value,
            storage: document.getElementById('dr-storage').value,
            marking: document.getElementById('dr-marking').value,
            srf: document.getElementById('dr-srf').value,
            erb: document.getElementById('dr-erb').value,
            window: document.getElementById('dr-window').value,
            delivery: document.getElementById('dr-delivery').value,
            quality: document.getElementById('dr-quality').value,
            qtydet: document.getElementById('dr-qtydet').value,
            transfer: document.getElementById('dr-transfer').value,
            payment: document.getElementById('dr-payment').value,
            laytime: document.getElementById('dr-laytime').value,
            inspection: document.getElementById('dr-inspection').value,
            others: document.getElementById('dr-others').value
        };
    } else {
        document.querySelectorAll('.item-row').forEach(row => {
            itemsArray.push({
                description: row.querySelector('.i-desc').value,
                qty: row.querySelector('.i-qty').value,
                price: row.querySelector('.i-price').value
            });
        });
    }

    const docData = {
        ref_no: document.getElementById('docNum').value,
        doc_type: curDocType,
        client_name: document.getElementById('clientName').value || 'Unknown',
        address: document.getElementById('address').value || 'None',
        representative: document.getElementById('salesRep').value || 'Lungowe Lutangu',
        items: itemsArray,
        total_amount: document.getElementById('pTotal').innerText.replace('ZMW ', '').replace(/,/g, ''),
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
            showNotification("Archive Failed: " + (response.error || "Unknown Error") + " 🔴");
        }
    } catch (err) {
        console.error("Neon Sync Error:", err);
        showNotification("Network Error: Cloud Unreachable 🔴");
    }
}