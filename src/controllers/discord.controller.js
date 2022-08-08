const { updatePresence } = require('./../services/discord.service');

module.exports = {
    updatePresence(request, response) {
        try {
            const result = updatePresence(request.query);
            
            if (result != true) {
                throw new Error(result);
            }

            return response.status(200).send();
        } catch (error) {
            return response.status(500).send({
                error: error.message,
                stack: error.stack
            });
        }
    }
}