const makeClient = require('discord-rich-presence');
const app_config = require('../../config');

let previousClient = null;

module.exports = {

    getDiscordClient(game = 'default') {
        if (previousClient) {
            previousClient.disconnect();
        }

        let client = null;
        const clientEntry = app_config.discord_clients.find(x => x.name === game);

        if (!clientEntry) {
            client = makeClient(app_config.discord_clients[0].client);
        }
        else {
            client = makeClient(clientEntry.client);
        }

        previousClient = client;
        return client;
    },
    getImageKey(game = 'default') {
        const clientEntry = app_config.discord_clients.find(x => x.name === game);
        
        if (!clientEntry) {
            return 'switch';
        }

        return clientEntry.largeImageText || null;
    }
}