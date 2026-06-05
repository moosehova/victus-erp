import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { type } = req.query;

    try {
        const result = await sql`
            SELECT ref_no 
            FROM documents 
            WHERE type = ${type} 
            ORDER BY id DESC 
            LIMIT 1;
        `;

        let nextNumber = 1100; // Default starting number

        // FIX: We must look inside result.rows for Vercel Postgres!
        if (result.rows && result.rows.length > 0 && result.rows[0].ref_no) {
            
            // Strip away letters (like VEL-INV-) and grab the numbers
            const currentNumStr = result.rows[0].ref_no.toString().replace(/\D/g, '');
            
            if (currentNumStr) {
                nextNumber = parseInt(currentNumStr, 10) + 1; // Add 1
            }
        }

        return res.status(200).json({ success: true, nextNumber });
        
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ success: false, message: 'Failed to fetch next number' });
    }
}