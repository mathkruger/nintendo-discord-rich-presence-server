const axios = require('axios');
const app_config = require('../../config');

module.exports = {
    async getToken(request, response) {
        const data = await axios({
            url: 'https://id.twitch.tv/oauth2/token',
            method: 'POST',
            params: {
                client_id: app_config.client_id,
                client_secret: app_config.client_secret,
                grant_type: 'client_credentials'
            }
        });

        return response.json(data.data);
    }
}