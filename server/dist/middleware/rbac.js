export function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: "Insufficient permissions." });
            return;
        }
        next();
    };
}
