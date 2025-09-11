const path = require('path');
const fs = require('fs');

// Check if running on new disk
const dataPath = fs.existsSync('/mnt/data/qashqadaryo-iib') 
    ? '/mnt/data/qashqadaryo-iib'
    : path.join(__dirname, '..');

module.exports = {
    // Data directories
    dataDir: path.join(dataPath, 'data'),
    logsDir: path.join(dataPath, 'logs'),
    uploadsDir: path.join(dataPath, 'uploads'),
    tempDir: path.join(dataPath, 'temp'),
    
    // Ensure directories exist
    ensureDirectories: function() {
        const dirs = [this.dataDir, this.logsDir, this.uploadsDir, this.tempDir];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
};