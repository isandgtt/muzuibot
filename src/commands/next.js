import { UserManager } from '../services/UserManager.js';
import { SessionManager } from '../services/SessionManager.js';
import { STATE, END_REASON } from '../utils/constants.js';
import { idleKeyboard } from '../utils/keyboards.js';
import locale from '../locales/id.js';
import config from '../config/config.js';
import { joinQueue } from './search.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = UserManager.getUser(chatId);

    if (!user) return bot.sendMessage(chatId, "Gunakan /start terlebih dahulu.");

    if (user.state === STATE.MATCHED) {
        // Cooldown check
        const now = Date.now();
        if (now - user.lastNext < config.cooldownMs) {
            return bot.sendMessage(chatId, locale.cooldownWarning);
        }
        user.lastNext = now;

        // End current session FIRST, then re-queue
        await SessionManager.endSession(bot, chatId, END_REASON.NEXT);
        await bot.sendMessage(chatId, locale.youLeft, { reply_markup: idleKeyboard });

        // Now search for new partner
        await joinQueue(bot, chatId);
    } else if (user.state === STATE.SEARCHING) {
        return bot.sendMessage(chatId, "Kamu sedang mencari partner. Tunggu ya!");
    } else {
        // IDLE — just search
        await joinQueue(bot, chatId);
    }
};
