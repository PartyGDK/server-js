const client = require('../models/client.js');


class Moderator extends client.Client {
    constructor(ws, data) {
        super(ws);
        this.roomCode = String(data.code).toUpperCase();
    }
}


exports.Moderator = Moderator;