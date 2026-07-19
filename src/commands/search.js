import { UserManager } from '../services/UserManager.js';
import { QueueManager } from '../services/QueueManager.js';
import { SessionManager } from '../services/SessionManager.js';
import { MatchmakingService } from '../services/MatchmakingService.js';
import { STATE, END_REASON } from '../utils/constants.js';
import locale from '../locales/id.js';
import config from '../config/config.js';
import { activeAnimations } from '../data/memory.js';
import { searchGenderKeyboard, idleKeyboard } from '../utils/keyboards.js';

export const execute = async (bot, msg, byGender = false) => {
    const chatId = msg.chat.id;
    const user = UserManager.getUser(chatId);

    if (!user) return;

    if (byGender) {
        return bot.sendMessage(chatId, "Pilih gender yang ingin kamu cari (hanya untuk sesi ini):", {
            reply_markup: searchGenderKeyboard
        });
    }

    await joinQueue(bot, chatId);
};

/**
 * Enqueue user and trigger matchmaking.
 * NEVER calls endSession — that is exclusively for Next/Stop commands.
 */
export const joinQueue = async (bot, chatId, tempPref = null) => {
    const user = UserManager.getUser(chatId);
    if (!user) return;

    // Block if user is locked (being matched), already chatting, or already searching
    if (user.state === STATE.MATCHING) {
        return bot.sendMessage(chatId, "⏳ Sedang memproses...");
    }
    if (user.state === STATE.MATCHED) {
        return bot.sendMessage(chatId, "Kamu sedang dalam percakapan. Gunakan ⏭ Next atau 🛑 Stop terlebih dahulu.");
    }
    if (user.state === STATE.SEARCHING) {
        return bot.sendMessage(chatId, locale.alreadyInQueue);
    }

    const success = QueueManager.enqueue(chatId, tempPref);
    if (!success) {
        return bot.sendMessage(chatId, locale.alreadyInQueue);
    }

    await startSearchMessage(bot, chatId);

    // Trigger matchmaking immediately (important for serverless/Vercel)
    await MatchmakingService.processQueue(bot);
};

const startSearchMessage = async (bot, chatId) => {
    try {
        const text = `${locale.searching}\n\nPeople online: ${UserManager.getUsersCount()}\nSearching: ${QueueManager.getQueueSize()}\nEstimated wait: < 1 minute`;
        const msg = await bot.sendMessage(chatId, text);

        if (config.webhookMode) return;

        let dots = 1;
        const interval = setInterval(() => {
            const dotStr = ".".repeat(dots);
            const updatedText = `🔍 Searching partner${dotStr}\n\nPeople online: ${UserManager.getUsersCount()}\nSearching: ${QueueManager.getQueueSize()}\nEstimated wait: < 1 minute`;
            bot.editMessageText(updatedText, {
                chat_id: chatId,
                message_id: msg.message_id
            }).catch(() => {});
            dots = (dots % 3) + 1;
        }, config.searchAnimationIntervalMs);

        activeAnimations.set(chatId, { interval, messageId: msg.message_id });
    } catch (e) {}
};
