const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());

// Environment targets
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const STUDENTS_URL = process.env.STUDENTS_SERVICE_URL || 'http://localhost:5002';
const COURSES_URL = process.env.COURSES_SERVICE_URL || 'http://localhost:5003';
const ENROLLMENTS_URL = process.env.ENROLLMENTS_SERVICE_URL || 'http://localhost:5004';
const ATTENDANCE_URL = process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:5005';
const ARTICLES_URL = process.env.ARTICLES_SERVICE_URL || 'http://localhost:5006';

// Health status API for microservices
app.get('/api/status', async (req, res) => {
    const services = {
        auth:        `${AUTH_URL}/graphql`,
        students:    `${STUDENTS_URL}/graphql`,
        courses:     `${COURSES_URL}/graphql`,
        enrollments: `${ENROLLMENTS_URL}/graphql`,
        attendance:  `${ATTENDANCE_URL}/graphql`,
        articles:    `${ARTICLES_URL}/graphql`,
    };
    
    const statuses = {};
    for (const [name, url] of Object.entries(services)) {
        try {
            // Send a light schema introspection query to verify GraphQL status
            await axios.post(url, { 
                query: 'query { __schema { queryType { name } } }' 
            }, { 
                timeout: 800 
            });
            statuses[name] = 'ONLINE';
        } catch (err) {
            statuses[name] = 'OFFLINE';
        }
    }
    res.json({ success: true, statuses });
});

// Proxy Rules mapping paths to their respective microservices
app.use('/auth',        createProxyMiddleware({ target: AUTH_URL, changeOrigin: true }));
app.use('/students',    createProxyMiddleware({ target: STUDENTS_URL, changeOrigin: true }));
app.use('/courses',     createProxyMiddleware({ target: COURSES_URL, changeOrigin: true }));
app.use('/enrollments', createProxyMiddleware({ target: ENROLLMENTS_URL, changeOrigin: true }));
app.use('/attendance',  createProxyMiddleware({ target: ATTENDANCE_URL, changeOrigin: true }));
app.use('/articles',    createProxyMiddleware({ target: ARTICLES_URL, changeOrigin: true }));

// Serve static gateway portal files
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
    console.log(`📡 Serving portal dashboard from public/`);
});
