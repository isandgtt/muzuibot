import locale from '../locales/id.js';

export const execute = async (bot, msg) => {
    bot.sendMessage(msg.chat.id, locale.rules, { parse_mode: 'Markdown' });
};
