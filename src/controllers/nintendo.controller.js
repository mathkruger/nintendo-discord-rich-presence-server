const crypto = require('crypto');
const base64url = require('base64url');
const request2 = require('request-promise-native');
const jar = request2.jar();
const request = request2.defaults({ jar: jar });
const { v4: uuidv4 } = require('uuid');

const ZNCA_PLATFORM = 'Android';
const ZNCA_PLATFORM_VERSION = '8.0.0';
const ZNCA_VERSION = '2.0.0';
const ZNCA_USER_AGENT = `com.nintendo.znca/${ZNCA_VERSION}(${ZNCA_PLATFORM}/${ZNCA_PLATFORM_VERSION})`;
const ZNCA_CLIENT_ID = '71b963c1b7b6d119';

function generateRandom(length) {
    return base64url(crypto.randomBytes(length));
}

function calculateChallenge(codeVerifier) {
    const hash = crypto.createHash('sha256');
    hash.update(codeVerifier);
    const codeChallenge = base64url(hash.digest());
    return codeChallenge;
}

function generateAuthenticationParams() {
    const state = generateRandom(36);
    const codeVerifier = generateRandom(32);
    const codeChallenge = calculateChallenge(codeVerifier);
    return {
        state,
        codeVerifier,
        codeChallenge
    };
}

async function getSessionToken(session_token_code, codeVerifier) {
    const resp = await request({
        method: 'POST',
        uri: 'https://accounts.nintendo.com/connect/1.0.0/api/session_token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Platform': 'Android',
            'X-ProductVersion': ZNCA_VERSION,
            'User-Agent': `NASDKAPI; Android`
        },
        form: {
            client_id: ZNCA_CLIENT_ID,
            session_token_code: session_token_code,
            session_token_code_verifier: codeVerifier
        }
    });
    
    return JSON.parse(resp).session_token;
}

async function getApiToken(session_token) {
    const resp = await request({
        method: 'POST',
        uri: 'https://accounts.nintendo.com/connect/1.0.0/api/token',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Platform': 'Android',
            'X-ProductVersion': ZNCA_VERSION,
            'User-Agent': ZNCA_USER_AGENT
        },
        json: {
            client_id: ZNCA_CLIENT_ID,
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer-session-token',
            session_token: session_token
        }
    });

    return {
        id: resp.id_token,
        access: resp.access_token
    };
}

async function getHash(idToken, timestamp) {
    const response = await request({
        method: 'POST',
        uri: 'https://elifessler.com/s2s/api/gen2',
        headers: {
            'User-Agent': 'nintendo-discord-rich-presence/1.0.0'
        },
        form: {
            naIdToken: idToken,
            timestamp: timestamp
        }
    });

    const responseObject = JSON.parse(response);
    return responseObject.hash;
}

async function callFlapg(idToken, guid, timestamp, login) {
    const hash = await getHash(idToken, timestamp);
    const response = await request({
        method: 'GET',
        uri: 'https://flapg.com/ika2/api/login?public',
        headers: {
            'x-token': idToken,
            'x-time': '' + timestamp,
            'x-guid': guid,
            'x-hash': hash,
            'x-ver': '3',
            'x-iid': login
        }
    });
    const responseObject = JSON.parse(response);

    return responseObject.result;
}

async function getUserInfo(token) {
    const response = await request({
        method: 'GET',
        uri: 'https://api.accounts.nintendo.com/2.0.0/users/me',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Platform': 'Android',
            'X-ProductVersion': ZNCA_VERSION,
            'User-Agent': ZNCA_USER_AGENT,
            Authorization: `Bearer ${token}`
        },
        json: true
    });

    return {
        nickname: response.nickname,
        language: response.language,
        birthday: response.birthday,
        country: response.country
    };
}

async function getApiLogin(userinfo, flapg_nso) {
    try {
        const resp = await request({
            method: 'POST',
            uri: 'https://api-lp1.znc.srv.nintendo.net/v3/Account/Login',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Platform': ZNCA_PLATFORM,
                'X-ProductVersion': ZNCA_VERSION,
                'User-Agent': ZNCA_USER_AGENT
            },
            body: {
                parameter: {
                    language: userinfo.language,
                    naCountry: userinfo.country,
                    naBirthday: userinfo.birthday,
                    f: flapg_nso.f,
                    naIdToken: flapg_nso.p1,
                    timestamp: flapg_nso.p2,
                    requestId: flapg_nso.p3
                }
            },
            json: true,
            gzip: true
        });
        return resp.result.webApiServerCredential.accessToken;
    } catch (error) {
        throw new Error(error);
    }
}

async function getApiAccessToken(sessionToken) {
    const apiTokens = await getApiToken(sessionToken);
    const userInfo = await getUserInfo(apiTokens.access);

    const guid = uuidv4();
    const timestamp = String(Math.floor(Date.now() / 1000));

    const flapg_nso = await callFlapg(apiTokens.id, guid, timestamp, "nso"); 
    const apiAccessToken = await getApiLogin(userInfo, flapg_nso);
    return apiAccessToken;
}

async function getUserCurrentInformation(accessToken) {
    const resp = await request({
        method: 'POST',
        uri: 'https://api-lp1.znc.srv.nintendo.net/v3/Friend/List',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Platform': 'Android',
            'X-ProductVersion': ZNCA_VERSION,
            'User-Agent': ZNCA_USER_AGENT,
            'Authorization': 'Bearer ' + accessToken
        },
        body: {
            parameter: {}
        },
        json: true,
        gzip: true
    });
    return resp;
}

module.exports = {
    async getAuthUrl(request, response) {
        const authParams = generateAuthenticationParams();
        const params = {
            state: authParams.state,
            redirect_uri: `npf${ZNCA_CLIENT_ID}://auth&client_id=${ZNCA_CLIENT_ID}`,
            scope: 'openid%20user%20user.birthday%20user.mii%20user.screenName',
            response_type: 'session_token_code',
            session_token_code_challenge: authParams.codeChallenge,
            session_token_code_challenge_method: 'S256',
            theme: 'login_form'
        };
        const arrayParams = [];
        for (var key in params) {
            if (!params.hasOwnProperty(key)) continue;
            arrayParams.push(`${key}=${params[key]}`);
        }
        const stringParams = arrayParams.join('&');
        const url = `https://accounts.nintendo.com/connect/1.0.0/authorize?${stringParams}`;
        return response.json({
            url,
            codeVerifier: authParams.codeVerifier
        });
    },
    async getAccessToken(request, response) {
        try {
            const { receivedUrl, verifier } = request.query;
            console.log(request.query);
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
                accessToken
            });
        } catch (error) {
            console.error(error);
            return response.status(500).send({
                success: false,
                error
            });
        }
    },
    async getUserPresence(request, response) {
        try {
            const accessToken = request.headers.authorization.replace('Bearer ', '');
            const { userToTrack } = request.query;
            const userInformation = await getUserCurrentInformation(accessToken);
            const userFound = userInformation.result.friends
            .find(x => x.name.toLowerCase() === userToTrack.toLowerCase());
            response.json(userFound ? userFound.presence : {});
        } catch (error) {
            console.error(error);
            return response.status(500).send({
                success: false,
                error
            });
        }
    },
}