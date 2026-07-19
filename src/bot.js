import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { execute as startCmd } from './commands/start.js';
import { execute as searchCmd } from './commands/search.js';
import { execute as nextCmd } from './commands/next.js';
import { execute as stopCmd } from './commands/stop.js';
import { execute as profileCmd } from './commands/profile.js';
import { handleMessage } from './handlers/messageHandler.js';
import { handleCallbackQuery } from './handlers/callbackHandler.js';

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
    console.warn("BOT_TOKEN is missing in .env file.");
}

// Local development uses polling, Vercel uses webhook
const isWebhook = !!process.env.WEBHOOK_URL;
const bot = new TelegramBot(token, { polling: !isWebhook });

console.log(`Bot initialized with ${isWebhook ? 'Webhook' : 'Polling'} mode...`);

// Register Commands
bot.onText(/^\/start$/, (msg) => startCmd(bot, msg));
bot.onText(/^\/search$/, (msg) => searchCmd(bot, msg));
bot.onText(/^\/next$/, (msg) => nextCmd(bot, msg));
bot.onText(/^\/stop$/, (msg) => stopCmd(bot, msg));
bot.onText(/^\/profile$/, (msg) => profileCmd(bot, msg));

// Register Handlers
bot.on('message', (msg) => handleMessage(bot, msg));
bot.on('callback_query', (query) => handleCallbackQuery(bot, query));

// Error handling to prevent crash
bot.on('polling_error', (error) => {
    console.error("Polling error:", error.code);
});

export default bot;
