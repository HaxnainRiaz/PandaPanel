const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const isVercel = Boolean(process.env.VERCEL);

let cached = globalThis.mongoose;
if (!cached) {
    cached = globalThis.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

    if (!uri) {
        console.error('CRITICAL ERROR: MONGODB_URI is missing!');
        throw new Error('Please define the MONGODB_URI environment variable');
    }

    const uriParts = uri.split('?')[0].split('/');
    const dbName = uriParts[uriParts.length - 1];

    if (!dbName || dbName.startsWith('?')) {
        throw new Error('MONGODB_URI must include an explicit database name to prevent data loss or fragmentation.');
    }

    if (mongoose.connection.readyState === 1) {
        cached.conn = mongoose.connection;
        return mongoose.connection;
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: isVercel ? 8000 : 20000,
            socketTimeoutMS: 30000,
            family: 4,
            retryWrites: true,
            retryReads: true,
            maxPoolSize: isVercel ? 1 : 10,
            minPoolSize: isVercel ? 0 : 1,
            connectTimeoutMS: isVercel ? 8000 : 20000,
            maxIdleTimeMS: isVercel ? 10000 : 30000,
            tls: true
        };

        const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
        console.log(`Initializing new MongoDB connection to: ${maskedUri}`);

        cached.promise = mongoose.connect(uri, opts).then(() => {
            console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
            cached.conn = mongoose.connection;
            return mongoose.connection;
        }).catch((err) => {
            cached.promise = null;
            console.error('❌ MongoDB Connection Error:', err.message);
            throw err;
        });
    }

    try {
        await cached.promise;
        cached.conn = mongoose.connection;
    } catch (e) {
        cached.promise = null;
        cached.conn = null;
        throw e;
    }

    return mongoose.connection;
};

module.exports = connectDB;
