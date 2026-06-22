const axios = require('axios');
const { dbAll, dbGet, dbRun } = require('../config/db');
const { GraphQLError } = require('graphql');

// Environment Service URLs
const STUDENTS_SERVICE_URL = process.env.STUDENTS_SERVICE_URL || 'http://localhost:5002/graphql';
const COURSES_SERVICE_URL = process.env.COURSES_SERVICE_URL || 'http://localhost:5003/graphql';
const ATTENDANCE_SERVICE_URL = process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:5005/graphql';
const ARTICLES_SERVICE_URL = process.env.ARTICLES_SERVICE_URL || 'http://localhost:5006/graphql';

// Helper to query other GraphQL services
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

// Function to trigger cleanups in Attendance and Articles services
async function wipeStudentProgress(studentId, courseId, token) {
    console.log(`🧹 Wiping progress for Student #${studentId} in Course #${courseId}...`);
    
    // 1. Delete Attendance records
    const attendanceQuery = `
        mutation ClearAttendance($studentId: ID!, $courseId: ID!) {
            deleteAttendanceByEnrollment(studentId: $studentId, courseId: $courseId)
        }
    `;
    await callService(ATTENDANCE_SERVICE_URL, attendanceQuery, { studentId, courseId }, token);

    // 2. Delete Article Reads records
    const articlesQuery = `
        mutation ClearArticleReads($studentId: ID!, $courseId: ID!) {
            deleteArticleReadsByEnrollment(studentId: $studentId, courseId: $courseId)
        }
    `;
    await callService(ARTICLES_SERVICE_URL, articlesQuery, { studentId, courseId }, token);
}

const resolvers = {
    Enrollment: {
        student: async (parent, _, context) => {
            const authHeader = context.reqHeaders?.authorization || '';
            const data = await callService(
                STUDENTS_SERVICE_URL,
                `query GetStudent($id: ID!) { student(id: $id) { id name email phone address } }`,
                { id: parent.student_id },
                authHeader
            );
            return data ? data.student : null;
        },
        course: async (parent, _, context) => {
            const authHeader = context.reqHeaders?.authorization || '';
            const data = await callService(
                COURSES_SERVICE_URL,
                `query GetCourse($id: ID!) { course(id: $id) { id title description instructor credits } }`,
                { id: parent.course_id },
                authHeader
            );
            return data ? data.course : null;
        }
    },
    Query: {
        enrollments: async () => {
            return await dbAll('SELECT * FROM enrollments ORDER BY enrolled_at DESC');
        },
        studentEnrollments: async (_, { student_id }) => {
            return await dbAll('SELECT * FROM enrollments WHERE student_id = ? ORDER BY enrolled_at DESC', [student_id]);
        }
    },
    Mutation: {
        createEnrollment: async (_, { student_id, course_id, status = 'active' }, context) => {
            const authHeader = context.reqHeaders?.authorization || '';

            // Verify Student exists
            const sData = await callService(
                STUDENTS_SERVICE_URL,
                `query CheckStudent($id: ID!) { student(id: $id) { id } }`,
                { id: student_id },
                authHeader
            );
            if (!sData || !sData.student) {
                throw new GraphQLError('Student not found in Students Service', { extensions: { code: 'NOT_FOUND' } });
            }

            // Verify Course exists
            const cData = await callService(
                COURSES_SERVICE_URL,
                `query CheckCourse($id: ID!) { course(id: $id) { id } }`,
                { id: course_id },
                authHeader
            );
            if (!cData || !cData.course) {
                throw new GraphQLError('Course not found in Courses Service', { extensions: { code: 'NOT_FOUND' } });
            }

            try {
                const result = await dbRun(
                    'INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, ?)',
                    [student_id, course_id, status]
                );
                return await dbGet('SELECT * FROM enrollments WHERE id = ?', [result.lastID]);
            } catch (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    throw new GraphQLError('Student is already enrolled in this course', { extensions: { code: 'CONFLICT' } });
                }
                throw new GraphQLError(err.message);
            }
        },
        updateEnrollmentStatus: async (_, { id, status }, context) => {
            const enrollment = await dbGet('SELECT * FROM enrollments WHERE id = ?', [id]);
            if (!enrollment) {
                throw new GraphQLError('Enrollment record not found', { extensions: { code: 'NOT_FOUND' } });
            }

            const authHeader = context.reqHeaders?.authorization || '';

            // Trigger progress wipe if dropped
            if (status === 'dropped') {
                await wipeStudentProgress(enrollment.student_id, enrollment.course_id, authHeader);
            }

            await dbRun('UPDATE enrollments SET status = ? WHERE id = ?', [status, id]);
            return await dbGet('SELECT * FROM enrollments WHERE id = ?', [id]);
        },
        deleteEnrollment: async (_, { id }, context) => {
            const enrollment = await dbGet('SELECT * FROM enrollments WHERE id = ?', [id]);
            if (!enrollment) {
                throw new GraphQLError('Enrollment record not found', { extensions: { code: 'NOT_FOUND' } });
            }

            const authHeader = context.reqHeaders?.authorization || '';

            // Wipe progress before deleting
            await wipeStudentProgress(enrollment.student_id, enrollment.course_id, authHeader);

            await dbRun('DELETE FROM enrollments WHERE id = ?', [id]);
            return true;
        }
    }
};

module.exports = resolvers;
