const express = require('express');
const AuthController = require('./controllers/auth.controller');
const GameController = require('./controllers/game.controller');
const DiscordController = require('./controllers/discord.controller');

const routes = express.Router();

routes.get('/auth/token', AuthController.getToken);
routes.get('/game/info', GameController.searchGame);
routes.get('/game/cover', GameController.getGameCover);
routes.get('/discord/update', DiscordController.updatePresence);
routes.get('/discord/remove', DiscordController.removePresence);

module.exports = routes;