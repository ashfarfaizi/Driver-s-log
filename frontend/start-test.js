const { spawn } = require('child_process');

console.log('Starting React application...');

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
