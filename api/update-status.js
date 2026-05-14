import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const { id, newStatus } = req.body;

    try {
        // Securely update the status of the specific document by its database ID
        await sql`
            UPDATE documents 
            SET status = ${newStatus} 
            WHERE id = ${id}
        `;
        return res.status(200).json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error("Database update failed:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}