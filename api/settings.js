// api/settings.js
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    const sql = neon(process.env.DATABASE_URL);

    // 1. GET Request: Load settings when you open the app
    if (req.method === 'GET') {
        try {
            const result = await sql`SELECT * FROM erp_config WHERE id = 1`;
            return res.status(200).json({ success: true, data: result[0] || null });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // 2. POST Request: Save settings when you hit the save button
    if (req.method === 'POST') {
        const data = req.body;
        try {
            // This updates the existing row, or creates it if it doesn't exist
            await sql`
                INSERT INTO erp_config (id, tpin, tax_rate, bank_name, account_number, signature)
                VALUES (1, ${data.tpin}, ${data.tax_rate}, ${data.bank_name}, ${data.account_number}, ${data.signature})
                ON CONFLICT (id) DO UPDATE SET 
                    tpin = EXCLUDED.tpin,
                    tax_rate = EXCLUDED.tax_rate,
                    bank_name = EXCLUDED.bank_name,
                    account_number = EXCLUDED.account_number,
                    signature = EXCLUDED.signature
            `;
            return res.status(200).json({ success: true, message: 'Settings saved to cloud' });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    
    return res.status(405).json({ message: 'Method Not Allowed' });
}