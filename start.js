const { spawnSync, spawn } = require('child_process');

// Start the HTTP server, for some reason it only works if I first start the server, and then the build
try {
    const serverProcess = spawn('node', ['html-kit/server.js'], { stdio: 'inherit' });

    serverProcess.on('error', (err) => {
        console.error('Failed to start server process:', err);
    });

    serverProcess.on('exit', (code) => {
        console.log(`Server process exited with code ${code}`);
    });

    // Handle process exit
    process.on('exit', () => {
        console.log('Server process killed');
        serverProcess.kill();
    });

    console.log('Server process started successfully.');
} catch (error) {
    console.error('Error starting server process:', error);
}

// Run the build process synchronously before starting the server
const buildResult = spawnSync('node', ['html-kit/build.js'], { stdio: 'inherit' });

if (buildResult.status !== 0) {
    console.error('Build process failed.');
    process.exit(1); // Exit if the build fails
}

console.log('Build process completed successfully. Starting server...');
