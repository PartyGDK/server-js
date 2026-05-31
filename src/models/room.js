const json_loader = require('../utils/json_loader.js');
const client = require('../models/client.js')
const enums = require('../models/enums.js');
const errors = require('../models/errors.js');


class Room extends client.Client {
    constructor(ws, code, data) {
        super(ws);
        this.code = code.toUpperCase();
        this.appTag = data.appTag;
        this.appData = json_loader.getApp(data.appTag);
        this.audienceEnabled = Boolean(String(data.audienceEnabled).toLowerCase() === 'true' && this.appData.audience_enabled);
        this.password = data.password;
        this.moderationPassword = data.moderationPassword;
        this.moderationEnabled = Boolean(data.moderationPassword && this.appData.moderation_enabled);        
        this.players = [];
        this.moderators = [];
        this.kickEntries = [];
        this.locked = false;
        this.createdAt = Date.now();
        this.expires = Date.now() + json_loader.config.rooms.lifetime * 1000;
    }

    getPlayers(playerRole) {
        if (!playerRole)
            return this.players;

        return this.players.filter(p => p.role == playerRole);
    }

    isFull() {
        let players = this.getPlayers(enums.PlayerRole.player).filter(p => !p.kicked);
        return players.length >= this.appData.players.max;
    }

    isAudienceFull() {
        return this.getPlayers(enums.PlayerRole.audience).length >= json_loader.config.rooms.audience_limit;
    }

    isNameTaken(name) {
        return this.getPlayers(enums.PlayerRole.player)
                .filter(p => p.name.toLowerCase() === name.toLowerCase()).length > 0;
    }

    getKickEntry(data) {
        if (data.id)
            return this.kickEntries.find(x => x.id === data.id);
        if (data.ip)
            return this.kickEntries.find(x => x.ip === data.ip);

        return null;
    }

    kickPlayer(playerId, reason) {
        let player = this.players.find(p => p.id === playerId);
        if (!player)
            throw new errors.RoomError('Player not found');
        if (player.role !== enums.PlayerRole.player)
            throw new errors.RoomError('You cannot kick an audience player');
        if (player.kicked || this.getKickEntry({id: player.id}))
            throw new errors.RoomError('This player has already been kicked');

        player.kicked = true;
        player.kickReason = reason;
        this.kickEntries.push(new KickEntry(player.id, player.ip, reason));

        this.ws.send(JSON.stringify({
            key: 'playerKicked',
            val: {
                id: player.id,
                reason: reason
            }
        }));

        player.ws.send(JSON.stringify({
            key: 'playerKicked',
            val: {
                reason: reason
            }
        }));
        player.ws.close();
    }

    censorPlayerName(playerId) {
        let player = this.players.find(p => p.id === playerId);
        if (!player)
            throw new errors.RoomError('Player not found');
        if (player.role !== enums.PlayerRole.player)
            throw new errors.RoomError('You cannot censor name of an audience player');
        if (player.nameCensored)
            throw new errors.RoomError('This player\'s name has already been censored');

        player.nameCensored = true;
        this.ws.send(JSON.stringify({
            key: 'nameCensored',
            val: {
                id: player.id,
                name: player.name
            }
        }));
    }
}

class KickEntry {
    constructor(id, ip, reason) {
        this.id = id;
        this.ip = ip;
        this.reason = reason;
    }
}


exports.Room = Room;