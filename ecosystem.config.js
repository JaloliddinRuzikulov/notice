module.exports = {
  apps: [{
    name: 'qashqadaryo-web',
    script: '/mnt/hdd128gb/qashqadaryo-iib-notification/server.js',
    cwd: '/mnt/hdd128gb/qashqadaryo-iib-notification',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    ignore_watch: [
      'node_modules',
      'logs',
      '.git',
      'public/audio',
      'public/audio/uploads',
      '*.log',
      '.pm2'
    ]
  }]
};