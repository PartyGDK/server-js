const server = require('../models/server.js');
const client_manager = require('../utils/client_manager.js');
const ratelimits = require('../utils/ratelimits.js');
const validator = require('../utils/validator.js');
const enums = require('../models/enums.js');
const json_loader = require('../utils/json_loader.js');
const qs = require('querystring');


const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET',
    'Access-Control-Max-Age': 2592000
};


server.http_server.error = (res, code) => {
    res.writeHead(code, headers);
    res.end(JSON.stringify({
        ok: false,
        httpCode: code
    }));
};


server.http_server.on('request', (request, res) => {
    let connectionType = ratelimits.RequestType.RoomCreate;

    try {
        if (request.url.startsWith('/createRoom')) {
            if (request.method !== 'POST')
                return server.http_server.error(res, 405);

            connectionType = ratelimits.RequestType.RoomCreate;
            if (ratelimits.isRateLimited(request, connectionType))
                return server.http_server.error(res, 429);

            ratelimits.makeRequest(request, connectionType);
            
            let body = '';
            request.on('data', data => {
                body += data;

                if (body.length > 4096)
                    res.req.destroy();
            });

            request.on('end', () => {
                let post = qs.parse(body);
                
                try {
                    let validationResult = validator.validate(post, enums.ConnectionType.createRoomHttp);
                    let room = client_manager.createRoom(validationResult);

                    res.writeHead(200, headers)
                    res.end(JSON.stringify({
                        ok: true,
                        body: {
                            roomCode: room.code,
                            roomId: room.id,
                            appTag: room.appTag,
                            audienceEnabled: room.audienceEnabled,
                            moderationEnabled: room.moderationEnabled
                        }
                    }));
                } catch (ex) {
                    server.http_server.error(res, 400);
                    console.error(ex);
                }
            });
        } else if (request.url.startsWith('/findRoom') || request.url.startsWith('/getRoom')) {
            if (request.method !== 'GET')
                return server.http_server.error(res, 405);

            connectionType = ratelimits.RequestType.RoomFind;
            if (ratelimits.isRateLimited(request, connectionType))
                return server.http_server.error(res, 429);

            ratelimits.makeRequest(request, connectionType);

            let validationResult = validator.validate(request.url, enums.ConnectionType.findRoom);
            let room = server.Server.getRoom(validationResult.code);

            if (!room)
                return server.http_server.error(res, 404);

            res.writeHead(200, headers);
            res.end(JSON.stringify({
                ok: true,
                body: {
                    appTag: room.appTag,
                    appName: json_loader.getApp(room.appTag).name,
                    locked: room.locked,
                    full: room.isFull(),
                    audienceEnabled: room.audienceEnabled,
                    passwordRequired: Boolean(room.password),
                    moderationEnabled: room.moderationEnabled
                }
            }));
        } else {
            server.http_server.error(res, 404);
        }

    } catch (ex) {
        let errorCode = 500;

        if (ex.message === 'Invalid form body' || ex.message === 'App not found')
            errorCode = 400;

        server.http_server.error(res, errorCode);
    }
});