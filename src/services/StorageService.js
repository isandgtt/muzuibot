import { MongoClient } from 'mongodb';
import { Logger } from '../utils/logger.js';

let client = null;
let db = null;

async function getDb() {
    const uri = process.env.MONGODB_URI;
    if (!uri) return null;
    if (db) return db;
    try {
        if (!client) {
            client = new MongoClient(uri);
        }
        await client.connect();
        db = client.db('muzuibot');
        
        // Ensure indexes — all IDs stored as Numbers
        await db.collection('users').createIndex({ telegram_id: 1 }, { unique: true });
        await db.collection('queue').createIndex({ userId: 1 }, { unique: true });
        await db.collection('sessions').createIndex({ id: 1 }, { unique: true });
        
        Logger.info('Connected to MongoDB successfully.');
        return db;
    } catch (e) {
        Logger.error('MongoDB connection error:', e.message);
        return null;
    }
}

// In-Memory Fallback Maps (used only if MONGODB_URI is not set)
const memUsers = new Map();
const memQueue = new Map();
const memSessions = new Map();
const memStats = {
    totalMatches: 0,
    messagesExchanged: 0
};

export class StorageService {
    // --- USER METHODS ---
    static async getUser(id) {
        const numId = Number(id);
        const mongoDb = await getDb();
        if (mongoDb) {
            return await mongoDb.collection('users').findOne({ telegram_id: numId });
        } else {
            return memUsers.get(numId) || null;
        }
    }

    static async setUser(id, user) {
        const numId = Number(id);
        const mongoDb = await getDb();
        if (mongoDb) {
            const doc = { ...user };
            delete doc._id;
            doc.telegram_id = numId;
            await mongoDb.collection('users').updateOne(
                { telegram_id: numId },
                { $set: doc },
                { upsert: true }
            );
        } else {
            memUsers.set(numId, user);
        }
    }

    static async deleteUser(id) {
        const numId = Number(id);
        const mongoDb = await getDb();
        if (mongoDb) {
            await mongoDb.collection('users').deleteOne({ telegram_id: numId });
        } else {
            memUsers.delete(numId);
        }
    }

    static async getUsersCount() {
        const mongoDb = await getDb();
        if (mongoDb) {
            return await mongoDb.collection('users').countDocuments({});
        } else {
            return memUsers.size;
        }
    }

    // --- QUEUE METHODS ---
    static async enqueue(userId, queueItem) {
        const numId = Number(userId);
        const mongoDb = await getDb();
        if (mongoDb) {
            const doc = { ...queueItem };
            doc.userId = numId;
            await mongoDb.collection('queue').updateOne(
                { userId: numId },
                { $set: doc },
                { upsert: true }
            );
        } else {
            memQueue.set(numId, queueItem);
        }
    }

    static async dequeue(userId) {
        const numId = Number(userId);
        const mongoDb = await getDb();
        if (mongoDb) {
            const res = await mongoDb.collection('queue').deleteOne({ userId: numId });
            return res.deletedCount > 0;
        } else {
            return memQueue.delete(numId);
        }
    }

    static async isInQueue(userId) {
        const numId = Number(userId);
        const mongoDb = await getDb();
        if (mongoDb) {
            const count = await mongoDb.collection('queue').countDocuments({ userId: numId });
            return count > 0;
        } else {
            return memQueue.has(numId);
        }
    }

    static async getQueueArray() {
        const mongoDb = await getDb();
        if (mongoDb) {
            return await mongoDb.collection('queue').find({}).toArray();
        } else {
            return Array.from(memQueue.values());
        }
    }

    static async getQueueSize() {
        const mongoDb = await getDb();
        if (mongoDb) {
            return await mongoDb.collection('queue').countDocuments({});
        } else {
            return memQueue.size;
        }
    }

    // --- SESSION METHODS ---
    static async getSession(sessionId) {
        const mongoDb = await getDb();
        if (mongoDb) {
            return await mongoDb.collection('sessions').findOne({ id: sessionId });
        } else {
            return memSessions.get(sessionId) || null;
        }
    }

    static async setSession(sessionId, session) {
        const mongoDb = await getDb();
        if (mongoDb) {
            const doc = { ...session };
            delete doc._id;
            await mongoDb.collection('sessions').updateOne(
                { id: sessionId },
                { $set: doc },
                { upsert: true }
            );
        } else {
            memSessions.set(sessionId, session);
        }
    }

    static async deleteSession(sessionId) {
        const mongoDb = await getDb();
        if (mongoDb) {
            await mongoDb.collection('sessions').deleteOne({ id: sessionId });
        } else {
            memSessions.delete(sessionId);
        }
    }

    static async getAllSessions() {
        const mongoDb = await getDb();
        if (mongoDb) {
            return await mongoDb.collection('sessions').find({}).toArray();
        } else {
            return Array.from(memSessions.values());
        }
    }

    // --- STATS METHODS ---
    static async incrementMatches() {
        const mongoDb = await getDb();
        if (mongoDb) {
            await mongoDb.collection('stats').updateOne(
                { _id: 'global' },
                { $inc: { matches: 1 } },
                { upsert: true }
            );
        } else {
            memStats.totalMatches++;
        }
    }

    static async incrementMessages() {
        const mongoDb = await getDb();
        if (mongoDb) {
            await mongoDb.collection('stats').updateOne(
                { _id: 'global' },
                { $inc: { messages: 1 } },
                { upsert: true }
            );
        } else {
            memStats.messagesExchanged++;
        }
    }

    static async getGlobalStats() {
        const mongoDb = await getDb();
        if (mongoDb) {
            const stats = await mongoDb.collection('stats').findOne({ _id: 'global' });
            const totalUsers = await mongoDb.collection('users').countDocuments({});
            return {
                totalUsers: totalUsers || 0,
                totalMatches: stats?.matches || 0,
                messagesExchanged: stats?.messages || 0
            };
        } else {
            return {
                totalUsers: memUsers.size,
                totalMatches: memStats.totalMatches,
                messagesExchanged: memStats.messagesExchanged
            };
        }
    }
}
