const app_config = require('../../config');
const client = require('discord-rich-presence')(app_config.discord_client_id);

module.exports = {
    updatePresence(request, response) {
        try {
            const { state } = request.query;

            client.updatePresence({
                state: state,
                details: 'Powered by: mathkruger',
                startTimestamp: Date.now(),
                largeImageKey: largeImage,
                instance: true,
            });

            return response.status(200).send();
        } catch (error) {
            return response.status(500).send({
                success: false,
                error
            });
        }
    }
}