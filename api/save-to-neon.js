// api/save-to-neon.js
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // This pulls your secret connection string from Vercel's settings
    const sql = neon(process.env.DATABASE_URL);
    const data = req.body;

    try {
        await sql`
            INSERT INTO documents (
                ref_no, 
                doc_type, 
                client_name, 
                address, 
                representative, 
                items, 
                total_amount
            ) VALUES (
                ${data.ref_no}, 
                ${data.doc_type}, 
                ${data.client_name}, 
                ${data.address}, 
                ${data.representative}, 
                ${JSON.stringify(data.items)}, 
                ${data.total_amount}
            )
        `;
        return res.status(200).json({ success: true, message: 'Victus Document Archived' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
}