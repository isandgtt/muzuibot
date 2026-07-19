import { StorageService } from './StorageService.js';
import { STATE } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class UserManager {
    static async getUser(id) {
        return await StorageService.getUser(id);
    }

    static async createUser(id) {
        let user = await this.getUser(id);
        if (!user) {
            user = {
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
            await StorageService.setUser(id, user);
            Logger.info(`New user created: ${id}`);
        }
        return user;
    }

    static async updateUserState(id, newState) {
        const user = await this.getUser(id);
        if (user) {
            user.state = newState;
            await StorageService.setUser(id, user);
        }
    }

    static async deleteUser(id) {
        await StorageService.deleteUser(id);
        Logger.info(`User deleted: ${id}`);
    }

    static async updateLastSeen(id) {
        const user = await this.getUser(id);
        if (user) {
            user.lastSeen = Date.now();
            await StorageService.setUser(id, user);
        }
    }

    static async getUsersCount() {
        return await StorageService.getUsersCount();
    }

    static async saveUser(user) {
        if (user && user.telegram_id) {
            await StorageService.setUser(user.telegram_id, user);
        }
    }
}
