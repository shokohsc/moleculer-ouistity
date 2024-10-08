const sh = require('exec-sh').promise
const path = require('path')
const { readFileSync, unlinkSync } = require('fs')
const { snakeCase } = require('lodash')

const Error404 = readFileSync(path.resolve(__dirname, '../assets/images/404.jpg'))
const WebMixin = require('moleculer-web')
const swaggerJsdoc = require('swagger-jsdoc')

const { moleculer: { port }, global: { archivesMountPath, imageCacheTTL } } = require('../application.config')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OUISTITY',
      version: require('../package.json').version,
    },
  },
  apis: ['./services/**/*.js'], // files containing annotations as above
};

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
      allowedHeaders: ['Cache-Control', 'X-Requested-With'],
      // Configures the Access-Control-Expose-Headers CORS header.
      exposedHeaders: [],
      // Configures the Access-Control-Allow-Credentials CORS header.
      credentials: false,
      // Configures the Access-Control-Max-Age CORS header.
      maxAge: 3600
    },
    routes: [{
      onBeforeCall(ctx, route, req, res) {
        ctx.meta.cacheControl = req.headers["cache-control"] || 'no-cache';
      },
      mappingPolicy: 'restrict',
      aliases: {
        'GET status/readiness' (req, res) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ready: true }))
        },
        async 'GET swagger' (req, res) {
          const openapiSpecification = await swaggerJsdoc(options)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(openapiSpecification))
        },
        'GET api/v1/books': 'BooksDomain.filter',
        'GET api/v1/books/:urn': 'BooksDomain.getByUrn',
        'GET api/v1/pages': 'PagesDomain.filter',
        'GET api/v1/pages/:urn': 'PagesDomain.getByUrn',

        'GET api/v1/marvel/characters/:id/comics': 'MarvelCharacters.getComics',
        'GET api/v1/marvel/characters/:id': 'MarvelCharacters.getCharacter',
        'GET api/v1/marvel/characters': 'MarvelCharacters.searchCharacters',

        'GET api/v1/marvel/comics/week': 'MarvelComics.getComicsWeek',
        'GET api/v1/marvel/comics/:id': 'MarvelComics.getComic',
        'GET api/v1/marvel/comics': 'MarvelComics.searchComics',

        'GET api/v1/marvel/creators/:id/comics': 'MarvelCreators.getComics',
        'GET api/v1/marvel/creators/:id': 'MarvelCreators.getCreator',
        'GET api/v1/marvel/creators': 'MarvelCreators.searchCreators',

        'GET api/v1/marvel/events/:id/comics': 'MarvelEvents.getComics',
        'GET api/v1/marvel/events/:id': 'MarvelEvents.getEvent',
        'GET api/v1/marvel/events': 'MarvelEvents.searchEvents',

        'GET api/v1/marvel/series/:id/comics': 'MarvelSeries.getComics',
        'GET api/v1/marvel/series/:id': 'MarvelSeries.getSerie',
        'GET api/v1/marvel/series': 'MarvelSeries.searchSeries',

        'GET api/v1/marvel/stories/:id/comics': 'MarvelStories.getComics',
        'GET api/v1/marvel/stories/:id': 'MarvelStories.getStory',
        'GET api/v1/marvel/stories': 'MarvelStories.searchStories',

        'POST generate/catalog' (req, res) {
          // Emit a moleculer event to accelerate the callback.
          const params = {
            source: path.resolve(__dirname, `${archivesMountPath}/**/*.cb*`),
            pages: false,
            ...req.$params
          }
          req.$ctx.broker.emit('ArchivesDomain.GenerateCatalogInitialized', params)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ called: true, params: req.$params }))
        },
        'POST clean/catalog' (req, res) {
          // Emit a moleculer event to accelerate the callback.
          const params = {
            source: path.resolve(__dirname, `${archivesMountPath}/weekly/`),
            ...req.$params
          }
          req.$ctx.broker.emit('ArchivesDomain.CleanCatalogInitialized', params)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ called: true, params: req.$params }))
        },
        async 'GET images/:urn' (req, res) {
          try {
            let cmd
            const { urn } = req.$params
            const [page] = await req.$ctx.broker.call('PagesDomain.getPageAndArchive', { urn })
            const { archive, name, type } = page
            // await sh(`7z e -o/tmp "${archive}" "${name}"`, true)
            if (path.extname(archive) === '.cbz') {
              cmd = `unzip -p "${archive}" "${name}" > /tmp/${urn}`
            }
            if (path.extname(archive) === '.cbr') {
              cmd = `unrar p -idq "${archive}" "${name}" > /tmp/${urn}`
            }
            this.logger.info(cmd)
            await sh(cmd, true)
            // read file
            const buffer = readFileSync(`/tmp/${urn}`)
            unlinkSync(`/tmp/${urn}`)
            // send buffer as image
            res.setHeader('Content-Type', `image/${(path.extname(name)).replace('.', '')}`)
            res.setHeader('Cache-Control', `public, max-age=${imageCacheTTL}`)
            res.end(buffer)
          } catch (e) {
            this.logger.error(e)
            // send buffer as image
            res.setHeader('Content-Type', 'image')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(Error404)
          }
        }
      }
    }]
  }
}
