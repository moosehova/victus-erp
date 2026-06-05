import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { type } = req.query;

    try {
        console.log("Fetching next number for doc_type:", type);

        // Updated to use the correct column name 'doc_type' 
        // as seen in your Neon SQL Editor screenshot
        const result = await sql`
            SELECT ref_no 
            FROM documents 
            WHERE doc_type = ${type} 
            ORDER BY id DESC 
            LIMIT 1;
        `;

        let nextNumber = 1100;

        if (result.rows && result.rows.length > 0 && result.rows[0].ref_no) {
            // Strip non-numeric characters and increment
            const currentNumStr = result.rows[0].ref_no.toString().replace(/\D/g, '');
            if (currentNumStr) {
                nextNumber = parseInt(currentNumStr, 10) + 1;
            }
        }

        return res.status(200).json({ success: true, nextNumber });
        
    } catch (error) {
        console.error("CRITICAL DATABASE ERROR in next-num.js:", error);
        // Returning a 500 status code with JSON so the frontend doesn't crash on 'A'
        return res.status(500).json({ success: false, message: 'Database error occurred' });
    }
}