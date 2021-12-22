const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const nconf = require('nconf')
nconf.argv().env().file({ file: 'nconf.json' })

// ************************************
// Typecasting from kube env
// ************************************
let APP_MOLECULER_METRICS_ENABLED = true
let APP_MOLECULER_API_GATEWAY_PORT = 5000
let APP_MOLECULER_METRICS_PORT = 5050
let APP_MOLECULER_APOLLO_PORT = 7000
let APP_NATS_PORT = 4222
let APP_RABBITMQ_PORT = 5672
let APP_RABBITMQ_PREFETCH_COUNT = 1
let APP_RETHINKDB_PORT = 28015
let APP_REDIS_PORT = 6379
let APP_GRAPHQL_ONE_MINUTE_CACHE_TTL = 60
let APP_GRAPHQL_ONE_DAY_CACHE_TTL = 86400
let APP_GRAPHQL_ONE_YEAR_CACHE_TTL = 31557600
let APP_REDIS_CACHE_TTL = 86400
let APP_IMAGE_CACHE_TTL = 31557600
// ************************************
if (nconf.get('APP_MOLECULER_METRICS_ENABLED') && nconf.get('APP_MOLECULER_METRICS_ENABLED') === 'true') { APP_MOLECULER_METRICS_ENABLED = true }
if (nconf.get('APP_MOLECULER_API_GATEWAY_PORT')) { APP_MOLECULER_API_GATEWAY_PORT = parseInt(nconf.get('APP_MOLECULER_API_GATEWAY_PORT')) }
if (nconf.get('APP_MOLECULER_METRICS_PORT')) { APP_MOLECULER_METRICS_PORT = parseInt(nconf.get('APP_MOLECULER_METRICS_PORT')) }
if (nconf.get('APP_MOLECULER_APOLLO_PORT')) { APP_MOLECULER_APOLLO_PORT = parseInt(nconf.get('APP_MOLECULER_APOLLO_PORT')) }
if (nconf.get('APP_NATS_PORT')) { APP_NATS_PORT = parseInt(nconf.get('APP_NATS_PORT')) }
if (nconf.get('APP_RABBITMQ_PORT')) { APP_RABBITMQ_PORT = parseInt(nconf.get('APP_RABBITMQ_PORT')) }
if (nconf.get('APP_RABBITMQ_PREFETCH_COUNT')) { APP_RABBITMQ_PREFETCH_COUNT = parseInt(nconf.get('APP_RABBITMQ_PREFETCH_COUNT')) }
if (nconf.get('APP_RETHINKDB_PORT')) { APP_RETHINKDB_PORT = parseInt(nconf.get('APP_RETHINKDB_PORT')) }
if (nconf.get('APP_REDIS_PORT')) { APP_REDIS_PORT = parseInt(nconf.get('APP_REDIS_PORT')) }
if (nconf.get('APP_GRAPHQL_ONE_MINUTE_CACHE_TTL')) { APP_GRAPHQL_ONE_MINUTE_CACHE_TTL = parseInt(nconf.get('APP_GRAPHQL_ONE_MINUTE_CACHE_TTL')) }
if (nconf.get('APP_GRAPHQL_ONE_DAY_CACHE_TTL')) { APP_GRAPHQL_ONE_DAY_CACHE_TTL = parseInt(nconf.get('APP_GRAPHQL_ONE_DAY_CACHE_TTL')) }
if (nconf.get('APP_GRAPHQL_ONE_YEAR_CACHE_TTL')) { APP_GRAPHQL_ONE_YEAR_CACHE_TTL = parseInt(nconf.get('APP_GRAPHQL_ONE_YEAR_CACHE_TTL')) }
if (nconf.get('APP_REDIS_CACHE_TTL')) { APP_REDIS_CACHE_TTL = parseInt(nconf.get('APP_REDIS_CACHE_TTL')) }
if (nconf.get('APP_IMAGE_CACHE_TTL')) { APP_IMAGE_CACHE_TTL = parseInt(nconf.get('APP_IMAGE_CACHE_TTL')) }
// ************************************

const APP_GLOBAL_GATEWAY_URL = nconf.get('APP_GLOBAL_GATEWAY_URL') || 'http://localhost:5000'
const APP_MOLECULER_APOLLO_HOSTNAME = nconf.get('APP_APOLLO_HOSTNAME') || 'localhost'

const APP_RETHINKDB_HOSTNAME = nconf.get('APP_RETHINKDB_HOSTNAME') || 'localhost'
const APP_NATS_HOSTNAME = nconf.get('APP_NATS_HOSTNAME') || 'localhost'
const APP_REDIS_HOSTNAME = nconf.get('APP_REDIS_HOSTNAME') || 'localhost'

const APP_RABBITMQ_HOSTNAME = nconf.get('APP_RABBITMQ_HOSTNAME') || 'localhost'
const APP_RABBITMQ_USERNAME = nconf.get('APP_RABBITMQ_USERNAME') || 'admin'
const APP_RABBITMQ_PASSWORD = nconf.get('APP_RABBITMQ_PASSWORD') || 'password'

const APP_ARCHIVES_MOUNT_PATH = nconf.get('APP_ARCHIVES_MOUNT_PATH') || '/usr/app/assets/data/archives'

module.exports = {
  global: {
    gatewayUrl: APP_GLOBAL_GATEWAY_URL,
    archivesMountPath: APP_ARCHIVES_MOUNT_PATH,
    imageCacheTTL: APP_IMAGE_CACHE_TTL
  },
  moleculer: {
    port: APP_MOLECULER_API_GATEWAY_PORT,
    metrics: {
      enabled: APP_MOLECULER_METRICS_ENABLED,
      port: APP_MOLECULER_METRICS_PORT
    }
  },
  apollo: {
    hostname: APP_MOLECULER_APOLLO_HOSTNAME,
    port: APP_MOLECULER_APOLLO_PORT
  },
  rethinkdb: {
    hostname: APP_RETHINKDB_HOSTNAME,
    port: APP_RETHINKDB_PORT
  },
  rabbitmq: {
    hostname: APP_RABBITMQ_HOSTNAME,
    port: APP_RABBITMQ_PORT,
    username: APP_RABBITMQ_USERNAME,
    password: APP_RABBITMQ_PASSWORD,
    prefetchCount: APP_RABBITMQ_PREFETCH_COUNT
  },
  nats: {
    hostname: APP_NATS_HOSTNAME,
    port: APP_NATS_PORT
  },
  redis: {
    hostname: APP_REDIS_HOSTNAME,
    port: APP_REDIS_PORT,
    cacheTTL: APP_REDIS_CACHE_TTL
  },
  graphqlCache: {
    oneMinute: APP_GRAPHQL_ONE_MINUTE_CACHE_TTL,
    oneDay: APP_GRAPHQL_ONE_DAY_CACHE_TTL,
    oneYear: APP_GRAPHQL_ONE_YEAR_CACHE_TTL
  }
}
