const app_config = require('../../config');

const gameStatusEnum = {
    'playing': '🕹 Jogando',
    'lobby': '⌛ Querendo jogar com alguém',
    'paused': '⏸️ Jogo pausado',
    'no-game': '🔎 Procurando novo jogo'
};

module.exports = {
    updatePresence(client, { state, details, friendCode, eshopUrl }) {
        try {
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
            return true;
        } catch (error) {
            return error;
        }
    }
}