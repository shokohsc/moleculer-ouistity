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
    ExtractImageToMemory: require('./actions/archives/ExtractImageToMemory'),
    GenerateCatalog: require('./actions/archives/GenerateCatalog'),
    GenerateBookSubscriber: require('./actions/archives/GenerateBookSubscriber'),
    GenerateBookPagesSubscriber: require('./actions/archives/GenerateBookPagesSubscriber')
  }
}
