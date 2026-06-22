const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', '..', 'students.db');
const db = new sqlite3.Database(dbPath);

// Promisify database operations
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

// Initialize Table and Seeds
async function initDb() {
    await dbRun(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Check if table is empty, if so seed it
    const row = await dbGet('SELECT COUNT(*) AS count FROM students');
    if (row.count === 0) {
        console.log('🌱 Seeding students database...');
        const seedStudents = [
            [2, 'Fasya Arinal Hudha', 'fasya@edubrain.id', '081200000001', 'Bandung'],
            [3, 'Alifia Ryana Saputri', 'alifia@edubrain.id', '081200000002', 'Bandung'],
            [4, 'Asyifa Indi Azalia', 'asyifa@edubrain.id', '081200000003', 'Bandung'],
            [5, 'Maya Radina Putri', 'maya@edubrain.id', '081200000004', 'Bandung'],
            [6, 'Nadila Naurah Rayyani H.', 'nadila@edubrain.id', '081200000005', 'Bandung'],
            [7, 'Budi Santoso', 'budi@edubrain.id', '081200000006', 'Jakarta'],
            [8, 'Citra Dewi', 'citra@edubrain.id', '081200000007', 'Surabaya']
        ];

        for (const [id, name, email, phone, address] of seedStudents) {
            await dbRun(
                'INSERT INTO students (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
                [id, name, email, phone, address]
            );
        }
        console.log('✅ Students database seeded!');
    }
}

module.exports = {
    initDb,
    dbRun,
    dbAll,
    dbGet
};
