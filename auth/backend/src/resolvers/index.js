const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { dbGet, dbRun } = require('../config/db');
const { GraphQLError } = require('graphql');

const SECRET = process.env.JWT_SECRET || 'edubrain_super_secret_2026';

const resolvers = {
    Query: {
        me: async (_, __, context) => {
            if (!context.user) {
                throw new GraphQLError('Not authenticated', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }
            const user = await dbGet('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [context.user.id]);
            return user;
        }
    },
    Mutation: {
        login: async (_, { email, password }) => {
            const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
            if (!user) {
                throw new GraphQLError('Invalid email or password', {
                    extensions: { code: 'BAD_USER_INPUT' }
                });
            }

            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) {
                throw new GraphQLError('Invalid email or password', {
                    extensions: { code: 'BAD_USER_INPUT' }
                });
            }

            let studentId = null;
            if (user.role === 'student') {
                studentId = user.id; 
            }

            const token = jwt.sign(
                { id: user.id, student_id: studentId, email: user.email, role: user.role, name: user.name },
                SECRET,
                { expiresIn: '7d' }
            );

            return {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at
                }
            };
        },
        register: async (_, { name, email, password, phone, address }) => {
            const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
            if (existing) {
                throw new GraphQLError('Email already registered', {
                    extensions: { code: 'CONFLICT' }
                });
            }

            const password_hash = await bcrypt.hash(password, 10);
            let userId;

            // 1. Simpan data ke database Auth utama terlebih dahulu
            try {
                const result = await dbRun(
                    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                    [name, email, password_hash, 'student']
                );
                userId = result.lastID;
            } catch (err) {
                throw new GraphQLError('Failed to register user inside auth database: ' + err.message);
            }

            // 2. Kirim data sinkronisasi ke Student Service (Port 5002)
            // Dibungkus secara independen agar jika port 5002 mati, pendaftaran akun tidak ikut gagal/drop.
            try {
                const studentServiceUrl = process.env.STUDENTS_SERVICE_URL || 'http://localhost:5002/graphql';
                const studentRes = await axios.post(studentServiceUrl, {
                    query: `
                        mutation CreateStudentDirect($id: ID!, $name: String!, $email: String!, $phone: String, $address: String) {
                            createStudentDirect(id: $id, name: $name, email: $email, phone: $phone, address: $address) {
                                id
                            }
                        }
                    `,
                    variables: {
                        id: userId,
                        name,
                        email,
                        phone: phone || null,
                        address: address || null
                    }
                }, { timeout: 3000 }); // Batas waktu tunggu respons maksimal 3 detik
                
                if (studentRes.data.errors) {
                    console.error('⚠️ Sync warnings in student service:', studentRes.data.errors);
                }
            } catch (syncErr) {
                console.error('❌ Failed to sync student profile record, but user account was successfully created:', syncErr.message);
            }

            // 3. Buat token agar user otomatis masuk setelah mendaftar
            const token = jwt.sign(
                { id: userId, student_id: userId, email, role: 'student', name },
                SECRET,
                { expiresIn: '7d' }
            );

            const user = await dbGet('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);

            return {
                token,
                user
            };
        }
    }
};

module.exports = resolvers;