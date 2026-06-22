const { dbAll, dbGet, dbRun } = require('../config/db');
const { GraphQLError } = require('graphql');
const axios = require('axios');

const ARTICLES_SERVICE_URL = process.env.ARTICLES_SERVICE_URL || 'http://localhost:5006/graphql';

async function callService(url, query, variables = {}, token = '') {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = token;

        const res = await axios.post(url, { query, variables }, { headers });
        if (res.data.errors) {
            console.error(`GraphQL errors calling ${url}:`, res.data.errors);
            return null;
        }
        return res.data.data;
    } catch (err) {
        console.error(`HTTP error calling ${url}:`, err.message);
        return null;
    }
}

const resolvers = {
    Course: {
        article: async (parent, _, context) => {
            const authHeader = context.reqHeaders?.authorization || '';
            const data = await callService(
                ARTICLES_SERVICE_URL,
                `query GetArticles { articles { id title content course_id is_read created_at } }`,
                {},
                authHeader
            );
            if (data && data.articles) {
                return data.articles.find(a => String(a.course_id) === String(parent.id)) || null;
            }
            return null;
        }
    },
    Query: {
        courses: async () => {
            return await dbAll('SELECT * FROM courses ORDER BY id ASC');
        },
        course: async (_, { id }) => {
            const course = await dbGet('SELECT * FROM courses WHERE id = ?', [id]);
            if (!course) {
                throw new GraphQLError('Course not found', {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            return course;
        }
    },
    Mutation: {
        createCourse: async (_, { title, description, instructor, credits = 3 }) => {
            try {
                const result = await dbRun(
                    'INSERT INTO courses (title, description, instructor, credits) VALUES (?, ?, ?, ?)',
                    [title, description, instructor, credits]
                );
                return await dbGet('SELECT * FROM courses WHERE id = ?', [result.lastID]);
            } catch (err) {
                throw new GraphQLError(err.message);
            }
        },
        updateCourse: async (_, { id, title, description, instructor, credits }) => {
            const check = await dbGet('SELECT id FROM courses WHERE id = ?', [id]);
            if (!check) {
                throw new GraphQLError('Course not found', {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            try {
                await dbRun(
                    'UPDATE courses SET title = ?, description = ?, instructor = ?, credits = ? WHERE id = ?',
                    [title, description, instructor, credits, id]
                );
                return await dbGet('SELECT * FROM courses WHERE id = ?', [id]);
            } catch (err) {
                throw new GraphQLError(err.message);
            }
        },
        deleteCourse: async (_, { id }) => {
            const check = await dbGet('SELECT id FROM courses WHERE id = ?', [id]);
            if (!check) {
                throw new GraphQLError('Course not found', {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            await dbRun('DELETE FROM courses WHERE id = ?', [id]);
            return true;
        }
    }
};

module.exports = resolvers;
