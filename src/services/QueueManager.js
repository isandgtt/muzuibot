import { queue } from '../data/memory.js';
import { STATE } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';
import { UserManager } from './UserManager.js';

export class QueueManager {
    /**
     * Add user to the search queue.
     * Returns false if user is already queued, locked, or in invalid state.
     */
    static enqueue(userId, temporaryPref = null) {
        const user = UserManager.getUser(userId);
        if (!user) return false;

        // Block if already in queue, searching, matching, or chatting
        if (queue.has(userId)) return false;
        if (user.state === STATE.SEARCHING || user.state === STATE.MATCHING || user.state === STATE.MATCHED) {
            return false;
        }

        user.state = STATE.SEARCHING;
        queue.set(userId, {
            userId,
            gender: user.gender,
            genderPreference: temporaryPref || user.genderPreference,
            city: user.city,
            joinedAt: Date.now()
        });
        Logger.queue(`User enqueued: ${userId} (pref: ${temporaryPref || user.genderPreference || 'random'})`);
        return true;
    }

    /**
     * Remove user from queue. Does NOT change user state
     * — that responsibility belongs to the caller (MatchmakingService or stop command).
     */
    static dequeue(userId) {
        const removed = queue.delete(userId);
        if (removed) Logger.queue(`User dequeued: ${userId}`);
        return removed;
    }

    static isInQueue(userId) {
        return queue.has(userId);
    }

    static getQueueArray() {
        return Array.from(queue.values());
    }

    static getQueueSize() {
        return queue.size;
    }
}
