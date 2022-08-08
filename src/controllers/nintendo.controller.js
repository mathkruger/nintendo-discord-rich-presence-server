const {
    getAuthenticationURL,
    getApiAccessToken,
    generateBearerAccessToken
} = require('../services/nitendo-auth.service');
const { getUserFromFriends, getUser } = require('../services/nintendo.service');

function handleServerError(response, error) {
    return response.status(500).send({
        error: error.message,
        stack: error.stack
    });
}

module.exports = {
    async getAuthUrl(request, response) {
        try {
            return response.json(getAuthenticationURL());
        } catch (error) {
            handleServerError(response, error);
        }
    },
    async getAccessToken(request, response) {
        try {
            const { receivedUrl, verifier } = request.query;
            const result = await generateBearerAccessToken(receivedUrl, verifier);
            response.json(result);
        } catch (error) {
            handleServerError(response, error);
        }
    },
    async renewAccessToken(request, response) {
        try {
            const { sessionToken } = request.query;
            const accessToken = await getApiAccessToken(sessionToken);
            response.json({
                accessToken,
            });
        } catch (error) {
            handleServerError(response, error);
        }
    },
    async getUserDetails(request, response) {
        try {
            const accessToken = request.headers.authorization.replace('Bearer ', '');
            const data = await getUser(accessToken);
            response.json(data);
        } catch (error) {
            handleServerError(response, error);
        }
    },
    async getUserPresence(request, response) {
        try {
            const accessToken = request.headers.authorization.replace('Bearer ', '');
            const { userToTrack } = request.query;
            const userInformation = await getUserFromFriends(accessToken, userToTrack);
            response.json(userInformation);
        } catch (error) {
            handleServerError(response, error);
        }
    }
}