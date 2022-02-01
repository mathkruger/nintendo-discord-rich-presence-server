const axios = require('axios');
const app_config = require('../../config');

module.exports = {
    async searchGame(request, response) {
        try {
            const searchTerm = request.query.term;
            const authorization = request.headers['authorization'];

            const data = await axios({
                url: 'https://api.igdb.com/v4/games',
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Client-ID': app_config.client_id,
                    'Authorization': authorization,
                },
                data: `
                search "${searchTerm}";
                fields name,rating,cover;
                where release_dates.platform = (130);
            `
            });

            return response.json(data.data);
        } catch (error) {
            return response.status(500).send({
                success: false,
                error
            });
        }
    },

    async getGameCover(request, response) {
        try {
            const id = request.query.id;
            const authorization = request.headers['authorization'];

            const data = await axios({
                url: 'https://api.igdb.com/v4/covers',
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Client-ID': app_config.client_id,
                    'Authorization': authorization,
                },
                data: `
                    fields url;
                    where id = ${id};
                `
            });

            return response.json(data.data[0]);

        } catch (error) {
            return response.status(500).send({
                success: false,
                error
            });
        }
    }
}