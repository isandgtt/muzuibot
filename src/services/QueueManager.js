import { StorageService } from './StorageService.js';
import { STATE } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';
import { UserManager } from './UserManager.js';

export class QueueManager {
    /**
     * Add user to the search queue.
     * Returns false if user is already queued.
     */
    static async enqueue(userId, temporaryPref = null) {
        const numId = Number(userId);
        const user = await UserManager.getUser(numId);
        if (!user) return false;

        const alreadyIn = await this.isInQueue(numId);
        if (alreadyIn) return false;

        // Only block if user is MATCHING or MATCHED.
        // Do NOT block SEARCHING here — the caller (search.js) handles
        // the stale-state recovery for SEARCHING users.
        if (user.state === STATE.MATCHING || user.state === STATE.MATCHED) {
            return false;
        }

        user.state = STATE.SEARCHING;
        await UserManager.saveUser(user);

        const queueItem = {
            userId: numId,
            gender: user.gender,
            genderPreference: temporaryPref || user.genderPreference,
            city: user.city,
            joinedAt: Date.now()
        };

        await StorageService.enqueue(numId, queueItem);
        Logger.queue(`User enqueued: ${numId} (pref: ${temporaryPref || user.genderPreference || 'random'})`);
        return true;
    }

    /**
     * Remove user from queue. Does NOT change user state.
     * Returns true if user was actually removed, false if they weren't in queue.
     */
    static async dequeue(userId) {
        const numId = Number(userId);
        const removed = await StorageService.dequeue(numId);
        if (removed) Logger.queue(`User dequeued: ${numId}`);
        return removed;
    }

    static async isInQueue(userId) {
        return await StorageService.isInQueue(Number(userId));
    }

    static async getQueueArray() {
        return await StorageService.getQueueArray();
    }

    static async getQueueSize() {
        return await StorageService.getQueueSize();
    }
}
