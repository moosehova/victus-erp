// api/save-to-neon.js
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const data = req.body;

    try {
        // Insert document into database (matching actual table structure)
        const result = await sql`
            INSERT INTO documents (ref_no, doc_type, client_name, items, total_amount, contract_details, status, created_at)
            VALUES (${data.ref_no}, ${data.doc_type}, ${data.client_name}, ${JSON.stringify(data.items)}, ${data.total_amount}, ${JSON.stringify(data.contract_details)}, 'DRAFT', NOW())
            RETURNING id
        `;

        return res.status(200).json({ success: true, id: result[0].id });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}