const EventEmitter = require('events');
const WebSocket = require('ws');

function BitpandaTickerConnection({uri, tradePairs}) {
    const connectionTimeout = 5000;
    const reconnectInterval = 10000;
    const eventEmitter = new EventEmitter();

    const subscribeToPriceTicks = ws => {
        const message = {
            type: "SUBSCRIBE",
            channels: [
                {
                    name: "PRICE_TICKS",
                    instrument_codes: tradePairs,
                },
            ],
        };

        ws.send(JSON.stringify(message));
    };

    const handlePriceTick = msg => {
        eventEmitter.emit('priceTick', {
            currency: msg.instrument_code.replace('_EUR', ''),
            price: Number.parseFloat(msg.price),
        });
    };

    const handlePriceTickHistory = msg => {
        for (const tick of msg.history) {
            handlePriceTick(tick);
        }
    };

    const messageHandlers = {
        "PRICE_TICK": handlePriceTick,
        "PRICE_TICK_HISTORY": handlePriceTickHistory,
    };

    const handleMessage = msg => {
        if (!(msg.type in messageHandlers)) {
            return;
        }

        (messageHandlers[msg.type])(msg);
    };

    this.open = () => {
        const ws = new WebSocket(uri);
        const timeout = setTimeout(() => ws.close(), connectionTimeout);

        ws.on('open', (event) => {
            console.log('open event', event);
            clearTimeout(timeout);

            subscribeToPriceTicks(ws);
        });

        ws.on('close', (event) => {
            console.log('close event', event);
            clearTimeout(timeout);

            setTimeout(() => {
                this.open();
            }, reconnectInterval);
        });

        ws.on('error', (event) => {
            console.warn('BitpandaTickerConnection error', event);
        });

        ws.on('message', jsonMsg => {
            try {
                const msg = JSON.parse(jsonMsg);
                handleMessage(msg);
            } catch (e) {
                if (e instanceof SyntaxError) {
                    console.error('Failed to parse Bitpanda websocket message', {error: e, jsonMsg});
                } else {
                    throw e;
                }
            }
        });
    };

    this.open();

    return eventEmitter;
}

module.exports = {
    BitpandaTickerConnection,
};
