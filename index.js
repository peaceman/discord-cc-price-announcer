'use strict';

const config = require('./config.js');


const Discord = require('discord.js');
const { ChannelIdStorage } = require('./channel-id-storage');
const { BitpandaTickerConnection } = require('./bitpanda');
const { say } = require('./say');
const fs = require('fs');
const temp = require('temp');


const channelIds = new ChannelIdStorage('channels.json');
const voiceConnections = new Map();
const exchangeRates = {};

const tickerConnection = new BitpandaTickerConnection(config.ticker.bitpanda);
tickerConnection.on('priceTick', ({currency, price}) => exchangeRates[currency] = price);

const client = new Discord.Client();

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
    announce: async (msg, args) => {
        const guild = msg.guild;
        if (!guild) return;

        console.log(`announce prices in guild ${guild.name}`);
        announcePrices(guild);
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

async function announcePrices(guild) {
    const data = await joinRegisteredVoiceChannels(guild);

    for (const [currency, price] of Object.entries(exchangeRates)) {
        console.log(currency, price);

        // generate sound file
        const filePath = temp.path();
        const text = `current price of ${currency} is ${price} eur`;

        await say(filePath, config.voice, text);

        const playSoundPromises = data
            .map(([channel, connection]) => {
                return playSound(filePath, connection)
                    .then(() => {
                        console.log(`played sound at ${channel.guild.name} / ${channel.name}`);
                    });
            });

        await Promise.allSettled(playSoundPromises);

        fs.rm(filePath, (e) => {
            if (e) {
                console.error('failed to delete sound file', filePath);
            }
        });
    }

    // leave joined channels
    for (const [channel, connection] of data) {
        connection.disconnect();
    }
}
