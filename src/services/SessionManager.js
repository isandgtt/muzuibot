import { StorageService } from './StorageService.js';
import { activeAnimations } from '../data/memory.js';
import { v4 as uuidv4 } from 'uuid';
import { STATE, SESSION_STATE, END_REASON } from '../utils/constants.js';
import { UserManager } from './UserManager.js';
import { Logger } from '../utils/logger.js';
import { StatsManager } from './StatsManager.js';
import { chattingKeyboard, idleKeyboard } from '../utils/keyboards.js';
import locale from '../locales/id.js';
import config from '../config/config.js';

export class SessionManager {
    /**
     * Creates a new session between two users.
     * Atomic flow: lock → assign → notify.
     */
    static async createSession(bot, partnerA_id, partnerB_id) {
        const userA = await UserManager.getUser(partnerA_id);
        const userB = await UserManager.getUser(partnerB_id);

        if (!userA || !userB) {
            Logger.error(`createSession aborted: missing user data (A:${!!userA} B:${!!userB})`);
            return null;
        }

        const sessionId = uuidv4();

        // --- STEP 1: Create session object with CREATING state ---
        const session = {
            id: sessionId,
            partnerA: partnerA_id,
            partnerB: partnerB_id,
            state: SESSION_STATE.CREATING,
            startedAt: Date.now(),
            lastActivity: Date.now(),
            messagesA: 0,
            messagesB: 0
        };
        await StorageService.setSession(sessionId, session);

        // --- STEP 2: Lock both users (MATCHING) and assign partner/session ---
        userA.state = STATE.MATCHING;
        userA.partner = partnerB_id;
        userA.sessionId = sessionId;
        userA.stats.totalMatches++;
        userA.stats.totalChats++;

        userB.state = STATE.MATCHING;
        userB.partner = partnerA_id;
        userB.sessionId = sessionId;
        userB.stats.totalMatches++;
        userB.stats.totalChats++;

        await UserManager.saveUser(userA);
        await UserManager.saveUser(userB);

        // --- STEP 3: Activate session and unlock users ---
        session.state = SESSION_STATE.ACTIVE;
        await StorageService.setSession(sessionId, session);

        userA.state = STATE.MATCHED;
        userB.state = STATE.MATCHED;
        await UserManager.saveUser(userA);
        await UserManager.saveUser(userB);

        await StatsManager.incrementMatches();
        Logger.match(`Session Created | sessionId=${sessionId} | userA=${partnerA_id} | userB=${partnerB_id}`);

        this.clearAnimation(partnerA_id);
        this.clearAnimation(partnerB_id);

        // --- STEP 4: Notify both users (async, after state is fully set) ---
        try {
            await bot.sendMessage(partnerA_id, locale.partnerFound, { reply_markup: chattingKeyboard });
        } catch (e) {
            Logger.error(`Failed to notify partner A (${partnerA_id})`, e.message);
        }
        try {
            await bot.sendMessage(partnerB_id, locale.partnerFound, { reply_markup: chattingKeyboard });
        } catch (e) {
            Logger.error(`Failed to notify partner B (${partnerB_id})`, e.message);
        }

        return sessionId;
    }

    /**
     * Ends a session.
     */
    static async endSession(bot, userId, reason = END_REASON.STOP) {
        const user = await UserManager.getUser(userId);
        if (!user) return null;

        if (user.state !== STATE.MATCHED) {
            Logger.session(`Ignored endSession for ${userId} — state is ${user.state}, not MATCHED`);
            return null;
        }

        const sessionId = user.sessionId;
        if (!sessionId) {
            Logger.session(`Ignored endSession for ${userId} — no sessionId`);
            return null;
        }

        const session = await StorageService.getSession(sessionId);

        if (!session) {
            Logger.session(`Cleanup cancelled for ${userId} — session ${sessionId} not found (already ended?)`);
            user.state = STATE.IDLE;
            user.partner = null;
            user.sessionId = null;
            await UserManager.saveUser(user);
            return null;
        }

        if (session.state !== SESSION_STATE.ACTIVE) {
            Logger.session(`Ignored cleanup for ${userId} — session ${sessionId} state is ${session.state}`);
            return null;
        }

        session.state = SESSION_STATE.ENDING;
        await StorageService.setSession(sessionId, session);

        const partnerA_id = session.partnerA;
        const partnerB_id = session.partnerB;
        const otherPartnerId = userId === partnerA_id ? partnerB_id : partnerA_id;

        const userA = await UserManager.getUser(partnerA_id);
        const userB = await UserManager.getUser(partnerB_id);

        if (userA) {
            userA.state = STATE.IDLE;
            userA.partner = null;
            userA.sessionId = null;
            if (reason === END_REASON.NEXT && userId === partnerA_id) userA.stats.skipped++;
            else if (reason === END_REASON.STOP && userId === partnerA_id) userA.stats.stopped++;
            await UserManager.saveUser(userA);
        }
        if (userB) {
            userB.state = STATE.IDLE;
            userB.partner = null;
            userB.sessionId = null;
            if (reason === END_REASON.NEXT && userId === partnerB_id) userB.stats.skipped++;
            else if (reason === END_REASON.STOP && userId === partnerB_id) userB.stats.stopped++;
            await UserManager.saveUser(userB);
        }

        session.state = SESSION_STATE.ENDED;
        await StorageService.deleteSession(sessionId);

        Logger.session(`Session Ended | sessionId=${sessionId} | reason=${reason} | initiator=${userId}`);

        if (otherPartnerId && (reason === END_REASON.NEXT || reason === END_REASON.STOP)) {
            try {
                await bot.sendMessage(otherPartnerId, locale.partnerLeft, { reply_markup: idleKeyboard });
            } catch (e) {
                Logger.error(`Failed to notify partner ${otherPartnerId} about disconnect`, e.message);
            }
        }

        return otherPartnerId;
    }

    static async updateActivity(sessionId) {
        const session = await StorageService.getSession(sessionId);
        if (session && session.state === SESSION_STATE.ACTIVE) {
            session.lastActivity = Date.now();
            await StorageService.setSession(sessionId, session);
        }
    }

    static async checkTimeouts(bot) {
        const now = Date.now();
        const allSessions = await StorageService.getAllSessions();
        for (const session of allSessions) {
            if (session.state !== SESSION_STATE.ACTIVE) continue;
            if (now - session.lastActivity > config.sessionTimeoutMs) {
                Logger.session(`Session Timeout | sessionId=${session.id}`);

                session.state = SESSION_STATE.ENDING;
                await StorageService.setSession(session.id, session);

                const uA = await UserManager.getUser(session.partnerA);
                const uB = await UserManager.getUser(session.partnerB);

                if (uA) {
                    uA.state = STATE.IDLE;
                    uA.partner = null;
                    uA.sessionId = null;
                    await UserManager.saveUser(uA);
                }
                if (uB) {
                    uB.state = STATE.IDLE;
                    uB.partner = null;
                    uB.sessionId = null;
                    await UserManager.saveUser(uB);
                }

                session.state = SESSION_STATE.ENDED;
                await StorageService.deleteSession(session.id);

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
