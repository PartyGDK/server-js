const server = require('./models/server.js');
require('./utils/websocket.js');
require('./utils/http_handler.js');

require('./commands/room.js');
require('./commands/player.js');
require('./commands/moderator.js');


server.Server.listen();