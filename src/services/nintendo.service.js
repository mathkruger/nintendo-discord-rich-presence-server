const { fetchWithTimeout } = require('../utils/fetch-timeout');
const {
    ZNCA_PLATFORM,
    ZNCA_VERSION,
    ZNCA_USER_AGENT,
} = require('../utils/variables');

const request = (url, method, params, accessToken) => {
    return fetchWithTimeout('https://api-lp1.znc.srv.nintendo.net' + url, {
        method,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Platform': ZNCA_PLATFORM,
            'X-ProductVersion': ZNCA_VERSION,
            'User-Agent': ZNCA_USER_AGENT,
            Authorization: 'Bearer ' + accessToken
        },
        body: params,
    });
}

module.exports = {
    async getUserFriendList(accessToken) {
        try {
            const response = await request('/v3/Friend/List', 'POST', '{"parameter": {}}', accessToken);
            const data = await response.json();
            
            if (!data.result) {
                throw new Error(data.errorMessage);
            }

            return data;
        } catch (error) {
            throw new Error(error);
        }
    },
    async getUser(accessToken) {
        try {
            const response = await request('/v3/User/ShowSelf', 'POST', '{"parameter": {}}', accessToken);
            const data = await response.json();
            
            if (!data.result) {
                throw new Error(data.errorMessage);
            }

            return data;
        } catch (error) {
            throw new Error(error);
        }
    }
}