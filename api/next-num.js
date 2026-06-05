// api/next-num.js
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { type } = req.query;
    const sql = neon(process.env.DATABASE_URL);

    try {
        // Find the highest ref_no for this specific document type
        const result = await sql`
            SELECT ref_no 
            FROM documents 
            WHERE doc_type = ${type} 
            ORDER BY id DESC 
            LIMIT 1
        `;

        let nextNumber = 1100; // Default starting number for new document types

        if (result.length > 0 && result[0].ref_no) {
            // Strip away any letters and just grab the raw numbers
            const currentNumStr = result[0].ref_no.toString().replace(/\D/g, '');
            
            if (currentNumStr) {
                nextNumber = parseInt(currentNumStr, 10) + 1; // Add 1 to the highest number
            }
        }

        return res.status(200).json({ success: true, nextNumber });
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ success: false, message: 'Failed to fetch next number' });
    }
}