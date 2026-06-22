const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'articles.db');
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

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

// Initialize Tables and Seeds
async function initDb() {
    await dbRun(`
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            course_id INTEGER,
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS article_reads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
            UNIQUE(article_id, student_id)
        )
    `);

    const row = await dbGet('SELECT COUNT(*) AS count FROM articles');
    if (row.count === 0) {
        console.log('🌱 Seeding articles database...');
        const seedArticles = [
            [
                1,
                'Pengantar Web Programming',
                'Web programming adalah proses membuat aplikasi atau halaman web yang dapat diakses melalui browser.\n\n## Teknologi Utama\n\n**HTML (HyperText Markup Language)** adalah bahasa markup yang digunakan untuk membuat struktur halaman web. Setiap elemen ditandai dengan tag seperti `<div>`, `<p>`, `<h1>`, dan sebagainya.\n\n**CSS (Cascading Style Sheets)** digunakan untuk mengatur tampilan dan tata letak halaman web. CSS memungkinkan developer mengatur warna, font, ukuran, dan posisi elemen.\n\n**JavaScript** adalah bahasa pemrograman yang membuat halaman web menjadi interaktif. Dengan JavaScript, kita dapat merespons aksi pengguna, melakukan request ke server, dan memanipulasi DOM.\n\n## Framework Modern\n\nReact, Vue, dan Angular adalah framework JavaScript yang memudahkan pembangunan aplikasi web kompleks. Node.js dan Express.js digunakan di sisi server untuk membuat API.\n\n## Kesimpulan\n\nMemahami web programming adalah fondasi penting bagi setiap pengembang perangkat lunak modern. Setelah membaca artikel ini, Anda siap untuk mengikuti sesi perkuliahan!',
                1,
                1
            ],
            [
                2,
                'Dasar-Dasar Sistem Basis Data',
                'Sistem Basis Data (Database Systems) adalah cara terorganisir untuk menyimpan, mengelola, dan mengambil informasi.\n\n## Konsep Dasar\n\n**Relational Database** menyimpan data dalam tabel yang saling terhubung. Setiap tabel memiliki baris (record) dan kolom (field). Contoh: MySQL, PostgreSQL, Oracle.\n\n**SQL (Structured Query Language)** adalah bahasa standar untuk berinteraksi dengan database relasional. Perintah utama:\n- `SELECT` - mengambil data\n- `INSERT` - menambah data\n- `UPDATE` - mengubah data\n- `DELETE` - menghapus data\n\n## Primary Key & Foreign Key\n\n**Primary Key** adalah kolom unik yang mengidentifikasi setiap record. **Foreign Key** adalah kolom yang merujuk ke Primary Key tabel lain, membentuk relasi antar tabel.\n\n## Normalisasi\n\nNormalisasi adalah proses mengorganisir database untuk mengurangi redundansi dan ketergantungan data. Bentuk normal: 1NF, 2NF, 3NF, dan BCNF.\n\n## Kesimpulan\n\nMemahami database adalah keahlian wajib bagi developer. Baca artikel ini sebelum hadir agar diskusi lebih produktif!',
                2,
                1
            ],
            [
                3,
                'Pengantar Jaringan Komputer',
                'Jaringan komputer memungkinkan perangkat saling berkomunikasi dan berbagi sumber daya.\n\n## Model OSI & TCP/IP\n\nModel OSI memiliki 7 lapisan: Physical, Data Link, Network, Transport, Session, Presentation, Application. Model TCP/IP menyederhanakan menjadi 4 lapisan.\n\n## Protokol Penting\n\n**IP (Internet Protocol)** mengidentifikasi setiap perangkat di jaringan dengan alamat IP. **TCP (Transmission Control Protocol)** menjamin pengiriman data yang andal. **HTTP/HTTPS** adalah protokol untuk transfer data web.\n\n## DNS & Port\n\nDNS (Domain Name System) menerjemahkan nama domain (google.com) menjadi alamat IP. Port adalah nomor yang mengidentifikasi layanan tertentu (80=HTTP, 443=HTTPS, 3306=MySQL).\n\n## Kesimpulan\n\nJaringan komputer adalah tulang punggung internet. Wajib baca sebelum kelas!',
                3,
                1
            ]
        ];

        for (const [id, title, content, courseId, createdBy] of seedArticles) {
            await dbRun(
                'INSERT INTO articles (id, title, content, course_id, created_by) VALUES (?, ?, ?, ?, ?)',
                [id, title, content, courseId, createdBy]
            );
        }
        console.log('✅ Articles database seeded!');
    }
}

module.exports = {
    initDb,
    dbRun,
    dbAll,
    dbGet
};
