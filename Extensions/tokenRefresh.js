const { exec } = require('child_process');

function refreshToken() {
    exec('curl -X POST http://localhost:3000/refresh', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Token refresh output: ${stdout}`);
    });
}

// Add a hook after spicetify apply
refreshToken();
