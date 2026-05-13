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
        try {
            await sql`
                INSERT INTO erp_config (id, tpin, tax_rate, bank_name, account_number, account_name, branch_name, branch_code, signature)
                VALUES (1, ${data.tpin}, ${data.tax_rate}, ${data.bank_name}, ${data.account_number}, ${data.account_name}, ${data.branch_name}, ${data.branch_code}, ${data.signature})
                ON CONFLICT (id) DO UPDATE SET 
                    tpin = EXCLUDED.tpin,
                    tax_rate = EXCLUDED.tax_rate,
                    bank_name = EXCLUDED.bank_name,
                    account_number = EXCLUDED.account_number,
                    account_name = EXCLUDED.account_name,
                    branch_name = EXCLUDED.branch_name,
                    branch_code = EXCLUDED.branch_code,
                    signature = EXCLUDED.signature
            `;
            return res.status(200).json({ success: true, message: 'Settings saved to cloud' });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    
    return res.status(405).json({ message: 'Method Not Allowed' });
}