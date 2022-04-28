const express = require('express');
const GameController = require('./controllers/game.controller');
const DiscordController = require('./controllers/discord.controller');
const NintendoController = require('./controllers/nintendo.controller');

const routes = express.Router();

routes.get('/game/info', GameController.searchGame);

routes.get('/nintendo/auth', NintendoController.getAuthUrl);
routes.get('/nintendo/token', NintendoController.getAccessToken);
routes.get('/nintendo/user', NintendoController.getUserDetails);
routes.get('/nintendo/presence', NintendoController.getUserPresence);

routes.get('/discord/update', DiscordController.updatePresence);

module.exports = routes;