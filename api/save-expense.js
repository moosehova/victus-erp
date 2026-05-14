import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    const sql = neon(process.env.DATABASE_URL);
    const { category, description, amount, date } = req.body;

    try {
        await sql`INSERT INTO expenses (category, description, amount, date) VALUES (${category}, ${description}, ${amount}, ${date})`;
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}