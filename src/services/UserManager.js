import { users } from '../data/memory.js';
import { STATE } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class UserManager {
    static getUser(id) {
        return users.get(id);
    }

    static createUser(id) {
        if (!users.has(id)) {
            const user = {
                id: uuidv4(),
                telegram_id: id,
                gender: null,
                genderPreference: null,
                city: null,
                state: STATE.NEW,
                partner: null,
                sessionId: null,
                createdAt: Date.now(),
                lastSeen: Date.now(),
                stats: {
                    totalChats: 0,
                    totalMatches: 0,
                    messagesSent: 0,
                    messagesReceived: 0,
                    skipped: 0,
                    stopped: 0
                },
                rateLimit: {
                    timestamps: []
                },
                lastNext: 0
            };
            users.set(id, user);
            Logger.info(`New user created: ${id}`);
        }
        return users.get(id);
    }

    static updateUserState(id, newState) {
        const user = this.getUser(id);
        if (user) {
            user.state = newState;
        }
    }

    static deleteUser(id) {
        users.delete(id);
        Logger.info(`User deleted: ${id}`);
    }

    static updateLastSeen(id) {
        const user = this.getUser(id);
        if (user) user.lastSeen = Date.now();
    }

    static getUsersCount() {
        return users.size;
    }
}
