'use strict';

const dotenv = require('dotenv');
dotenv.config();

const config = {
    token: process.env.DISCORD_BOT_TOKEN,
    prefix: 'ccpa',
    voice: {languageCode: 'en-GB', name: 'en-GB-Wavenet-B'},
    announcement: {
        prefix: '<emphasis level="strong">ATTENTION</emphasis><emphasis level="strong">ANNOUNCEMENT</emphasis>',
        suffix: "<s>thanks for listening</s><s>and i'll see you soon</s>",
    },
    channelStorageFolder: process.env.CHANNEL_STORAGE_FOLDER || '',
    ticker: {
        bitpanda: {
            uri: 'wss://streams.exchange.bitpanda.com',
            tradePairs: [
                'BTC_EUR',
                'MIOTA_EUR',
            ]
        }
    },
};

module.exports = config;
