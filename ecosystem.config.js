module.exports = {
    apps: [
      {
        name: "nextjs-web",
        cwd: "apps/premier-printing", // Point to the web app's directory
        script: "node_modules/next/dist/bin/next", // Use Next.js binary
        args: "start -p 3000", // Start on port 3000
        exec_mode: "cluster", // Enable cluster mode to use multiple CPUs
        instances: "23", // Use all available CPU cores
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
        name: "nextjs-web",
        cwd: "apps/pythias", // Point to the web app's directory
        script: "node_modules/next/dist/bin/next", // Use Next.js binary
        args: "start -p 3002", // Start on port 3000
        exec_mode: "cluster", // Enable cluster mode to use multiple CPUs
        instances: "2", // Use all available CPU cores
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
        name: "nextjs-web",
        cwd: "apps/po", // Point to the web app's directory
        script: "node_modules/next/dist/bin/next", // Use Next.js binary
        args: "start -p 3001", // Start on port 3000
        exec_mode: "cluster", // Enable cluster mode to use multiple CPUs
        instances: "7", // Use all available CPU cores
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
    ],
  };
  