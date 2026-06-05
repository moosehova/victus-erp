export default async function handler(req, res) {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    return res.status(200).json({
        success: true,
        hasDbUrl: !!dbUrl,
        urlPrefix: dbUrl ? dbUrl.substring(0, 15) + '...' : null,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
    });
}
