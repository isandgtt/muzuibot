import { UserManager } from '../services/UserManager.js';
import { SessionManager } from '../services/SessionManager.js';
import { QueueManager } from '../services/QueueManager.js';
import { STATE, END_REASON } from '../utils/constants.js';
import { idleKeyboard } from '../utils/keyboards.js';
import locale from '../locales/id.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = await UserManager.getUser(chatId);

    if (!user) return bot.sendMessage(chatId, "Gunakan /start terlebih dahulu.");

    if (user.state === STATE.MATCHED) {
        await SessionManager.endSession(bot, chatId, END_REASON.STOP);
        bot.sendMessage(chatId, locale.youLeft, { reply_markup: idleKeyboard });
    } else if (user.state === STATE.SEARCHING) {
        await QueueManager.dequeue(chatId);
        user.state = STATE.IDLE;
        await UserManager.saveUser(user);
        SessionManager.clearAnimation(chatId);
        bot.sendMessage(chatId, locale.stopSearch, { reply_markup: idleKeyboard });
    } else {
        bot.sendMessage(chatId, locale.notSearching, { reply_markup: idleKeyboard });
    }
};
