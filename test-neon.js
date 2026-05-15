// test-neon.js - Simple test script to check Neon database connection and tables
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function testNeonConnection() {
    console.log('🧪 Testing Neon Database Connection...\n');

    try {
        // Test basic connection
        console.log('1. Testing database connection...');
        const result = await sql`SELECT 1 as test`;
        console.log('✅ Database connection successful!\n');

        // Check if tables exist
        console.log('2. Checking database tables...');

        const tables = ['documents', 'erp_config', 'products', 'expenses', 'clients'];

        for (const table of tables) {
            try {
                const exists = await sql`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ${table})`;
                if (exists[0].exists) {
                    console.log(`✅ Table '${table}' exists`);

                    // Get row count
                    const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
                    console.log(`   📊 Row count: ${count[0].count}`);
                } else {
                    console.log(`❌ Table '${table}' does not exist`);
                }
            } catch (error) {
                console.log(`❌ Error checking table '${table}': ${error.message}`);
            }
        }

        console.log('\n3. Testing sample queries...');

        // Test documents table
        try {
            const docs = await sql`SELECT COUNT(*) as total FROM documents`;
            console.log(`✅ Documents table accessible (${docs[0].total} records)`);
        } catch (error) {
            console.log(`❌ Documents table error: ${error.message}`);
        }

        // Test settings
        try {
            const settings = await sql`SELECT * FROM erp_config WHERE id = 1`;
            console.log(`✅ Settings accessible (${settings.length > 0 ? 'configured' : 'not configured'})`);
        } catch (error) {
            console.log(`❌ Settings error: ${error.message}`);
        }

        console.log('\n🎉 Neon database test completed!');

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testNeonConnection();