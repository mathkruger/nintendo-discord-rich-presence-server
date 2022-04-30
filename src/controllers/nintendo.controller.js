const {
    getAuthenticationURL,
    getSessionToken,
    getApiAccessToken
} = require('../services/nitendo-auth.service');
const { getUserFriendList, getUser } = require('../services/nintendo.service');

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
            const params = {};
            receivedUrl.split('#')[1]
                .split('&')
                .forEach(str => {
                    const splitStr = str.split('=');
                    params[splitStr[0]] = splitStr[1];
                });
            const code = params.session_token_code;
            const sessionToken = await getSessionToken(code, verifier);
            const accessToken = await getApiAccessToken(sessionToken);
            response.json({
                sessionToken,
                accessToken,
            });
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
            const userInformation = await getUserFriendList(accessToken);

            const userFound = userInformation.result.friends
            .find(x => x.name.toLowerCase() === userToTrack.toLowerCase());

            response.json(userFound ? userFound : {});
        } catch (error) {
            handleServerError(response, error);
        }
    }
}