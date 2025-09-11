const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = req.body.path || '/home/user';
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get directory listing
router.get('/list', async (req, res) => {
    try {
        const dirPath = req.query.path || '/home/user';
        
        // Security check - only allow access within /home/user
        if (!dirPath.startsWith('/home/user')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const files = await fs.readdir(dirPath, { withFileTypes: true });
        
        const fileList = await Promise.all(files.map(async (file) => {
            const filePath = path.join(dirPath, file.name);
            try {
                const stats = await fs.stat(filePath);
                return {
                    name: file.name,
                    path: filePath,
                    isDirectory: file.isDirectory(),
                    size: stats.size,
                    modified: stats.mtime,
                    permissions: stats.mode
                };
            } catch (err) {
                return {
                    name: file.name,
                    path: filePath,
                    isDirectory: file.isDirectory(),
                    error: true
                };
            }
        }));

        res.json({
            path: dirPath,
            parent: path.dirname(dirPath),
            files: fileList.sort((a, b) => {
                // Directories first, then files
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            })
        });
    } catch (error) {
        console.error('Error listing directory:', error);
        res.status(500).json({ error: error.message });
    }
});

// Download file
router.get('/download', async (req, res) => {
    try {
        const filePath = req.query.path;
        
        if (!filePath || !filePath.startsWith('/home/user')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
            return res.status(400).json({ error: 'Cannot download directory' });
        }

        res.download(filePath);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete file/directory
router.delete('/delete', async (req, res) => {
    try {
        const filePath = req.body.path;
        
        if (!filePath || !filePath.startsWith('/home/user')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Prevent deleting important files
        const protectedPaths = [
            '/home/user/server.js',
            '/home/user/package.json',
            '/home/user/.env',
            '/home/user/data/users.json'
        ];

        if (protectedPaths.includes(filePath)) {
            return res.status(403).json({ error: 'Cannot delete protected file' });
        }

        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
            await fs.rmdir(filePath, { recursive: true });
        } else {
            await fs.unlink(filePath);
        }

        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create directory
router.post('/mkdir', async (req, res) => {
    try {
        const { path: dirPath, name } = req.body;
        
        if (!dirPath || !dirPath.startsWith('/home/user')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const newPath = path.join(dirPath, name);
        await fs.mkdir(newPath, { recursive: true });

        res.json({ success: true, path: newPath });
    } catch (error) {
        console.error('Error creating directory:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload file
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        res.json({ 
            success: true, 
            file: req.file.filename,
            path: req.file.path 
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Read text file content
router.get('/read', async (req, res) => {
    try {
        const filePath = req.query.path;
        
        if (!filePath || !filePath.startsWith('/home/user')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
            return res.status(400).json({ error: 'Cannot read directory' });
        }

        // Only read text files (limit size)
        if (stats.size > 1024 * 1024) { // 1MB limit
            return res.status(400).json({ error: 'File too large to read' });
        }

        const content = await fs.readFile(filePath, 'utf8');
        res.json({ content, path: filePath });
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;