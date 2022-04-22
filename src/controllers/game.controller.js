const { getQueriedGamesBrazil } = require('nintendo-switch-eshop');

module.exports = {
    async searchGame(request, response) {
        try {
            const searchTerm = request.query.term;
            const result = await getQueriedGamesBrazil(searchTerm);
            return response.json(result);
        } catch (error) {
            return response.status(500).send({
                success: false,
                error
            });
        }
    },
}