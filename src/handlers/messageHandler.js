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

export const handleMessage = async (bot, msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const user = await UserManager.getUser(chatId);
    if (!user) return;

    await UserManager.updateLastSeen(chatId);

    // Ignore slash commands (handled by onText in bot.js)
    if (text && text.startsWith('/')) return;

    // Route Reply Keyboard button presses
    if (text) {
        switch (text) {
            case locale.btn_findPartner:
                return searchCmd(bot, msg);
            case locale.btn_searchGender:
                return searchCmd(bot, msg, true);
            case locale.btn_profile:
                return profileCmd(bot, msg);
            case locale.btn_settings:
                return settingsCmd(bot, msg);
            case locale.btn_help:
                return helpCmd(bot, msg);
            case locale.btn_next:
                return nextCmd(bot, msg);
            case locale.btn_stop:
                return stopCmd(bot, msg);
            case locale.btn_rules:
                return rulesCmd(bot, msg);
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
        const now = Date.now();
        user.rateLimit.timestamps = user.rateLimit.timestamps.filter(t => now - t < config.rateLimit.timeWindowMs);
        if (user.rateLimit.timestamps.length >= config.rateLimit.maxMessages) {
            return bot.sendMessage(chatId, locale.rateLimitWarning);
        }
        user.rateLimit.timestamps.push(now);
        await UserManager.saveUser(user);

        const partnerId = user.partner;
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
    if (user.state === STATE.IDLE) {
        bot.sendMessage(chatId, locale.noPartner, { reply_markup: idleKeyboard });
    }
};
