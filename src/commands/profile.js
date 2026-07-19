import { users } from '../data/memory.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = users.get(chatId);
    
    if (!user || !user.gender || !user.genderPreference || !user.city) {
        return bot.sendMessage(chatId, "Profil belum lengkap. Silakan gunakan /start");
    }
    
    const text = `👤 Profil Kamu:\n\nGender: ${user.gender === 'male' ? '👦 Male' : '👧 Female'}\nPreference: ${user.genderPreference === 'male' ? 'Male' : user.genderPreference === 'female' ? 'Female' : 'Random'}\nKota: ${user.city}\nStatus: ${user.status}`;
    bot.sendMessage(chatId, text);
};
