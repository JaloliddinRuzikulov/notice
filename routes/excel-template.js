const express = require('express');
const router = express.Router();
const path = require('path');
const { saveExcelTemplate } = require('../lib/excel-generator');

// Download Excel template
router.get('/download', async (req, res) => {
    try {
        const templatePath = path.join(__dirname, '../temp', 'xodimlar-shablon.xlsx');
        
        // Ensure temp directory exists
        const fs = require('fs');
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Generate fresh template
        await saveExcelTemplate(templatePath);
        
        // Send file
        res.download(templatePath, 'xodimlar-import-shablon.xlsx', (err) => {
            if (err) {
                console.error('Template download error:', err);
                res.status(500).json({ error: 'Shablon yuklab olishda xatolik' });
            }
            
            // Clean up temp file after sending
            fs.unlink(templatePath, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });
        });
        
    } catch (error) {
        console.error('Template generation error:', error);
        res.status(500).json({ error: 'Shablon yaratishda xatolik' });
    }
});

module.exports = router;