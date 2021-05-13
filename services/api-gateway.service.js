const WebMixin = require('moleculer-web')

const { moleculer: { port } } = require('../application.config')

module.exports = {
  name: 'ApiGateway',
  mixins: [WebMixin],
  settings: {
    port,
    // Global CORS settings for all routes
    cors: {
      // Configures the Access-Control-Allow-Origin CORS header.
      origin: '*',
      // Configures the Access-Control-Allow-Methods CORS header.
      methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
      // Configures the Access-Control-Allow-Headers CORS header.
      allowedHeaders: [],
      // Configures the Access-Control-Expose-Headers CORS header.
      exposedHeaders: [],
      // Configures the Access-Control-Allow-Credentials CORS header.
      credentials: false,
      // Configures the Access-Control-Max-Age CORS header.
      maxAge: 3600
    },
    routes: [{
      mappingPolicy: 'restrict',
      aliases: {
        'GET status/liveness' (req, res) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ alive: true }))
        },
        'GET status/readiness' (req, res) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ready: true }))
        },
        'GET api/v1/books': 'BooksDomain.filter',
        'GET api/v1/pages': 'PagesDomain.filter',
        'POST generate/catalog' (req, res) {
          req.$ctx.broker.emit('ArchivesDomain.GenerateCatalogInitialized', req.$params)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ called: true, params: req.$params }))
        }
      }
    }]
  }
}
