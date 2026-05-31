const enums = require('../models/enums.js');


class Command {
    constructor(key, clientType, func) {
        this.key = key;
        this.clientType = clientType;
        this.func = func;
    }

    execute(client, val) {
        return this.func(client, val);
    }
}


class CommandProcessor {
    constructor() {
        this.commands = [];
    }

    on(key, clientType, func) {
        this.commands.push(new Command(key, clientType, func));
    }

    execute(client, data) {
        this.commands.forEach((command) => {
            if (client instanceof command.clientType && data.key === command.key)
                return command.execute(client, data);
        });
    }

    static getRecipients(room, data) {
        let dataRecipients = data.recipients || [],
        ignore = data.ignore || [],
        recipients = [];

        if (dataRecipients.find(r => r === 'ALL'))
            recipients = room.getPlayers(); 
        else if (dataRecipients.find(r => r === 'ALL_PLAYERS'))
            recipients = room.getPlayers(enums.PlayerRole.player);
        else if (dataRecipients.find(r => r === 'ALL_AUDIENCE'))
            recipients = room.getPlayers(enums.PlayerRole.audience);
        else
            recipients = room.getPlayers().filter(p => dataRecipients.find(r => r === p.id));

        recipients = recipients.filter(r => !ignore.find(i => i === r.id));
        return recipients;
    }
}


exports.CommandProcessor = CommandProcessor;