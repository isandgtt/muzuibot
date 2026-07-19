export const execute = async (bot, msg) => {
    const text = `ℹ️ **Help & Commands**\n\n/start - Memulai bot dan setup profil\n/search - Mencari partner chat\n/next - Mencari partner baru\n/stop - Berhenti chat / mencari\n/profile - Melihat profil kamu\n/settings - Pengaturan profil\n\nPrivacy: Kami tidak membagikan ID atau nama kamu kepada partner chat. Chat bersifat sepenuhnya anonim.`;
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
};
