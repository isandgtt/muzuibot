import { sessions, activeAnimations } from '../data/memory.js';
import { v4 as uuidv4 } from 'uuid';
import { STATE } from '../utils/constants.js';
import { UserManager } from './UserManager.js';
import { Logger } from '../utils/logger.js';
import { StatsManager } from './StatsManager.js';
import { chattingKeyboard, idleKeyboard } from '../utils/keyboards.js';
import locale from '../locales/id.js';
import config from '../config/config.js';

export class SessionManager {
    static async createSession(bot, partnerA_id, partnerB_id) {
        const sessionId = uuidv4();
        
        const userA = UserManager.getUser(partnerA_id);
        const userB = UserManager.getUser(partnerB_id);
        
        if (!userA || !userB) return null;

        const session = {
            id: sessionId,
            partnerA: partnerA_id,
            partnerB: partnerB_id,
            startedAt: Date.now(),
            lastActivity: Date.now(),
            messagesA: 0,
            messagesB: 0
        };
        
        sessions.set(sessionId, session);
        
        userA.state = STATE.MATCHED;
        userA.partner = partnerB_id;
        userA.sessionId = sessionId;
        userA.stats.totalMatches++;
        userA.stats.totalChats++;
        
        userB.state = STATE.MATCHED;
        userB.partner = partnerA_id;
        userB.sessionId = sessionId;
        userB.stats.totalMatches++;
        userB.stats.totalChats++;
        
        StatsManager.incrementMatches();
        Logger.session(`Session Created: ${sessionId}`);

        this.clearAnimation(partnerA_id);
        this.clearAnimation(partnerB_id);

        try {
            await bot.sendMessage(partnerA_id, locale.partnerFound, { reply_markup: chattingKeyboard });
            await bot.sendMessage(partnerB_id, locale.partnerFound, { reply_markup: chattingKeyboard });
        } catch (e) {
            Logger.error("Failed to notify users about match", e.message);
        }

        return sessionId;
    }

    static async endSession(bot, userId, skipped = false) {
        const user = UserManager.getUser(userId);
        if (!user || user.state !== STATE.MATCHED || !user.sessionId) return null;
        
        const sessionId = user.sessionId;
        const session = sessions.get(sessionId);
        
        if (session) {
            const partnerA_id = session.partnerA;
            const partnerB_id = session.partnerB;
            
            const userA = UserManager.getUser(partnerA_id);
            const userB = UserManager.getUser(partnerB_id);
            
            if (userA) {
                userA.state = STATE.IDLE;
                userA.partner = null;
                userA.sessionId = null;
                if (skipped && userId === partnerA_id) userA.stats.skipped++;
                else if (userId === partnerA_id) userA.stats.stopped++;
            }
            
            if (userB) {
                userB.state = STATE.IDLE;
                userB.partner = null;
                userB.sessionId = null;
                if (skipped && userId === partnerB_id) userB.stats.skipped++;
                else if (userId === partnerB_id) userB.stats.stopped++;
            }
            
            sessions.delete(sessionId);
            Logger.session(`Session Ended: ${sessionId}`);
            
            const otherPartnerId = userId === partnerA_id ? partnerB_id : partnerA_id;

            if (otherPartnerId) {
                try {
                    await bot.sendMessage(otherPartnerId, locale.partnerLeft, { reply_markup: idleKeyboard });
                } catch (e) { }
            }
            
            return otherPartnerId;
        }
        return null;
    }

    static updateActivity(sessionId) {
        const session = sessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
        }
    }

    static async checkTimeouts(bot) {
        const now = Date.now();
        for (const [sessionId, session] of sessions.entries()) {
            if (now - session.lastActivity > config.sessionTimeoutMs) {
                Logger.session(`Session Timeout: ${sessionId}`);
                
                const uA = UserManager.getUser(session.partnerA);
                const uB = UserManager.getUser(session.partnerB);
                
                if (uA) {
                    uA.state = STATE.IDLE;
                    uA.partner = null;
                    uA.sessionId = null;
                }
                if (uB) {
                    uB.state = STATE.IDLE;
                    uB.partner = null;
                    uB.sessionId = null;
                }
                sessions.delete(sessionId);
                
                try {
                    await bot.sendMessage(session.partnerA, locale.sessionTimeout, { reply_markup: idleKeyboard });
                } catch (e) { }
                try {
                    await bot.sendMessage(session.partnerB, locale.sessionTimeout, { reply_markup: idleKeyboard });
                } catch (e) { }
            }
        }
    }

    static clearAnimation(userId) {
        if (activeAnimations.has(userId)) {
            const data = activeAnimations.get(userId);
            clearInterval(data.interval);
            activeAnimations.delete(userId);
        }
    }
}
