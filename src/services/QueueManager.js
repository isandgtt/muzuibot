import { StorageService } from './StorageService.js';
import { STATE } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';
import { UserManager } from './UserManager.js';

export class QueueManager {
    /**
     * Add user to the search queue.
     * Returns false if user is already queued, locked, or in invalid state.
     */
    static async enqueue(userId, temporaryPref = null) {
        const user = await UserManager.getUser(userId);
        if (!user) return false;

        const alreadyIn = await this.isInQueue(userId);
        if (alreadyIn) return false;
        
        if (user.state === STATE.SEARCHING || user.state === STATE.MATCHING || user.state === STATE.MATCHED) {
            return false;
        }

        user.state = STATE.SEARCHING;
        await UserManager.saveUser(user);

        const queueItem = {
            userId,
            gender: user.gender,
            genderPreference: temporaryPref || user.genderPreference,
            city: user.city,
            joinedAt: Date.now()
        };

        await StorageService.enqueue(userId, queueItem);
        Logger.queue(`User enqueued: ${userId} (pref: ${temporaryPref || user.genderPreference || 'random'})`);
        return true;
    }

    /**
     * Remove user from queue. Does NOT change user state
     */
    static async dequeue(userId) {
        const removed = await StorageService.dequeue(userId);
        if (removed) Logger.queue(`User dequeued: ${userId}`);
        return removed;
    }

    static async isInQueue(userId) {
        return await StorageService.isInQueue(userId);
    }

    static async getQueueArray() {
        return await StorageService.getQueueArray();
    }

    static async getQueueSize() {
        return await StorageService.getQueueSize();
    }
}
