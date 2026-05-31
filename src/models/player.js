const client = require('../models/client.js');
const json_loader = require('../utils/json_loader.js');
const ratelimits = require('../utils/ratelimits.js');


class Player extends client.Client {
    constructor(ws, playerRole, data) {
        super(ws, data.id);
        this.role = String(playerRole);
        this.name = String(data.name).substring(0, json_loader.config.players.max_name_length);
        this.roomCode = String(data.code).toUpperCase();
        this.disconnected = false;
        this.reconnected = true;
        this.kicked = false;
        this.kickReason = null;
        this.nameCensored = false;
        this.isWaitedForInput = false;
        this.ip = ratelimits.getIP(ws);
    }
}


exports.Player = Player;