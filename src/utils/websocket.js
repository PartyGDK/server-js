const server = require('../models/server.js');
const client_manager = require('../utils/client_manager.js');
const validator = require('../utils/validator.js');
const enums = require('../models/enums.js');
const ratelimits = require('../utils/ratelimits.js');


server.Server.ws.error = function(ws, message, closeConnection) {
    ws.send(JSON.stringify({
        ok: false,
        error: message
    }));

    if (closeConnection || false)
        ws.close();
}

server.Server.ws.closeWithReason = function(ws, reason) {
    ws.send(JSON.stringify({
        key: 'connectionClosed',
        val: {
            code: reason
        }
    }));

    ws.close();
}

server.Server.ws.on('connection', function connection(ws, request) {
    try {
        if (!ratelimits.makeRequest(ws, ratelimits.RequestType.WSOpen))
            return;

        ws.on('error', console.error);
        ws.on('close', () => client_manager.onClose(ws));
        ws.on('message', (data, isBinary) => onMessage(ws, isBinary ? data.toString() : data));

        let connectionType;

        if (request.url.startsWith('/createRoom?')) {
            connectionType = enums.ConnectionType.createRoom;
        } else if (request.url.startsWith('/play?')) {
            connectionType = enums.ConnectionType.play;
        } else if (request.url.startsWith('/moderate?')) {
            connectionType = enums.ConnectionType.moderate;
        } else if (!connectionType) {
            return server.Server.ws.error(ws, 'Invalid path', true);
        }

        try {
            let validationResult = validator.validate(request.url, connectionType);

            switch (connectionType) {
                case enums.ConnectionType.createRoom:
                    client_manager.activateRoom(ws, validationResult);
                    break;

                case enums.ConnectionType.play:
                    client_manager.joinPlayer(ws, validationResult);
                    break;

                case enums.ConnectionType.moderate:
                    client_manager.joinModerator(ws, validationResult);
            }
        } catch (ex) {
            server.Server.ws.error(ws, ex.message, true);
        }
    } catch (ex) {
        console.error(ex);
        ws.close()
    }
});

function onMessage(ws, data) {
    if (!ratelimits.makeRequest(ws, ratelimits.RequestType.WSMessage))
        return;

    try {
        server.Server.command_processor.execute(server.Server.getClientByWebSocket(ws), JSON.parse(data));
    } catch (ex) {
        console.error(ex.message);
    }
}