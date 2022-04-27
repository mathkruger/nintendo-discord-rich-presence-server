const express = require('express');
const GameController = require('./controllers/game.controller');
const DiscordController = require('./controllers/discord.controller');
const NintendoController = require('./controllers/nintendo.controller');

const routes = express.Router();

routes.get('/game/info', GameController.searchGame);
routes.get('/nintendo/presence', NintendoController.getUserPresence);
routes.get('/discord/update', DiscordController.updatePresence);

module.exports = routes;