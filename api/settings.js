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
                INSERT INTO erp_config (id, tpin, reg_no, tax_rate, bank_name, account_number, account_name, branch_name, branch_code, swift_code, sort_code, currency, signature)
                VALUES (1, ${data.tpin || ''}, ${data.reg_no || ''}, ${data.tax_rate || ''}, ${data.bank_name || ''}, ${data.account_number || ''}, ${data.account_name || ''}, ${data.branch_name || ''}, ${data.branch_code || ''}, ${data.swift_code || ''}, ${data.sort_code || ''}, ${data.currency || 'ZMW'}, ${data.signature || null})
                ON CONFLICT (id) DO UPDATE SET 
                    tpin = EXCLUDED.tpin,
                    reg_no = EXCLUDED.reg_no,
                    tax_rate = EXCLUDED.tax_rate,
                    bank_name = EXCLUDED.bank_name,
                    account_number = EXCLUDED.account_number,
                    account_name = EXCLUDED.account_name,
                    branch_name = EXCLUDED.branch_name,
                    branch_code = EXCLUDED.branch_code,
                    swift_code = EXCLUDED.swift_code,
                    sort_code = EXCLUDED.sort_code,
                    currency = EXCLUDED.currency,
                    signature = EXCLUDED.signature
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