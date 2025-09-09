module.exports = {
  apps: [
    {
      name: 'lynx-portfolio-back',
      script: 'index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        DOTENV_CONFIG_QUIET: 'true'
      }
    }
  ]
};
