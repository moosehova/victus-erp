// check-schema.js
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
    try {
        console.log('Checking documents table schema...\n');

        const columns = await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'documents' ORDER BY ordinal_position`;

        console.log('Documents table columns:');
        columns.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkSchema();