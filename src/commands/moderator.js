const server = require('../models/server.js');
const enums = require('../models/enums.js');
const errors = require('../models/errors.js');
const moderator = require('../models/moderator.js');


server.Server.command_processor.on('moderateInput', moderator.Moderator, (client, data) => {
    let val = data.val;

    let room = server.Server.getRoom(client.roomCode);
    if (!room)
        return;

    room.ws.send(JSON.stringify({
        key: 'inputModerated',
        val: val
    }));

    room.moderators.forEach(m => m.ws.send(JSON.stringify({
        key: 'inputModerated',
        val: val
    })));
});

server.Server.command_processor.on('censorName', moderator.Moderator, (client, data) => {
    let val = data.val;

    let room = server.Server.getRoom(client.roomCode);
    if (!room)
        return;

    let player = room.getPlayers(enums.PlayerRole.player).find(p => p.name === val.name);

    try {
        if (!player)
            throw new errors.CommandError('Player not found');

        room.censorPlayerName(player.id);
        room.moderators.forEach(m => m.ws.send(JSON.stringify({
            key: 'nameCensored',
            val: val
        })));
    } catch (ex) {
        server.Server.ws.error(client.ws, ex.message);
    }
});

server.Server.command_processor.on('kickPlayer', moderator.Moderator, (client, data) => {
    let val = data.val;

    let room = server.Server.getRoom(client.roomCode);
    if (!room)
        return;

    let player = room.getPlayers(enums.PlayerRole.player).find(p => p.name === val.name);

    try {
        if (!player)
            throw new errors.CommandError('Player not found');
        
        room.kickPlayer(player.id, val.reason);
        room.moderators.forEach(m => m.ws.send(JSON.stringify({
            key: 'playerKicked',
            val: val
        })));
    } catch (ex) {
        server.Server.ws.error(client.ws, ex.message);
    }
});