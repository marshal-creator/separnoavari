// PM2 Ecosystem Configuration for Separ Noavari Server
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'separnoavari-server',
    script: './index.mjs',
    cwd: '/srv/separnoavari/separnoavari/server',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10
  }]
};

