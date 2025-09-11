const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Safe file operations utility with atomic writes, backups, and locking
 */
class SafeFileOps {
    constructor() {
        this.locks = new Map();
        this.backupDir = path.join(__dirname, '../data/backups');
        this.tempDir = path.join(__dirname, '../data/temp');
        this.initDirs();
    }

    async initDirs() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create directories:', error);
        }
    }

    /**
     * Acquire a lock for a file
     */
    async acquireLock(filePath, timeout = 30000) { // Increased from 5s to 30s
        const lockKey = filePath;
        const startTime = Date.now();
        
        while (this.locks.has(lockKey)) {
            if (Date.now() - startTime > timeout) {
                throw new Error(`Lock timeout for file: ${filePath}`);
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        this.locks.set(lockKey, Date.now());
        return lockKey;
    }

    /**
     * Release a lock
     */
    releaseLock(lockKey) {
        this.locks.delete(lockKey);
    }

    /**
     * Create a backup of a file
     */
    async createBackup(filePath) {
        try {
            const exists = await fs.access(filePath).then(() => true).catch(() => false);
            if (!exists) return null;

            const fileName = path.basename(filePath);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `${fileName}.${timestamp}.backup`;
            const backupPath = path.join(this.backupDir, backupName);
            
            await fs.copyFile(filePath, backupPath);
            
            // Keep only last 10 backups per file
            await this.cleanOldBackups(fileName, 10);
            
            return backupPath;
        } catch (error) {
            console.error('Backup failed:', error);
            return null;
        }
    }

    /**
     * Clean old backups
     */
    async cleanOldBackups(fileName, keepCount = 10) {
        try {
            const files = await fs.readdir(this.backupDir);
            const backups = files
                .filter(f => f.startsWith(fileName + '.'))
                .sort()
                .reverse();
            
            for (let i = keepCount; i < backups.length; i++) {
                await fs.unlink(path.join(this.backupDir, backups[i])).catch(() => {});
            }
        } catch (error) {
            console.error('Failed to clean old backups:', error);
        }
    }

    /**
     * Calculate file checksum
     */
    async calculateChecksum(filePath) {
        try {
            const data = await fs.readFile(filePath);
            return crypto.createHash('md5').update(data).digest('hex');
        } catch (error) {
            return null;
        }
    }

    /**
     * Validate JSON file
     */
    async validateJSON(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            JSON.parse(data);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Read JSON file safely with validation
     */
    async readJSON(filePath, defaultValue = null) {
        let lock;
        try {
            lock = await this.acquireLock(filePath);
            
            const exists = await fs.access(filePath).then(() => true).catch(() => false);
            if (!exists) {
                return defaultValue;
            }

            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            
            return parsed;
        } catch (error) {
            console.error(`Failed to read JSON from ${filePath}:`, error);
            
            // Try to restore from backup
            const backups = await this.getBackups(path.basename(filePath));
            if (backups.length > 0) {
                console.log(`Attempting to restore from backup: ${backups[0]}`);
                try {
                    const backupData = await fs.readFile(path.join(this.backupDir, backups[0]), 'utf8');
                    return JSON.parse(backupData);
                } catch (backupError) {
                    console.error('Failed to restore from backup:', backupError);
                }
            }
            
            return defaultValue;
        } finally {
            if (lock) this.releaseLock(lock);
        }
    }

    /**
     * Write JSON file atomically with backup
     */
    async writeJSON(filePath, data, options = {}) {
        let lock;
        try {
            console.log(`[SAFE-FILE-OPS DEBUG] writeJSON called for: ${filePath}`);
            console.log(`[SAFE-FILE-OPS DEBUG] Data is array: ${Array.isArray(data)}, length: ${Array.isArray(data) ? data.length : 'N/A'}`);
            
            lock = await this.acquireLock(filePath);
            console.log(`[SAFE-FILE-OPS DEBUG] Lock acquired for: ${filePath}`);
            
            // Create backup first
            const backupPath = await this.createBackup(filePath);
            console.log(`[SAFE-FILE-OPS DEBUG] Backup created: ${backupPath}`);
            
            // Generate temp file name
            const tempFile = path.join(
                this.tempDir, 
                `${path.basename(filePath)}.${Date.now()}.tmp`
            );
            console.log(`[SAFE-FILE-OPS DEBUG] Temp file: ${tempFile}`);
            
            // Write to temp file
            const jsonData = JSON.stringify(data, null, options.spaces || 2);
            console.log(`[SAFE-FILE-OPS DEBUG] JSON data size: ${jsonData.length} bytes`);
            await fs.writeFile(tempFile, jsonData, 'utf8');
            console.log(`[SAFE-FILE-OPS DEBUG] Written to temp file`);
            
            // Validate the temp file
            if (!await this.validateJSON(tempFile)) {
                throw new Error('Invalid JSON data');
            }
            console.log(`[SAFE-FILE-OPS DEBUG] Temp file validated`);
            
            // Atomic rename
            console.log(`[SAFE-FILE-OPS DEBUG] About to rename ${tempFile} to ${filePath}`);
            await fs.rename(tempFile, filePath);
            console.log(`[SAFE-FILE-OPS DEBUG] File renamed successfully`);
            
            // Verify write was successful by reading directly without lock
            // (we already have the lock)
            try {
                const verifyData = await fs.readFile(filePath, 'utf8');
                const parsed = JSON.parse(verifyData);
                console.log(`[SAFE-FILE-OPS DEBUG] Verification successful, file contains ${Array.isArray(parsed) ? parsed.length : 'N/A'} items`);
            } catch (verifyError) {
                console.error(`[SAFE-FILE-OPS DEBUG] Verification failed:`, verifyError);
                throw new Error('Failed to verify written data');
            }
            
            return true;
        } catch (error) {
            console.error(`Failed to write JSON to ${filePath}:`, error);
            
            // Try to restore from backup
            const backups = await this.getBackups(path.basename(filePath));
            if (backups.length > 0) {
                console.log('Attempting to restore from backup after write failure');
                try {
                    await fs.copyFile(
                        path.join(this.backupDir, backups[0]), 
                        filePath
                    );
                } catch (restoreError) {
                    console.error('Failed to restore from backup:', restoreError);
                }
            }
            
            throw error;
        } finally {
            if (lock) this.releaseLock(lock);
            
            // Clean up temp files
            this.cleanTempFiles();
        }
    }

    /**
     * Get list of backups for a file
     */
    async getBackups(fileName) {
        try {
            const files = await fs.readdir(this.backupDir);
            return files
                .filter(f => f.startsWith(fileName + '.'))
                .sort()
                .reverse();
        } catch (error) {
            return [];
        }
    }

    /**
     * Clean temp files older than 1 hour
     */
    async cleanTempFiles() {
        try {
            const files = await fs.readdir(this.tempDir);
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            
            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = await fs.stat(filePath);
                if (stats.mtimeMs < oneHourAgo) {
                    await fs.unlink(filePath).catch(() => {});
                }
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    /**
     * Transaction support for multiple file operations
     */
    async transaction(operations) {
        const backups = [];
        const completed = [];
        
        try {
            // Create backups for all files
            for (const op of operations) {
                if (op.type === 'write') {
                    const backup = await this.createBackup(op.filePath);
                    backups.push({ filePath: op.filePath, backupPath: backup });
                }
            }
            
            // Execute all operations
            for (const op of operations) {
                if (op.type === 'write') {
                    await this.writeJSON(op.filePath, op.data, op.options);
                    completed.push(op);
                } else if (op.type === 'read') {
                    op.result = await this.readJSON(op.filePath, op.defaultValue);
                    completed.push(op);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Transaction failed, rolling back:', error);
            
            // Rollback completed operations
            for (const backup of backups) {
                if (backup.backupPath) {
                    try {
                        await fs.copyFile(backup.backupPath, backup.filePath);
                        console.log(`Rolled back: ${backup.filePath}`);
                    } catch (rollbackError) {
                        console.error(`Failed to rollback ${backup.filePath}:`, rollbackError);
                    }
                }
            }
            
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new SafeFileOps();