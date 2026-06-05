import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Force a check if the URL is even present
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
        console.error("CRITICAL: Database URL is missing from Environment Variables!");
        return res.status(500).json({ success: false, error: "Database configuration missing" });
    }

    const sql = neon(dbUrl);
    
    // ... rest of your existing logic ...
    
    // 2. Parse query parameters
    const type = req.query?.type || '';

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
        return res.status(200).json({ success: true, nextNumber: nextNumber });
        
    } catch (error) {
        console.error("Database Query Failed:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Unknown database error"
        });
    }
}