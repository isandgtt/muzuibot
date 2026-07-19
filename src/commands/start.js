import { UserManager } from '../services/UserManager.js';
import { STATE } from '../utils/constants.js';
import { idleKeyboard } from '../utils/keyboards.js';
import locale from '../locales/id.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = await UserManager.createUser(chatId);

    if (user.state === STATE.MATCHED || user.state === STATE.SEARCHING) {
        user.state = STATE.IDLE;
        await UserManager.saveUser(user);
    } else if (user.state === STATE.NEW || user.state === STATE.PROFILE_SETUP) {
        user.state = STATE.IDLE;
        await UserManager.saveUser(user);
    }

    try {
        await bot.sendMessage(chatId, locale.welcome, {
            reply_markup: idleKeyboard
        });
    } catch (error) {
        console.error("Error in start command:", error);
    }
};
