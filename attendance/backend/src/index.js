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

app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

const PORT = process.env.ATTENDANCE_PORT || 5005;

// Auth Context with forwarded headers
const context = async ({ req }) => {
    const header = req.headers.authorization;
    let user = null;
    if (header) {
        const token = header.startsWith('Bearer ') ? header.slice(7) : header;
        try {
            user = jwt.verify(token, SECRET);
        } catch (err) {}
    }
    return { user, reqHeaders: req.headers };
};

async function startServer() {
    try {
        await initDb();
        console.log('⏰ Attendance Database initialized successfully.');
    } catch (dbErr) {
        console.error('❌ Failed to initialize Attendance Database:', dbErr);
    }

    const server = new ApolloServer({
        typeDefs,
        resolvers
    });
    await server.start();

    app.use('/graphql', expressMiddleware(server, { context }));

    app.listen(PORT, () => {
        console.log("⏰ Attendance Service running on http://localhost:" + PORT);
        console.log("📡 GraphQL API available at http://localhost:" + PORT + "/graphql");
    });
}

startServer();
