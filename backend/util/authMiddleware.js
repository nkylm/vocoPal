const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');

    console.log('authMiddleare token: ', token)

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        console.log('jwt verify')
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('decoded: ', decoded)
        req.user = decoded.userId; // Attach user ID to request
        console.log('user: ', req.user)
        next(); // Continue to the next middleware or route
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;
