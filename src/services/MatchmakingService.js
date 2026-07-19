import { QueueManager } from './QueueManager.js';
import { SessionManager } from './SessionManager.js';
import { Logger } from '../utils/logger.js';

export class MatchmakingService {
    static async processQueue(bot) {
        const queueArr = QueueManager.getQueueArray();
        if (queueArr.length < 2) return;
        
        queueArr.sort((a, b) => a.joinedAt - b.joinedAt);

        const matchedIds = new Set();

        for (let i = 0; i < queueArr.length; i++) {
            const u1 = queueArr[i];
            if (matchedIds.has(u1.userId)) continue;

            let bestMatch = null;
            let highestScore = -1;

            for (let j = i + 1; j < queueArr.length; j++) {
                const u2 = queueArr[j];
                if (matchedIds.has(u2.userId)) continue;

                const score = this.calculateScore(u1, u2);
                
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = u2;
                }
            }

            if (bestMatch && highestScore >= 0) {
                matchedIds.add(u1.userId);
                matchedIds.add(bestMatch.userId);
                
                QueueManager.dequeue(u1.userId);
                QueueManager.dequeue(bestMatch.userId);
                
                Logger.match(`Match found: ${u1.userId} (score: ${highestScore}) ${bestMatch.userId}`);
                await SessionManager.createSession(bot, u1.userId, bestMatch.userId);
            }
        }
    }

    static calculateScore(u1, u2) {
        let score = 0;
        
        const pref1 = u1.genderPreference || 'random';
        const gen1 = u1.gender || 'unknown';
        const pref2 = u2.genderPreference || 'random';
        const gen2 = u2.gender || 'unknown';

        const prefMatch1 = pref1 === 'random' || pref1 === gen2;
        const prefMatch2 = pref2 === 'random' || pref2 === gen1;
        
        if (!prefMatch1 || !prefMatch2) {
            return -1; 
        }

        score += 50;

        const city1 = u1.city || 'unknown';
        const city2 = u2.city || 'unknown';
        if (city1 !== 'unknown' && city1.toLowerCase() === city2.toLowerCase()) {
            score += 30;
        }

        const waitTime1 = (Date.now() - u1.joinedAt) / 1000;
        const waitTime2 = (Date.now() - u2.joinedAt) / 1000;
        const waitPoints = Math.min(10, Math.floor((waitTime1 + waitTime2) / 2));
        score += waitPoints;

        return score;
    }
}
