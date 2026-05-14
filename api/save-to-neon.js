import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const data = req.body;

    try {
        // 1. Memorize the Client (Smart CRM)
        if (data.client_name && data.client_name !== 'Unknown') {
            await sql`
                INSERT INTO clients (name, address) 
                VALUES (${data.client_name}, ${data.address})
                ON CONFLICT (name) DO UPDATE SET address = EXCLUDED.address
            `;
        }

        // 2. Memorize the Product (Self-Learning Inventory)
        if (data.doc_type === 'Deal Recap' && data.contract_details && data.contract_details.product) {
            await sql`
                INSERT INTO products (name, base_price, storage_cost, marking_fee, srf, erb) 
                VALUES (
                    ${data.contract_details.product}, 
                    ${data.contract_details.price || ''}, 
                    ${data.contract_details.storage || ''}, 
                    ${data.contract_details.marking || ''}, 
                    ${data.contract_details.srf || ''}, 
                    ${data.contract_details.erb || ''}
                )
                ON CONFLICT (name) DO UPDATE SET 
                    base_price = EXCLUDED.base_price,
                    storage_cost = EXCLUDED.storage_cost,
                    marking_fee = EXCLUDED.marking_fee,
                    srf = EXCLUDED.srf,
                    erb = EXCLUDED.erb
            `;
        }

        // 3. Archive the Document
        await sql`
            INSERT INTO documents (
                ref_no, 
                doc_type, 
                client_name, 
                address, 
                representative, 
                items, 
                total_amount,
                contract_details
            ) VALUES (
                ${data.ref_no}, 
                ${data.doc_type}, 
                ${data.client_name}, 
                ${data.address}, 
                ${data.representative}, 
                ${JSON.stringify(data.items || [])}, 
                ${data.total_amount},
                ${data.contract_details ? JSON.stringify(data.contract_details) : null}
            )
        `;
        return res.status(200).json({ success: true, message: 'Document Archived & Database Updated' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
}