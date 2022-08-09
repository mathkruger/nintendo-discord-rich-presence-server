const app_config = require('./../../config');
const client = require('discord-rich-presence')(app_config.discord_clients[0].client);
const got = require('got');
const terminalImage = require('terminal-image');

const { readCache } = require('../utils/cache-manager');

const { getQueriedGamesBrazil } = require('nintendo-switch-eshop');
const { getUserFromFriends } = require('../services/nintendo.service');
const { updatePresence } = require('../services/discord.service');

const { updateToken } = require('./login');

lastPresence = {game: { name: null }};

function minutesToHm(d) {
    d = Number(d);
    var h = Math.floor(d % 3600 / 60);
    var m = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hora e " : " horas e ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minuto" : " minutos") : "";
    return hDisplay + mDisplay; 
}

const presence = {
    async getUserPresence({ userToTrack, tokens }) {
        return await getUserFromFriends(tokens.accessToken, userToTrack);
    },
    async printGameCover(imageUri) {
        const imageBuffer = await got(imageUri).buffer();
        console.log(await terminalImage.buffer(imageBuffer, {width: '100%'}));
    },
    async printPresence(user) {
        const statusLabels = {
            ONLINE: 'Online',
            INACTIVE: 'Inativo',
            OFFLINE: 'Offline'
        };

        console.clear();
        console.log("---Nintendo Rich Presence >> Presença---");
        console.log('Usuário: ' + user.name);
        console.log('Status: ' + statusLabels[user.presence.state]);

        if (user.presence.state === 'ONLINE') {
            console.log("------------------------------------");
            await this.printGameCover(user.presence.game.imageUri);
            console.log(user.presence.game.imageUri);
            console.log("------------------------------------");
            console.log('Jogando atualmente: ' + user.presence.game.name);
            console.log('Já jogou por ' + minutesToHm(user.presence.game.totalPlayTime));
        }
    },
    updateDiscordPresence(user) {
        let status = {
            state: 'no-game',
            details: '💤💤💤'
        };

        if (user.presence.state == 'ONLINE') {
            status = {
                state: 'playing',
                details: user.presence.game.name,
            };
        }

        updatePresence(client, status);
    }
}

function getSavedAccessToken() {
    return readCache();
}

async function updateRun(token) {
    const user = await presence.getUserPresence(token); 

    if (lastPresence.game.name == null || lastPresence.game.name != user.presence.game.name) {
        await presence.printPresence(user);
        presence.updateDiscordPresence(user);
    }
    
    lastPresence = user.presence;
}

async function getPresence(token, errorCallback) {
    try {
        await updateRun(token);
    } catch (error) {
        await errorCallback(error);
    }
}

async function main() {
    const errorCallback = async (error) => {
        if (!error) {
            console.log('Você precisa estar logado para acessar essa aplicação');
            process.exit(0);
        }
        else {
            if(!error.message.includes('AbortError: The user aborted a request.')) {
                if (error.message.includes('Token expired')) {
                    await updateToken();
                    await main();
                }
                else if (error.message.includes('Invalid token')) {
                    console.log('A sua sessão é muito antiga, é necessário fazer um novo login.');
                    process.exit(0);
                }
                else {
                    console.log('ERRO DESCONHECIDO: ', error);
                    process.exit(-1);
                }
            }
        }
    };

    let loop = null;
    let token = getSavedAccessToken();

    if (token == null) {
        await errorCallback(null);
    }

    await getPresence(token, errorCallback);

    loop = setInterval(async () => {
        await getPresence(token, errorCallback);
    }, 30000);

    exitProgram(() => {
        if (loop) {
            clearInterval(loop);
        }
    });
}

function exitProgram(callback) {
    if (process.platform === "win32") {
        const rl = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.on("SIGINT", function () {
            process.emit("SIGINT");
        });
    }
    
    process.on("SIGINT", function () {
        callback();
        process.exit();
    });
}

module.exports = {
    client: {
        init: main
    }
}