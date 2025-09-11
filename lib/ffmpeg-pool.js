const { spawn } = require('child_process');
const EventEmitter = require('events');

class FFmpegPool extends EventEmitter {
    constructor(options = {}) {
        super();
        this.maxProcesses = options.maxProcesses || 5;
        this.processes = [];
        this.queue = [];
        this.activeJobs = new Map();
    }

    async processAudio(jobId, args, onData) {
        return new Promise((resolve, reject) => {
            const job = {
                id: jobId,
                args: args,
                onData: onData,
                resolve: resolve,
                reject: reject,
                startTime: Date.now()
            };

            this.queue.push(job);
            this.processQueue();
        });
    }

    processQueue() {
        while (this.queue.length > 0 && this.processes.length < this.maxProcesses) {
            const job = this.queue.shift();
            this.startProcess(job);
        }
    }

    startProcess(job) {
        console.log(`[FFmpegPool] Starting process for job ${job.id}`);
        
        const ffmpeg = spawn('ffmpeg', job.args);
        const processInfo = {
            process: ffmpeg,
            job: job,
            startTime: Date.now()
        };
        
        this.processes.push(processInfo);
        this.activeJobs.set(job.id, processInfo);

        // Handle stdout data
        ffmpeg.stdout.on('data', (data) => {
            if (job.onData) {
                job.onData(data);
            }
        });

        // Handle stderr for logging
        let stderrBuffer = '';
        ffmpeg.stderr.on('data', (data) => {
            stderrBuffer += data.toString();
        });

        // Handle process completion
        ffmpeg.on('close', (code) => {
            console.log(`[FFmpegPool] Process for job ${job.id} finished with code ${code}`);
            
            // Remove from active processes
            this.processes = this.processes.filter(p => p !== processInfo);
            this.activeJobs.delete(job.id);
            
            if (code === 0) {
                job.resolve({
                    success: true,
                    duration: Date.now() - job.startTime
                });
            } else {
                job.reject(new Error(`FFmpeg failed with code ${code}: ${stderrBuffer}`));
            }
            
            // Process next in queue
            this.processQueue();
        });

        ffmpeg.on('error', (err) => {
            console.error(`[FFmpegPool] Process error for job ${job.id}:`, err);
            this.processes = this.processes.filter(p => p !== processInfo);
            this.activeJobs.delete(job.id);
            job.reject(err);
            this.processQueue();
        });
    }

    stopJob(jobId) {
        const processInfo = this.activeJobs.get(jobId);
        if (processInfo) {
            console.log(`[FFmpegPool] Stopping job ${jobId}`);
            processInfo.process.kill('SIGTERM');
            return true;
        }
        
        // Also check queue
        this.queue = this.queue.filter(job => job.id !== jobId);
        return false;
    }

    getStats() {
        return {
            activeProcesses: this.processes.length,
            queueLength: this.queue.length,
            maxProcesses: this.maxProcesses,
            activeJobs: Array.from(this.activeJobs.keys())
        };
    }

    shutdown() {
        console.log('[FFmpegPool] Shutting down...');
        
        // Clear queue
        this.queue = [];
        
        // Kill all active processes
        for (const processInfo of this.processes) {
            processInfo.process.kill('SIGTERM');
        }
        
        this.processes = [];
        this.activeJobs.clear();
    }
}

module.exports = FFmpegPool;