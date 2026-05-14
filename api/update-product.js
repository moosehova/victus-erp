import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const { name, base_price, storage_cost, marking_fee, srf, erb } = req.body;

    try {
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
    } catch (error) {
        console.error("Pricing update failed:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}