const RabbitMQMixin = require('../mixins/rabbitmq.mixin')
const MeilisearchMixin = require('../mixins/meilisearch.mixin')
const { rabbitmq, meilisearch } = require('../application.config')

module.exports = {
  name: 'ArchivesDomain',
  mixins: [RabbitMQMixin, MeilisearchMixin],
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
        },
        'archives-domain-clean-book': {
          type: 'topic',
          subscriber: 'ArchivesDomain.CleanBookSubscriber'
        }
      }
    },
    meilisearch: {
      ...meilisearch,
      index: 'comics'
    }
  },
  events: {
    'ArchivesDomain.GenerateCatalogInitialized': {
      async handler (ctx) {
        await ctx.broker.call('ArchivesDomain.GenerateCatalog', ctx.params)
      }
    },
    'ArchivesDomain.CleanCatalogInitialized': {
      async handler (ctx) {
        await ctx.broker.call('ArchivesDomain.CleanCatalog', ctx.params)
      }
    }
  },
  actions: {
    GenerateCatalog: require('./actions/archives/GenerateCatalog'),
    GenerateBookSubscriber: require('./actions/archives/GenerateBookSubscriber'),
    GenerateBookPagesSubscriber: require('./actions/archives/GenerateBookPagesSubscriber'),
    GenerateChecksum: require('./actions/archives/GenerateChecksum'),
    CleanCatalog: require('./actions/archives/CleanCatalog'),
    CleanBookSubscriber: require('./actions/archives/CleanBookSubscriber'),
    searchHits: {
      async handler (ctx) {
        this.logger.info(ctx.action.name, ctx.params)
        const { query, page, pageSize } = ctx.params
        try {
          const index = await this.getIndex()

          return await index.search(query, { offset: (page - 1) * pageSize, limit: pageSize })
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
}
