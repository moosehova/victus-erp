import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // 1. Setup connection using the environment variable
    const sql = neon(process.env.POSTGRES_URL);
    
    // 2. Parse query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const type = url.searchParams.get('type');

    try {
        // 3. Query the database
        const result = await sql`
            SELECT ref_no 
            FROM documents 
            WHERE doc_type = ${type} 
            ORDER BY id DESC 
            LIMIT 1;
        `;

        let nextNumber = 1100;

        if (result && result.length > 0 && result[0].ref_no) {
            const currentNumStr = result[0].ref_no.toString().replace(/\D/g, '');
            if (currentNumStr) {
                nextNumber = parseInt(currentNumStr, 10) + 1;
            }
        }

        // 4. Return success
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, nextNumber: nextNumber }));
        
    } catch (error) {
        console.error("Database Query Failed:", error);
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ 
            success: false, 
            error: error.message 
        }));
    }
}