import { users } from '../data/memory.js';
import { USER_STATUS } from '../utils/constants.js';
import { addToQueue, removeFromQueue } from '../services/queue.js';
import { findMatch } from '../services/matchmaking.js';
import { endSession } from '../services/session.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = users.get(chatId);
    
    if (!user || !user.gender || !user.genderPreference || !user.city) {
        return bot.sendMessage(chatId, "Silakan lengkapi profil terlebih dahulu dengan /start");
    }
    
    if (user.status === USER_STATUS.CHATTING) {
        const partnerId = endSession(chatId);
        if (partnerId) {
            bot.sendMessage(partnerId, "Partner meninggalkan percakapan.\n\nGunakan /search untuk mencari partner baru.");
        }
    }
    
    if (user.status === USER_STATUS.SEARCHING) {
        return bot.sendMessage(chatId, "Kamu sudah berada di dalam antrean pencarian. Mohon tunggu.");
    }
    
    addToQueue(chatId);
    await bot.sendMessage(chatId, "🔍 Mencari partner...");
    
    const partnerId = findMatch(chatId);
    
    if (partnerId) {
        const matchMsg = `🎉 Partner ditemukan!\n\nMulai ngobrol sekarang.\n\nGunakan /next untuk ganti partner.\nGunakan /stop untuk berhenti.`;
        bot.sendMessage(chatId, matchMsg);
        bot.sendMessage(partnerId, matchMsg);
    }
};
