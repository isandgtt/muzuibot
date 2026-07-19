export default {
    sessionTimeoutMs: 15 * 60 * 1000,
    cooldownMs: 3000,
    queueUpdateIntervalMs: 5000,
    searchAnimationIntervalMs: 2000,
    rateLimit: {
        maxMessages: 8,
        timeWindowMs: 5000
    },
    developmentMode: process.env.NODE_ENV !== 'production',
    webhookMode: !!process.env.WEBHOOK_URL
};
