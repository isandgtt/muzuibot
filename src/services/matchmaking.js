import { getQueue, removeFromQueue } from './queue.js';
import { createSession } from './session.js';

export const findMatch = (userId) => {
    const queue = getQueue();
    const currentUser = queue.find(q => q.userId === userId);
    if (!currentUser) return null;
    
    const isMatch = (u1, u2) => {
        const prefMatch1 = u1.genderPreference === 'random' || u1.genderPreference === u2.gender;
        const prefMatch2 = u2.genderPreference === 'random' || u2.genderPreference === u1.gender;
        return prefMatch1 && prefMatch2;
    };

    // Prioritas 1: Gender Preference cocok & Kota sama
    let partner = queue.find(u => u.userId !== userId && isMatch(currentUser, u) && u.city.toLowerCase() === currentUser.city.toLowerCase());
    
    // Prioritas 2: Jika tidak ada kota sama, cari kota lain asalkan preference cocok
    if (!partner) {
        partner = queue.find(u => u.userId !== userId && isMatch(currentUser, u));
    }
    
    if (partner) {
        removeFromQueue(userId);
        removeFromQueue(partner.userId);
        createSession(userId, partner.userId);
        console.log(`Partner Found: ${userId} & ${partner.userId}`);
        return partner.userId;
    }
    
    return null;
};
