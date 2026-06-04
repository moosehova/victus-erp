import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    const sql = neon(process.env.DATABASE_URL);

    if (req.method === 'GET') {
        try {
            const result = await sql`SELECT * FROM erp_config WHERE id = 1`;
            return res.status(200).json({ success: true, data: result[0] || null });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    if (req.method === 'POST') {
        const data = req.body;
        console.log('Settings POST received:', { tpin: data.tpin, reg_no: data.reg_no, tax_rate: data.tax_rate });
        try {
            const result = await sql`
                UPDATE erp_config SET 
                    tpin = ${data.tpin || ''}, 
                    reg_no = ${data.reg_no || ''}, 
                    tax_rate = ${data.tax_rate || ''}, 
                    bank_name = ${data.bank_name || ''}, 
                    account_name = ${data.account_name || ''}, 
                    account_number = ${data.account_number || ''},
                    branch_name = ${data.branch_name || ''},
                    branch_code = ${data.branch_code || ''},
                    swift_code = ${data.swift_code || ''}, 
                    sort_code = ${data.sort_code || ''}, 
                    currency = ${data.currency || 'ZMW'},
                    signature = ${data.signature || null},
                    updated_at = NOW()
                WHERE id = 1
                RETURNING *
            `;
            console.log('Settings saved successfully:', result[0]);
            return res.status(200).json({ success: true, message: 'Settings saved to cloud', data: result[0] });
        } catch (error) {
            console.error('Settings POST error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    
    return res.status(405).json({ message: 'Method Not Allowed' });
}