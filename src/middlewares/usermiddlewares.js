    const jwt = require("jsonwebtoken");

    const authMiddleware = (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({
                    message: "No token provided",
                });
            }

            const token = authHeader.split(" ")[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = decoded;

            next();

        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token expired", });
            }
            if (err.name === "JsonWebTokenError") {
                return res.status(401).json({ message: "Invalid token", });
            }
            return res.status(500).json({
                message: "Internal server error",
            }); 
        }
    };

    module.exports = authMiddleware;