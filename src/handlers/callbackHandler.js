import { users } from '../data/memory.js';
import { preferenceKeyboard } from '../utils/keyboards.js';
import { CONVERSATION_STATE } from '../utils/constants.js';

export const handleCallbackQuery = async (bot, query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const messageId = query.message.message_id;
    
    const user = users.get(chatId);
    if (!user) {
        return bot.answerCallbackQuery(query.id, { text: "Session expired. Gunakan /start" });
    }
    
    try {
        if (data.startsWith('gender_')) {
            const gender = data.replace('gender_', ''); // 'male' or 'female'
            user.gender = gender;
            
            await bot.editMessageText("Pilih Gender Preference (Siapa yang ingin kamu ajak chat):", {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: preferenceKeyboard
            });
            await bot.answerCallbackQuery(query.id);
        } else if (data.startsWith('pref_')) {
            const pref = data.replace('pref_', ''); // 'male', 'female', or 'random'
            user.genderPreference = pref;
            user.state = CONVERSATION_STATE.AWAITING_CITY;
            
            await bot.editMessageText("Kirimkan nama Kota kamu (Contoh: Jakarta, Bandung, dll):", {
                chat_id: chatId,
                message_id: messageId
            });
            await bot.answerCallbackQuery(query.id);
        }
    } catch (error) {
        console.error("Error handling callback:", error);
    }
};
