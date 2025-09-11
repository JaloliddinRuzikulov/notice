const express = require('express');
const router = express.Router();
const os = require('os');
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);
const { adminAuth } = require('../middleware/auth');

// Get system statistics - admin only
router.get('/stats', adminAuth, async (req, res) => {
    try {
        // Memory info
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        
        // Disk space info - check both root and data disk
        let diskInfo = {};
        let dataDiskInfo = {};
        
        try {
            // Root disk
            const { stdout: rootDisk } = await execFilePromise('df', ['-B1', '/']);
            const rootLines = rootDisk.trim().split('\n');
            if (rootLines.length > 1) {
                const parts = rootLines[1].split(/\s+/);
                diskInfo = {
                    total: parseInt(parts[1]),
                    used: parseInt(parts[2]),
                    available: parseInt(parts[3]),
                    usagePercent: parseInt(parts[4])
                };
            }
            
            // Check if data disk is mounted (now using /mnt/hdd128gb)
            try {
                const { stdout: dataDisk } = await execFilePromise('df', ['-B1', '/mnt/hdd128gb']);
                const dataLines = dataDisk.trim().split('\n');
                if (dataLines.length > 1) {
                    const parts = dataLines[1].split(/\s+/);
                    dataDiskInfo = {
                        total: parseInt(parts[1]),
                        used: parseInt(parts[2]),
                        available: parseInt(parts[3]),
                        usagePercent: parseInt(parts[4]),
                        mounted: true
                    };
                }
            } catch (e) {
                dataDiskInfo = { mounted: false };
            }
        } catch (error) {
            console.error('Error getting disk info:', error);
            diskInfo = {
                total: 0,
                used: 0,
                available: 0,
                usagePercent: 0
            };
        }
        
        // CPU info
        const cpus = os.cpus();
        const cpuUsage = process.cpuUsage();
        
        // System uptime
        const uptime = os.uptime();
        
        res.json({
            memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                usagePercent: Math.round((usedMemory / totalMemory) * 100)
            },
            disk: diskInfo,
            dataDisk: dataDiskInfo,
            cpu: {
                cores: cpus.length,
                model: cpus[0]?.model || 'Unknown',
                usage: cpuUsage
            },
            system: {
                platform: os.platform(),
                release: os.release(),
                uptime: uptime,
                loadAverage: os.loadavg()
            }
        });
    } catch (error) {
        console.error('Error getting system stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'System statistikalarini olishda xatolik' 
        });
    }
});

module.exports = router;