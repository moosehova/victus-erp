import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { type } = req.query;

    try {
        // Log the type so we can see what's being requested
        console.log("Fetching next number for type:", type);

        // Double check this table name exists exactly like this in your Neon SQL Editor
        const result = await sql`
            SELECT ref_no 
            FROM documents 
            WHERE doc_type = ${type} 
            ORDER BY id DESC 
            LIMIT 1;
        `;

        let nextNumber = 1100;

        if (result.rows && result.rows.length > 0 && result.rows[0].ref_no) {
            const currentNumStr = result.rows[0].ref_no.toString().replace(/\D/g, '');
            if (currentNumStr) {
                nextNumber = parseInt(currentNumStr, 10) + 1;
            }
        }

        return res.status(200).json({ success: true, nextNumber });
        
    } catch (error) {
        // This will print the actual SQL error to your Vercel Logs
        console.error("CRITICAL DATABASE ERROR in next-num.js:", error);
        
        // Return a valid JSON response even on error so your frontend doesn't crash
        return res.status(200).json({ success: false, nextNumber: 1100 });
    }
}