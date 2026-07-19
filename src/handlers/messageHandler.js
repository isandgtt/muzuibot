import { users } from '../data/memory.js';
import { USER_STATUS, CONVERSATION_STATE } from '../utils/constants.js';

export const handleMessage = async (bot, msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Ignore commands (starts with /)
    if (text && text.startsWith('/')) return;

    const user = users.get(chatId);
    if (!user) return;
    
    // Handle conversation state (e.g. awaiting city)
    if (user.state === CONVERSATION_STATE.AWAITING_CITY && text) {
        user.city = text.trim();
        user.state = CONVERSATION_STATE.NONE;
        
        await bot.sendMessage(chatId, "✅ Profil berhasil dibuat.\n\nGunakan /search untuk mencari partner.");
        return;
    }
    
    // Handle Chatting
    if (user.status === USER_STATUS.CHATTING && user.partner) {
        const partnerId = user.partner;
        try {
            // Copy message to partner
            await bot.copyMessage(partnerId, chatId, msg.message_id);
        } catch (error) {
            console.error("Error forwarding message:", error);
            bot.sendMessage(chatId, "Gagal mengirim pesan ke partner.");
        }
        return;
    }
    
    // If not chatting and not setting up profile
    if (user.status !== USER_STATUS.CHATTING && user.state === CONVERSATION_STATE.NONE) {
        bot.sendMessage(chatId, "⚠️ Kamu belum memiliki partner.\n\nGunakan /search.");
    }
};
