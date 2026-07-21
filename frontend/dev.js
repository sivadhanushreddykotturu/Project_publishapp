const { spawn } = require('node:child_process');

// We run the production build and start process to serve the applet statically and stably.
// This bypasses development-only on-demand chunk loading issues and fast-refresh conflicts in Next.js 15.
const child = spawn('npx next build && npx next start -p 3002 -H 0.0.0.0', {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
  }
});

child.on('close', (code) => {
  process.exit(code || 0);
});


