const axios = require('axios');
const { dbAll, dbGet, dbRun } = require('../config/db');
const { GraphQLError } = require('graphql');

// Environment Service URLs
const STUDENTS_SERVICE_URL = process.env.STUDENTS_SERVICE_URL || 'http://localhost:5002/graphql';
const COURSES_SERVICE_URL = process.env.COURSES_SERVICE_URL || 'http://localhost:5003/graphql';
const ARTICLES_SERVICE_URL = process.env.ARTICLES_SERVICE_URL || 'http://localhost:5006/graphql';

// GraphQL service caller helper
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
    Attendance: {
        student: async (parent, _, context) => {
            const authHeader = context.reqHeaders?.authorization || '';
            const data = await callService(
                STUDENTS_SERVICE_URL,
                `query GetStudent($id: ID!) { student(id: $id) { id name email } }`,
                { id: parent.student_id },
                authHeader
            );
            return data ? data.student : null;
        },
        course: async (parent, _, context) => {
            const authHeader = context.reqHeaders?.authorization || '';
            const data = await callService(
                COURSES_SERVICE_URL,
                `query GetCourse($id: ID!) { course(id: $id) { id title instructor } }`,
                { id: parent.course_id },
                authHeader
            );
            return data ? data.course : null;
        }
    },
    Query: {
        attendanceLogs: async () => {
            return await dbAll('SELECT * FROM attendance ORDER BY date DESC, created_at DESC');
        },
        studentAttendance: async (_, { student_id }) => {
            return await dbAll('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC, created_at DESC', [student_id]);
        }
    },
    Mutation: {
        markAttendance: async (_, { student_id, course_id, date, status = 'present', notes }, context) => {
            const authHeader = context.reqHeaders?.authorization || '';

            // 1. Prevent duplicate attendance on the same date for the student
            const existing = await dbGet(
                'SELECT id FROM attendance WHERE student_id = ? AND course_id = ? AND date = ?',
                [student_id, course_id, date]
            );
            if (existing) {
                throw new GraphQLError('Attendance already recorded for this course on this date', { extensions: { code: 'CONFLICT' } });
            }

            // 2. Student Role gate checking: Query Articles Service
            if (context.user && context.user.role === 'student') {
                const checkedId = context.user.student_id || student_id;
                
                const artQuery = `
                    query VerifyAttendance($courseId: ID!, $studentId: ID!) {
                        canAttend(courseId: $courseId, studentId: $studentId) {
                            can_attend
                            message
                        }
                    }
                `;
                const artData = await callService(
                    ARTICLES_SERVICE_URL,
                    artQuery,
                    { courseId: course_id, studentId: checkedId },
                    authHeader
                );

                if (!artData || !artData.canAttend.can_attend) {
                    const msg = artData ? artData.canAttend.message : 'Prerequisite article reading checks failed in Articles Service';
                    throw new GraphQLError(msg, { extensions: { code: 'FORBIDDEN' } });
                }
            }

            try {
                const result = await dbRun(
                    'INSERT INTO attendance (student_id, course_id, date, status, notes) VALUES (?, ?, ?, ?, ?)',
                    [student_id, course_id, date, status, notes]
                );
                return await dbGet('SELECT * FROM attendance WHERE id = ?', [result.lastID]);
            } catch (err) {
                throw new GraphQLError(err.message);
            }
        },
        updateAttendanceStatus: async (_, { id, status, notes }, context) => {
            if (!context.user || context.user.role !== 'admin') {
                throw new GraphQLError('Admin authorization required', { extensions: { code: 'FORBIDDEN' } });
            }
            const check = await dbGet('SELECT id FROM attendance WHERE id = ?', [id]);
            if (!check) {
                throw new GraphQLError('Attendance record not found', { extensions: { code: 'NOT_FOUND' } });
            }

            await dbRun(
                'UPDATE attendance SET status = ?, notes = ? WHERE id = ?',
                [status, notes, id]
            );
            return await dbGet('SELECT * FROM attendance WHERE id = ?', [id]);
        },
        deleteAttendance: async (_, { id }, context) => {
            if (!context.user || context.user.role !== 'admin') {
                throw new GraphQLError('Admin authorization required', { extensions: { code: 'FORBIDDEN' } });
            }
            const check = await dbGet('SELECT id FROM attendance WHERE id = ?', [id]);
            if (!check) {
                throw new GraphQLError('Attendance record not found', { extensions: { code: 'NOT_FOUND' } });
            }
            await dbRun('DELETE FROM attendance WHERE id = ?', [id]);
            return true;
        },
        deleteAttendanceByEnrollment: async (_, { studentId, courseId }) => {
            await dbRun('DELETE FROM attendance WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
            return true;
        }
    }
};

module.exports = resolvers;
