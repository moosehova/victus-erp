import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    const sql = neon(process.env.DATABASE_URL);
    const { action } = req.query;

    try {
        if (req.method === 'GET' && action === 'list') {
            const result = await sql`
                SELECT * FROM expenses 
                ORDER BY date DESC, id DESC 
                LIMIT 100
            `;
            return res.status(200).json({ success: true, data: result });
        }
        
        if (req.method === 'POST') {
            const postAction = req.query.action || req.body.action;
            if (postAction === 'save') {
                const { category, description, amount, date } = req.body;
                await sql`INSERT INTO expenses (category, description, amount, date) VALUES (${category}, ${description}, ${amount}, ${date})`;
                return res.status(200).json({ success: true });
            }
        }
        return res.status(400).json({ success: false, message: 'Invalid action' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
