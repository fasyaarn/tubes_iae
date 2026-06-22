const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'attendance.db');
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
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            status TEXT CHECK(status IN ('present', 'absent', 'late')) DEFAULT 'present',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, course_id, date)
        )
    `);

    const row = await dbGet('SELECT COUNT(*) AS count FROM attendance');
    if (row.count === 0) {
        console.log('🌱 Seeding attendance database...');
        const seedAttendance = [
            [2, 1, '2026-04-01', 'present'],
            [2, 1, '2026-04-08', 'present'],
            [3, 1, '2026-04-01', 'present'],
            [4, 2, '2026-04-02', 'present'],
            [5, 1, '2026-04-01', 'present'],
            [6, 3, '2026-04-03', 'present']
        ];

        for (const [studentId, courseId, date, status] of seedAttendance) {
            await dbRun(
                'INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)',
                [studentId, courseId, date, status]
            );
        }
        console.log('✅ Attendance database seeded!');
    }
}

module.exports = {
    initDb,
    dbRun,
    dbAll,
    dbGet
};
