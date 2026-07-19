import { UserManager } from '../services/UserManager.js';
import { STATE } from '../utils/constants.js';
import { idleKeyboard } from '../utils/keyboards.js';
import locale from '../locales/id.js';
import config from '../config/config.js';
import { Logger } from '../utils/logger.js';
import { SessionManager } from '../services/SessionManager.js';
import { StatsManager } from '../services/StatsManager.js';

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
    
    const user = UserManager.getUser(chatId);
    if (!user) return;
    
    UserManager.updateLastSeen(chatId);

    if (text && text.startsWith('/')) return;

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
    
    if (user.state === STATE.PROFILE_SETUP && text) {
        if (!user.city) {
            user.city = text.trim().substring(0, 50);
            user.state = STATE.IDLE;
            await bot.sendMessage(chatId, locale.profileCreated, { reply_markup: idleKeyboard });
        }
        return;
    }
    
    if (user.state === STATE.MATCHED && user.partner && user.sessionId) {
        const now = Date.now();
        user.rateLimit.timestamps = user.rateLimit.timestamps.filter(t => now - t < config.rateLimit.timeWindowMs);
        if (user.rateLimit.timestamps.length >= config.rateLimit.maxMessages) {
            return bot.sendMessage(chatId, locale.rateLimitWarning);
        }
        user.rateLimit.timestamps.push(now);

        const partnerId = user.partner;
        try {
            SessionManager.updateActivity(user.sessionId);
            const partnerUser = UserManager.getUser(partnerId);
            StatsManager.recordMessage(user, partnerUser);
            
            bot.sendChatAction(partnerId, "typing").catch(()=>{});
            
            await bot.copyMessage(partnerId, chatId, msg.message_id);
        } catch (error) {
            Logger.error("Error forwarding message:", error.message);
        }
        return;
    }
    
    if (user.state === STATE.IDLE) {
        bot.sendMessage(chatId, locale.noPartner, { reply_markup: idleKeyboard });
    }
};
