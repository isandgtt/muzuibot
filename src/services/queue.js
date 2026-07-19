import { searchQueue, users } from '../data/memory.js';
import { USER_STATUS } from '../utils/constants.js';

export const addToQueue = (userId) => {
    const user = users.get(userId);
    if (!user) return;
    
    user.status = USER_STATUS.SEARCHING;
    searchQueue.set(userId, {
        userId,
        gender: user.gender,
        genderPreference: user.genderPreference,
        city: user.city,
        joinedAt: Date.now()
    });
    console.log(`User Searching: ${userId}`);
};

export const removeFromQueue = (userId) => {
    searchQueue.delete(userId);
    const user = users.get(userId);
    if (user && user.status === USER_STATUS.SEARCHING) {
        user.status = USER_STATUS.IDLE;
    }
};

export const getQueue = () => {
    return Array.from(searchQueue.values());
};
