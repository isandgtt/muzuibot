import { QueueManager } from './QueueManager.js';
import { SessionManager } from './SessionManager.js';
import { UserManager } from './UserManager.js';
import { STATE } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';

export class MatchmakingService {
    /**
     * Process the queue and match users.
     * 
     * NO global lock — the lock was causing the "search 2x" bug because:
     * When User A calls processQueue (finds only itself), User B joins and also
     * calls processQueue but gets blocked by isProcessing = true.
     * 
     * Instead, we rely on atomic dequeue (MongoDB deleteOne) to prevent
     * double-matching. If two processQueue calls run concurrently, the first
     * one to dequeue a user wins; the second sees the user is gone.
     */
    static async processQueue(bot) {
        try {
            const queueArr = await QueueManager.getQueueArray();
            if (queueArr.length < 2) return;

            queueArr.sort((a, b) => a.joinedAt - b.joinedAt);

            const matchedIds = new Set();

            for (let i = 0; i < queueArr.length; i++) {
                const u1 = queueArr[i];
                const u1Id = Number(u1.userId);
                if (matchedIds.has(u1Id)) continue;

                // Verify user is still valid and in queue
                const user1 = await UserManager.getUser(u1Id);
                if (!user1 || user1.state !== STATE.SEARCHING) continue;

                let bestMatch = null;
                let highestScore = -1;

                for (let j = i + 1; j < queueArr.length; j++) {
                    const u2 = queueArr[j];
                    const u2Id = Number(u2.userId);
                    if (matchedIds.has(u2Id)) continue;

                    const user2 = await UserManager.getUser(u2Id);
                    if (!user2 || user2.state !== STATE.SEARCHING) continue;

                    const score = this.calculateScore(u1, u2);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = u2;
                    }
                }

                if (bestMatch && highestScore >= 0) {
                    const bestMatchId = Number(bestMatch.userId);

                    // Atomic dequeue — if another concurrent processQueue already
                    // took this user, dequeue returns false and we skip.
                    const removedA = await QueueManager.dequeue(u1Id);
                    const removedB = await QueueManager.dequeue(bestMatchId);

                    if (!removedA || !removedB) {
                        // One or both were already dequeued by a concurrent process.
                        // Re-enqueue the one that was successfully dequeued (if any)
                        // so they don't get lost.
                        if (removedA && !removedB) {
                            Logger.match(`Conflict: re-enqueuing ${u1Id} (partner ${bestMatchId} already taken)`);
                            await QueueManager.enqueue(u1Id);
                        }
                        if (removedB && !removedA) {
                            Logger.match(`Conflict: re-enqueuing ${bestMatchId} (partner ${u1Id} already taken)`);
                            await QueueManager.enqueue(bestMatchId);
                        }
                        continue;
                    }

                    matchedIds.add(u1Id);
                    matchedIds.add(bestMatchId);

                    Logger.match(`Match found: ${u1Id} <-> ${bestMatchId} (score: ${highestScore})`);

                    await SessionManager.createSession(bot, u1Id, bestMatchId);
                }
            }
        } catch (err) {
            Logger.error('processQueue error:', err.message);
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
