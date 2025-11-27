const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

/**
 * Database abstraction layer supporting SQLite and Postgres
 */
class DB {
    constructor() {
        this.dbType = process.env.DATABASE_URL ? 'postgres' : 'sqlite';

        if (this.dbType === 'sqlite') {
            const dbDir = path.join(__dirname, '../../data');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }
            const dbPath = path.join(dbDir, 'ci_runs.db');
            this.db = new Database(dbPath);
            this.initSQLite();
        } else {
            // Parse DATABASE_URL and remove sslmode parameter
            const connectionString = process.env.DATABASE_URL.split('?')[0];

            this.db = new Client({
                connectionString,
                ssl: {
                    rejectUnauthorized: false  // Accept self-signed certificates
                }
            });
            this.db.connect()
                .catch(err => {
                    console.error('PostgreSQL connection failed:', err.message);
                    console.error('Falling back to SQLite...');
                    // Fallback to SQLite on connection error
                    this.dbType = 'sqlite';
                    const dbDir = path.join(__dirname, '../../data');
                    if (!fs.existsSync(dbDir)) {
                        fs.mkdirSync(dbDir, { recursive: true });
                    }
                    const dbPath = path.join(dbDir, 'ci_runs.db');
                    this.db = new Database(dbPath);
                    this.initSQLite();
                });
            this.initPostgres();
        }
    }

    initSQLite() {
        this.db.exec(`
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

        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_status ON runs(status);
      CREATE INDEX IF NOT EXISTS idx_repo ON runs(repo);
      CREATE INDEX IF NOT EXISTS idx_created_at ON runs(created_at);
    `);
    }

    async initPostgres() {
        await this.db.query(`
      CREATE TABLE IF NOT EXISTS runs (
        id SERIAL PRIMARY KEY,
        repo TEXT NOT NULL,
        workflow TEXT NOT NULL,
        branch TEXT NOT NULL,
        commit_sha TEXT NOT NULL,
        status TEXT NOT NULL,
        run_url TEXT NOT NULL,
        raw_payload JSONB NOT NULL,
        logs TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

        await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_status ON runs(status);
      CREATE INDEX IF NOT EXISTS idx_repo ON runs(repo);
      CREATE INDEX IF NOT EXISTS idx_created_at ON runs(created_at);
    `);
    }

    /**
     * Insert a new CI run
     */
    insertRun(run) {
        const { repo, workflow, branch, commit_sha, status, run_url, raw_payload, logs } = run;

        if (this.dbType === 'sqlite') {
            const stmt = this.db.prepare(`
        INSERT INTO runs (repo, workflow, branch, commit_sha, status, run_url, raw_payload, logs)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const result = stmt.run(repo, workflow, branch, commit_sha, status, run_url, JSON.stringify(raw_payload), logs || '');
            return result.lastInsertRowid;
        } else {
            return this.db.query(
                `INSERT INTO runs (repo, workflow, branch, commit_sha, status, run_url, raw_payload, logs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [repo, workflow, branch, commit_sha, status, run_url, raw_payload, logs || '']
            ).then(res => res.rows[0].id);
        }
    }

    /**
     * Get runs with pagination and filters
     */
    getRuns(options = {}) {
        const { limit = 20, offset = 0, status, repo, search, startDate, endDate } = options;

        let query = 'SELECT * FROM runs WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND status = ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++}`;
            params.push(status);
        }
        if (repo) {
            query += ` AND repo = ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++}`;
            params.push(repo);
        }
        if (search) {
            query += ` AND (branch LIKE ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++} OR commit_sha LIKE ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++})`;
            params.push(`%${search}%`, `%${search}%`);
        }
        if (startDate) {
            query += ` AND created_at >= ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND created_at <= ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++}`;
            params.push(endDate);
        }

        query += ' ORDER BY created_at DESC';
        query += ` LIMIT ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++} OFFSET ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++}`;
        params.push(limit, offset);

        if (this.dbType === 'sqlite') {
            return this.db.prepare(query).all(...params);
        } else {
            return this.db.query(query, params).then(res => res.rows);
        }
    }

    /**
     * Get total count of runs (for pagination)
     */
    getRunsCount(options = {}) {
        const { status, repo, search, startDate, endDate } = options;

        let query = 'SELECT COUNT(*) as count FROM runs WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND status = ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++}`;
            params.push(status);
        }
        if (repo) {
            query += ` AND repo = ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++}`;
            params.push(repo);
        }
        if (search) {
            query += ` AND (branch LIKE ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++} OR commit_sha LIKE ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++})`;
            params.push(`%${search}%`, `%${search}%`);
        }
        if (startDate) {
            query += ` AND created_at >= ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND created_at <= ${this.dbType === 'sqlite' ? '?' : '$' + paramIndex++}`;
            params.push(endDate);
        }

        if (this.dbType === 'sqlite') {
            return this.db.prepare(query).get(...params).count;
        } else {
            return this.db.query(query, params).then(res => parseInt(res.rows[0].count));
        }
    }

    /**
     * Get a single run by ID
     */
    getRunById(id) {
        if (this.dbType === 'sqlite') {
            return this.db.prepare('SELECT * FROM runs WHERE id = ?').get(id);
        } else {
            return this.db.query('SELECT * FROM runs WHERE id = $1', [id]).then(res => res.rows[0]);
        }
    }

    /**
     * Get aggregate stats
     */
    getStats() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString();

        if (this.dbType === 'sqlite') {
            const total = this.db.prepare('SELECT COUNT(*) as count FROM runs').get().count;
            const failuresLast7Days = this.db.prepare(
                "SELECT COUNT(*) as count FROM runs WHERE status = 'failure' AND created_at >= ?"
            ).get(sevenDaysAgoStr).count;

            const topFailing = this.db.prepare(`
        SELECT workflow, COUNT(*) as count 
        FROM runs 
        WHERE status = 'failure' 
        GROUP BY workflow 
        ORDER BY count DESC 
        LIMIT 5
      `).all();

            return {
                totalRuns: total,
                failuresLast7Days,
                topFailingWorkflows: topFailing
            };
        } else {
            return Promise.all([
                this.db.query('SELECT COUNT(*) as count FROM runs'),
                this.db.query("SELECT COUNT(*) as count FROM runs WHERE status = 'failure' AND created_at >= $1", [sevenDaysAgoStr]),
                this.db.query(`
          SELECT workflow, COUNT(*) as count 
          FROM runs 
          WHERE status = 'failure' 
          GROUP BY workflow 
          ORDER BY count DESC 
          LIMIT 5
        `)
            ]).then(([totalRes, failuresRes, topFailingRes]) => ({
                totalRuns: parseInt(totalRes.rows[0].count),
                failuresLast7Days: parseInt(failuresRes.rows[0].count),
                topFailingWorkflows: topFailingRes.rows
            }));
        }
    }

    /**
     * Update a run
     */
    updateRun(id, updates) {
        const { status, logs } = updates;

        if (this.dbType === 'sqlite') {
            const stmt = this.db.prepare(`
        UPDATE runs 
        SET status = COALESCE(?, status), 
            logs = COALESCE(?, logs),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
            return stmt.run(status, logs, id);
        } else {
            return this.db.query(
                `UPDATE runs 
         SET status = COALESCE($1, status), 
             logs = COALESCE($2, logs),
             updated_at = NOW()
         WHERE id = $3`,
                [status, logs, id]
            );
        }
    }

    close() {
        if (this.dbType === 'sqlite') {
            this.db.close();
        } else {
            this.db.end();
        }
    }
}

module.exports = new DB();
