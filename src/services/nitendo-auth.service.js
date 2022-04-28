const crypto = require('crypto');
const base64url = require('base64url');
const { fetchWithTimeout } = require('../utils/fetch-timeout');
const { v4: uuidv4 } = require('uuid');

const {
    ZNCA_PLATFORM,
    ZNCA_VERSION,
    ZNCA_USER_AGENT,
    ZNCA_CLIENT_ID
} = require('../utils/variables');

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

function getAuthenticationURL() {
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
    return {
        url,
        codeVerifier: authParams.codeVerifier
    };
}

async function getSessionToken(session_token_code, codeVerifier) {
    const form = new URLSearchParams();
    form.append('client_id', ZNCA_CLIENT_ID);
    form.append('session_token_code', session_token_code);
    form.append('session_token_code_verifier', codeVerifier);

    const response = await fetchWithTimeout('https://accounts.nintendo.com/connect/1.0.0/api/session_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Platform': ZNCA_PLATFORM,
            'X-ProductVersion': ZNCA_VERSION,
            'User-Agent': `NASDKAPI; Android`
        },
        body: form
    });
    const data = await response.json();
    return data.session_token;
}

async function getApiToken(session_token) {
    const response = await fetchWithTimeout('https://accounts.nintendo.com/connect/1.0.0/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Platform': ZNCA_PLATFORM,
            'X-ProductVersion': ZNCA_VERSION,
            'User-Agent': ZNCA_USER_AGENT
        },
        body: JSON.stringify({
            client_id: ZNCA_CLIENT_ID,
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer-session-token',
            session_token: session_token
        })
    });
    const data = await response.json();

    return {
        id: data.id_token,
        access: data.access_token
    };
}

async function getHash(idToken, timestamp) {
    const form = new URLSearchParams();
    form.append('naIdToken', idToken);
    form.append('timestamp', timestamp);

    const response = await fetchWithTimeout('https://elifessler.com/s2s/api/gen2', {
        method: 'POST',
        headers: {
            'User-Agent': 'nintendo-discord-rich-presence/1.0.0'
        },
        body: form
    });

    const responseObject = await response.json();
    return responseObject.hash;
}

async function callFlapg(idToken, guid, timestamp, login) {
    const hash = await getHash(idToken, timestamp);
    const response = await fetchWithTimeout('https://flapg.com/ika2/api/login?public', {
        method: 'GET',
        headers: {
            'x-token': idToken,
            'x-time': '' + timestamp,
            'x-guid': guid,
            'x-hash': hash,
            'x-ver': '3',
            'x-iid': login
        }
    });

    const responseObject = await response.json();
    return responseObject.result;
}

async function getUserInfo(token) {
    const response = await fetchWithTimeout('https://api.accounts.nintendo.com/2.0.0/users/me', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Platform': ZNCA_PLATFORM,
            'X-ProductVersion': ZNCA_VERSION,
            'User-Agent': ZNCA_USER_AGENT,
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();

    return {
        nickname: data.nickname,
        language: data.language,
        birthday: data.birthday,
        country: data.country
    };
}

async function getApiLogin(userinfo, flapg_nso) {
    try {
        const response = await fetchWithTimeout('https://api-lp1.znc.srv.nintendo.net/v3/Account/Login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Platform': ZNCA_PLATFORM,
                'X-ProductVersion': ZNCA_VERSION,
                'User-Agent': ZNCA_USER_AGENT
            },
            body: JSON.stringify({
                parameter: {
                    language: userinfo.language,
                    naCountry: userinfo.country,
                    naBirthday: userinfo.birthday,
                    f: flapg_nso.f,
                    naIdToken: flapg_nso.p1,
                    timestamp: flapg_nso.p2,
                    requestId: flapg_nso.p3
                }
            })
        });
        const data = await response.json();
        if (data.result) {
            return data.result.webApiServerCredential.accessToken;
        }
        else {
            throw new Error(data.errorMessage);
        }
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

module.exports = {
    getAuthenticationURL,
    getSessionToken,
    getApiAccessToken,
}