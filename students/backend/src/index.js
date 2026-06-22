const express = require('express');
const cors = require('cors');
const path = require('path');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { initDb } = require('./config/db');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'edubrain_super_secret_2026';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static client assets
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

const PORT = process.env.STUDENT_PORT || 5002;

// Context function for Authentication
const context = async ({ req }) => {
    const header = req.headers.authorization;
    if (!header) return { user: null };

    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    try {
        const user = jwt.verify(token, SECRET);
        return { user };
    } catch (err) {
        return { user: null };
    }
};

async function startServer() {
    // 1. Initialize SQLite Database Tables and Seeds
    try {
        await initDb();
        console.log('👨‍🎓 Students Database initialized successfully.');
    } catch (dbErr) {
        console.error('❌ Failed to initialize Students Database:', dbErr);
    }

    // 2. Start Apollo Server
    const server = new ApolloServer({
        typeDefs,
        resolvers
    });
    await server.start();

    // 3. Mount GraphQL API
    app.use('/graphql', expressMiddleware(server, { context }));

    // 4. Start listening
    app.listen(PORT, () => {
        console.log(`👨‍🎓 Student Service running on http://localhost:${PORT}`);
        console.log(`📡 GraphQL API available at http://localhost:${PORT}/graphql`);
    });
}

startServer();
