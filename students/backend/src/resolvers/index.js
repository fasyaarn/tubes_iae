const { dbAll, dbGet, dbRun } = require('../config/db');
const { GraphQLError } = require('graphql');

const resolvers = {
    Query: {
        students: async (_, __, context) => {
            // Check auth context if needed, but keep it accessible for internal service calls
            return await dbAll('SELECT * FROM students ORDER BY id DESC');
        },
        student: async (_, { id }) => {
            const student = await dbGet('SELECT * FROM students WHERE id = ?', [id]);
            if (!student) {
                throw new GraphQLError('Student not found', {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            return student;
        }
    },
    Mutation: {
        createStudent: async (_, { name, email, phone, address }) => {
            try {
                const result = await dbRun(
                    'INSERT INTO students (name, email, phone, address) VALUES (?, ?, ?, ?)',
                    [name, email, phone, address]
                );
                return await dbGet('SELECT * FROM students WHERE id = ?', [result.lastID]);
            } catch (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    throw new GraphQLError('Email already exists', {
                        extensions: { code: 'CONFLICT' }
                    });
                }
                throw new GraphQLError(err.message);
            }
        },
        createStudentDirect: async (_, { id, name, email, phone, address }) => {
            try {
                await dbRun(
                    'INSERT INTO students (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
                    [id, name, email, phone, address]
                );
                return await dbGet('SELECT * FROM students WHERE id = ?', [id]);
            } catch (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    throw new GraphQLError('Student ID or Email already exists', {
                        extensions: { code: 'CONFLICT' }
                    });
                }
                throw new GraphQLError(err.message);
            }
        },
        updateStudent: async (_, { id, name, email, phone, address }) => {
            const check = await dbGet('SELECT id FROM students WHERE id = ?', [id]);
            if (!check) {
                throw new GraphQLError('Student not found', {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            try {
                await dbRun(
                    'UPDATE students SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
                    [name, email, phone, address, id]
                );
                return await dbGet('SELECT * FROM students WHERE id = ?', [id]);
            } catch (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    throw new GraphQLError('Email already in use by another student', {
                        extensions: { code: 'CONFLICT' }
                    });
                }
                throw new GraphQLError(err.message);
            }
        },
        deleteStudent: async (_, { id }) => {
            const check = await dbGet('SELECT id FROM students WHERE id = ?', [id]);
            if (!check) {
                throw new GraphQLError('Student not found', {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            await dbRun('DELETE FROM students WHERE id = ?', [id]);
            return true;
        }
    }
};

module.exports = resolvers;
