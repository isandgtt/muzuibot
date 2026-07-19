import { users } from '../data/memory.js';
import { endSession } from '../services/session.js';
import { removeFromQueue } from '../services/queue.js';
import { USER_STATUS } from '../utils/constants.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = users.get(chatId);
    
    if (!user) return bot.sendMessage(chatId, "Gunakan /start terlebih dahulu.");
    
    if (user.status === USER_STATUS.CHATTING) {
        const partnerId = endSession(chatId);
        if (partnerId) {
            bot.sendMessage(partnerId, "Partner meninggalkan percakapan.\n\nGunakan /search untuk mencari partner baru.");
        }
        bot.sendMessage(chatId, "Kamu telah menghentikan percakapan.");
    } else if (user.status === USER_STATUS.SEARCHING) {
        removeFromQueue(chatId);
        bot.sendMessage(chatId, "Berhenti mencari partner.");
    } else {
        bot.sendMessage(chatId, "Kamu tidak sedang mencari atau chatting dengan siapa pun.");
    }
};
