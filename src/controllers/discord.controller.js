const app_config = require('../../config');
const client = require('discord-rich-presence')(app_config.discord_client_id);
const gameStatusEnum = {
    'playing': '🕹 Jogando',
    'lobby': '⌛ Querendo jogar com alguém',
    'paused': '⏸️ Jogo pausado',
    'no-game': '🔎 Procurando novo jogo'
};

module.exports = {
    updatePresence(request, response) {
        try {
            const { state, details } = request.query;

            client.updatePresence({
                state: gameStatusEnum[state],
                details: decodeURI(details),
                startTimestamp: Date.now(),
                largeImageKey: 'switch',
                instance: true,
            });

            return response.status(200).send();
        } catch (error) {
            return response.status(500).send({
                success: false,
                error: error
            });
        }
    }
}