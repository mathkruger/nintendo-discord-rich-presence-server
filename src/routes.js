const express = require('express');
const GameController = require('./controllers/game.controller');
const DiscordController = require('./controllers/discord.controller');

const routes = express.Router();

routes.get('/game/info', GameController.searchGame);
routes.get('/discord/update', DiscordController.updatePresence);

module.exports = routes;