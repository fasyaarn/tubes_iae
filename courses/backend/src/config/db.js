const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'courses.db');
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
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            instructor TEXT,
            credits INTEGER DEFAULT 3,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Seed if empty
    const row = await dbGet('SELECT COUNT(*) AS count FROM courses');
    if (row.count === 0) {
        console.log('🌱 Seeding courses database...');
        const seedCourses = [
            [1, 'Web Programming', 'Learn HTML, CSS, JS, React, and Node.js', 'Dr. Ahmad', 3],
            [2, 'Database Systems', 'Relational databases, SQL, and NoSQL fundamentals', 'Dr. Budi', 3],
            [3, 'Computer Networks', 'TCP/IP, HTTP, DNS, and network protocols', 'Dr. Citra', 2],
            [4, 'Software Engineering', 'SDLC, Agile, Scrum, and design patterns', 'Dr. Diana', 3],
            [5, 'Mobile Development', 'Android and iOS development fundamentals', 'Dr. Eko', 3]
        ];

        for (const [id, title, description, instructor, credits] of seedCourses) {
            await dbRun(
                'INSERT INTO courses (id, title, description, instructor, credits) VALUES (?, ?, ?, ?, ?)',
                [id, title, description, instructor, credits]
            );
        }
        console.log('✅ Courses database seeded!');
    }
}

module.exports = {
    initDb,
    dbRun,
    dbAll,
    dbGet
};
