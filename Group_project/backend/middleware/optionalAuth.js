const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        req.user = null; // Guest user
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains user ID and email
        next();
    } catch (err) {
        req.user = null; // Invalid token, default to guest
        next();
    }
};

module.exports = optionalAuth;