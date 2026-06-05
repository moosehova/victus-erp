export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { password } = req.body;
    const correctPassword = process.env.ERP_PASSWORD;

    if (!correctPassword) {
        return res.status(500).json({ success: false, message: 'Server password not configured' });
    }

    if (password === correctPassword) {
        // Return a simple success token
        return res.status(200).json({ 
            success: true, 
            token: Buffer.from(correctPassword).toString('base64') // Basic obfuscation for local storage
        });
    } else {
        return res.status(401).json({ success: false, message: 'Incorrect Password' });
    }
}
