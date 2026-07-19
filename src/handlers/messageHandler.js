import { UserManager } from '../services/UserManager.js';
import { STATE, SESSION_STATE } from '../utils/constants.js';
import { idleKeyboard } from '../utils/keyboards.js';
import locale from '../locales/id.js';
import config from '../config/config.js';
import { Logger } from '../utils/logger.js';
import { SessionManager } from '../services/SessionManager.js';
import { StatsManager } from '../services/StatsManager.js';
import { StorageService } from '../services/StorageService.js';

import { execute as searchCmd } from '../commands/search.js';
import { execute as nextCmd } from '../commands/next.js';
import { execute as stopCmd } from '../commands/stop.js';
import { execute as profileCmd } from '../commands/profile.js';
import { execute as settingsCmd } from '../commands/settings.js';
import { execute as helpCmd } from '../commands/help.js';
import { execute as rulesCmd } from '../commands/rules.js';

// Per-user processing guard to prevent double execution.
// This is an in-memory Map (fine because it's only for debouncing within
// the same process, not for cross-instance state).
const processingUsers = new Map();

export const handleMessage = async (bot, msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore slash commands (handled by onText in bot.js)
    if (text && text.startsWith('/')) return;

    // Per-user debounce: prevent concurrent processing of messages
    // from the same user (e.g. double-tap, rapid Telegram delivery)
    if (processingUsers.get(chatId)) return;
    processingUsers.set(chatId, true);

    try {
        // Auto-create user if they don't exist yet (e.g. they joined via
        // deep link or pressed a keyboard button without /start)
        let user = await UserManager.getUser(chatId);
        if (!user) {
            user = await UserManager.createUser(chatId);
            if (user.state === STATE.NEW) {
                user.state = STATE.IDLE;
                await UserManager.saveUser(user);
            }
        }

        // Throttled lastSeen update — only write to DB every 60 seconds
        const now = Date.now();
        if (now - (user.lastSeen || 0) > 60000) {
            await UserManager.updateLastSeen(chatId);
        }

        // Route Reply Keyboard button presses
        if (text) {
            switch (text) {
                case locale.btn_findPartner:
                    return await searchCmd(bot, msg);
                case locale.btn_searchGender:
                    return await searchCmd(bot, msg, true);
                case locale.btn_profile:
                    return await profileCmd(bot, msg);
                case locale.btn_settings:
                    return await settingsCmd(bot, msg);
                case locale.btn_help:
                    return await helpCmd(bot, msg);
                case locale.btn_next:
                    return await nextCmd(bot, msg);
                case locale.btn_stop:
                    return await stopCmd(bot, msg);
                case locale.btn_rules:
                    return await rulesCmd(bot, msg);
            }
        }

        // Handle profile setup (awaiting city input)
        if (user.state === STATE.PROFILE_SETUP && text) {
            if (!user.city) {
                user.city = text.trim().substring(0, 50);
                user.state = STATE.IDLE;
                await UserManager.saveUser(user);
                await bot.sendMessage(chatId, locale.profileCreated, { reply_markup: idleKeyboard });
            }
            return;
        }

        // Forward messages to partner (only when fully MATCHED with valid ACTIVE session)
        if (user.state === STATE.MATCHED && user.partner && user.sessionId) {
            const session = await StorageService.getSession(user.sessionId);
            if (!session || session.state !== SESSION_STATE.ACTIVE) {
                return;
            }

            // Rate limiter
            user.rateLimit.timestamps = user.rateLimit.timestamps.filter(t => now - t < config.rateLimit.timeWindowMs);
            if (user.rateLimit.timestamps.length >= config.rateLimit.maxMessages) {
                return bot.sendMessage(chatId, locale.rateLimitWarning);
            }
            user.rateLimit.timestamps.push(now);
            await UserManager.saveUser(user);

            const partnerId = Number(user.partner);
            try {
                await SessionManager.updateActivity(user.sessionId);
                const partnerUser = await UserManager.getUser(partnerId);
                await StatsManager.recordMessage(user, partnerUser);

                bot.sendChatAction(partnerId, "typing").catch(() => {});
                await bot.copyMessage(partnerId, chatId, msg.message_id);
            } catch (error) {
                Logger.error("Error forwarding message:", error.message);
            }
            return;
        }

        // User is idle and sent a random message
        if (user.state === STATE.IDLE || user.state === STATE.NEW) {
            bot.sendMessage(chatId, locale.noPartner, { reply_markup: idleKeyboard });
        }
    } finally {
        processingUsers.delete(chatId);
    }
};
