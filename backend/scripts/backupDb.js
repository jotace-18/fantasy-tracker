// Simple backup script for SQLite DB
// Usage: npm run backup
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'fantasy.sqlite');
const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const dest = path.join(backupsDir, `fantasy-${stamp}.sqlite`);
fs.copyFileSync(dbPath, dest);
console.log('Backup creado:', dest);
