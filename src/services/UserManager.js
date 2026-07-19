import { StorageService } from './StorageService.js';
import { STATE } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class UserManager {
    static async getUser(id) {
        return await StorageService.getUser(id);
    }

    static async createUser(id) {
        const numId = Number(id);
        let user = await this.getUser(numId);
        if (!user) {
            user = {
                id: uuidv4(),
                telegram_id: numId,
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
            await StorageService.setUser(numId, user);
            Logger.info(`New user created: ${numId}`);
        }
        return user;
    }

    static async updateUserState(id, newState) {
        const numId = Number(id);
        const user = await this.getUser(numId);
        if (user) {
            user.state = newState;
            await StorageService.setUser(numId, user);
        }
    }

    static async deleteUser(id) {
        const numId = Number(id);
        await StorageService.deleteUser(numId);
        Logger.info(`User deleted: ${numId}`);
    }

    static async updateLastSeen(id) {
        const numId = Number(id);
        const user = await this.getUser(numId);
        if (user) {
            user.lastSeen = Date.now();
            await StorageService.setUser(numId, user);
        }
    }

    static async getUsersCount() {
        return await StorageService.getUsersCount();
    }

    static async saveUser(user) {
        if (user && user.telegram_id != null) {
            await StorageService.setUser(Number(user.telegram_id), user);
        }
    }
}
