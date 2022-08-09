const inquirer = require('inquirer');
const { saveCache, readCache } = require('../utils/cache-manager');

const {
    getAuthenticationURL,
    generateBearerAccessToken,
    getApiAccessToken
} = require('../services/nitendo-auth.service');

module.exports = {
    async login() {
        const { url, codeVerifier } = getAuthenticationURL();

        const questions = [
            {
                type: 'editor',
                name: 'receivedUrl',
                message: '1 - Copie a URL do botão vermelho e cole aqui'
            },
            {
                type: 'input',
                name: 'userToTrack',
                message: '2 - Digite seu nome de usuário para rastrear'
            }
        ];
    
        console.clear();
        console.log("---Nintendo Rich Presence >> Login---");
        console.log(`Por limitações da API da Nintendo, você precisa de uma conta secundária para rastrear sua conta principal. Sorry :(`);

        console.log('-------------------------------------');
        console.log('Entre no link abaixo e faça login: ');
        console.log(url);
        console.log('-------------------------------------');

        const { receivedUrl, userToTrack } = await inquirer.prompt(questions);

        const tokens = await generateBearerAccessToken(receivedUrl, codeVerifier);

        const result = {
            userToTrack,
            tokens
        };

        saveCache(result);

        console.log('Você está logado!');
        process.exit(0);
    },
    async updateToken() {
        const { userToTrack, tokens } = readCache();
        const { sessionToken } = tokens;

        const newTokens = await getApiAccessToken(sessionToken);
        const result = {
            userToTrack,
            tokens: newTokens
        };

        saveCache(result);
        return result;
    }
}