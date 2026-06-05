export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    // Get password from request body
    const { password } = req.body;
    
    // Get the correct password from environment variables
    const correctPassword = process.env.ERP_PASSWORD;

    // Check if password is configured
    if (!correctPassword) {
        return res.status(500).json({ success: false, message: 'Server password not configured' });
    }

    // Compare passwords
    if (password === correctPassword) {
        // Password is correct - return success with a simple token
        return res.status(200).json({ 
            success: true, 
            token: 'authenticated_' + Date.now()
        });
    } else {
        // Password is incorrect
        return res.status(401).json({ success: false, message: 'Incorrect Password' });
    }
}
