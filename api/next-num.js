import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { type } = req.query;

    try {
        // We use ref_no here instead of doc_num!
        const result = await sql`
            SELECT ref_no 
            FROM documents 
            WHERE type = ${type} 
            ORDER BY id DESC 
            LIMIT 1;
        `;

        let nextNumber = 1100; // Default starting number

        if (result.length > 0 && result[0].ref_no) {
            // Strip away letters (like VEL-INV-) and grab the numbers
            const currentNumStr = result[0].ref_no.toString().replace(/\D/g, '');
            
            if (currentNumStr) {
                nextNumber = parseInt(currentNumStr, 10) + 1; // Add 1
            }
        }

        // Optional: If you want to automatically add the prefix back, you can do it here,
        // but passing just the number is fine if your frontend adds the "VEL-INV-" part.
        return res.status(200).json({ success: true, nextNumber });
        
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ success: false, message: 'Failed to fetch next number' });
    }
}