class AppError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AppError';
    }
}

class ConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConnectionError';
    }
}

class CommandError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CommandError';
    }
}

class RoomError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RoomError';
    }
}


exports.AppError = AppError;
exports.ConnectionError = ConnectionError;
exports.CommandError = CommandError;
exports.RoomError = RoomError;