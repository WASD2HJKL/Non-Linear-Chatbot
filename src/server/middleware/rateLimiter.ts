import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

interface RateLimiterOptions {
    windowMs?: number;
    max?: number;
    message?: string;
}

export const createRateLimiter = (options: RateLimiterOptions = {}) => {
    const windowMs = options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || "3600000"); // 1 hour default
    const max = options.max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"); // 100 requests default

    console.log("[RATE LIMITER DEBUG] Creating rate limiter with windowMs:", windowMs, "max:", max);

    return rateLimit({
        windowMs,
        max,
        message: options.message || "Too many requests from this user, please try again later.",
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        keyGenerator: (req: Request) => {
            // Use authenticated user ID if available, otherwise fall back to IP
            const user = (req as any).user || (req as any).context?.user;
            const key = user?.id?.toString() || req.ip || "anonymous";
            console.log(
                "[RATE LIMITER DEBUG] Generated key for user:",
                key,
                "user object:",
                user ? `id: ${user.id}` : "no user",
            );
            return key;
        },
        handler: (req: Request, res: Response) => {
            console.log("[RATE LIMITER DEBUG] Rate limit exceeded for", req.url);
            const retryAfter = res.get("Retry-After");
            res.status(429).json({
                error: "Too many requests",
                message: `You have exceeded the ${max} requests in ${windowMs / 60000} minutes limit.`,
                retryAfter: retryAfter,
            });
        },
    });
};
