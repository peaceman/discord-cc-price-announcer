'use strict';

const Discord = require('discord.js');
const fs = require('fs');
const temp = require('temp');

const config = require(`${process.cwd()}/config.js`);
const { ChannelIdStorage } = require('./channel-id-storage');
const { BitpandaTickerConnection } = require('./bitpanda');
const { say } = require('./say');

const channelIds = new ChannelIdStorage([config.channelStorageFolder, 'channels.json'].filter(v => v.length > 0).join('/'));
const voiceConnections = new Map();
const exchangeRates = {};

const tickerConnection = new BitpandaTickerConnection(config.ticker.bitpanda);
tickerConnection.on('priceTick', ({currency, price}) => exchangeRates[currency] = price);

const client = new Discord.Client();
const announcementLocks = new WeakMap();

client.once('ready', async () => {
    console.log('Established discord connection');
});

client.on('message', dispatchMessageToCommandHandler);
client.login(config.token);

const commandHandlers = {
    register: async (msg, args) => {
        console.log('recieved register message with args', args);

        const guild = msg.guild;
        if (!guild) return;

        const voiceChannel = msg.member.voice.channel;

        channelIds.addChannel(voiceChannel.id);
    },
    unregister: async (msg, args) => {
        console.log('received unregister message with args', args);

        const guild = msg.guild;
        if (!guild) return;

        const voiceChannel = msg.member.voice.channel;

        channelIds.removeChannel(voiceChannel.id);
    },
    announce: async (msg, args) => {
        const guild = msg.guild;
        if (!guild) return;

        console.log(`announce something in guild ${guild.name}`);
        announce(guild, args);
    },
};

function joinRegisteredVoiceChannels(guild) {
    return channelIds.getChannels()
        .then(channels => channels.map(channelId => client.channels.fetch(channelId)))
        .then(fetchChannelPromises => Promise.allSettled(fetchChannelPromises))
        .then(results => results
            .filter(p => p.status === 'fulfilled')
            .map(p => p.value))
        .then(channels => {
            return guild
                ? channels.filter(ch => ch.guild.id === guild.id)
                : channels;
        })
        .then(channels => {
            const joinChannelPromises = channels.map(c => c.join());

            return Promise.allSettled(joinChannelPromises)
                .then(results => results
                    .map((e, i) => [channels[i], e])
                    .filter(([channel, conPromise]) => conPromise.status === 'fulfilled')
                    .map(([channel, conPromise]) => [channel, conPromise.value]));
        });
}

function playSound(filePath, voiceConnection) {
    return new Promise((resolve, reject) => {
        const dispatcher = voiceConnection.play(filePath);

        dispatcher.on('speaking', (val) => {
            if (!val) resolve();
        });
    });
}

async function dispatchMessageToCommandHandler(message) {
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command in commandHandlers) {
        await (commandHandlers[command])(message, args);
    }
}

function createAnnouncementLock() {
    let resolve = undefined;
    const promise = new Promise(x => resolve = x);

    return [promise, resolve]
}

async function announce(guild, words = []) {
    const currentLock = announcementLocks.get(guild) || Promise.resolve();
    const [myLock, resolveLock] = createAnnouncementLock();

    announcementLocks.set(guild, myLock);
    await currentLock;

    // when the first word is 'custom' announce all remaining words as is
    if (words.length > 0 && (words[0] || '') === 'custom') {
        await announceWords(guild, words.slice(1));
    } else {
        await announcePrices(guild, words);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    resolveLock();
}

async function announceWords(guild, words = []) {
    const message = words.join(' ');

    // generate sound file
    const messageFilePath = temp.path();
    await say(messageFilePath, config.voice, message);

    try {

    } finally {
        const data = await joinRegisteredVoiceChannels(guild);
        await playSoundFileInChannels(data, messageFilePath);

        leaveVoiceChannels(data);
        deleteSoundFile(messageFilePath)
            .catch(console.error);
    }
}

async function announcePrices(guild, currencies = []) {
    currencies = currencies.map(s => String(s).toLowerCase());
    console.log('requested currencies', currencies);
    const data = await joinRegisteredVoiceChannels(guild);

    const announcementPrefixFilePath = temp.path();
    const announcementSuffixFilePath = temp.path();

    await Promise.all([
        say(announcementPrefixFilePath, config.voice, config.announcement.prefix),
        say(announcementSuffixFilePath, config.voice, config.announcement.suffix),
    ]);

    await playSoundFileInChannels(data, announcementPrefixFilePath);

    for (const [currency, price] of Object.entries(exchangeRates)) {
        if (currencies.length && !(currencies.includes(currency.toLowerCase().trim()))) {
            continue;
        }

        console.log(currency, price);

        // generate sound file
        const filePath = temp.path();
        const text = `current price of ${currency} is ${price} EUR`;

        await say(filePath, config.voice, text);
        await playSoundFileInChannels(data, filePath);

        deleteSoundFile(filePath)
            .catch(console.error);
    }

    await playSoundFileInChannels(data, announcementSuffixFilePath);

    deleteSoundFile(announcementPrefixFilePath)
        .catch(console.error);
    deleteSoundFile(announcementSuffixFilePath)
        .catch(console.error);

    leaveVoiceChannels(data);
}

function leaveVoiceChannels(data) {
    // leave joined channels
    for (const [channel, connection] of data) {
        console.debug('leave channel', channel.name);
        connection.disconnect();
    }
}

async function deleteSoundFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.rm(filePath, e => {
            if (e) {
                reject(e);
            } else {
                resolve();
            }
        });
    });
}

async function playSoundFileInChannels(data, filePath) {
    return Promise.allSettled(
        data
            .map(([channel, connection]) => {
                return playSound(filePath, connection)
                    .then(() => {
                        console.log(`finished playing sound ${filePath}`);
                    });
            })
    );
}
