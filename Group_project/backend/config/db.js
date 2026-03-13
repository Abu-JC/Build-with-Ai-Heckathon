const { Pool } = require('pg');
const mongoose = require('mongoose');
require('dotenv').config();

const pgPool = new Pool({ connectionString: process.env.POSTGRES_URI });

const connectDBs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected (IoT & AI Data)');

        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ PostgreSQL Connected (User Accounts)');
    } catch (err) {
        console.error('❌ Database Connection Error:', err);
        process.exit(1);
    }
};

module.exports = { connectDBs, pgPool };