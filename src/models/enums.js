const PlayerRole = {
    player: 'player',
    audience: 'audience'
};

const ConnectionType = {
    play: 'play',
    createRoom: 'createRoom',
    findRoom: 'findRoom',
    moderate: 'moderate',
    createRoomHttp: 'createRoomHttp'
};

const ConnectionClosedReason = {
    unknown: 0,
    roomDestroyed: 1,
    kickedByModerator: 2
};


exports.PlayerRole = PlayerRole;
exports.ConnectionType = ConnectionType;
exports.ConnectionClosedReason = ConnectionClosedReason;