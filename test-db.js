import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_daEv8bgu7ziG@ep-soft-flower-apc4jmf2.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function test() {
  try {
    const res = await sql`SELECT ref_no, doc_type, id FROM documents ORDER BY id DESC;`;
    console.log('Success:', res);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
