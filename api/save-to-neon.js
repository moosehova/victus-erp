// api/save-to-neon.js
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const data = req.body;

    try {
        // Check if a unique key (ref_no + doc_type) already exists
        const existing = await sql`
            SELECT id FROM documents 
            WHERE ref_no = ${data.ref_no} AND doc_type = ${data.doc_type}
            LIMIT 1
        `;

        let result;

        if (existing.length > 0) {
            // Document exists: UPDATE it
            result = await sql`
                UPDATE documents SET
                    client_name = ${data.client_name},
                    client_tpin = ${data.client_tpin || null},
                    client_reg_no = ${data.client_reg_no || null},
                    address = ${data.address},
                    representative = ${data.representative},
                    items = ${JSON.stringify(data.items)},
                    total_amount = ${data.total_amount},
                    contract_details = ${JSON.stringify(data.contract_details)},
                    updated_at = NOW()
                WHERE ref_no = ${data.ref_no} AND doc_type = ${data.doc_type}
                RETURNING id
            `;
        } else {
            // Document does not exist: INSERT it
            result = await sql`
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
                RETURNING id
            `;
        }

        return res.status(200).json({ success: true, id: result[0].id });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}