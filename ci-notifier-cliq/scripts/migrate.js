const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create data directory
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✓ Created data directory');
}

// Create database
const dbPath = path.join(dataDir, 'ci_runs.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo TEXT NOT NULL,
    workflow TEXT NOT NULL,
    branch TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    status TEXT NOT NULL,
    run_url TEXT NOT NULL,
    raw_payload TEXT NOT NULL,
    logs TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✓ Created runs table');

// Create indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_status ON runs(status);
  CREATE INDEX IF NOT EXISTS idx_repo ON runs(repo);
  CREATE INDEX IF NOT EXISTS idx_created_at ON runs(created_at);
`);

console.log('✓ Created indexes');

db.close();

console.log('\n✅ Database migration completed successfully!');
console.log(`Database location: ${dbPath}\n`);
