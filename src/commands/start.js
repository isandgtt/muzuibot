import { UserManager } from '../services/UserManager.js';
import { STATE } from '../utils/constants.js';
import { idleKeyboard, inlineGenderKeyboard } from '../utils/keyboards.js';
import locale from '../locales/id.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = UserManager.createUser(chatId);

    if (user.state === STATE.MATCHED || user.state === STATE.SEARCHING) {
        user.state = STATE.NEW;
    }

    try {
        if (user.gender && user.genderPreference && user.city) {
            user.state = STATE.IDLE;
            await bot.sendMessage(chatId, locale.profileCreated, { reply_markup: idleKeyboard });
        } else {
            user.state = STATE.PROFILE_SETUP;
            await bot.sendMessage(chatId, locale.welcome, {
                reply_markup: inlineGenderKeyboard
            });
        }
    } catch (error) {
        console.error("Error in start command:", error);
    }
};
