import { sessions, activeAnimations } from '../data/memory.js';
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
     * Returns sessionId or null on failure.
     */
    static async createSession(bot, partnerA_id, partnerB_id) {
        const userA = UserManager.getUser(partnerA_id);
        const userB = UserManager.getUser(partnerB_id);

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
        sessions.set(sessionId, session);

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

        // --- STEP 3: Activate session and unlock users ---
        session.state = SESSION_STATE.ACTIVE;
        userA.state = STATE.MATCHED;
        userB.state = STATE.MATCHED;

        StatsManager.incrementMatches();
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
     * Ends a session. Only called by explicit user action (Next/Stop) or Timeout.
     * Validates session state and ID before proceeding.
     * @param {string} reason - One of END_REASON values
     */
    static async endSession(bot, userId, reason = END_REASON.STOP) {
        const user = UserManager.getUser(userId);
        if (!user) return null;

        // Must be in MATCHED state
        if (user.state !== STATE.MATCHED) {
            Logger.session(`Ignored endSession for ${userId} — state is ${user.state}, not MATCHED`);
            return null;
        }

        const sessionId = user.sessionId;
        if (!sessionId) {
            Logger.session(`Ignored endSession for ${userId} — no sessionId`);
            return null;
        }

        const session = sessions.get(sessionId);

        // Session must exist and be ACTIVE
        if (!session) {
            Logger.session(`Cleanup cancelled for ${userId} — session ${sessionId} not found (already ended?)`);
            user.state = STATE.IDLE;
            user.partner = null;
            user.sessionId = null;
            return null;
        }

        if (session.state !== SESSION_STATE.ACTIVE) {
            Logger.session(`Ignored cleanup for ${userId} — session ${sessionId} state is ${session.state}`);
            return null;
        }

        // --- Mark session as ENDING to prevent re-entry ---
        session.state = SESSION_STATE.ENDING;

        const partnerA_id = session.partnerA;
        const partnerB_id = session.partnerB;
        const otherPartnerId = userId === partnerA_id ? partnerB_id : partnerA_id;

        const userA = UserManager.getUser(partnerA_id);
        const userB = UserManager.getUser(partnerB_id);

        // Reset both users
        if (userA) {
            userA.state = STATE.IDLE;
            userA.partner = null;
            userA.sessionId = null;
        }
        if (userB) {
            userB.state = STATE.IDLE;
            userB.partner = null;
            userB.sessionId = null;
        }

        // Track stats for initiator
        if (reason === END_REASON.NEXT) {
            if (user) user.stats.skipped++;
        } else if (reason === END_REASON.STOP) {
            if (user) user.stats.stopped++;
        }

        // Mark as ENDED and remove
        session.state = SESSION_STATE.ENDED;
        sessions.delete(sessionId);

        Logger.session(`Session Ended | sessionId=${sessionId} | reason=${reason} | initiator=${userId}`);

        // Notify the OTHER partner ONLY for valid reasons
        if (otherPartnerId && (reason === END_REASON.NEXT || reason === END_REASON.STOP)) {
            try {
                await bot.sendMessage(otherPartnerId, locale.partnerLeft, { reply_markup: idleKeyboard });
            } catch (e) {
                Logger.error(`Failed to notify partner ${otherPartnerId} about disconnect`, e.message);
            }
        }

        return otherPartnerId;
    }

    static updateActivity(sessionId) {
        const session = sessions.get(sessionId);
        if (session && session.state === SESSION_STATE.ACTIVE) {
            session.lastActivity = Date.now();
        }
    }

    /**
     * Check for timed-out sessions. Only ends ACTIVE sessions.
     */
    static async checkTimeouts(bot) {
        const now = Date.now();
        for (const [sessionId, session] of sessions.entries()) {
            if (session.state !== SESSION_STATE.ACTIVE) continue;
            if (now - session.lastActivity > config.sessionTimeoutMs) {
                Logger.session(`Session Timeout | sessionId=${sessionId}`);

                session.state = SESSION_STATE.ENDING;

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

                session.state = SESSION_STATE.ENDED;
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
