'use strict';

const dotenv = require('dotenv');
dotenv.config();

const config = {
    token: process.env.DISCORD_BOT_TOKEN,
    prefix: 'ccpa',
    voice: {languageCode: 'en-GB', name: 'en-GB-Wavenet-B'},
    announcement: {
        prefix: '<emphasis level="strong">ANNOUNCEMENT</emphasis><emphasis level="strong">ANNOUNCEMENT</emphasis>',
        suffix: 'thanks for listening',
    },
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
