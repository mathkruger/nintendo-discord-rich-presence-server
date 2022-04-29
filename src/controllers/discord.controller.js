const { getDiscordClient, getImageKey } = require('../services/discord.service');
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
            const discordGameName = state === 'no-game' ? 'default' : details;
            const client = getDiscordClient(discordGameName);

            const largeImageKey = getImageKey(discordGameName);

            const presenceStatus = {
                details: largeImageKey !== 'switch' ? 'Nintendo Switch' : decodeURI(details),
                state: gameStatusEnum[state] + (friendCode ? ' | SW-' + friendCode : ''),
                startTimestamp: Date.now(),
                instance: true,
                largeImageKey: largeImageKey || 'default',
                buttons: eshopUrl ? [
                    {
                        label: 'Nintendo eShop',
                        url: eshopUrl,
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