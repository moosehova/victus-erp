// api/save-to-neon.js
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const data = req.body;

    try {
        // Insert or update document if the same ref_no already exists
        const result = await sql`
            INSERT INTO documents (
                ref_no, doc_type, client_name, client_tpin, client_reg_no, address, representative, items, total_amount, contract_details, status, created_at, updated_at
            )
            VALUES (
                ${data.ref_no},
                ${data.doc_type},
                ${data.client_name},
                ${data.client_tpin || null},
                ${data.client_reg_no || null},
                ${data.address},
                ${data.representative},
                ${JSON.stringify(data.items)},
                ${data.total_amount},
                ${JSON.stringify(data.contract_details)},
                'DRAFT',
                NOW(),
                NOW()
            )
            ON CONFLICT (ref_no) DO UPDATE SET
                doc_type = EXCLUDED.doc_type,
                client_name = EXCLUDED.client_name,
                client_tpin = EXCLUDED.client_tpin,
                client_reg_no = EXCLUDED.client_reg_no,
                address = EXCLUDED.address,
                representative = EXCLUDED.representative,
                items = EXCLUDED.items,
                total_amount = EXCLUDED.total_amount,
                contract_details = EXCLUDED.contract_details,
                status = EXCLUDED.status,
                updated_at = NOW()
            RETURNING id
        `;

        return res.status(200).json({ success: true, id: result[0].id });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}