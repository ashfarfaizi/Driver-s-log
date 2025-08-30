const { spawn } = require('child_process');

console.log('Starting ELD Trip Planner Frontend...');
console.log('Note: Backend is not available, using mock data for demonstration');

// Start the React development server
const child = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('Error starting the application:', error);
});

child.on('close', (code) => {
  console.log(`Application exited with code ${code}`);
});
