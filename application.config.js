const nconf = require('nconf')
nconf.argv().env().file({ file: 'nconf.json' })

// ************************************
// Typecasting from kube env
// ************************************
let APP_MOLECULER_METRICS_ENABLED = false
let APP_MOLECULER_API_GATEWAY_PORT = 5000
let APP_MOLECULER_METRICS_PORT = 5050
let APP_MOLECULER_APOLLO_PORT = 7000
let APP_RETHINKDB_PORT = 28015
let APP_NATS_PORT = 4222
// ************************************
if (nconf.get('APP_MOLECULER_METRICS_ENABLED') && nconf.get('APP_MOLECULER_METRICS_ENABLED') === 'true') { APP_MOLECULER_METRICS_ENABLED = true }
if (nconf.get('APP_MOLECULER_API_GATEWAY_PORT')) { APP_MOLECULER_API_GATEWAY_PORT = parseInt(nconf.get('APP_MOLECULER_API_GATEWAY_PORT')) }
if (nconf.get('APP_MOLECULER_METRICS_PORT')) { APP_MOLECULER_METRICS_PORT = parseInt(nconf.get('APP_MOLECULER_METRICS_PORT')) }
if (nconf.get('APP_MOLECULER_APOLLO_PORT')) { APP_MOLECULER_APOLLO_PORT = parseInt(nconf.get('APP_MOLECULER_APOLLO_PORT')) }
if (nconf.get('APP_RETHINKDB_PORT')) { APP_RETHINKDB_PORT = parseInt(nconf.get('APP_RETHINKDB_PORT')) }
if (nconf.get('APP_NATS_PORT')) { APP_NATS_PORT = parseInt(nconf.get('APP_NATS_PORT')) }
// ************************************

const APP_GLOBAL_GATEWAY_URL = nconf.get('APP_GLOBAL_GATEWAY_URL') || 'http://localhost:5000'
const APP_RETHINKDB_HOSTNAME = nconf.get('APP_RETHINKDB_HOSTNAME') || 'localhost'
const APP_NATS_HOSTNAME = nconf.get('APP_NATS_HOSTNAME') || 'localhost'

module.exports = {
  global: {
    gatewayUrl: APP_GLOBAL_GATEWAY_URL
  },
  moleculer: {
    port: APP_MOLECULER_API_GATEWAY_PORT,
    metrics: {
      enabled: APP_MOLECULER_METRICS_ENABLED,
      port: APP_MOLECULER_METRICS_PORT
    }
  },
  apollo: {
    port: APP_MOLECULER_APOLLO_PORT
  },
  rethinkdb: {
    hostname: APP_RETHINKDB_HOSTNAME,
    port: APP_RETHINKDB_PORT
  },
  nats: {
    hostname: APP_NATS_HOSTNAME,
    port: APP_NATS_PORT
  }
}
