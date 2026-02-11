module.exports = {
  apps: [
    {
      name: 'leadpulse-web',
      cwd: '/data/.openclaw/workspace/leadpulse/apps/web',
      script: 'npm',
      args: 'run start -- -H 0.0.0.0 -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/data/.openclaw/workspace/leadpulse/logs/web.error.log',
      out_file: '/data/.openclaw/workspace/leadpulse/logs/web.out.log',
      merge_logs: true,
    },
  ],
};
