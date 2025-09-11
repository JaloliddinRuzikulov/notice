const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    const dbPath = path.join(__dirname, '../data/xabarnoma.db');
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);
    
    try {
        // Create backup directory
        await fs.mkdir(backupDir, { recursive: true });
        
        // Create backup using SQLite backup command
        await execAsync(`sqlite3 ${dbPath} ".backup '${backupPath}'"`);
        
        console.log(`Backup created: ${backupPath}`);
        
        // Keep only last 7 days of backups
        const files = await fs.readdir(backupDir);
        const backupFiles = files.filter(f => f.startsWith('backup-'));
        
        if (backupFiles.length > 7) {
            // Sort by date and remove old ones
            backupFiles.sort();
            const toDelete = backupFiles.slice(0, backupFiles.length - 7);
            
            for (const file of toDelete) {
                await fs.unlink(path.join(backupDir, file));
                console.log(`Deleted old backup: ${file}`);
            }
        }
        
        return backupPath;
    } catch (error) {
        console.error('Backup failed:', error);
        throw error;
    }
}

// Run backup if called directly
if (require.main === module) {
    backupDatabase()
        .then(() => console.log('Backup completed'))
        .catch(err => {
            console.error('Backup error:', err);
            process.exit(1);
        });
}

module.exports = { backupDatabase };