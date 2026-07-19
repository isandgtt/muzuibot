import { UserManager } from '../services/UserManager.js';
import { QueueManager } from '../services/QueueManager.js';
import { MatchmakingService } from '../services/MatchmakingService.js';
import { STATE } from '../utils/constants.js';
import locale from '../locales/id.js';
import config from '../config/config.js';
import { activeAnimations } from '../data/memory.js';
import { searchGenderKeyboard } from '../utils/keyboards.js';

export const execute = async (bot, msg, byGender = false) => {
    const chatId = msg.chat.id;
    const user = await UserManager.getUser(chatId);

    if (!user) return;

    if (byGender) {
        return bot.sendMessage(chatId, "Pilih gender yang ingin kamu cari (hanya untuk sesi ini):", {
            reply_markup: searchGenderKeyboard
        });
    }

    await joinQueue(bot, chatId);
};

export const joinQueue = async (bot, chatId, tempPref = null) => {
    const user = await UserManager.getUser(chatId);
    if (!user) return;

    if (user.state === STATE.MATCHING) {
        return bot.sendMessage(chatId, "⏳ Sedang memproses...");
    }
    if (user.state === STATE.MATCHED) {
        return bot.sendMessage(chatId, "Kamu sedang dalam percakapan. Gunakan ⏭ Next atau 🛑 Stop terlebih dahulu.");
    }

    // FIX BUG 4: Stale SEARCHING state recovery.
    // If user state is SEARCHING but they are NOT actually in the queue
    // (e.g. after bot restart, crash, or Vercel cold start), reset them
    // so they can search again instead of being stuck forever.
    if (user.state === STATE.SEARCHING) {
        const actuallyInQueue = await QueueManager.isInQueue(chatId);
        if (actuallyInQueue) {
            return bot.sendMessage(chatId, locale.alreadyInQueue);
        }
        // State is SEARCHING but not in queue — stale state, reset it
        user.state = STATE.IDLE;
        await UserManager.saveUser(user);
    }

    const success = await QueueManager.enqueue(chatId, tempPref);
    if (!success) {
        return bot.sendMessage(chatId, locale.alreadyInQueue);
    }

    // FIX BUG 3: Call processQueue IMMEDIATELY after enqueue, BEFORE the
    // slow startSearchMessage I/O. This ensures that if both users are
    // already in the queue, they get matched instantly without waiting
    // for the Telegram API sendMessage round-trip.
    await MatchmakingService.processQueue(bot);

    // Only show search animation if user wasn't matched yet
    const updatedUser = await UserManager.getUser(chatId);
    if (updatedUser && updatedUser.state === STATE.SEARCHING) {
        await startSearchMessage(bot, chatId);
    }
};

const startSearchMessage = async (bot, chatId) => {
    try {
        const usersCount = await UserManager.getUsersCount();
        const queueSize = await QueueManager.getQueueSize();
        const text = `${locale.searching}\n\nPeople online: ${usersCount}\nSearching: ${queueSize}\nEstimated wait: < 1 minute`;
        const msg = await bot.sendMessage(chatId, text);

        if (config.webhookMode) return;

        let dots = 1;
        const interval = setInterval(async () => {
            const dotStr = ".".repeat(dots);
            const currentUsersCount = await UserManager.getUsersCount();
            const currentQueueSize = await QueueManager.getQueueSize();
            const updatedText = `🔍 Searching partner${dotStr}\n\nPeople online: ${currentUsersCount}\nSearching: ${currentQueueSize}\nEstimated wait: < 1 minute`;
            bot.editMessageText(updatedText, {
                chat_id: chatId,
                message_id: msg.message_id
            }).catch(() => {});
            dots = (dots % 3) + 1;
        }, config.searchAnimationIntervalMs);

        activeAnimations.set(chatId, { interval, messageId: msg.message_id });
    } catch (e) {}
};
