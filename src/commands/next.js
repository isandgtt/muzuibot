import { users } from '../data/memory.js';
import { endSession } from '../services/session.js';
import { execute as executeSearch } from './search.js';
import { USER_STATUS } from '../utils/constants.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = users.get(chatId);
    
    if (!user) return bot.sendMessage(chatId, "Gunakan /start terlebih dahulu.");
    
    if (user.status === USER_STATUS.CHATTING) {
        const partnerId = endSession(chatId);
        if (partnerId) {
            console.log(`Partner Left: ${partnerId}`);
            bot.sendMessage(partnerId, "Partner meninggalkan percakapan.\n\nGunakan /search untuk mencari partner baru.");
        }
        await bot.sendMessage(chatId, "Kamu meninggalkan percakapan.");
    } else if (user.status === USER_STATUS.SEARCHING) {
        // Just inform or re-search
        await bot.sendMessage(chatId, "Mencari ulang partner...");
    } else {
        // IDLE
    }
    
    // Automatically search for a new partner
    await executeSearch(bot, msg);
};
