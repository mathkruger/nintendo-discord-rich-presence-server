const reader = require('readline-sync');
const {
    readCache,
    saveCache
} = require('./utils/cache-manager');

const { getAuthenticationURL } = require('./services/nitendo-auth.service');
const { getUserFromFriends } = require('./services/nintendo.service');

const auth = {
    getSavedAccessToken() {
        return readCache();
    },
    async getAndSaveAccessToken() {
        const { url, codeVerifier } = getAuthenticationURL()
        console.log('Por limitações da API da Nintendo, você precisa de uma conta secundária para rastrear sua conta principal. Sorry :(');
        console.log('Entre no link abaixo e informe a URL do botão vermelho: ');
        console.log(url);
        const receivedUrl = reader.question("-> ");
        const userToTrack = reader.question("Seu usuário principal (para rastrear a presença): ");
        
        const tokens = await generateBearerAccessToken(receivedUrl, codeVerifier);

        const result = {
            userToTrack,
            tokens
        };

        saveCache(result);
        return result;
    }
}

const presence = {
    async getUserPresence({ userToTrack, tokens }) {
        return await getUserFromFriends(tokens.accessToken, userToTrack);
    },
    printPresence(user) {
        const statusLabels = {
            ONLINE: 'Online',
            INACTIVE: 'Inativo',
            OFFLINE: 'Offline'
        };

        console.clear();
        console.log('Usuário: ' + user.name);
        console.log('Status: ' + statusLabels[user.presence.state]);

        if (user.presence.state === 'ONLINE') {
            console.log('Jogando atualmente: ' + user.presence.game.name);
            console.log('Já jogou por ' + user.presence.game.totalPLayTime + ' segundos');
        }
    }
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

async function init() {
    console.log("---Nintendo Rich Presence---");
    
    let token = auth.getSavedAccessToken() || (await auth.getAndSaveAccessToken());
    
    const loop = setInterval(async () => {
        const user = await presence.getUserPresence(token);
        presence.printPresence(user);
    }, 30000);

    exitProgram(() => {
        clearInterval(loop);
    });
}

module.exports = {
    client: {
        init
    }
}