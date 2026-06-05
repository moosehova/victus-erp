export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { password } = req.body;
        const correctPassword = process.env.ERP_PASSWORD;

        if (!correctPassword) {
            return res.status(500).json({ success: false, message: 'Server password not configured' });
        }

        if (password === correctPassword) {
            // Create a simple token using base64 encoding
            const token = Buffer.from(correctPassword + Date.now()).toString('base64');
            return res.status(200).json({ 
                success: true, 
                token: token
            });
        } else {
            return res.status(401).json({ success: false, message: 'Incorrect Password' });
        }
    } catch (error) {
        console.error('Login API Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
}
