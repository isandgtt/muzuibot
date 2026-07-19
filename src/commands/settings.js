import { UserManager } from '../services/UserManager.js';
import { settingsKeyboard } from '../utils/keyboards.js';

export const execute = async (bot, msg) => {
    const chatId = msg.chat.id;
    const user = UserManager.getUser(chatId);
    
    if (!user) return bot.sendMessage(chatId, "Gunakan /start terlebih dahulu.");
    
    bot.sendMessage(chatId, "⚙️ **Settings**\nPilih menu yang ingin kamu ubah:", {
        parse_mode: 'Markdown',
        reply_markup: settingsKeyboard
    });
};
