const app_config = require('../../config');
const client = require('discord-rich-presence')(app_config.discord_clients[0].client);

const gameStatusEnum = {
    'playing': '🕹 Jogando',
    'lobby': '⌛ Querendo jogar com alguém',
    'paused': '⏸️ Jogo pausado',
    'no-game': '🔎 Procurando novo jogo'
};

module.exports = {
    updatePresence(request, response) {
        try {
            const { state, details, friendCode, eshopUrl } = request.query;
            const gameName = decodeURI(details);

            const presenceStatus = {
                details: gameName,
                state: gameStatusEnum[state] + (friendCode ? ' | SW-' + friendCode : ''),
                startTimestamp: Date.now(),
                instance: true,
                largeImageKey: app_config.discord_images[gameName] || 'switch',
                buttons: eshopUrl ? [
                    {
                        label: 'Nintendo eShop',
                        url: decodeURIComponent(eshopUrl),
                    }
                ] : undefined
            };

            client.updatePresence(presenceStatus);

            return response.status(200).send();
        } catch (error) {
            return response.status(500).send({
                error: error.message,
                stack: error.stack
            });
        }
    }
}