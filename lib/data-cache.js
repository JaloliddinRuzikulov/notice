const fs = require('fs').promises;
const path = require('path');

class DataCache {
    constructor() {
        this.cache = new Map();
        this.lastModified = new Map();
    }

    async getFileData(filePath, parseJson = true) {
        try {
            const stats = await fs.stat(filePath);
            const mtime = stats.mtime.getTime();
            
            // Check if cached and not modified
            if (this.cache.has(filePath) && this.lastModified.get(filePath) === mtime) {
                console.log(`[Cache] Using cached data for ${path.basename(filePath)}`);
                return this.cache.get(filePath);
            }
            
            // Read and cache new data
            console.log(`[Cache] Reading fresh data for ${path.basename(filePath)}`);
            const data = await fs.readFile(filePath, 'utf8');
            const result = parseJson ? JSON.parse(data) : data;
            
            this.cache.set(filePath, result);
            this.lastModified.set(filePath, mtime);
            
            return result;
        } catch (error) {
            console.error(`[Cache] Error reading ${filePath}:`, error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
        this.lastModified.clear();
        console.log('[Cache] Cache cleared');
    }

    removeFromCache(filePath) {
        this.cache.delete(filePath);
        this.lastModified.delete(filePath);
        console.log(`[Cache] Removed ${path.basename(filePath)} from cache`);
    }
}

// Singleton instance
const dataCache = new DataCache();
module.exports = dataCache;