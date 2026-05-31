const json_loader = require('../utils/json_loader.js');
const server = require('../models/server.js');


const RequestType = {
    RoomCreate: 'room_create',
    RoomFind: 'room_find',
    WSOpen: 'ws_open',
    WSMessage: 'ws_message'
};


function areRateLimitsDisabled() {
    return json_loader.config.websocket.ratelimits.enabled === false;
}


function getIP(request) {
    if (request._socket)
        return request._socket.remoteAddress;

    if (request.connection.socket)
        return request.connection.socket.remoteAddress;

    return request.connection.remoteAddress;
}


function getRequestsLeft(request, type) {
    let ip = getIP(request);

    let defaultLimits = json_loader.config.websocket.ratelimits[type];
    if (!server.Server.ratelimits[ip])
        server.Server.ratelimits[ip] = { };

    let requestData = server.Server.ratelimits[ip][type] || { };
    if (Date.now() >= (requestData.nextRefresh || 0)) {
        server.Server.ratelimits[ip][type] = {
            requestsLeft: defaultLimits.requests,
            nextRefresh: Date.now() + defaultLimits.interval * 1000
        }
    }

    return server.Server.ratelimits[ip][type].requestsLeft;
}

function isRateLimited(request, type) {
    return !areRateLimitsDisabled() && getRequestsLeft(request, type) <= 0;
}

function makeRequest(request, type) {
    if (areRateLimitsDisabled())
        return true;

    let ip = getIP(request);

    if (!isRateLimited(request, type)) {
        server.Server.ratelimits[ip][type].requestsLeft--;
        return true;
    }

    switch (type) {
        case RequestType.WSMessage:
            server.Server.ws.error(request, 'You are being rate limited');
            break;

        case RequestType.WSOpen:
            server.Server.ws.error(request, 'You are being rate limited', true);
            break;
    }

    return false;
}

function clearRequestData() {
    Object.entries(server.Server.ratelimits).forEach(entry => {
        let address = entry[0],
        data = entry[1];

        Object.entries(data).forEach(dataEntry => {
            if (Date.now() >= dataEntry[1].nextRefresh)
                delete server.Server.ratelimits[address][dataEntry[0]];
        });

        if (Object.keys(server.Server.ratelimits[address]).length === 0)
            delete server.Server.ratelimits[address];
    });
}


setInterval(clearRequestData, json_loader.config.websocket.ratelimits_cleanup_interval * 1000);


exports.RequestType = RequestType;
exports.getIP = getIP;
exports.getRequestsLeft = getRequestsLeft;
exports.isRateLimited = isRateLimited;
exports.makeRequest = makeRequest;