import { queue } from '../data/memory.js';
import { STATE } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';
import { UserManager } from './UserManager.js';

export class QueueManager {
    static enqueue(userId, temporaryPref = null) {
        const user = UserManager.getUser(userId);
        if (!user) return false;
        
        if (queue.has(userId) || user.state === STATE.SEARCHING) {
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
        Logger.queue(`User enqueued: ${userId} with pref: ${temporaryPref || user.genderPreference}`);
        return true;
    }

    static dequeue(userId) {
        const user = UserManager.getUser(userId);
        if (user && user.state === STATE.SEARCHING) {
            user.state = STATE.IDLE;
        }
        const removed = queue.delete(userId);
        if (removed) Logger.queue(`User dequeued: ${userId}`);
        return removed;
    }

    static getQueueArray() {
        return Array.from(queue.values());
    }

    static getQueueSize() {
        return queue.size;
    }
}
