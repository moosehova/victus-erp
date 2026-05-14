import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    const sql = neon(process.env.DATABASE_URL);

    try {
        const clients = await sql`SELECT name, address FROM clients ORDER BY name ASC`;
        return res.status(200).json({ success: true, data: clients });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}