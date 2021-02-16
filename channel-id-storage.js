const fs = require('fs');

function ChannelIdStorage(filePath) {
    this.filePath = filePath;
}

ChannelIdStorage.prototype.getChannels = async function () {
    if (this.channels === undefined) {
        this.channels = new Set(await this.loadChannels());
    }

    return [...this.channels.values()];
};

ChannelIdStorage.prototype.loadChannels = function () {
    const readFilePromise = new Promise((resolve, reject) => {
        fs.readFile(this.filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        })
    });

    return readFilePromise
        .then(json => {
            return JSON.parse(json);
        })
        .catch(e => {
            if (e.code === 'ENOENT') {
                return [];
            }

            throw e;
        });
};

ChannelIdStorage.prototype.addChannel = async function (channelId) {
    await this.getChannels();
    if (this.channels.has(channelId)) return;

    this.channels.add(channelId);
    await this.persistChannels();
};

ChannelIdStorage.prototype.persistChannels = async function () {
    return new Promise((resolve, reject) => {
        fs.writeFile(this.filePath, JSON.stringify([...this.channels.values()]), err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
};

module.exports = {
    ChannelIdStorage,
};
