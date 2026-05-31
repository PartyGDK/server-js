const server = require('../models/server.js');
const player = require('../models/player.js');


server.Server.command_processor.on('input', player.Player, (client, data) => {
    if (!client.isWaitedForInput)
        return;

    let val = data.val;

    let room = server.Server.getRoom(client.roomCode);
    if (!room)
        return;

    room.ws.send(JSON.stringify({
        key: 'input',
        val: {
            playerId: client.id,
            data: val
        }
    }));
});