import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    const sql = neon(process.env.DATABASE_URL);
    const { action } = req.query;

    try {
        if (req.method === 'GET' && action === 'list') {
            const result = await sql`
                SELECT * FROM clients 
                ORDER BY name ASC
            `;
            return res.status(200).json({ success: true, data: result });
        }
        return res.status(400).json({ success: false, message: 'Invalid action' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
