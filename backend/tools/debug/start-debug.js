const { spawn } = require('child_process');

// Start server with full output
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

server.on('exit', (code, signal) => {
  console.log(`Server exited with code ${code} and signal ${signal}`);
});

// Keep the script running
process.on('SIGINT', () => {
  server.kill();
  process.exit();
});