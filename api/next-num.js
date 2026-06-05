import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { type } = req.query;

    try {
        // Querying against 'doc_type' and 'ref_no' based on your Neon screenshot
        const result = await sql`
            SELECT ref_no 
            FROM documents 
            WHERE doc_type = ${type} 
            ORDER BY id DESC 
            LIMIT 1;
        `;

        let nextNumber = 1100;

        if (result.rows && result.rows.length > 0 && result.rows[0].ref_no) {
            // Extracts numbers from strings like "VEL-INV-1100"
            const currentNumStr = result.rows[0].ref_no.toString().replace(/\D/g, '');
            if (currentNumStr) {
                nextNumber = parseInt(currentNumStr, 10) + 1;
            }
        }

        return res.status(200).json({ success: true, nextNumber: nextNumber });
        
    } catch (error) {
        // This log will appear in your Vercel Dashboard -> Logs
        console.error("DEBUG - Database Query Failed:", error);
        
        // Return a clean JSON error so the frontend doesn't throw a SyntaxError
        return res.status(500).json({ 
            success: false, 
            message: "Database query failed", 
            error: error.message 
        });
    }
}