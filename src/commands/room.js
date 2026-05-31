const server = require('../models/server.js');
const room = require('../models/room.js');


server.Server.command_processor.on('lockRoom', room.Room, (client) => {
    if (client.locked)
        return server.Server.ws.error(client.ws, 'Room is already locked');

    client.locked = true;
    client.ws.send(JSON.stringify({
        ok: true,
        key: 'roomLocked',
        val: { }
    }))
});

server.Server.command_processor.on('logo', room.Room, (client, data) => {
    let recipients = server.Server.command_processor.constructor.getRecipients(client, data);

    recipients.forEach(recipient => {
        recipient.ws.send(JSON.stringify({
            key: 'logo',
            val: { }
        }));
        recipient.isWaitedForInput = false;
    });
});

server.Server.command_processor.on('input', room.Room, (client, data) => {
    let val = data.val;
    let recipients = server.Server.command_processor.constructor.getRecipients(client, data);

    recipients.forEach(recipient => {
        recipient.ws.send(JSON.stringify({
            key: 'input',
            val: val
        }));
        recipient.isWaitedForInput = true;
    });
});

server.Server.command_processor.on('moderateInput', room.Room, (client, data) => {
    let val = data.val;

    client.moderators.forEach(moderator => {
        moderator.ws.send(JSON.stringify({
            key: 'moderateInput',
            val: val
        }));
    });
});

server.Server.command_processor.on('dropInput', room.Room, (client, data) => {
    let val = data.val;

    client.moderators.forEach(moderator => {
        moderator.ws.send(JSON.stringify({
            key: 'dropInput',
            val: val
        }));
    });
});

server.Server.command_processor.on('welcomeRestoreState', room.Room, (client, data) => {
    let val = data.val;
    let moderator = client.moderators.find(m => m.id === val.id);

    if (!moderator)
        return;

    moderator.ws.send(JSON.stringify({
        key: 'welcomeRestoreState',
        val: val
    }));
});