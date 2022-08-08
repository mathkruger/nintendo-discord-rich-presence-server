const app_config = require('../../config');

const { updatePresence } = require('./../services/discord.service');

const client = require('discord-rich-presence')(app_config.discord_clients[0].client);


module.exports = {
    updatePresence(request, response) {
        try {
            const result = updatePresence(client, request.query);
            
            if (result != true) {
                throw new Error(result);
            }

            return response.status(200).send();
        } catch (error) {
            return response.status(500).send({
                error: error.message,
                stack: error.stack
            });
        }
    }
}