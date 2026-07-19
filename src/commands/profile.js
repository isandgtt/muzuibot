import { UserManager } from '../services/UserManager.js';
import { idleKeyboard } from '../utils/keyboards.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = UserManager.getUser(chatId);
    
    if (!user || !user.gender || !user.genderPreference || !user.city) {
        return bot.sendMessage(chatId, "Profil belum lengkap. Silakan gunakan /start", { reply_markup: idleKeyboard });
    }
    
    const s = user.stats;
    const text = `👤 **My Profile**\n\nGender: ${user.gender === 'male' ? '👦 Male' : '👧 Female'}\nPreference: ${user.genderPreference === 'male' ? 'Male' : user.genderPreference === 'female' ? 'Female' : 'Random'}\nCity: ${user.city}\n\n📊 **Statistics**\nTotal Matches: ${s.totalMatches}\nMessages Sent: ${s.messagesSent}\nStatus: ${user.state}\nAccount Created: ${new Date(user.createdAt).toLocaleDateString()}`;
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
};
