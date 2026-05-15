import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, error: 'Document id is required' });
    }

    try {
        await sql`
            DELETE FROM documents
            WHERE id = ${id}
        `;
        return res.status(200).json({ success: true, message: 'Document deleted' });
    } catch (error) {
        console.error('Delete document failed:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
