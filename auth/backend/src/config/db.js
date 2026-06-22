const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', '..', 'auth.db');
const db = new sqlite3.Database(dbPath);

// Promisify operations
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Initialize Users Table and Seeds
async function initDb() {
    await dbRun(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('admin', 'student')) DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const row = await dbGet('SELECT COUNT(*) AS count FROM users');
    if (row.count === 0) {
        console.log('🌱 Seeding auth users database...');
        
        // Hash passwords dynamically
        const adminHash = await bcrypt.hash('admin123', 10);
        const studentHash = await bcrypt.hash('student123', 10);

        const seedUsers = [
            [1, 'Administrator', 'admin@edubrain.id', adminHash, 'admin'],
            [2, 'Fasya Arinal Hudha', 'fasya@edubrain.id', studentHash, 'student'],
            [3, 'Alifia Ryana Saputri', 'alifia@edubrain.id', studentHash, 'student'],
            [4, 'Asyifa Indi Azalia', 'asyifa@edubrain.id', studentHash, 'student'],
            [5, 'Maya Radina Putri', 'maya@edubrain.id', studentHash, 'student'],
            [6, 'Nadila Naurah Rayyani H.', 'nadila@edubrain.id', studentHash, 'student'],
            [7, 'Budi Santoso', 'budi@edubrain.id', studentHash, 'student'],
            [8, 'Citra Dewi', 'citra@edubrain.id', studentHash, 'student']
        ];

        for (const [id, name, email, hash, role] of seedUsers) {
            await dbRun(
                'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
                [id, name, email, hash, role]
            );
        }
        console.log('✅ Auth database seeded!');
    }
}

module.exports = {
    initDb,
    dbRun,
    dbAll,
    dbGet
};
