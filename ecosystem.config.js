module.exports = {
  apps: [
    {
      name: "nextjs-premier",
      cwd: "apps/premier-printing", // Point to the web app's directory
      script: "node_modules/next/dist/bin/next", // Use Next.js binary
      args: "start -p 3000", // Start on port 3000
      exec_mode: "cluster", // Enable cluster mode to use multiple CPUs
      instances: "5", // Use all available CPU cores
      env: {
        NODE_ENV: "production", // Set production environment
      },
      output: null, // Output log file
      error: null, // Error log file
      merge_logs: true,
      log_rotate: true,
      max_size: "10M",
      retain: "3",
      log_date_format: "YYYY-MM-DD HH:mm Z",

      max_memory_restart: "5G",
      max_restarts: 10,
      min_uptime: "30s",
      cron_restart: "0 9 * * *", //9am UTC is 4AM EST
    },
    {
      name: "nextjs-pythias",
      cwd: "apps/pythias", // Point to the web app's directory
      script: "node_modules/next/dist/bin/next", // Use Next.js binary
      args: "start -p 3002", // Start on port 3000
      exec_mode: "cluster", // Enable cluster mode to use multiple CPUs
      instances: "1", // Use all available CPU cores
      env: {
        NODE_ENV: "production", // Set production environment
      },
      output: null, // Output log file
      error: null, // Error log file
      merge_logs: true,
      log_rotate: true,
      max_size: "10M",
      retain: "10",
      log_date_format: "YYYY-MM-DD HH:mm Z",

      max_memory_restart: "5G",
      max_restarts: 10,
      min_uptime: "30s",
      cron_restart: "0 9 * * *", //9am UTC is 4AM EST
    },
    {
      name: "nextjs-printthreads",
      cwd: "apps/printthreads", // Point to the web app's directory
      script: "node_modules/next/dist/bin/next", // Use Next.js binary
      args: "start -p 3003", // Start on port 3000
      exec_mode: "cluster", // Enable cluster mode to use multiple CPUs
      instances: "1", // Use all available CPU cores
      env: {
        NODE_ENV: "production", // Set production environment
      },
      output: null, // Output log file
      error: null, // Error log file
      merge_logs: true,
      log_rotate: true,
      max_size: "10M",
      retain: "10",
      log_date_format: "YYYY-MM-DD HH:mm Z",

      max_memory_restart: "5G",
      max_restarts: 10,
      min_uptime: "30s",
      cron_restart: "0 9 * * *", //9am UTC is 4AM EST
    },
    {
      name: "nextjs-po",
      cwd: "apps/po", // Point to the web app's directory
      script: "node_modules/next/dist/bin/next", // Use Next.js binary
      args: "start -p 3001", // Start on port 3000
      exec_mode: "cluster", // Enable cluster mode to use multiple CPUs
      instances: "5", // Use all available CPU cores
      env: {
        NODE_ENV: "production", // Set production environment
      },
      output: null, // Output log file
      error: null, // Error log file
      merge_logs: true,
      log_rotate: true,
      max_size: "10M",
      retain: "10",
      log_date_format: "YYYY-MM-DD HH:mm Z",

      max_memory_restart: "5G",
      max_restarts: 10,
      min_uptime: "30s",
      cron_restart: "0 9 * * *", //9am UTC is 4AM EST
    },
    {
      name: "pull-orders",
      cwd: "apps/premier-printing",
      script: "scripts/runPullOrders.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: false,
      cron_restart: "0 * * * *", // every hour
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      out_file: "logs/pull-orders-out.log",
      error_file: "logs/pull-orders-error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
    {
      name: "tracking-premier-printing",
      cwd: "apps/premier-printing",
      script: "scripts/runTracking.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: false,
      cron_restart: "0 */6 * * *", // every 6 hours
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      out_file: "logs/tracking-premier-out.log",
      error_file: "logs/tracking-premier-error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
    {
      name: "tracking-po",
      cwd: "apps/po",
      script: "scripts/runTracking.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: false,
      cron_restart: "0 */6 * * *", // every 6 hours
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      out_file: "logs/tracking-po-out.log",
      error_file: "logs/tracking-po-error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
    {
      name: "blanks-forecast-premier",
      cwd: "apps/premier-printing",
      script: "scripts/runBlankForecast.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: false,
      cron_restart: "0 */4 * * *", // every 4 hours
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      out_file: "logs/blanks-forecast-premier-out.log",
      error_file: "logs/blanks-forecast-premier-error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
    {
      name: "blanks-forecast-printthreads",
      cwd: "apps/printthreads",
      script: "scripts/runBlankForecast.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: false,
      cron_restart: "0 */4 * * *", // every 4 hours
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3003,
      },
      out_file: "logs/blanks-forecast-printthreads-out.log",
      error_file: "logs/blanks-forecast-printthreads-error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
    {
      name: "blanks-forecast-po",
      cwd: "apps/po",
      script: "scripts/runBlankForecast.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: false,
      cron_restart: "0 */4 * * *", // every 4 hours
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      out_file: "logs/blanks-forecast-po-out.log",
      error_file: "logs/blanks-forecast-po-error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
    {
      name: "forecast-premier",
      cwd: "apps/premier-printing",
      script: "scripts/runForecast.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: false,
      cron_restart: "0 */4 * * *", // every 4 hours
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      out_file: "logs/forecast-premier-out.log",
      error_file: "logs/forecast-premier-error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
    {
      name: "forecast-printthreads",
      cwd: "apps/printthreads",
      script: "scripts/runForecast.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: false,
      cron_restart: "0 */4 * * *", // every 4 hours
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3003,
      },
      out_file: "logs/forecast-printthreads-out.log",
      error_file: "logs/forecast-printthreads-error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
    {
      name: "forecast-po",
      cwd: "apps/po",
      script: "scripts/runForecast.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: false,
      cron_restart: "0 */4 * * *", // every 4 hours
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      out_file: "logs/forecast-po-out.log",
      error_file: "logs/forecast-po-error.log",
      merge_logs: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
  ],
};
  