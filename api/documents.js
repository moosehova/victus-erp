import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    const sql = neon(process.env.DATABASE_URL);
    const { action, type } = req.query;

    try {
        if (req.method === 'GET') {
            if (action === 'list') {
                const result = await sql`
                    SELECT * FROM documents 
                    ORDER BY id DESC 
                    LIMIT 200
                `;
                return res.status(200).json({ success: true, data: result });
            } 
            
            if (action === 'next-num') {
                const result = await sql`
                    SELECT ref_no 
                    FROM documents 
                    WHERE doc_type = ${type || ''} 
                    ORDER BY id DESC 
                    LIMIT 1;
                `;

                let nextNumber = 1100;

                if (result && result.length > 0 && result[0].ref_no) {
                    const currentNumStr = result[0].ref_no.toString().replace(/\D/g, '');
                    if (currentNumStr) {
                        nextNumber = parseInt(currentNumStr, 10) + 1;
                    }
                }
                return res.status(200).json({ success: true, nextNumber: nextNumber });
            }
        } 
        
        if (req.method === 'POST') {
            const data = req.body;
            const postAction = req.query.action || req.body.action;

            if (postAction === 'save') {
                const existing = await sql`
                    SELECT id FROM documents 
                    WHERE ref_no = ${data.ref_no} AND doc_type = ${data.doc_type}
                    LIMIT 1
                `;

                let result;
                if (existing.length > 0) {
                    result = await sql`
                        UPDATE documents SET
                            client_name = ${data.client_name},
                            client_tpin = ${data.client_tpin || null},
                            client_reg_no = ${data.client_reg_no || null},
                            address = ${data.address},
                            representative = ${data.representative},
                            items = ${JSON.stringify(data.items)},
                            total_amount = ${data.total_amount},
                            contract_details = ${JSON.stringify(data.contract_details)},
                            currency = ${data.currency || 'ZMW'},
                            updated_at = NOW()
                        WHERE ref_no = ${data.ref_no} AND doc_type = ${data.doc_type}
                        RETURNING id
                    `;
                } else {
                    result = await sql`
                        INSERT INTO documents (
                            ref_no, doc_type, client_name, client_tpin, client_reg_no, address, representative, items, total_amount, contract_details, currency, status, created_at, updated_at
                        )
                        VALUES (
                            ${data.ref_no}, ${data.doc_type}, ${data.client_name}, ${data.client_tpin || null}, ${data.client_reg_no || null}, ${data.address}, ${data.representative}, ${JSON.stringify(data.items)}, ${data.total_amount}, ${JSON.stringify(data.contract_details)}, ${data.currency || 'ZMW'}, 'DRAFT', NOW(), NOW()
                        )
                        RETURNING id
                    `;
                }
                return res.status(200).json({ success: true, id: result[0].id });
            }

            if (postAction === 'delete') {
                await sql`DELETE FROM documents WHERE id = ${data.id}`;
                return res.status(200).json({ success: true, message: 'Document permanently deleted' });
            }

            if (postAction === 'update-status') {
                await sql`UPDATE documents SET status = ${data.newStatus} WHERE id = ${data.id}`;
                return res.status(200).json({ success: true, message: 'Status updated successfully' });
            }
        }

        return res.status(400).json({ success: false, message: 'Invalid action or method' });
    } catch (error) {
        console.error("Documents API Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
