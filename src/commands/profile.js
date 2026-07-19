import { UserManager } from '../services/UserManager.js';
import { idleKeyboard } from '../utils/keyboards.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = await UserManager.getUser(chatId);
    
    if (!user) {
        return bot.sendMessage(chatId, "Gunakan /start terlebih dahulu", { reply_markup: idleKeyboard });
    }
    
    const s = user.stats;
    const genderStr = user.gender === 'male' ? '👦 Male' : user.gender === 'female' ? '👧 Female' : 'Not Set';
    const prefStr = user.genderPreference === 'male' ? 'Male' : user.genderPreference === 'female' ? 'Female' : 'Random';
    const cityStr = user.city || 'Not Set';
    
    const text = `👤 **My Profile**\n\nGender: ${genderStr}\nPreference: ${prefStr}\nCity: ${cityStr}\n\n📊 **Statistics**\nTotal Matches: ${s.totalMatches}\nMessages Sent: ${s.messagesSent}\nStatus: ${user.state}\nAccount Created: ${new Date(user.createdAt).toLocaleDateString()}`;
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
};
