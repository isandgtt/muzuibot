import { UserManager } from '../services/UserManager.js';
import { STATE } from '../utils/constants.js';
import { inlinePrefKeyboard, idleKeyboard, deleteConfirmKeyboard, inlineGenderKeyboard } from '../utils/keyboards.js';
import locale from '../locales/id.js';
import { joinQueue } from '../commands/search.js';

export const handleCallbackQuery = async (bot, query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const messageId = query.message.message_id;
    
    const user = await UserManager.getUser(chatId);
    if (!user) {
        return bot.answerCallbackQuery(query.id, { text: "Session expired. Gunakan /start" });
    }
    
    try {
        if (data.startsWith('gender_')) {
            const gender = data.replace('gender_', ''); 
            user.gender = gender;
            await UserManager.saveUser(user);
            await bot.editMessageText(locale.chooseGenderPref, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: inlinePrefKeyboard
            });
            await bot.answerCallbackQuery(query.id);
        } else if (data.startsWith('pref_')) {
            const pref = data.replace('pref_', ''); 
            user.genderPreference = pref;
            await UserManager.saveUser(user);
            
            if (user.state === STATE.PROFILE_SETUP) {
                await bot.editMessageText(locale.askCity, {
                    chat_id: chatId,
                    message_id: messageId
                });
            } else {
                await bot.editMessageText("Preference updated.", { chat_id: chatId, message_id: messageId });
            }
            await bot.answerCallbackQuery(query.id);
        } else if (data.startsWith('search_')) {
            const tempPref = data.replace('search_', '');
            await bot.editMessageText("Mencari dengan preference spesifik...", { chat_id: chatId, message_id: messageId });
            await joinQueue(bot, chatId, tempPref);
            await bot.answerCallbackQuery(query.id);
        } else if (data === 'del_yes') {
            await UserManager.deleteUser(chatId);
            await bot.editMessageText("Profil kamu telah dihapus. Ketik /start untuk membuat ulang.", { chat_id: chatId, message_id: messageId });
            await bot.answerCallbackQuery(query.id);
        } else if (data === 'del_no') {
            await bot.editMessageText("Penghapusan dibatalkan.", { chat_id: chatId, message_id: messageId });
            await bot.answerCallbackQuery(query.id);
        } else if (data === 'set_gender') {
            await bot.editMessageText("Pilih Gender baru:", { chat_id: chatId, message_id: messageId, reply_markup: inlineGenderKeyboard });
            await bot.answerCallbackQuery(query.id);
        } else if (data === 'set_pref') {
            await bot.editMessageText("Pilih Preference baru:", { chat_id: chatId, message_id: messageId, reply_markup: inlinePrefKeyboard });
            await bot.answerCallbackQuery(query.id);
        } else if (data === 'set_city') {
            user.state = STATE.PROFILE_SETUP;
            user.city = null;
            await UserManager.saveUser(user);
            await bot.editMessageText(locale.askCity, { chat_id: chatId, message_id: messageId });
            await bot.answerCallbackQuery(query.id);
        } else if (data === 'set_delete') {
            await bot.editMessageText(locale.deleteConfirm, { chat_id: chatId, message_id: messageId, reply_markup: deleteConfirmKeyboard });
            await bot.answerCallbackQuery(query.id);
        } else if (data === 'set_back') {
            await bot.editMessageText("Pengaturan ditutup.", { chat_id: chatId, message_id: messageId });
            await bot.answerCallbackQuery(query.id);
        }
    } catch (error) {
        console.error("Error handling callback:", error);
    }
};
