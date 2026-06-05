import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    const sql = neon(process.env.DATABASE_URL);
    const { action } = req.query;

    try {
        if (req.method === 'GET' && action === 'list') {
            const result = await sql`SELECT * FROM products ORDER BY name ASC`;
            return res.status(200).json({ success: true, data: result });
        }
        
        if (req.method === 'POST') {
            const postAction = req.query.action || req.body.action;
            if (postAction === 'update') {
                const { name, base_price, storage_cost, marking_fee, srf, erb } = req.body;
                await sql`
                    UPDATE products 
                    SET base_price = ${base_price}, 
                        storage_cost = ${storage_cost}, 
                        marking_fee = ${marking_fee}, 
                        srf = ${srf}, 
                        erb = ${erb}
                    WHERE name = ${name}
                `;
                return res.status(200).json({ success: true, message: 'Product updated successfully' });
            }
        }
        return res.status(400).json({ success: false, message: 'Invalid action' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
