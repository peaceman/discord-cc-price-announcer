'use strict';

const dotenv = require('dotenv');
dotenv.config();

const config = {
    token: process.env.DISCORD_BOT_TOKEN,
    prefix: 'ccpa',
    voice: 'samantha',
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
