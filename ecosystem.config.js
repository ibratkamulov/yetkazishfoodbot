module.exports = {
  apps: [
    {
      name: 'fastfood-bot',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      time: true,
      autorestart: true,
      watch: false,
    },
  ],
};
