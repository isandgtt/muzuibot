import { StorageService } from './StorageService.js';

export class StatsManager {
    static async incrementMatches() {
        await StorageService.incrementMatches();
    }
    
    static async incrementMessages() {
        await StorageService.incrementMessages();
    }
    
    static async recordMessage(userA, userB) {
        if (userA) {
            userA.stats.messagesSent++;
            await StorageService.setUser(userA.telegram_id, userA);
        }
        if (userB) {
            userB.stats.messagesReceived++;
            await StorageService.setUser(userB.telegram_id, userB);
        }
        await this.incrementMessages();
    }

    static async getGlobalStats() {
        return await StorageService.getGlobalStats();
    }
}
