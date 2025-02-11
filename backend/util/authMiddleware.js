const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization']; // Correct way to access headers
    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
    console.log('Extracted Token:', token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token:', decoded);
        
        req.user = decoded.userId; // Attach user ID to request
        console.log('User ID:', req.user);
        
        next(); // Continue to the next middleware or route
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;
