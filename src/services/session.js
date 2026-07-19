import { sessions, users } from '../data/memory.js';
import { v4 as uuidv4 } from 'uuid';
import { USER_STATUS } from '../utils/constants.js';

export const createSession = (partnerA_id, partnerB_id) => {
    const sessionId = uuidv4();
    sessions.set(sessionId, {
        id: sessionId,
        partnerA: partnerA_id,
        partnerB: partnerB_id,
        startedAt: Date.now()
    });
    
    const userA = users.get(partnerA_id);
    const userB = users.get(partnerB_id);
    
    if (userA) {
        userA.status = USER_STATUS.CHATTING;
        userA.partner = partnerB_id;
        userA.sessionId = sessionId;
    }
    
    if (userB) {
        userB.status = USER_STATUS.CHATTING;
        userB.partner = partnerA_id;
        userB.sessionId = sessionId;
    }
    
    console.log(`Session Created: ${sessionId} between ${partnerA_id} and ${partnerB_id}`);
    return sessionId;
};

export const endSession = (userId) => {
    const user = users.get(userId);
    if (!user || user.status !== USER_STATUS.CHATTING || !user.sessionId) return null;
    
    const sessionId = user.sessionId;
    const session = sessions.get(sessionId);
    
    if (session) {
        const partnerA_id = session.partnerA;
        const partnerB_id = session.partnerB;
        
        const userA = users.get(partnerA_id);
        const userB = users.get(partnerB_id);
        
        if (userA) {
            userA.status = USER_STATUS.IDLE;
            userA.partner = null;
            userA.sessionId = null;
        }
        
        if (userB) {
            userB.status = USER_STATUS.IDLE;
            userB.partner = null;
            userB.sessionId = null;
        }
        
        sessions.delete(sessionId);
        console.log(`Session Ended: ${sessionId}`);
        
        return userId === partnerA_id ? partnerB_id : partnerA_id;
    }
    return null;
};
