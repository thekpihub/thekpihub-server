module.exports = {
  apps: [
    {
      name: 'ditto-wingman',
      cwd: '/var/www/ditto-wingman',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/ditto-wingman-error.log',
      out_file: '/var/log/ditto-wingman-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
