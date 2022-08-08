const fs = require('fs');
const app_config = require('../../config.json');

const CACHE_PATH = app_config.cache_path;
const FILE_NAME = 'cache.json'

function saveCache(cache) {
    try {
        fs.writeFileSync(`${CACHE_PATH}${FILE_NAME}`, JSON.stringify(cache),'utf8')
        return true
    } catch (error) {
        throw new Error(error)
    }
}

function readCache() {
    try {
        const file = fs.readFileSync(`${CACHE_PATH}${FILE_NAME}`, 'utf8')
        return JSON.parse(file)
    } catch (error) {
        return null
    }
}

module.exports = {
    saveCache,
    readCache
}