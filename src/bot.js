import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { execute as startCmd } from './commands/start.js';
import { execute as searchCmd } from './commands/search.js';
import { execute as nextCmd } from './commands/next.js';
import { execute as stopCmd } from './commands/stop.js';
import { execute as profileCmd } from './commands/profile.js';
import { execute as settingsCmd } from './commands/settings.js';
import { execute as helpCmd } from './commands/help.js';
import { handleMessage } from './handlers/messageHandler.js';
import { handleCallbackQuery } from './handlers/callbackHandler.js';
import { MatchmakingService } from './services/MatchmakingService.js';
import { SessionManager } from './services/SessionManager.js';
import config from './config/config.js';
import { Logger } from './utils/logger.js';

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
    Logger.warn("BOT_TOKEN is missing in .env file.");
}

const isWebhook = config.webhookMode;
const bot = new TelegramBot(token, { polling: !isWebhook });

Logger.info(`Bot initialized with ${isWebhook ? 'Webhook' : 'Polling'} mode...`);

bot.onText(/^\/start$/, (msg) => startCmd(bot, msg));
bot.onText(/^\/search$/, (msg) => searchCmd(bot, msg));
bot.onText(/^\/next$/, (msg) => nextCmd(bot, msg));
bot.onText(/^\/stop$/, (msg) => stopCmd(bot, msg));
bot.onText(/^\/profile$/, (msg) => profileCmd(bot, msg));
bot.onText(/^\/settings$/, (msg) => settingsCmd(bot, msg));
bot.onText(/^\/help$/, (msg) => helpCmd(bot, msg));

bot.on('message', (msg) => handleMessage(bot, msg));
bot.on('callback_query', (query) => handleCallbackQuery(bot, query));

bot.on('polling_error', (error) => {
    Logger.error("Polling error:", error.code);
});

setInterval(() => {
    MatchmakingService.processQueue(bot).catch(err => Logger.error("Matchmaking error", err));
}, config.queueUpdateIntervalMs);

setInterval(() => {
    SessionManager.checkTimeouts(bot).catch(err => Logger.error("Timeout check error", err));
}, 60000);

export default bot;
