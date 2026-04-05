import { aj } from "../config/arcjet.js";

export const arcjetMiddleware = async (req, res, next) => {
    try {
        const auth = typeof req.auth === "function" ? req.auth() : null;
        const isAuthenticated = Boolean(auth?.isAuthenticated);

        const decision = await aj.protect(req, {
            requested: 1, // each request consumes 1 token
        });

        if (decision.isDenied()) {
            // Native app requests can be flagged as bots. If Clerk has already
            // authenticated the request, let the protected route handle it.
            if (decision.reason.isBot() && isAuthenticated) {
                return next();
            }

            if (decision.reason.isRateLimit()) {
                return res.status(429).json({
                    error: "Too many requests",
                    message: "Rate limit exceeded. Please try again later."
                });
            } else if (decision.reason.isBot()) {
                return res.status(403).json({
                    error: "Bot access denied",
                    message: "Automated requests are not allowed."
                });
            } else {
                return res.status(403).json({
                    error: "Forbidden",
                    message: "Access denied by security policy",
                });
            }
        }

        if (decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
            return res.status(403).json({
                error: "Spoofed bot detected",
                message: "Malicious bot activity detected"
            })
        }

        next();
    } catch (error) {
        console.error("Arcject middleware error:", error);
        next();
    }
}
