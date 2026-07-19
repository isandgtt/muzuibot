export const Logger = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
    error: (msg, err = '') => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err),
    match: (msg) => console.log(`[MATCH] ${new Date().toISOString()} - ${msg}`),
    queue: (msg) => console.log(`[QUEUE] ${new Date().toISOString()} - ${msg}`),
    session: (msg) => console.log(`[SESSION] ${new Date().toISOString()} - ${msg}`)
};
