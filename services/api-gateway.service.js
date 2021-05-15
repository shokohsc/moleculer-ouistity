const sh = require('exec-sh').promise
const path = require('path')
const { readFileSync, unlinkSync } = require('fs')
const { snakeCase } = require('lodash')
const WebMixin = require('moleculer-web')

const Error404 = readFileSync(path.resolve(__dirname, '../assets/images/404.jpg'))

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
        'GET api/v1/books/:urn': 'BooksDomain.getByUrn',
        'GET api/v1/pages': 'PagesDomain.filter',
        'GET api/v1/pages/:urn': 'PagesDomain.getByUrn',
        'POST generate/catalog' (req, res) {
          // Emit a moleculer event to accelerate the ccallback.
          req.$ctx.broker.emit('ArchivesDomain.GenerateCatalogInitialized', req.$params)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ called: true, params: req.$params }))
        },
        async 'GET images/:urn' (req, res) {
          try {
            const { urn } = req.$params
            const { filepath, name, type } = await req.$ctx.broker.call('PagesDomain.getByUrn', { urn })
            const basename = snakeCase(path.basename(filepath, path.extname(filepath)))
            const extname = path.extname(filepath)
            let cmd = false
            if (type === 'zip') {
              // write tmp file
              cmd = `unzip -p "${filepath}" "${name}" > /tmp/${basename}${extname}`
            }
            if (type === 'rar') {
              // write tmp file
              cmd = `unrar p -idq "${filepath}" "${name}" > /tmp/${basename}${extname}`
            }
            await sh(cmd, true)
            // read file
            const buffer = readFileSync(`/tmp/${basename}${extname}`)
            unlinkSync(`/tmp/${basename}${extname}`)
            // send buffer as image
            res.setHeader('Content-Type', 'image')
            res.end(buffer)
          } catch (e) {
            // send buffer as image
            res.setHeader('Content-Type', 'image')
            res.end(Error404)
          }
        }
      }
    }]
  }
}
