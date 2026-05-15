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