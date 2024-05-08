const RabbitMQMixin = require('../mixins/rabbitmq.mixin')
const { rabbitmq } = require('../application.config')

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
        },
        'archives-domain-clean-book': {
          type: 'topic',
          subscriber: 'ArchivesDomain.CleanBookSubscriber'
        }
      }
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
    CleanBookSubscriber: require('./actions/archives/CleanBookSubscriber')
  }
}
