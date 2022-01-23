const sh = require('exec-sh').promise
const path = require('path')
const { readFileSync, unlinkSync } = require('fs')
const { snakeCase } = require('lodash')

const Error404 = readFileSync(path.resolve(__dirname, '../assets/images/404.jpg'))

const RabbitMQMixin = require('../mixins/rabbitmq.mixin')
const { global: { imageCacheTTL }, rabbitmq } = require('../application.config')

module.exports = {
  name: 'ArchivesDomain',
  mixins: [RabbitMQMixin],
  settings: {
    rabbitmq: {
      ...rabbitmq,
      aliases: {
        'archives-domain-generate-book': {
          type: 'topic',
          subscriber: 'ArchivesDomain.GenerateBookSubscriber'
        },
        'archives-domain-generate-book-pages-catalog': {
          type: 'topic',
          subscriber: 'ArchivesDomain.GenerateBookPagesSubscriber'
        }
      }
    }
  },
  events: {
    'ArchivesDomain.GenerateCatalogInitialized': {
      async handler (ctx) {
        await ctx.broker.call('ArchivesDomain.GenerateCatalog', ctx.params)
      }
    }
  },
  actions: {
    GenerateCatalog: require('./actions/archives/GenerateCatalog'),
    GenerateBookSubscriber: require('./actions/archives/GenerateBookSubscriber'),
    GenerateBookPagesSubscriber: require('./actions/archives/GenerateBookPagesSubscriber'),
    GenerateChecksum: require('./actions/archives/GenerateChecksum'),
    getByUrn: {
      rest: "GET /",
      async handler(ctx) {
				this.logger.info(ctx.action.name, ctx.params)
        try {
          const { urn } = ctx.params
          const { filepath, name, type } = await ctx.broker.call('PagesDomain.getByUrn', { urn })
          const basename = snakeCase(path.basename(name, path.extname(name)))
          const extname = path.extname(name)
          await sh(`7z e -o/tmp "${filepath}" "${name}"`, true)
          // read file
          const buffer = readFileSync(`/tmp/${name}`)
          unlinkSync(`/tmp/${name}`)
          // send buffer as image
          ctx.meta.$responseType = 'image'
          ctx.meta.$responseHeaders = {
            'Cache-Control': `public, max-age=${imageCacheTTL}`
          }
          return buffer
        } catch (e) {
          console.log(e);
          // send buffer as image
          ctx.meta.$responseType = 'image'
          ctx.meta.$responseHeaders = {
            'Cache-Control': `no-cache`
          }
          return Error404
        }
			},
			params: {
				urn: { type: 'string'}
			}
    }
  }
}
