'use strict';

const dotenv = require('dotenv');
dotenv.config();

const config = {
    token: process.env.DISCORD_BOT_TOKEN,
    prefix: 'ccpa',
    voice: {languageCode: 'en-IN', name: 'en-IN-Wavenet-B'},
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
