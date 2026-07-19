import { users } from '../data/memory.js';
import { USER_STATUS, CONVERSATION_STATE } from '../utils/constants.js';
import { genderKeyboard } from '../utils/keyboards.js';
import { v4 as uuidv4 } from 'uuid';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    
    if (!users.has(chatId)) {
        users.set(chatId, {
            id: uuidv4(),
            telegram_id: chatId,
            gender: null,
            genderPreference: null,
            city: null,
            status: USER_STATUS.IDLE,
            partner: null,
            sessionId: null,
            searching: false,
            createdAt: Date.now(),
            state: CONVERSATION_STATE.NONE
        });
    }

    const user = users.get(chatId);
    
    // Reset state and status if they /start again
    user.state = CONVERSATION_STATE.NONE;
    if (user.status === USER_STATUS.SEARCHING) {
        // Will be removed from queue via other mechanisms or we can do it here, 
        // but let's keep it simple.
    }

    const welcomeMsg = `👋 Selamat datang di MuzuiBot!\n\nMuzuiBot adalah Anonymous Chat Telegram.\n\nKamu bisa ngobrol secara anonim dengan orang lain.\n\nSilakan lengkapi profil terlebih dahulu.\n\nPilih Gender kamu:`;
    
    try {
        await bot.sendMessage(chatId, welcomeMsg, {
            reply_markup: genderKeyboard
        });
    } catch (error) {
        console.error("Error in start command:", error);
    }
};
