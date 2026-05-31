const ws = require('ws');
const fs = require('fs');
const http = require('http');
const client = require('../models/client.js');
const room = require('../models/room.js');
const player = require('../models/player.js');
const moderator = require('../models/moderator.js');
const json_loader = require('../utils/json_loader.js');
const command_processor = require('../models/command_processor.js');


const server_settings = { };
if (json_loader.config.websocket.ssl.enabled) {
    server_settings.cert = fs.readFileSync(json_loader.config.websocket.ssl.cert);
    server_settings.key = fs.readFileSync(json_loader.config.websocket.ssl.key);
}

const http_server = http.createServer(server_settings);


class Server {
    static ws = new ws.WebSocketServer({ server: http_server });
    static clients = [];
    static ratelimits = {};
    static command_processor = new command_processor.CommandProcessor();


    static listen() {
        let port = Number(process.env.PORT || json_loader.config.websocket.port),
        host = process.env.HOST || json_loader.config.websocket.host;

        http_server.listen(port, host);
    }

    static getClientByWebSocket(_ws) {
        let _client = this.clients.find(c => c.ws === _ws);

        if (!_client)
            _client = new client.Client(_ws);

        return _client;
    }

    static getClientById(clientId) {
        return this.clients.find(c => c.id === clientId);
    }

    static getRoom(codeOrId) {
        return this.clients.find(c => c instanceof room.Room
            && (codeOrId === c.id || codeOrId.toUpperCase() === c.code));
    }

    static destroyClient(_client, reason) {
        if (!this.clients.find(c => c == _client))
            return;

        if (_client instanceof room.Room) {
            _client.players.forEach((p) => this.destroyClient(p));
            _client.moderators.forEach((m) => this.destroyClient(m));
        } else if (_client instanceof player.Player || _client instanceof moderator.Moderator) {
            let _room = this.getRoom(_client.roomCode);
            
            if (_room) {
                if (_client instanceof player.Player)
                    _room.players = _room.players.filter(p => p !== _client);
                else
                    _room.moderators = _room.moderators.filter(m => m !== client);
            }
        }
        
        if (_client.ws)
            this.ws.closeWithReason(_client.ws, reason);
        
        this.clients = this.clients.filter(c => c !== _client);

        console.debug(`Client ${_client.id} has been destroyed with reason: ${reason}`);
    }

    static generateRoomCode(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        length = length || json_loader.config.rooms.code_length;

        while (true) {
            let code = '';

            for (let i = 0; i < length; i++) {
                let characterIndex = Math.floor(Math.random() * chars.length);
                code += chars.charAt(characterIndex);
            }

            if (this.clients.filter(c => c instanceof room.Room && c.code == code).length == 0
                && !(code in json_loader.config.rooms.forbidden_codes))
                return code;
        }
    }
}


exports.Server = Server;
exports.http_server = http_server;