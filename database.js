const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ent_database.db');

db.serialize(() => {
    // Table Utilisateurs (avec fonction et établissement)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstname TEXT,
        lastname TEXT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        fonction TEXT DEFAULT 'Élève',
        etablissement TEXT DEFAULT 'Collège Carrington'
    )`);

    // Table Messages
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_name TEXT,
        receiver_username TEXT,
        subject TEXT,
        content TEXT,
        date TEXT
    )`);

    // Table Message Flash (Urgence)
    db.run(`CREATE TABLE IF NOT EXISTS flash_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        active INTEGER DEFAULT 1
    )`);
});

module.exports = db;