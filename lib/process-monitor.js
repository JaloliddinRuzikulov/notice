const { exec } = require('child_process');
const EventEmitter = require('events');

class ProcessMonitor extends EventEmitter {
    constructor() {
        super();
        this.monitoringInterval = null;
        this.maxFFmpegProcesses = 20; // Increased from 10 to 20 for broadcasts
        this.memoryThreshold = 80; // Alert if memory usage > 80%
    }
    
    start(interval = 30000) { // Check every 30 seconds
        console.log('[ProcessMonitor] Starting monitoring...');
        
        this.monitoringInterval = setInterval(() => {
            this.checkProcesses();
            this.checkMemory();
        }, interval);
        
        // Initial check
        this.checkProcesses();
        this.checkMemory();
    }
    
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
    
    checkProcesses() {
        // Count FFmpeg processes
        exec('ps aux | grep ffmpeg | grep -v grep | wc -l', (err, stdout) => {
            if (err) return;
            
            const ffmpegCount = parseInt(stdout.trim()) || 0;
            
            if (ffmpegCount > this.maxFFmpegProcesses) {
                console.warn(`[ProcessMonitor] WARNING: ${ffmpegCount} FFmpeg processes running!`);
                this.emit('high-ffmpeg-count', ffmpegCount);
                
                // Kill zombie FFmpeg processes older than 5 minutes
                this.killOldFFmpeg();
            }
        });
    }
    
    checkMemory() {
        exec('free -m | grep Mem:', (err, stdout) => {
            if (err) return;
            
            const parts = stdout.trim().split(/\s+/);
            const total = parseInt(parts[1]) || 0;
            const used = parseInt(parts[2]) || 0;
            const usage = (used / total * 100).toFixed(1);
            
            if (usage > this.memoryThreshold) {
                console.warn(`[ProcessMonitor] WARNING: Memory usage at ${usage}%`);
                this.emit('high-memory', { usage, total, used });
            }
        });
    }
    
    killOldFFmpeg() {
        // Find and kill FFmpeg processes older than 5 minutes
        const cmd = `ps aux | grep ffmpeg | grep -v grep | awk '{print $2, $10}' | while read pid time; do
            # Convert time to seconds
            if [[ $time =~ ([0-9]+):([0-9]+) ]]; then
                minutes=\${BASH_REMATCH[1]}
                seconds=\${BASH_REMATCH[2]}
                total_seconds=$((minutes * 60 + seconds))
                if [ $total_seconds -gt 300 ]; then
                    echo "Killing old FFmpeg process $pid (runtime: $time)"
                    kill -9 $pid 2>/dev/null
                fi
            fi
        done`;
        
        exec(cmd, { shell: '/bin/bash' }, (err, stdout) => {
            if (stdout) {
                console.log('[ProcessMonitor]', stdout.trim());
            }
        });
    }
    
    // Get current stats
    async getStats() {
        return new Promise((resolve) => {
            const stats = {};
            
            // Get FFmpeg count
            exec('ps aux | grep ffmpeg | grep -v grep | wc -l', (err, stdout) => {
                stats.ffmpegProcesses = parseInt(stdout.trim()) || 0;
                
                // Get memory usage
                exec('free -m | grep Mem:', (err, stdout) => {
                    if (stdout) {
                        const parts = stdout.trim().split(/\s+/);
                        stats.memory = {
                            total: parseInt(parts[1]) || 0,
                            used: parseInt(parts[2]) || 0,
                            free: parseInt(parts[3]) || 0,
                            usage: ((parseInt(parts[2]) || 0) / (parseInt(parts[1]) || 1) * 100).toFixed(1)
                        };
                    }
                    
                    // Get Node.js memory
                    const nodeMemory = process.memoryUsage();
                    stats.nodeMemory = {
                        heapUsed: (nodeMemory.heapUsed / 1024 / 1024).toFixed(2),
                        heapTotal: (nodeMemory.heapTotal / 1024 / 1024).toFixed(2),
                        rss: (nodeMemory.rss / 1024 / 1024).toFixed(2)
                    };
                    
                    resolve(stats);
                });
            });
        });
    }
}

module.exports = ProcessMonitor;