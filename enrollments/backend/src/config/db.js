const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'enrollments.db');
const db = new sqlite3.Database(dbPath);

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
        CREATE TABLE IF NOT EXISTS enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, course_id)
        )
    `);

    const row = await dbGet('SELECT COUNT(*) AS count FROM enrollments');
    if (row.count === 0) {
        console.log('🌱 Seeding enrollments database...');
        const seedEnrollments = [
            [2, 1, 'active'],
            [2, 2, 'active'],
            [2, 4, 'active'],
            [3, 1, 'active'],
            [3, 3, 'active'],
            [4, 2, 'active'],
            [4, 4, 'active'],
            [5, 1, 'active'],
            [5, 5, 'active'],
            [6, 3, 'active'],
            [6, 4, 'active'],
            [7, 1, 'completed'],
            [7, 2, 'completed'],
            [8, 5, 'active']
        ];

        for (const [studentId, courseId, status] of seedEnrollments) {
            await dbRun(
                'INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, ?)',
                [studentId, courseId, status]
            );
        }
        console.log('✅ Enrollments database seeded!');
    }
}

module.exports = {
    initDb,
    dbRun,
    dbAll,
    dbGet
};
