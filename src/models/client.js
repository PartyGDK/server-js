const json_loader = require('../utils/json_loader.js');
const crypto = require('crypto');


class Client {
    constructor(ws, id) {
        this.ws = ws;
        this.id = crypto.randomUUID() || id;
        this.requests_left = json_loader.config.websocket.ratelimits.requests;
        this.next_refresh = Date.now() + json_loader.config.websocket.ratelimits.refresh_interval * 1000;
    }

    isRateLimited() {
        if (Date.now() >= this.next_refresh) {
            this.requests_left = json_loader.config.websocket.ratelimits.requests;
            this.next_refresh = Date.now() + json_loader.config.websocket.ratelimits.refresh_interval * 1000;
        }

        return this.requests_left <= 0;
    }
}


exports.Client = Client;