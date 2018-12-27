module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   *
   * cronjob: @reboot sudo pm2 start /path/to/file/pm2.config.js
   */
  apps : [
    {
      name      : "Web-Application",
      script    : "/opt/Web-Application/server.js",
      watch     : true,
      env: {
        NODE_ENV: "development",
        COMMON_VARIABLE: "true"
      },
      env_production : {
        NODE_ENV: "production"
      }
    },
  ],
}
