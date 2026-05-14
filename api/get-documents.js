// api/get-documents.js
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        // Fetch all documents from the database, newest first
        const docs = await sql`SELECT * FROM documents ORDER BY id DESC`;
        return res.status(200).json({ success: true, data: docs });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
}