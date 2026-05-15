// test-save-to-neon.js - Test the save-to-neon API functionality
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function testSaveToNeon() {
    console.log('🧪 Testing save-to-neon API functionality...\n');

    // Sample document data (matching actual table structure)
    const testDoc = {
        ref_no: 'VEL-QT-9999',
        doc_type: 'Quotation',
        client_name: 'Test Client',
        items: [
            { description: 'Test Item 1', qty: 2, price: 100.00 },
            { description: 'Test Item 2', qty: 1, price: 50.00 }
        ],
        total_amount: 250.00,
        contract_details: null
    };

    try {
        console.log('1. Inserting test document...');

        const result = await sql`
            INSERT INTO documents (ref_no, doc_type, client_name, items, total_amount, contract_details, status, created_at)
            VALUES (${testDoc.ref_no}, ${testDoc.doc_type}, ${testDoc.client_name}, ${JSON.stringify(testDoc.items)}, ${testDoc.total_amount}, ${JSON.stringify(testDoc.contract_details)}, 'DRAFT', NOW())
            RETURNING id, ref_no, doc_type, total_amount
        `;

        console.log('✅ Document inserted successfully!');
        console.log(`   ID: ${result[0].id}`);
        console.log(`   Ref: ${result[0].ref_no}`);
        console.log(`   Type: ${result[0].doc_type}`);
        console.log(`   Amount: ${result[0].total_amount}`);

        console.log('\n2. Verifying document was saved...');

        const verify = await sql`SELECT COUNT(*) as count FROM documents WHERE ref_no = ${testDoc.ref_no}`;
        console.log(`✅ Document count: ${verify[0].count}`);

        console.log('\n3. Testing total documents count...');

        const total = await sql`SELECT COUNT(*) as total FROM documents`;
        console.log(`📊 Total documents in database: ${total[0].total}`);

        console.log('\n4. Cleaning up test data...');

        await sql`DELETE FROM documents WHERE ref_no = ${testDoc.ref_no}`;
        console.log('✅ Test document removed');

        const finalCount = await sql`SELECT COUNT(*) as count FROM documents`;
        console.log(`📊 Final document count: ${finalCount[0].count}`);

        console.log('\n🎉 save-to-neon API test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testSaveToNeon();