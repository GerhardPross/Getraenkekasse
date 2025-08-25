// utils/db.js
const Database = require('better-sqlite3');
const path = require('path');

// Datenbankverbindung erstellen
const db = new Database(path.join(process.cwd(), 'db', 'db.sqlite'), {
  verbose: console.log, // Optional: Loggt SQL-Befehle
});

module.exports = db;
