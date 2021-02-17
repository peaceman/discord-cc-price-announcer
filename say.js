const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

const client = new textToSpeech.TextToSpeechClient();

async function googleTextToSpeech(targetFile, voice, msg) {
    const request = {
        input: {text: msg},
        audioConfig: {audioEncoding: 'OGG_OPUS'},
        voice
    };

    const [response] = await client.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(targetFile, response.audioContent, 'binary');
}

module.exports = {
    say: googleTextToSpeech
};
