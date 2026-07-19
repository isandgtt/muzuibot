import { QueueManager } from './QueueManager.js';
import { SessionManager } from './SessionManager.js';
import { UserManager } from './UserManager.js';
import { STATE } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';

// Prevents concurrent processQueue from running
let isProcessing = false;

export class MatchmakingService {
    /**
     * Process the queue and match users.
     * Uses a lock flag to prevent concurrent execution and race conditions.
     */
    static async processQueue(bot) {
        if (isProcessing) return;
        isProcessing = true;

        try {
            const queueArr = QueueManager.getQueueArray();
            if (queueArr.length < 2) return;

            queueArr.sort((a, b) => a.joinedAt - b.joinedAt);

            const matchedIds = new Set();

            for (let i = 0; i < queueArr.length; i++) {
                const u1 = queueArr[i];
                if (matchedIds.has(u1.userId)) continue;

                // Verify user is still valid and in queue
                const user1 = UserManager.getUser(u1.userId);
                if (!user1 || user1.state !== STATE.SEARCHING || !QueueManager.isInQueue(u1.userId)) continue;

                let bestMatch = null;
                let highestScore = -1;

                for (let j = i + 1; j < queueArr.length; j++) {
                    const u2 = queueArr[j];
                    if (matchedIds.has(u2.userId)) continue;

                    const user2 = UserManager.getUser(u2.userId);
                    if (!user2 || user2.state !== STATE.SEARCHING || !QueueManager.isInQueue(u2.userId)) continue;

                    const score = this.calculateScore(u1, u2);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = u2;
                    }
                }

                if (bestMatch && highestScore >= 0) {
                    matchedIds.add(u1.userId);
                    matchedIds.add(bestMatch.userId);

                    // Atomic sequence: dequeue → create session
                    // dequeue no longer changes user state
                    QueueManager.dequeue(u1.userId);
                    QueueManager.dequeue(bestMatch.userId);

                    Logger.match(`Match found: ${u1.userId} <-> ${bestMatch.userId} (score: ${highestScore})`);

                    // createSession sets state MATCHING → MATCHED atomically
                    await SessionManager.createSession(bot, u1.userId, bestMatch.userId);
                }
            }
        } finally {
            isProcessing = false;
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

        if (!prefMatch1 || !prefMatch2) return -1;

        score += 50;

        const city1 = u1.city || '';
        const city2 = u2.city || '';
        if (city1 && city2 && city1.toLowerCase() === city2.toLowerCase()) {
            score += 30;
        }

        const avgWait = ((Date.now() - u1.joinedAt) + (Date.now() - u2.joinedAt)) / 2000;
        score += Math.min(10, Math.floor(avgWait));

        return score;
    }
}
