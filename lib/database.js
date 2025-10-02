const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '../data/xabarnoma.db');
    }

    async initialize() {
        try {
            // Ensure data directory exists
            await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
            
            return new Promise((resolve, reject) => {
                this.db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        console.error('Database connection error:', err);
                        reject(err);
                    } else {
                        console.log('Connected to SQLite database');
                        this.db.run('PRAGMA foreign_keys = ON');
                        this.createTables().then(resolve).catch(reject);
                    }
                });
            });
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    async createTables() {
        const queries = [
            // Districts table
            `CREATE TABLE IF NOT EXISTS districts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Departments table
            `CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Employees table with all required fields
            `CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                position TEXT,
                rank TEXT,
                department TEXT,
                phone_number TEXT NOT NULL,
                service_phone TEXT,
                district TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted BOOLEAN DEFAULT 0,
                created_by TEXT
            )`,
            
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                permissions TEXT,
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                allowed_districts TEXT
            )`,
            
            // Groups table
            `CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                members TEXT,
                district TEXT,
                created_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // SIP Accounts table
            `CREATE TABLE IF NOT EXISTS sip_accounts (
                id TEXT PRIMARY KEY,
                extension TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                server TEXT NOT NULL,
                active BOOLEAN DEFAULT 1,
                channels INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Broadcast History table
            `CREATE TABLE IF NOT EXISTS broadcast_history (
                id TEXT PRIMARY KEY,
                broadcast_name TEXT NOT NULL,
                audio_file TEXT,
                target_group TEXT,
                target_district TEXT,
                target_department TEXT,
                total_recipients INTEGER DEFAULT 0,
                completed_calls INTEGER DEFAULT 0,
                failed_calls INTEGER DEFAULT 0,
                confirmed_calls INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                started_at DATETIME,
                completed_at DATETIME,
                started_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Create indexes for performance
            `CREATE INDEX IF NOT EXISTS idx_employees_district ON employees(district)`,
            `CREATE INDEX IF NOT EXISTS idx_employees_deleted ON employees(deleted)`,
            `CREATE INDEX IF NOT EXISTS idx_employees_phone ON employees(phone_number)`,
            `CREATE INDEX IF NOT EXISTS idx_broadcast_history_status ON broadcast_history(status)`,
            `CREATE INDEX IF NOT EXISTS idx_broadcast_history_started_at ON broadcast_history(started_at)`
        ];

        for (const query of queries) {
            await this.run(query);
        }
    }

    // Promisified database methods
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Transaction support
    async transaction(callback) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.run('BEGIN TRANSACTION');
                const result = await callback();
                await this.run('COMMIT');
                resolve(result);
            } catch (error) {
                await this.run('ROLLBACK');
                reject(error);
            }
        });
    }

    // Employee methods with district filtering
    async getEmployees(districtFilter = null, includeDeleted = false) {
        let query = 'SELECT * FROM employees WHERE 1=1';
        const params = [];

        if (!includeDeleted) {
            query += ' AND deleted = 0';
        }

        if (districtFilter) {
            query += ' AND district = ?';
            params.push(districtFilter);
        }

        query += ' ORDER BY name';
        return this.all(query, params);
    }

    async createEmployee(data, userId) {
        const query = `
            INSERT INTO employees (name, position, rank, department, phone_number, service_phone, district, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        return this.run(query, [
            data.name,
            data.position || '',
            data.rank || '',
            data.department || '',
            data.phoneNumber,
            data.servicePhone || '',
            data.district || '',
            userId
        ]);
    }

    async updateEmployee(id, data) {
        const query = `
            UPDATE employees 
            SET name = ?, position = ?, rank = ?, department = ?, 
                phone_number = ?, service_phone = ?, district = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND deleted = 0
        `;
        return this.run(query, [
            data.name,
            data.position || '',
            data.rank || '',
            data.department || '',
            data.phoneNumber,
            data.servicePhone || '',
            data.district || '',
            id
        ]);
    }

    async deleteEmployee(id) {
        // Soft delete
        return this.run('UPDATE employees SET deleted = 1 WHERE id = ?', [id]);
    }

    // Check user district permissions
    async canUserAccessDistrict(userId, district) {
        const user = await this.get('SELECT allowed_districts FROM users WHERE id = ?', [userId]);
        if (!user) return false;
        
        const allowedDistricts = JSON.parse(user.allowed_districts || '[]');
        return allowedDistricts.includes('all') || allowedDistricts.includes(district);
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = new Database();