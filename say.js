const { spawn } = require('child_process');

function say(targetFile, voice, msg) {
    const proc = spawn('say', ['-o', targetFile, '-v', voice, msg], { stdio: ['pipe', 'pipe', process.stderr]});

    return new Promise((resolve, reject) => {
        proc.on('exit', (code) => {
            console.debug(`say proc exited with code ${code}`);
            resolve();
        });

        proc.on('close', (code, signal) => {
            if (code !== undefined && code !== 0) {
                reject(`proc closed with non zero exit code ${code}`);
            } else {
                resolve();
            }

            console.debug(`say proc closed with code ${code} and/or signal ${signal}`);
        });

        proc.on('error', reject);
    });
}

module.exports = {
    say
};
