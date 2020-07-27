const log = require('debug')('cache:')

const cacheManager = require('cache-manager')
const redisStore = require('cache-manager-ioredis')
const crypto = require('crypto')

module.exports = ({ ttl = 60 /*seconds*/ }) => {
    const Cache = cacheManager.caching({
        store: redisStore,
        host: 'localhost', // default value
        port: 6379, // default value
        // password : "XXXXX",
        // db       : 0,
        ttl
    })

    return Object.freeze({
        set,
        get,
        del
    })

    async function set ({ source, key }, value) {
        log('set:', { source, key })
        await Cache.set(hash({ source, key }), value)
        return value
    }

    async function get ({ source, key }, DBFunction) {
        log('get:', { source, key })
        const cachekey = hash({ source, key })
        const value = await Cache.get(cachekey)
        if (value) {
            log('Cache found...')
            return value
        }

        log('Cache not found...', { source, key })
        const result = await DBFunction
        if (result === null || result.length === 0) {
            log('Result returns null or empty array...')
            return result
        }

        await Cache.set(cachekey, result)
        return result
    }

    async function del ({ source, key }) {
        log('del:', { source, key })
        await Cache.del(hash({ source, key }))
        return { source, key }
    }

    function hash ({ source, key }) {
        return `${source}:${md5(key)}`
    }

    function md5 (key) {
        return crypto
            .createHash('md5')
            .update(key)
            .digest('hex')
    }
}
