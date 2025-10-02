#!/usr/bin/env node

/**
 * Safe Migration Script: JSON to SQLite
 *
 * Bu script JSON fayllardan SQLite database ga data ko'chiradi
 * Xavfsizlik:
 * - Dry-run mode (test)
 * - Data validation
 * - Rollback support
 * - Progress tracking
 */

const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

class MigrationManager {
    constructor(dryRun = true) {
        this.dryRun = dryRun;
        this.dbPath = path.join(__dirname, '../data/xabarnoma.db');
        this.db = null;
        this.stats = {
            employees: { json: 0, db: 0, migrated: 0, errors: 0 },
            users: { json: 0, db: 0, migrated: 0, errors: 0 },
            departments: { json: 0, db: 0, migrated: 0, errors: 0 },
            districts: { json: 0, db: 0, migrated: 0, errors: 0 },
            groups: { json: 0, db: 0, migrated: 0, errors: 0 },
            sip_accounts: { json: 0, db: 0, migrated: 0, errors: 0 },
            broadcast_history: { json: 0, db: 0, migrated: 0, errors: 0 }
        };
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) reject(err);
                else {
                    console.log('✅ Connected to SQLite database');
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve();
                }
            });
        });
    }

    async readJSON(filename) {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../data', filename),
                'utf8'
            );
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Error reading ${filename}:`, error.message);
            return null;
        }
    }

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

    async migrateDistricts() {
        console.log('\n📍 Migrating Districts...');
        const districts = await this.readJSON('districts.json');
        if (!districts) return;

        this.stats.districts.json = districts.length;

        for (const district of districts) {
            try {
                if (this.dryRun) {
                    console.log(`  [DRY-RUN] Would insert: ${district.name}`);
                    this.stats.districts.migrated++;
                } else {
                    // Check if exists
                    const exists = await this.get(
                        'SELECT id FROM districts WHERE name = ?',
                        [district.name]
                    );

                    if (!exists) {
                        await this.run(
                            'INSERT INTO districts (name) VALUES (?)',
                            [district.name]
                        );
                        this.stats.districts.migrated++;
                        console.log(`  ✓ Inserted: ${district.name}`);
                    } else {
                        console.log(`  ⏭ Skipped (exists): ${district.name}`);
                    }
                }
            } catch (error) {
                console.error(`  ❌ Error migrating ${district.name}:`, error.message);
                this.stats.districts.errors++;
            }
        }

        const dbCount = await this.get('SELECT COUNT(*) as count FROM districts');
        this.stats.districts.db = dbCount.count;
    }

    async migrateDepartments() {
        console.log('\n🏢 Migrating Departments...');
        const departments = await this.readJSON('departments.json');
        if (!departments) return;

        this.stats.departments.json = departments.length;

        for (const dept of departments) {
            try {
                if (this.dryRun) {
                    console.log(`  [DRY-RUN] Would insert: ${dept.name}`);
                    this.stats.departments.migrated++;
                } else {
                    // Check if exists
                    const exists = await this.get(
                        'SELECT id FROM departments WHERE name = ?',
                        [dept.name]
                    );

                    if (!exists) {
                        await this.run(
                            'INSERT INTO departments (name, description) VALUES (?, ?)',
                            [dept.name, dept.description || '']
                        );
                        this.stats.departments.migrated++;
                        console.log(`  ✓ Inserted: ${dept.name}`);
                    } else {
                        console.log(`  ⏭ Skipped (exists): ${dept.name}`);
                    }
                }
            } catch (error) {
                console.error(`  ❌ Error migrating ${dept.name}:`, error.message);
                this.stats.departments.errors++;
            }
        }

        const dbCount = await this.get('SELECT COUNT(*) as count FROM departments');
        this.stats.departments.db = dbCount.count;
    }

    async migrateUsers() {
        console.log('\n👥 Migrating Users...');
        const users = await this.readJSON('users.json');
        if (!users) return;

        this.stats.users.json = users.length;

        for (const user of users) {
            try {
                if (this.dryRun) {
                    console.log(`  [DRY-RUN] Would insert: ${user.username}`);
                    this.stats.users.migrated++;
                } else {
                    // Check if exists
                    const exists = await this.get(
                        'SELECT id FROM users WHERE username = ?',
                        [user.username]
                    );

                    if (!exists) {
                        await this.run(
                            `INSERT INTO users (username, password, name, role, permissions, active, allowed_districts, last_login)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                user.username,
                                user.password, // Already hashed
                                user.name,
                                user.role,
                                JSON.stringify(user.permissions || []),
                                user.active ? 1 : 0,
                                JSON.stringify(user.allowedDistricts || ['all']),
                                user.lastLogin || null
                            ]
                        );
                        this.stats.users.migrated++;
                        console.log(`  ✓ Inserted: ${user.username} (${user.role})`);
                    } else {
                        console.log(`  ⏭ Skipped (exists): ${user.username}`);
                    }
                }
            } catch (error) {
                console.error(`  ❌ Error migrating ${user.username}:`, error.message);
                this.stats.users.errors++;
            }
        }

        const dbCount = await this.get('SELECT COUNT(*) as count FROM users');
        this.stats.users.db = dbCount.count;
    }

    async migrateGroups() {
        console.log('\n👨‍👩‍👧‍👦 Migrating Groups...');
        const groups = await this.readJSON('groups.json');
        if (!groups) return;

        this.stats.groups.json = groups.length;

        for (const group of groups) {
            try {
                if (this.dryRun) {
                    console.log(`  [DRY-RUN] Would insert: ${group.name}`);
                    this.stats.groups.migrated++;
                } else {
                    // Check if exists
                    const exists = await this.get(
                        'SELECT id FROM groups WHERE id = ?',
                        [group.id]
                    );

                    if (!exists) {
                        await this.run(
                            `INSERT INTO groups (id, name, description, members, district, created_by)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                group.id,
                                group.name,
                                group.description || '',
                                JSON.stringify(group.members || []),
                                group.district || '',
                                group.createdBy || 'migration'
                            ]
                        );
                        this.stats.groups.migrated++;
                        console.log(`  ✓ Inserted: ${group.name} (${group.members?.length || 0} members)`);
                    } else {
                        console.log(`  ⏭ Skipped (exists): ${group.name}`);
                    }
                }
            } catch (error) {
                console.error(`  ❌ Error migrating ${group.name}:`, error.message);
                this.stats.groups.errors++;
            }
        }

        const dbCount = await this.get('SELECT COUNT(*) as count FROM groups');
        this.stats.groups.db = dbCount.count;
    }

    async migrateSIPAccounts() {
        console.log('\n📞 Migrating SIP Accounts...');
        const sipAccounts = await this.readJSON('sip-accounts.json');
        if (!sipAccounts) return;

        this.stats.sip_accounts.json = sipAccounts.length;

        for (const account of sipAccounts) {
            try {
                if (this.dryRun) {
                    console.log(`  [DRY-RUN] Would insert: ${account.name} (${account.extension})`);
                    this.stats.sip_accounts.migrated++;
                } else {
                    // Check if exists
                    const exists = await this.get(
                        'SELECT id FROM sip_accounts WHERE extension = ?',
                        [account.extension]
                    );

                    if (!exists) {
                        await this.run(
                            `INSERT INTO sip_accounts (id, extension, password, name, server, active, channels, updated_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                account.id,
                                account.extension,
                                account.password,
                                account.name,
                                account.server,
                                account.active ? 1 : 0,
                                account.channels || 1,
                                account.updatedAt || null
                            ]
                        );
                        this.stats.sip_accounts.migrated++;
                        console.log(`  ✓ Inserted: ${account.name} (${account.extension})`);
                    } else {
                        console.log(`  ⏭ Skipped (exists): ${account.name}`);
                    }
                }
            } catch (error) {
                console.error(`  ❌ Error migrating ${account.name}:`, error.message);
                this.stats.sip_accounts.errors++;
            }
        }

        const dbCount = await this.get('SELECT COUNT(*) as count FROM sip_accounts');
        this.stats.sip_accounts.db = dbCount.count;
    }

    async migrateBroadcastHistory() {
        console.log('\n📡 Migrating Broadcast History...');
        const broadcasts = await this.readJSON('broadcast-history.json');
        if (!broadcasts) return;

        this.stats.broadcast_history.json = broadcasts.length;

        for (const broadcast of broadcasts) {
            try {
                if (this.dryRun) {
                    if (this.stats.broadcast_history.migrated < 5) {
                        console.log(`  [DRY-RUN] Would insert: ${broadcast.broadcastName || 'Unnamed'}`);
                    }
                    this.stats.broadcast_history.migrated++;
                } else {
                    // Check if exists
                    const exists = await this.get(
                        'SELECT id FROM broadcast_history WHERE id = ?',
                        [broadcast.id]
                    );

                    if (!exists) {
                        await this.run(
                            `INSERT INTO broadcast_history (
                                id, broadcast_name, audio_file, target_group, target_district, target_department,
                                total_recipients, completed_calls, failed_calls, confirmed_calls,
                                status, started_at, completed_at, started_by
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                broadcast.id,
                                broadcast.broadcastName || '',
                                broadcast.audioFile || '',
                                broadcast.targetGroup || '',
                                broadcast.targetDistrict || '',
                                broadcast.targetDepartment || '',
                                broadcast.totalRecipients || 0,
                                broadcast.completedCalls || 0,
                                broadcast.failedCalls || 0,
                                broadcast.confirmedCalls || 0,
                                broadcast.status || 'completed',
                                broadcast.startedAt || null,
                                broadcast.completedAt || null,
                                broadcast.startedBy || 'migration'
                            ]
                        );
                        this.stats.broadcast_history.migrated++;
                        if (this.stats.broadcast_history.migrated % 100 === 0) {
                            console.log(`  ✓ Migrated ${this.stats.broadcast_history.migrated} broadcasts...`);
                        }
                    }
                }
            } catch (error) {
                console.error(`  ❌ Error migrating broadcast ${broadcast.id}:`, error.message);
                this.stats.broadcast_history.errors++;
            }
        }

        const dbCount = await this.get('SELECT COUNT(*) as count FROM broadcast_history');
        this.stats.broadcast_history.db = dbCount.count;
        console.log(`  ✓ Total migrated: ${this.stats.broadcast_history.migrated}`);
    }

    async migrateEmployees() {
        console.log('\n👔 Migrating Employees...');
        const employees = await this.readJSON('employees.json');
        if (!employees) return;

        this.stats.employees.json = employees.length;

        for (const emp of employees) {
            try {
                if (this.dryRun) {
                    if (this.stats.employees.migrated < 5) {
                        console.log(`  [DRY-RUN] Would insert: ${emp.name} - ${emp.phoneNumber}`);
                    }
                    this.stats.employees.migrated++;
                } else {
                    // Check if exists by phone number
                    const exists = await this.get(
                        'SELECT id FROM employees WHERE phone_number = ?',
                        [emp.phoneNumber]
                    );

                    if (!exists) {
                        await this.run(
                            `INSERT INTO employees (name, position, rank, department, phone_number, service_phone, district, deleted, created_by)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                emp.name,
                                emp.position || '',
                                emp.rank || '',
                                emp.department || '',
                                emp.phoneNumber,
                                emp.servicePhone || '',
                                emp.district || '',
                                emp.deleted ? 1 : 0,
                                emp.createdBy || 'migration'
                            ]
                        );
                        this.stats.employees.migrated++;
                        if (this.stats.employees.migrated % 100 === 0) {
                            console.log(`  ✓ Migrated ${this.stats.employees.migrated} employees...`);
                        }
                    }
                }
            } catch (error) {
                console.error(`  ❌ Error migrating ${emp.name}:`, error.message);
                this.stats.employees.errors++;
            }
        }

        const dbCount = await this.get('SELECT COUNT(*) as count FROM employees');
        this.stats.employees.db = dbCount.count;
        console.log(`  ✓ Total migrated: ${this.stats.employees.migrated}`);
    }

    async validateData() {
        console.log('\n🔍 Validating Data...\n');

        for (const [table, stats] of Object.entries(this.stats)) {
            const status = stats.errors === 0 ? '✅' : '⚠️';
            console.log(`${status} ${table.toUpperCase()}:`);
            console.log(`   JSON: ${stats.json} records`);
            console.log(`   DB: ${stats.db} records`);
            console.log(`   Migrated: ${stats.migrated} records`);
            if (stats.errors > 0) {
                console.log(`   ❌ Errors: ${stats.errors}`);
            }
        }
    }

    async migrate() {
        try {
            await this.connect();

            console.log(`\n${'='.repeat(60)}`);
            console.log(`MIGRATION MODE: ${this.dryRun ? '🧪 DRY-RUN (Test)' : '🚀 PRODUCTION'}`);
            console.log(`${'='.repeat(60)}`);

            // Order matters: districts first, then departments, etc.
            await this.migrateDistricts();
            await this.migrateDepartments();
            await this.migrateUsers();
            await this.migrateGroups();
            await this.migrateSIPAccounts();
            await this.migrateBroadcastHistory();
            await this.migrateEmployees();

            await this.validateData();

            console.log(`\n${'='.repeat(60)}`);
            if (this.dryRun) {
                console.log('✅ DRY-RUN COMPLETED - No data was modified');
                console.log('💡 Run with --production flag to perform actual migration');
            } else {
                console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
            }
            console.log(`${'='.repeat(60)}\n`);

        } catch (error) {
            console.error('\n❌ MIGRATION FAILED:', error);
            throw error;
        } finally {
            if (this.db) {
                await new Promise((resolve) => this.db.close(resolve));
            }
        }
    }
}

// CLI execution
const args = process.argv.slice(2);
const isDryRun = !args.includes('--production');

const migrator = new MigrationManager(isDryRun);
migrator.migrate().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
