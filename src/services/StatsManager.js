import { globalStats } from '../data/memory.js';

export class StatsManager {
    static incrementMatches() {
        globalStats.totalMatches++;
    }
    
    static incrementMessages() {
        globalStats.messagesExchanged++;
    }
    
    static recordMessage(userA, userB) {
        if (userA) userA.stats.messagesSent++;
        if (userB) userB.stats.messagesReceived++;
        this.incrementMessages();
    }
}
